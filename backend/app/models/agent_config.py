"""
Agent Configuration model for managing AI trading agent settings
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AgentConfig(Base):
    """Agent Configuration model for managing AI trading agent settings"""
    
    __tablename__ = "agent_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Agent identification
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # AI Model Configuration
    ai_model_name = Column(String, default="deepseek-chat")
    ai_model_version = Column(String, default="v3.1")
    
    # Trading Strategy
    strategy_type = Column(String, default="balanced")  # aggressive, balanced, conservative
    risk_level = Column(Float, default=0.5)  # 0.0 (very conservative) to 1.0 (very aggressive)
    max_position_size = Column(Float, default=0.1)  # Max % of portfolio per position
    stop_loss_pct = Column(Float, default=0.05)  # 5% stop loss
    take_profit_pct = Column(Float, default=0.15)  # 15% take profit
    
    # Portfolio Management
    initial_cash = Column(Float, default=10000.0)
    max_daily_trades = Column(Integer, default=5)
    rebalance_frequency = Column(String, default="daily")  # daily, weekly, monthly
    
    # Market Settings
    market = Column(String, default="us")  # "us" or "cn"
    allowed_symbols = Column(JSON)  # List of allowed trading symbols
    excluded_symbols = Column(JSON)  # List of excluded symbols
    
    # Advanced Settings
    use_technical_analysis = Column(Boolean, default=True)
    use_sentiment_analysis = Column(Boolean, default=True)
    use_news_analysis = Column(Boolean, default=True)
    sentiment_weight = Column(Float, default=0.3)
    technical_weight = Column(Float, default=0.4)
    fundamental_weight = Column(Float, default=0.3)
    
    # Agent Status
    is_active = Column(Boolean, default=False)
    is_running = Column(Boolean, default=False)
    last_run_at = Column(DateTime(timezone=True))
    next_run_at = Column(DateTime(timezone=True))
    
    # Performance Tracking
    total_trades = Column(Integer, default=0)
    successful_trades = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="agent_configs")
    portfolio = relationship("Portfolio", back_populates="agent_config", uselist=False)
    
    def __repr__(self):
        return f"<AgentConfig(name='{self.name}', strategy='{self.strategy_type}', active={self.is_active})>"
    
    @property
    def win_rate_pct(self) -> float:
        """Calculate win rate as percentage"""
        if self.total_trades > 0:
            return (self.successful_trades / self.total_trades) * 100
        return 0.0
    
    def update_performance(self, trade_successful: bool):
        """Update performance metrics after a trade"""
        self.total_trades += 1
        if trade_successful:
            self.successful_trades += 1
        self.win_rate = self.win_rate_pct