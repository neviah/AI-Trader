"""
Trade History API routes
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.trade import Trade, TradeType, TradeStatus
from app.models.portfolio import Portfolio
from app.schemas import TradeResponse, TradeCreate, APIResponse, PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_trade_history(
    portfolio_id: Optional[int] = Query(None, description="Filter by portfolio ID"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    trade_type: Optional[str] = Query(None, description="Filter by trade type (buy/sell)"),
    status: Optional[str] = Query(None, description="Filter by trade status"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=500, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trade history with filtering and pagination"""
    
    # Build base query for user's trades
    query = db.query(Trade).join(Portfolio).filter(Portfolio.user_id == current_user.id)
    
    # Apply filters
    if portfolio_id:
        query = query.filter(Trade.portfolio_id == portfolio_id)
    
    if symbol:
        query = query.filter(Trade.symbol.ilike(f"%{symbol}%"))
    
    if trade_type:
        try:
            trade_type_enum = TradeType(trade_type.lower())
            query = query.filter(Trade.trade_type == trade_type_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid trade type. Must be 'buy' or 'sell'"
            )
    
    if status:
        try:
            status_enum = TradeStatus(status.lower())
            query = query.filter(Trade.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be 'pending', 'executed', 'failed', or 'cancelled'"
            )
    
    if start_date:
        query = query.filter(Trade.created_at >= start_date)
    
    if end_date:
        query = query.filter(Trade.created_at <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    trades = query.order_by(desc(Trade.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    
    # Calculate pagination info
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=[TradeResponse.from_orm(trade) for trade in trades],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade_detail(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific trade"""
    
    trade = db.query(Trade).join(Portfolio).filter(
        Trade.id == trade_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    return TradeResponse.from_orm(trade)


@router.get("/analytics/summary", response_model=APIResponse)
async def get_trade_analytics_summary(
    portfolio_id: Optional[int] = Query(None, description="Filter by portfolio ID"),
    days: Optional[int] = Query(30, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trade analytics summary"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Build base query
    query = db.query(Trade).join(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Trade.created_at >= start_date,
        Trade.created_at <= end_date
    )
    
    if portfolio_id:
        query = query.filter(Trade.portfolio_id == portfolio_id)
    
    # Get executed trades only for calculations
    executed_trades = query.filter(Trade.status == TradeStatus.EXECUTED).all()
    
    # Calculate metrics
    total_trades = len(executed_trades)
    buy_trades = len([t for t in executed_trades if t.trade_type == TradeType.BUY])
    sell_trades = len([t for t in executed_trades if t.trade_type == TradeType.SELL])
    
    total_volume = sum(t.total_value for t in executed_trades)
    total_fees = sum(t.fees for t in executed_trades)
    
    # Calculate profit/loss for sell trades
    profitable_trades = len([t for t in executed_trades if t.trade_type == TradeType.SELL and t.profit_loss > 0])
    total_pnl = sum(t.profit_loss for t in executed_trades if t.trade_type == TradeType.SELL)
    
    # Win rate
    win_rate = (profitable_trades / sell_trades * 100) if sell_trades > 0 else 0
    
    # Average trade size
    avg_trade_size = (total_volume / total_trades) if total_trades > 0 else 0
    
    # Most traded symbols
    symbol_counts = {}
    for trade in executed_trades:
        symbol_counts[trade.symbol] = symbol_counts.get(trade.symbol, 0) + 1
    
    most_traded = sorted(symbol_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    analytics = {
        "period_days": days,
        "total_trades": total_trades,
        "buy_trades": buy_trades,
        "sell_trades": sell_trades,
        "total_volume": round(total_volume, 2),
        "total_fees": round(total_fees, 2),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2),
        "avg_trade_size": round(avg_trade_size, 2),
        "most_traded_symbols": [{"symbol": symbol, "count": count} for symbol, count in most_traded]
    }
    
    return APIResponse(
        success=True,
        message=f"Trade analytics for the last {days} days",
        data=analytics
    )


@router.get("/analytics/performance", response_model=APIResponse)
async def get_trade_performance_analytics(
    portfolio_id: Optional[int] = Query(None, description="Filter by portfolio ID"),
    group_by: str = Query("day", description="Group by: day, week, month"),
    days: Optional[int] = Query(30, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trade performance analytics grouped by time period"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Build base query
    query = db.query(Trade).join(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Trade.created_at >= start_date,
        Trade.created_at <= end_date,
        Trade.status == TradeStatus.EXECUTED
    )
    
    if portfolio_id:
        query = query.filter(Trade.portfolio_id == portfolio_id)
    
    trades = query.all()
    
    # Group trades by time period
    from collections import defaultdict
    grouped_data = defaultdict(lambda: {
        "trades": 0,
        "volume": 0.0,
        "pnl": 0.0,
        "fees": 0.0
    })
    
    for trade in trades:
        # Determine grouping key based on group_by parameter
        trade_date = trade.created_at.date()
        
        if group_by == "day":
            key = trade_date.strftime("%Y-%m-%d")
        elif group_by == "week":
            # Get Monday of the week
            monday = trade_date - timedelta(days=trade_date.weekday())
            key = monday.strftime("%Y-%m-%d")
        elif group_by == "month":
            key = trade_date.strftime("%Y-%m")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid group_by parameter. Must be 'day', 'week', or 'month'"
            )
        
        grouped_data[key]["trades"] += 1
        grouped_data[key]["volume"] += trade.total_value
        grouped_data[key]["fees"] += trade.fees
        
        # Only add P&L for sell trades
        if trade.trade_type == TradeType.SELL:
            grouped_data[key]["pnl"] += trade.profit_loss
    
    # Convert to list and sort by date
    performance_data = []
    for date_key, data in sorted(grouped_data.items()):
        performance_data.append({
            "date": date_key,
            "trades": data["trades"],
            "volume": round(data["volume"], 2),
            "pnl": round(data["pnl"], 2),
            "fees": round(data["fees"], 2)
        })
    
    return APIResponse(
        success=True,
        message=f"Trade performance analytics grouped by {group_by}",
        data=performance_data
    )