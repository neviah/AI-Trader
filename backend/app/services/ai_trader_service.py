"""
AI-Trader Integration Service

This service provides an interface between the FastAPI backend and the existing AI-Trader system.
It manages agent lifecycle, executes trades, and syncs data between systems.
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import subprocess

from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.agent_config import AgentConfig
from app.models.portfolio import Portfolio
from app.models.trade import Trade, TradeType, TradeStatus
from app.models.user import User

# Add AI-Trader root to path for imports
ai_trader_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ai_trader_root))

try:
    from main import get_agent_class, load_config
    from tools.general_tools import get_config_value, write_config_value
    from tools.result_tools import get_daily_portfolio_values, calculate_portfolio_value
except ImportError as e:
    print(f"Warning: Could not import AI-Trader modules: {e}")
    # Provide fallback functionality


class AITraderService:
    """Service for integrating with the existing AI-Trader system"""
    
    def __init__(self):
        self.ai_trader_root = Path(settings.AI_TRADER_CONFIG_PATH).parent
        self.running_agents: Dict[int, subprocess.Popen] = {}
        
    async def start_agent(self, agent_config: AgentConfig, portfolio: Portfolio, db: Session) -> Dict[str, Any]:
        """
        Start an AI trading agent based on configuration
        
        Args:
            agent_config: The agent configuration
            portfolio: The associated portfolio
            db: Database session
            
        Returns:
            Dict with agent status and process info
        """
        try:
            # Create AI-Trader compatible configuration
            config = self._create_ai_trader_config(agent_config, portfolio)
            
            # Write configuration to temporary file
            config_file = self._write_temp_config(agent_config.id, config)
            
            # Start the AI-Trader process
            process = await self._start_ai_trader_process(config_file, agent_config.id)
            
            if process and process.returncode is None:
                self.running_agents[agent_config.id] = process
                
                # Update agent status in database
                agent_config.is_running = True
                agent_config.last_run_at = datetime.utcnow()
                db.commit()
                
                return {
                    "status": "started",
                    "agent_id": agent_config.id,
                    "process_id": process.pid,
                    "config_file": str(config_file)
                }
            else:
                raise Exception("Failed to start AI-Trader process")
                
        except Exception as e:
            return {
                "status": "error",
                "agent_id": agent_config.id,
                "error": str(e)
            }
    
    async def stop_agent(self, agent_id: int, db: Session) -> Dict[str, Any]:
        """
        Stop a running AI trading agent
        
        Args:
            agent_id: The agent configuration ID
            db: Database session
            
        Returns:
            Dict with stop status
        """
        try:
            if agent_id in self.running_agents:
                process = self.running_agents[agent_id]
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                
                del self.running_agents[agent_id]
            
            # Update agent status in database
            agent_config = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
            if agent_config:
                agent_config.is_running = False
                db.commit()
            
            # Clean up temporary config file
            self._cleanup_temp_config(agent_id)
            
            return {
                "status": "stopped",
                "agent_id": agent_id
            }
            
        except Exception as e:
            return {
                "status": "error",
                "agent_id": agent_id,
                "error": str(e)
            }
    
    async def sync_portfolio_data(self, portfolio: Portfolio, db: Session) -> Dict[str, Any]:
        """
        Sync portfolio data from AI-Trader logs
        
        Args:
            portfolio: The portfolio to sync
            db: Database session
            
        Returns:
            Dict with sync results
        """
        try:
            # Read AI-Trader position data
            position_file = self._get_position_file(portfolio.id)
            
            if not position_file.exists():
                return {"status": "no_data", "message": "No position file found"}
            
            # Parse position data
            positions = self._parse_position_file(position_file)
            
            if positions:
                latest_position = positions[-1]
                
                # Update portfolio holdings
                portfolio.holdings = latest_position.get("positions", {})
                portfolio.current_cash = portfolio.holdings.get("CASH", 0.0)
                
                # Calculate total portfolio value
                total_value = await self._calculate_portfolio_value(portfolio.holdings)
                portfolio.total_value = total_value
                
                # Update performance metrics
                portfolio.update_performance_metrics()
                portfolio.updated_at = datetime.utcnow()
                
                db.commit()
                
                # Sync trades
                trade_sync_results = await self._sync_trades(portfolio, db)
                
                return {
                    "status": "success",
                    "portfolio_value": total_value,
                    "holdings": portfolio.holdings,
                    "trades_synced": trade_sync_results.get("trades_synced", 0)
                }
            else:
                return {"status": "no_data", "message": "No position data found"}
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def get_agent_status(self, agent_id: int) -> Dict[str, Any]:
        """
        Get current status of an AI trading agent
        
        Args:
            agent_id: The agent configuration ID
            
        Returns:
            Dict with agent status information
        """
        try:
            is_running = agent_id in self.running_agents
            process_info = None
            
            if is_running:
                process = self.running_agents[agent_id]
                process_info = {
                    "pid": process.pid,
                    "returncode": process.returncode,
                    "is_alive": process.returncode is None
                }
                
                # Check if process is actually still running
                if process.returncode is not None:
                    # Process has terminated
                    del self.running_agents[agent_id]
                    is_running = False
            
            return {
                "agent_id": agent_id,
                "is_running": is_running,
                "process_info": process_info,
                "log_file": self._get_log_file(agent_id) if is_running else None
            }
            
        except Exception as e:
            return {
                "agent_id": agent_id,
                "status": "error",
                "error": str(e)
            }
    
    # Private helper methods
    
    def _create_ai_trader_config(self, agent_config: AgentConfig, portfolio: Portfolio) -> Dict[str, Any]:
        """Create AI-Trader compatible configuration"""
        
        config = {
            "agent_type": "BaseAgent" if agent_config.market == "us" else "BaseAgentAStock",
            "market": agent_config.market,
            "date_range": {
                "init_date": datetime.now().strftime("%Y-%m-%d"),
                "end_date": (datetime.now().replace(hour=23, minute=59)).strftime("%Y-%m-%d")
            },
            "models": [
                {
                    "name": f"{agent_config.name}-{agent_config.id}",
                    "basemodel": agent_config.model_name,
                    "signature": f"api-agent-{agent_config.id}",
                    "enabled": True,
                    "openai_base_url": settings.DEEPSEEK_API_BASE,
                    "openai_api_key": settings.DEEPSEEK_API_KEY
                }
            ],
            "agent_config": {
                "max_steps": 30,
                "max_retries": 3,
                "base_delay": 1.0,
                "initial_cash": portfolio.initial_cash
            },
            "log_config": {
                "log_path": f"./data/api_agents"
            }
        }
        
        return config
    
    def _write_temp_config(self, agent_id: int, config: Dict[str, Any]) -> Path:
        """Write temporary configuration file for AI-Trader"""
        
        config_dir = Path(settings.AI_TRADER_CONFIG_PATH)
        config_file = config_dir / f"api_agent_{agent_id}_config.json"
        
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        return config_file
    
    async def _start_ai_trader_process(self, config_file: Path, agent_id: int) -> subprocess.Popen:
        """Start AI-Trader as a subprocess"""
        
        # Create log directory
        log_dir = Path("./logs")
        log_dir.mkdir(exist_ok=True)
        
        # Prepare command
        cmd = [
            sys.executable,
            str(self.ai_trader_root / "main.py"),
            str(config_file)
        ]
        
        # Start process
        process = subprocess.Popen(
            cmd,
            cwd=str(self.ai_trader_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        return process
    
    def _cleanup_temp_config(self, agent_id: int):
        """Clean up temporary configuration file"""
        
        config_dir = Path(settings.AI_TRADER_CONFIG_PATH)
        config_file = config_dir / f"api_agent_{agent_id}_config.json"
        
        if config_file.exists():
            config_file.unlink()
    
    def _get_position_file(self, portfolio_id: int) -> Path:
        """Get path to AI-Trader position file"""
        
        return Path(settings.AI_TRADER_DATA_PATH) / "api_agents" / f"api-agent-{portfolio_id}" / "position" / "position.jsonl"
    
    def _get_log_file(self, agent_id: int) -> Path:
        """Get path to agent log file"""
        
        return Path("./logs") / f"agent_{agent_id}.log"
    
    def _parse_position_file(self, position_file: Path) -> List[Dict[str, Any]]:
        """Parse AI-Trader position.jsonl file"""
        
        positions = []
        
        try:
            with open(position_file, 'r') as f:
                for line in f:
                    if line.strip():
                        positions.append(json.loads(line.strip()))
        except Exception as e:
            print(f"Error parsing position file: {e}")
        
        return positions
    
    async def _calculate_portfolio_value(self, holdings: Dict[str, float]) -> float:
        """Calculate total portfolio value with current prices"""
        
        total_value = holdings.get("CASH", 0.0)
        
        # Add stock values (would integrate with real price data)
        for symbol, quantity in holdings.items():
            if symbol != "CASH" and quantity > 0:
                # Placeholder price - would integrate with Alpha Vantage
                price = 150.0
                total_value += quantity * price
        
        return total_value
    
    async def _sync_trades(self, portfolio: Portfolio, db: Session) -> Dict[str, Any]:
        """Sync trades from AI-Trader logs to database"""
        
        # This would parse AI-Trader trade logs and create Trade records
        # For now, return placeholder
        
        return {"trades_synced": 0}


# Global service instance
ai_trader_service = AITraderService()