"""
Subscription Management API routes
"""

from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.schemas import SubscriptionResponse, SubscriptionCreate, APIResponse

router = APIRouter()


@router.get("/", response_model=List[SubscriptionResponse])
async def get_user_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's subscription history"""
    
    subscriptions = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).order_by(Subscription.created_at.desc()).all()
    
    return [SubscriptionResponse.from_orm(sub) for sub in subscriptions]


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current active subscription"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    return SubscriptionResponse.from_orm(subscription)


@router.post("/subscribe", response_model=APIResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription for the user"""
    
    # Check if user already has an active subscription
    existing_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription"
        )
    
    # Create new subscription
    subscription = Subscription(
        user_id=current_user.id,
        tier=SubscriptionTier(subscription_data.tier),
        status=SubscriptionStatus.TRIAL,  # Start with trial
        monthly_price=subscription_data.monthly_price,
        currency=subscription_data.currency,
        max_agents=subscription_data.max_agents,
        max_portfolio_value=subscription_data.max_portfolio_value,
        api_calls_per_month=subscription_data.api_calls_per_month,
        trial_start=datetime.utcnow(),
        trial_end=datetime.utcnow() + timedelta(days=14)  # 14-day trial
    )
    
    # Set tier-specific features
    if subscription.tier == SubscriptionTier.PREMIUM:
        subscription.advanced_analytics = True
    elif subscription.tier in [SubscriptionTier.PROFESSIONAL, SubscriptionTier.ENTERPRISE]:
        subscription.advanced_analytics = True
        subscription.priority_support = True
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return APIResponse(
        success=True,
        message="Subscription created successfully",
        data={
            "subscription_id": subscription.id,
            "trial_end": subscription.trial_end
        }
    )


@router.post("/upgrade", response_model=APIResponse)
async def upgrade_subscription(
    new_tier: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade user's subscription to a higher tier"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    try:
        new_tier_enum = SubscriptionTier(new_tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription tier"
        )
    
    # Check if it's actually an upgrade
    tier_hierarchy = {
        SubscriptionTier.BASIC: 1,
        SubscriptionTier.PREMIUM: 2,
        SubscriptionTier.PROFESSIONAL: 3,
        SubscriptionTier.ENTERPRISE: 4
    }
    
    if tier_hierarchy[new_tier_enum] <= tier_hierarchy[subscription.tier]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only upgrade to a higher tier"
        )
    
    # Update subscription
    subscription.tier = new_tier_enum
    subscription.updated_at = datetime.utcnow()
    
    # Update tier-specific features and limits
    if new_tier_enum == SubscriptionTier.PREMIUM:
        subscription.monthly_price = 29.99
        subscription.max_agents = 3
        subscription.max_portfolio_value = 50000.0
        subscription.api_calls_per_month = 50000
        subscription.advanced_analytics = True
    elif new_tier_enum == SubscriptionTier.PROFESSIONAL:
        subscription.monthly_price = 99.99
        subscription.max_agents = 10
        subscription.max_portfolio_value = 250000.0
        subscription.api_calls_per_month = 200000
        subscription.advanced_analytics = True
        subscription.priority_support = True
    elif new_tier_enum == SubscriptionTier.ENTERPRISE:
        subscription.monthly_price = 299.99
        subscription.max_agents = 50
        subscription.max_portfolio_value = 1000000.0
        subscription.api_calls_per_month = 1000000
        subscription.advanced_analytics = True
        subscription.priority_support = True
    
    db.commit()
    
    return APIResponse(
        success=True,
        message=f"Subscription upgraded to {new_tier_enum.value}",
        data={
            "new_tier": new_tier_enum.value,
            "monthly_price": subscription.monthly_price
        }
    )


@router.post("/cancel", response_model=APIResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's subscription"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.updated_at = datetime.utcnow()
    
    # Set cancellation to be effective at end of current billing period
    if subscription.billing_end:
        # Will remain active until billing period ends
        effective_date = subscription.billing_end
    else:
        # For trial subscriptions, cancel immediately
        effective_date = datetime.utcnow()
    
    db.commit()
    
    return APIResponse(
        success=True,
        message="Subscription cancelled successfully",
        data={
            "effective_date": effective_date,
            "access_until": effective_date
        }
    )


@router.get("/plans", response_model=APIResponse)
async def get_subscription_plans():
    """Get available subscription plans"""
    
    plans = [
        {
            "tier": "basic",
            "name": "Basic",
            "price": 9.99,
            "currency": "USD",
            "features": {
                "max_agents": 1,
                "max_portfolio_value": 10000.0,
                "api_calls_per_month": 10000,
                "advanced_analytics": False,
                "priority_support": False,
                "real_time_data": True,
                "basic_strategies": True
            },
            "description": "Perfect for beginners getting started with AI trading"
        },
        {
            "tier": "premium",
            "name": "Premium",
            "price": 29.99,
            "currency": "USD",
            "features": {
                "max_agents": 3,
                "max_portfolio_value": 50000.0,
                "api_calls_per_month": 50000,
                "advanced_analytics": True,
                "priority_support": False,
                "real_time_data": True,
                "basic_strategies": True,
                "advanced_strategies": True,
                "portfolio_optimization": True
            },
            "description": "Great for serious traders wanting multiple strategies"
        },
        {
            "tier": "professional",
            "name": "Professional",
            "price": 99.99,
            "currency": "USD",
            "features": {
                "max_agents": 10,
                "max_portfolio_value": 250000.0,
                "api_calls_per_month": 200000,
                "advanced_analytics": True,
                "priority_support": True,
                "real_time_data": True,
                "basic_strategies": True,
                "advanced_strategies": True,
                "portfolio_optimization": True,
                "risk_management": True,
                "custom_strategies": True
            },
            "description": "For professional traders managing larger portfolios"
        },
        {
            "tier": "enterprise",
            "name": "Enterprise",
            "price": 299.99,
            "currency": "USD",
            "features": {
                "max_agents": 50,
                "max_portfolio_value": 1000000.0,
                "api_calls_per_month": 1000000,
                "advanced_analytics": True,
                "priority_support": True,
                "real_time_data": True,
                "basic_strategies": True,
                "advanced_strategies": True,
                "portfolio_optimization": True,
                "risk_management": True,
                "custom_strategies": True,
                "multi_market_support": True,
                "dedicated_support": True,
                "api_access": True
            },
            "description": "For institutional traders and hedge funds"
        }
    ]
    
    return APIResponse(
        success=True,
        message="Available subscription plans",
        data=plans
    )


@router.get("/usage", response_model=APIResponse)
async def get_subscription_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription usage statistics"""
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Calculate current usage
    from app.models.agent_config import AgentConfig
    from app.models.portfolio import Portfolio
    
    active_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id,
        AgentConfig.is_active == True
    ).count()
    
    total_portfolio_value = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_active == True
    ).with_entities(func.sum(Portfolio.total_value)).scalar() or 0.0
    
    # API calls would be tracked separately in a real system
    api_calls_this_month = 0  # Placeholder
    
    usage_data = {
        "subscription_tier": subscription.tier.value,
        "subscription_status": subscription.status.value,
        "trial_days_remaining": subscription.days_remaining if subscription.status == SubscriptionStatus.TRIAL else None,
        "limits": {
            "max_agents": subscription.max_agents,
            "max_portfolio_value": subscription.max_portfolio_value,
            "api_calls_per_month": subscription.api_calls_per_month
        },
        "current_usage": {
            "active_agents": active_agents,
            "total_portfolio_value": round(total_portfolio_value, 2),
            "api_calls_this_month": api_calls_this_month
        },
        "usage_percentages": {
            "agents": round((active_agents / subscription.max_agents) * 100, 1),
            "portfolio_value": round((total_portfolio_value / subscription.max_portfolio_value) * 100, 1),
            "api_calls": round((api_calls_this_month / subscription.api_calls_per_month) * 100, 1)
        }
    }
    
    return APIResponse(
        success=True,
        message="Subscription usage statistics",
        data=usage_data
    )