"""
Pydantic schemas for API request/response models
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
import re

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = None
    country: Optional[str] = None
    timezone: str = "UTC"


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if len(v) > 128:
            raise ValueError('Password must be less than 128 characters')
            
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
            
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
            
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
            
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
            
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username requirements"""
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
            
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
            
        if not re.match("^[a-zA-Z0-9_-]+$", v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
            
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate full name"""
        if v and len(v) < 2:
            raise ValueError('Full name must be at least 2 characters long')
            
        return v


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Subscription schemas
class SubscriptionBase(BaseModel):
    tier: str
    monthly_price: float
    currency: str = "USD"
    max_agents: int = 1
    max_portfolio_value: float = 10000.0
    api_calls_per_month: int = 10000


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    status: str
    stripe_subscription_id: Optional[str] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    billing_start: Optional[datetime] = None
    billing_end: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Portfolio schemas
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    initial_cash: float = 10000.0
    market: str = "us"


class PortfolioCreate(PortfolioBase):
    agent_config_id: Optional[int] = None


class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    current_cash: float
    total_value: float
    total_return: float
    total_return_pct: float
    daily_return_pct: float
    max_drawdown: float
    sharpe_ratio: Optional[float] = None
    holdings: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_trade_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# Trade schemas
class TradeBase(BaseModel):
    symbol: str
    trade_type: str  # "buy" or "sell"
    quantity: int
    price: float


class TradeCreate(TradeBase):
    portfolio_id: int
    ai_reasoning: Optional[str] = None
    confidence_score: Optional[float] = None
    market_conditions: Optional[str] = None


class TradeResponse(TradeBase):
    id: int
    portfolio_id: int
    total_value: float
    status: str
    execution_price: Optional[float] = None
    fees: float
    ai_reasoning: Optional[str] = None
    confidence_score: Optional[float] = None
    market_conditions: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Agent Config schemas
class AgentConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    strategy_type: str = "balanced"
    risk_level: float = Field(default=0.5, ge=0.0, le=1.0)
    max_position_size: float = Field(default=0.1, ge=0.0, le=1.0)
    stop_loss_pct: float = Field(default=0.05, ge=0.0, le=1.0)
    take_profit_pct: float = Field(default=0.15, ge=0.0, le=1.0)
    initial_cash: float = 10000.0
    max_daily_trades: int = 5
    market: str = "us"


class AgentConfigCreate(AgentConfigBase):
    allowed_symbols: Optional[List[str]] = None
    excluded_symbols: Optional[List[str]] = None


class AgentConfigResponse(AgentConfigBase):
    id: int
    user_id: int
    ai_model_name: str
    ai_model_version: str
    allowed_symbols: Optional[List[str]] = None
    excluded_symbols: Optional[List[str]] = None
    use_technical_analysis: bool
    use_sentiment_analysis: bool
    use_news_analysis: bool
    is_active: bool
    is_running: bool
    total_trades: int
    successful_trades: int
    win_rate: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    strategy_type: Optional[str] = None
    risk_level: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_position_size: Optional[float] = Field(None, ge=0.0, le=1.0)
    stop_loss_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    take_profit_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_daily_trades: Optional[int] = None
    is_active: Optional[bool] = None


# API Response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int