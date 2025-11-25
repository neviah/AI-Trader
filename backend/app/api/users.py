"""
User Management API routes
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user, get_password_hash, verify_password
from app.models.user import User
from app.schemas import UserResponse, APIResponse
from pydantic import BaseModel, EmailStr

router = APIRouter()


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return UserResponse.from_orm(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    
    update_data = profile_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message="Password changed successfully"
    )


@router.get("/dashboard", response_model=APIResponse)
async def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user dashboard overview"""
    
    from app.models.subscription import Subscription, SubscriptionStatus
    from app.models.agent_config import AgentConfig
    from app.models.portfolio import Portfolio
    from app.models.trade import Trade, TradeStatus
    from sqlalchemy import func, desc
    from datetime import timedelta
    
    # Get subscription info
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    # Get portfolio summary
    portfolios = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_active == True
    ).all()
    
    total_portfolio_value = sum(p.total_value for p in portfolios)
    total_return = sum(p.total_return for p in portfolios)
    
    # Get agent summary
    total_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id
    ).count()
    
    active_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id,
        AgentConfig.is_active == True
    ).count()
    
    running_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id,
        AgentConfig.is_running == True
    ).count()
    
    # Get recent trades
    recent_trades = db.query(Trade).join(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Trade.status == TradeStatus.EXECUTED
    ).order_by(desc(Trade.executed_at)).limit(5).all()
    
    # Get trading stats for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_trades_count = db.query(Trade).join(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Trade.status == TradeStatus.EXECUTED,
        Trade.executed_at >= thirty_days_ago
    ).count()
    
    dashboard_data = {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "member_since": current_user.created_at,
            "last_login": current_user.last_login
        },
        "subscription": {
            "tier": subscription.tier.value if subscription else None,
            "status": subscription.status.value if subscription else None,
            "trial_days_remaining": subscription.days_remaining if subscription and subscription.status == SubscriptionStatus.TRIAL else None
        } if subscription else None,
        "portfolio_summary": {
            "total_portfolios": len(portfolios),
            "total_value": round(total_portfolio_value, 2),
            "total_return": round(total_return, 2),
            "total_return_pct": round((total_return / sum(p.initial_cash for p in portfolios) * 100) if portfolios else 0, 2)
        },
        "agent_summary": {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "running_agents": running_agents
        },
        "trading_activity": {
            "recent_trades_30d": recent_trades_count,
            "latest_trades": [
                {
                    "symbol": trade.symbol,
                    "type": trade.trade_type.value,
                    "quantity": trade.quantity,
                    "price": trade.execution_price or trade.price,
                    "executed_at": trade.executed_at
                }
                for trade in recent_trades
            ]
        }
    }
    
    return APIResponse(
        success=True,
        message="User dashboard data",
        data=dashboard_data
    )


@router.delete("/account", response_model=APIResponse)
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (soft delete by deactivating)"""
    
    # Check if user has active subscriptions or running agents
    from app.models.subscription import Subscription, SubscriptionStatus
    from app.models.agent_config import AgentConfig
    
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if active_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please cancel your subscription before deleting your account"
        )
    
    running_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id,
        AgentConfig.is_running == True
    ).count()
    
    if running_agents > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please stop all running agents before deleting your account"
        )
    
    # Soft delete by deactivating the account
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message="Account deactivated successfully"
    )