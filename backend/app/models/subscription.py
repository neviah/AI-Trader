"""
Subscription model for managing user subscription plans
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class SubscriptionTier(enum.Enum):
    """Subscription tier options"""
    BASIC = "basic"
    PREMIUM = "premium"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(enum.Enum):
    """Subscription status options"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class Subscription(Base):
    """Subscription model for managing user subscription plans"""
    
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Subscription details
    tier = Column(Enum(SubscriptionTier), nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)
    
    # Pricing
    monthly_price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    # Billing
    stripe_subscription_id = Column(String, unique=True)
    stripe_customer_id = Column(String)
    
    # Limits and features
    max_agents = Column(Integer, default=1)
    max_portfolio_value = Column(Float, default=10000.0)  # USD
    api_calls_per_month = Column(Integer, default=10000)
    advanced_analytics = Column(Boolean, default=False)
    priority_support = Column(Boolean, default=False)
    
    # Timestamps
    trial_start = Column(DateTime(timezone=True))
    trial_end = Column(DateTime(timezone=True))
    billing_start = Column(DateTime(timezone=True))
    billing_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    
    def __repr__(self):
        return f"<Subscription(user_id={self.user_id}, tier='{self.tier.value}', status='{self.status.value}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return self.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]
    
    @property
    def days_remaining(self) -> int:
        """Calculate days remaining in current billing period"""
        import datetime
        if self.status == SubscriptionStatus.TRIAL and self.trial_end:
            return max(0, (self.trial_end - datetime.datetime.now(datetime.timezone.utc)).days)
        elif self.billing_end:
            return max(0, (self.billing_end - datetime.datetime.now(datetime.timezone.utc)).days)
        return 0