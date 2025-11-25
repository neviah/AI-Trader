"""
Portfolio Management API routes
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade, TradeStatus
from app.schemas import (
    PortfolioResponse, 
    PortfolioCreate, 
    PortfolioUpdate, 
    APIResponse, 
    PaginatedResponse
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_portfolios(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's portfolios with pagination"""
    
    query = db.query(Portfolio).filter(Portfolio.user_id == current_user.id)
    
    if is_active is not None:
        query = query.filter(Portfolio.is_active == is_active)
    
    total = query.count()
    portfolios = query.order_by(desc(Portfolio.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=[PortfolioResponse.from_orm(portfolio) for portfolio in portfolios],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.post("/", response_model=PortfolioResponse)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio"""
    
    # Check if user has reached portfolio limit based on subscription
    # This would integrate with subscription limits
    existing_portfolios = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_active == True
    ).count()
    
    # For now, limit to 5 active portfolios per user
    if existing_portfolios >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of active portfolios reached"
        )
    
    # Create new portfolio
    portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        description=portfolio_data.description,
        initial_cash=portfolio_data.initial_cash,
        current_cash=portfolio_data.initial_cash,
        total_value=portfolio_data.initial_cash,
        market=portfolio_data.market,
        agent_config_id=portfolio_data.agent_config_id,
        holdings={"CASH": portfolio_data.initial_cash}
    )
    
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    
    return PortfolioResponse.from_orm(portfolio)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific portfolio"""
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Update portfolio value with current market prices
    await _update_portfolio_value(portfolio, db)
    
    return PortfolioResponse.from_orm(portfolio)


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    portfolio_update: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update portfolio information"""
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Update fields
    update_data = portfolio_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(portfolio, field, value)
    
    portfolio.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(portfolio)
    
    return PortfolioResponse.from_orm(portfolio)


@router.delete("/{portfolio_id}", response_model=APIResponse)
async def delete_portfolio(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a portfolio (soft delete by setting is_active to False)"""
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Soft delete
    portfolio.is_active = False
    portfolio.updated_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message="Portfolio deleted successfully"
    )


@router.get("/{portfolio_id}/performance", response_model=APIResponse)
async def get_portfolio_performance(
    portfolio_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days for performance analysis"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed portfolio performance metrics"""
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get trades in the period
    trades = db.query(Trade).filter(
        Trade.portfolio_id == portfolio_id,
        Trade.created_at >= start_date,
        Trade.status == TradeStatus.EXECUTED
    ).all()
    
    # Calculate performance metrics
    total_trades = len(trades)
    buy_trades = len([t for t in trades if t.trade_type.value == "buy"])
    sell_trades = len([t for t in trades if t.trade_type.value == "sell"])
    
    total_invested = sum(t.total_value for t in trades if t.trade_type.value == "buy")
    total_divested = sum(t.total_value for t in trades if t.trade_type.value == "sell")
    
    # Calculate returns
    returns_data = []
    current_value = portfolio.total_value
    
    # This would ideally use historical portfolio values
    # For now, we'll provide current metrics
    performance = {
        "portfolio_id": portfolio_id,
        "period_days": days,
        "current_value": portfolio.total_value,
        "total_return": portfolio.total_return,
        "total_return_pct": portfolio.total_return_pct,
        "daily_return_pct": portfolio.daily_return_pct,
        "max_drawdown": portfolio.max_drawdown,
        "sharpe_ratio": portfolio.sharpe_ratio,
        "total_trades": total_trades,
        "buy_trades": buy_trades,
        "sell_trades": sell_trades,
        "total_invested": round(total_invested, 2),
        "total_divested": round(total_divested, 2),
        "current_holdings": portfolio.holdings
    }
    
    return APIResponse(
        success=True,
        message="Portfolio performance data",
        data=performance
    )


@router.get("/{portfolio_id}/holdings", response_model=APIResponse)
async def get_portfolio_holdings(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current portfolio holdings with real-time values"""
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Process holdings to add current market values
    holdings_with_values = []
    
    for symbol, quantity in (portfolio.holdings or {}).items():
        if symbol == "CASH":
            holdings_with_values.append({
                "symbol": "CASH",
                "quantity": quantity,
                "current_price": 1.0,
                "market_value": quantity,
                "cost_basis": quantity,
                "unrealized_pnl": 0.0,
                "unrealized_pnl_pct": 0.0
            })
        else:
            # This would integrate with real-time price data
            current_price = await _get_current_price(symbol)
            market_value = quantity * current_price
            
            # Calculate cost basis from trade history
            cost_basis = await _calculate_cost_basis(portfolio_id, symbol, db)
            unrealized_pnl = market_value - cost_basis
            unrealized_pnl_pct = (unrealized_pnl / cost_basis * 100) if cost_basis > 0 else 0
            
            holdings_with_values.append({
                "symbol": symbol,
                "quantity": quantity,
                "current_price": current_price,
                "market_value": market_value,
                "cost_basis": cost_basis,
                "unrealized_pnl": unrealized_pnl,
                "unrealized_pnl_pct": unrealized_pnl_pct
            })
    
    # Calculate portfolio totals
    total_market_value = sum(h["market_value"] for h in holdings_with_values)
    total_cost_basis = sum(h["cost_basis"] for h in holdings_with_values)
    total_unrealized_pnl = total_market_value - total_cost_basis
    
    holdings_data = {
        "portfolio_id": portfolio_id,
        "total_market_value": round(total_market_value, 2),
        "total_cost_basis": round(total_cost_basis, 2),
        "total_unrealized_pnl": round(total_unrealized_pnl, 2),
        "holdings": holdings_with_values
    }
    
    return APIResponse(
        success=True,
        message="Portfolio holdings with current values",
        data=holdings_data
    )


# Helper functions
async def _update_portfolio_value(portfolio: Portfolio, db: Session):
    """Update portfolio total value with current market prices"""
    total_value = 0.0
    
    for symbol, quantity in (portfolio.holdings or {}).items():
        if symbol == "CASH":
            total_value += quantity
        else:
            current_price = await _get_current_price(symbol)
            total_value += quantity * current_price
    
    portfolio.total_value = total_value
    portfolio.update_performance_metrics()
    db.commit()


async def _get_current_price(symbol: str) -> float:
    """Get current market price for a symbol"""
    # This would integrate with Alpha Vantage or other price data provider
    # For now, return a placeholder price
    return 150.0


async def _calculate_cost_basis(portfolio_id: int, symbol: str, db: Session) -> float:
    """Calculate cost basis for a symbol in a portfolio"""
    trades = db.query(Trade).filter(
        Trade.portfolio_id == portfolio_id,
        Trade.symbol == symbol,
        Trade.status == TradeStatus.EXECUTED,
        Trade.trade_type.value == "buy"
    ).all()
    
    total_cost = sum(trade.total_value for trade in trades)
    return total_cost