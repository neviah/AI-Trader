"""
Portfolio model for managing user investment portfolios
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Portfolio(Base):
    """Portfolio model for tracking user investment portfolios"""
    
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_config_id = Column(Integer, ForeignKey("agent_configs.id"))
    
    # Portfolio identification
    name = Column(String, nullable=False)
    description = Column(String)
    
    # Financial data
    initial_cash = Column(Float, nullable=False, default=10000.0)
    current_cash = Column(Float, nullable=False, default=10000.0)
    total_value = Column(Float, nullable=False, default=10000.0)
    
    # Performance metrics
    total_return = Column(Float, default=0.0)  # Absolute return in USD
    total_return_pct = Column(Float, default=0.0)  # Percentage return
    daily_return_pct = Column(Float, default=0.0)  # Daily return percentage
    max_drawdown = Column(Float, default=0.0)  # Maximum drawdown percentage
    sharpe_ratio = Column(Float)
    
    # Holdings (JSON field to store current positions)
    holdings = Column(JSON, default=dict)  # {"AAPL": 10, "MSFT": 5, "CASH": 5000}
    
    # Market information
    market = Column(String, default="us")  # "us" or "cn"
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_trade_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    agent_config = relationship("AgentConfig", back_populates="portfolio")
    trades = relationship("Trade", back_populates="portfolio")
    
    def __repr__(self):
        return f"<Portfolio(name='{self.name}', value=${self.total_value:.2f}, return={self.total_return_pct:.2f}%)>"
    
    @property
    def stock_value(self) -> float:
        """Calculate total value of stock holdings (excluding cash)"""
        if not self.holdings:
            return 0.0
        return sum(
            quantity * self._get_current_price(symbol)
            for symbol, quantity in self.holdings.items()
            if symbol != "CASH" and quantity > 0
        )
    
    def _get_current_price(self, symbol: str) -> float:
        """Get current price for a symbol (placeholder - implement with real data)"""
        # This would integrate with Alpha Vantage or other price data source
        return 100.0  # Placeholder
    
    def update_performance_metrics(self):
        """Update calculated performance metrics"""
        if self.initial_cash > 0:
            self.total_return = self.total_value - self.initial_cash
            self.total_return_pct = (self.total_return / self.initial_cash) * 100