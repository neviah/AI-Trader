"""
AI-Trader Integration Service

This service acts as a bridge between the FastAPI backend and the existing AI-Trader system.
It manages agent lifecycle, syncs trade data, and coordinates between the subscription platform
and the actual trading agents.
"""

import asyncio
import json
import os
import subprocess
import signal
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.agent_config import AgentConfig
from app.models.trade import Trade
from app.models.portfolio import Portfolio
from app.models.user import User

logger = logging.getLogger(__name__)

class AITraderBridge:
    """Bridge service to integrate with existing AI-Trader system"""
    
    def __init__(self):
        self.active_agents: Dict[int, Dict[str, Any]] = {}  # agent_id -> process info
        self.ai_trader_path = "/workspaces/AI-Trader"
        self.config_path = "/workspaces/AI-Trader/configs"
        self.data_path = "/workspaces/AI-Trader/data"
        
    async def start_agent(self, agent_config_id: int, db: AsyncSession) -> bool:
        """Start an AI trading agent based on configuration"""
        try:
            # Get agent configuration
            result = await db.execute(
                select(AgentConfig).where(AgentConfig.id == agent_config_id)
            )
            agent_config = result.scalar_one_or_none()
            
            if not agent_config:
                logger.error(f"Agent config {agent_config_id} not found")
                return False
                
            if agent_config_id in self.active_agents:
                logger.warning(f"Agent {agent_config_id} is already running")
                return True
                
            # Create agent-specific configuration
            config_file = await self._create_agent_config(agent_config, db)
            
            # Start the AI-Trader process
            process = await self._start_trading_process(config_file, agent_config)
            
            if process:
                self.active_agents[agent_config_id] = {
                    'process': process,
                    'config_file': config_file,
                    'started_at': datetime.now(),
                    'agent_config': agent_config
                }
                
                # Update agent status in database
                agent_config.is_running = True
                agent_config.last_started_at = datetime.now()
                await db.commit()
                
                logger.info(f"Started AI agent {agent_config_id} (PID: {process.pid})")
                return True
            else:
                logger.error(f"Failed to start AI agent {agent_config_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting agent {agent_config_id}: {e}")
            return False
    
    async def stop_agent(self, agent_config_id: int, db: AsyncSession) -> bool:
        """Stop a running AI trading agent"""
        try:
            if agent_config_id not in self.active_agents:
                logger.warning(f"Agent {agent_config_id} is not running")
                return True
                
            agent_info = self.active_agents[agent_config_id]
            process = agent_info['process']
            
            # Gracefully terminate the process
            process.terminate()
            
            # Wait for process to end, then force kill if needed
            try:
                await asyncio.wait_for(process.wait(), timeout=10.0)
            except asyncio.TimeoutError:
                logger.warning(f"Force killing agent {agent_config_id}")
                process.kill()
                await process.wait()
            
            # Clean up
            del self.active_agents[agent_config_id]
            
            # Update database
            result = await db.execute(
                select(AgentConfig).where(AgentConfig.id == agent_config_id)
            )
            agent_config = result.scalar_one_or_none()
            if agent_config:
                agent_config.is_running = False
                agent_config.last_stopped_at = datetime.now()
                await db.commit()
            
            logger.info(f"Stopped AI agent {agent_config_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping agent {agent_config_id}: {e}")
            return False
    
    async def get_agent_status(self, agent_config_id: int) -> Dict[str, Any]:
        """Get status of an AI trading agent"""
        if agent_config_id not in self.active_agents:
            return {
                'running': False,
                'status': 'stopped'
            }
        
        agent_info = self.active_agents[agent_config_id]
        process = agent_info['process']
        
        return {
            'running': True,
            'status': 'active' if process.returncode is None else 'crashed',
            'pid': process.pid,
            'started_at': agent_info['started_at'].isoformat(),
            'uptime_seconds': (datetime.now() - agent_info['started_at']).total_seconds()
        }
    
    async def sync_trades_from_ai_trader(self, db: AsyncSession) -> int:
        """Sync trade data from AI-Trader logs/data to database"""
        try:
            trades_synced = 0
            
            # Look for trade data files in AI-Trader data directory
            for data_file in Path(self.data_path).glob("*trades*.json"):
                trades_data = json.loads(data_file.read_text())
                
                for trade_data in trades_data:
                    # Check if trade already exists
                    existing_trade = await db.execute(
                        select(Trade).where(
                            Trade.symbol == trade_data.get('symbol'),
                            Trade.executed_at == datetime.fromisoformat(trade_data.get('timestamp'))
                        )
                    )
                    
                    if existing_trade.scalar_one_or_none():
                        continue  # Trade already exists
                    
                    # Create new trade record
                    trade = Trade(
                        portfolio_id=trade_data.get('portfolio_id'),
                        symbol=trade_data.get('symbol'),
                        trade_type=trade_data.get('action'),  # buy/sell
                        quantity=trade_data.get('quantity'),
                        price=trade_data.get('price'),
                        total_amount=trade_data.get('total'),
                        ai_reasoning=trade_data.get('reasoning', ''),
                        confidence_score=trade_data.get('confidence', 0.5),
                        executed_at=datetime.fromisoformat(trade_data.get('timestamp'))
                    )
                    
                    db.add(trade)
                    trades_synced += 1
            
            await db.commit()
            logger.info(f"Synced {trades_synced} trades from AI-Trader")
            return trades_synced
            
        except Exception as e:
            logger.error(f"Error syncing trades: {e}")
            return 0
    
    async def _create_agent_config(self, agent_config: AgentConfig, db: AsyncSession) -> str:
        """Create AI-Trader configuration file for specific agent"""
        
        # Get user and portfolio info
        result = await db.execute(
            select(Portfolio).where(Portfolio.id == agent_config.portfolio_id)
        )
        portfolio = result.scalar_one_or_none()
        
        if not portfolio:
            raise ValueError(f"Portfolio {agent_config.portfolio_id} not found")
        
        # Create agent-specific config based on default config
        config = {
            "models": [
                {
                    "name": "deepseek-chat-v3.1",
                    "basemodel": "deepseek-chat",
                    "max_daily_requests": agent_config.max_trades_per_day or 50,
                    "api_key": os.getenv("DEEPSEEK_API_KEY"),
                    "api_base": "https://api.deepseek.com/v1",
                    "enabled": True
                }
            ],
            "trading": {
                "portfolio_id": portfolio.id,
                "initial_cash": float(portfolio.current_cash),
                "risk_level": agent_config.risk_tolerance,
                "strategy": agent_config.strategy_type,
                "max_position_size": agent_config.max_position_size or 0.1,
                "stop_loss_pct": agent_config.stop_loss_pct or 0.05,
                "take_profit_pct": agent_config.take_profit_pct or 0.15,
                "use_technical_analysis": agent_config.use_technical_analysis,
                "use_sentiment_analysis": agent_config.use_sentiment_analysis,
                "use_news_analysis": agent_config.use_news_analysis
            },
            "data_sources": {
                "alpha_vantage_key": os.getenv("ALPHA_VANTAGE_API_KEY", "demo"),
                "market": portfolio.market or "us"
            },
            "execution": {
                "paper_trading": not agent_config.live_trading,
                "trade_frequency": "hourly",  # or based on agent_config
                "logging_level": "INFO"
            }
        }
        
        # Save config file
        config_filename = f"agent_{agent_config.id}_config.json"
        config_filepath = os.path.join(self.config_path, config_filename)
        
        with open(config_filepath, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Created config file: {config_filepath}")
        return config_filepath
    
    async def _start_trading_process(self, config_file: str, agent_config: AgentConfig) -> Optional[asyncio.subprocess.Process]:
        """Start the actual AI-Trader process"""
        try:
            # Command to run AI-Trader with specific config
            cmd = [
                "python",
                "main.py",
                "--config", config_file,
                "--mode", "live" if agent_config.live_trading else "paper"
            ]
            
            # Start the process
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=self.ai_trader_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env={
                    **os.environ,
                    "DEEPSEEK_API_KEY": os.getenv("DEEPSEEK_API_KEY"),
                    "ALPHA_VANTAGE_API_KEY": os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
                }
            )
            
            logger.info(f"Started AI-Trader process (PID: {process.pid}) with config: {config_file}")
            return process
            
        except Exception as e:
            logger.error(f"Failed to start trading process: {e}")
            return None
    
    async def monitor_agents(self, db: AsyncSession):
        """Background task to monitor running agents and sync data"""
        while True:
            try:
                # Check agent health
                for agent_id, agent_info in list(self.active_agents.items()):
                    process = agent_info['process']
                    
                    if process.returncode is not None:
                        logger.warning(f"Agent {agent_id} process died (return code: {process.returncode})")
                        # Update database status
                        result = await db.execute(
                            select(AgentConfig).where(AgentConfig.id == agent_id)
                        )
                        agent_config = result.scalar_one_or_none()
                        if agent_config:
                            agent_config.is_running = False
                            await db.commit()
                        
                        # Clean up
                        del self.active_agents[agent_id]
                
                # Sync trade data every few minutes
                await self.sync_trades_from_ai_trader(db)
                
                # Wait before next check
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Error in agent monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error

# Global instance
ai_trader_bridge = AITraderBridge()