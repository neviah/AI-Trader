"""
Trade model for tracking individual buy/sell transactions
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TradeType(enum.Enum):
    """Trade type options"""
    BUY = "buy"
    SELL = "sell"


class TradeStatus(enum.Enum):
    """Trade status options"""
    PENDING = "pending"
    EXECUTED = "executed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Trade(Base):
    """Trade model for tracking individual buy/sell transactions"""
    
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    # Trade details
    symbol = Column(String, nullable=False, index=True)
    trade_type = Column(Enum(TradeType), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    
    # Trade execution
    status = Column(Enum(TradeStatus), default=TradeStatus.PENDING)
    execution_price = Column(Float)  # Actual execution price (may differ from intended)
    fees = Column(Float, default=0.0)
    
    # AI Decision Context
    ai_reasoning = Column(Text)  # DeepSeek's reasoning for this trade
    confidence_score = Column(Float)  # AI confidence level (0-1)
    market_conditions = Column(Text)  # Market conditions at time of decision
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    executed_at = Column(DateTime(timezone=True))
    
    # External references
    broker_trade_id = Column(String)  # Reference to external broker trade ID
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="trades")
    
    def __repr__(self):
        return f"<Trade({self.trade_type.value} {self.quantity} {self.symbol} @ ${self.price:.2f})>"
    
    @property
    def profit_loss(self) -> float:
        """Calculate profit/loss for this trade (for sells)"""
        if self.trade_type == TradeType.SELL and self.execution_price:
            return (self.execution_price - self.price) * self.quantity
        return 0.0
    
    @property
    def is_profitable(self) -> bool:
        """Check if this trade was profitable"""
        return self.profit_loss > 0