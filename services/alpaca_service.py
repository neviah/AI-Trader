"""
Alpaca Trading Service
Real stock trading integration using Alpaca Markets API
"""
import os
import logging
from typing import Dict, List, Optional, Union
from decimal import Decimal
import asyncio
from datetime import datetime, timedelta

import alpaca_trade_api as tradeapi
from alpaca_trade_api.rest import APIError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class AlpacaService:
    """
    Service for connecting to Alpaca Markets for real stock trading
    Handles authentication, order management, and portfolio tracking
    """
    
    def __init__(self, paper_trading: bool = True):
        """
        Initialize Alpaca service
        
        Args:
            paper_trading: If True, use paper trading (fake money)
        """
        self.paper_trading = paper_trading
        
        # Get API credentials from environment
        self.api_key = os.getenv('ALPACA_API_KEY')
        self.secret_key = os.getenv('ALPACA_SECRET_KEY')
        
        if not self.api_key or not self.secret_key:
            raise ValueError("Alpaca API credentials not found in environment variables")
        
        # Set base URL based on paper trading mode
        if paper_trading:
            base_url = 'https://paper-api.alpaca.markets'
        else:
            base_url = 'https://api.alpaca.markets'
        
        # Initialize Alpaca API client
        self.api = tradeapi.REST(
            self.api_key,
            self.secret_key,
            base_url,
            api_version='v2'
        )
        
        logger.info(f"Alpaca service initialized - Paper trading: {paper_trading}")
    
    async def get_account_info(self) -> Dict:
        """Get account information and buying power"""
        try:
            account = self.api.get_account()
            return {
                'account_id': account.id,
                'buying_power': float(account.buying_power),
                'cash': float(account.cash),
                'portfolio_value': float(account.portfolio_value),
                'equity': float(account.equity),
                'day_trade_count': account.daytrade_count,
                'status': account.status,
                'paper_trading': self.paper_trading
            }
        except APIError as e:
            logger.error(f"Error getting account info: {e}")
            raise
    
    async def get_positions(self) -> List[Dict]:
        """Get current stock positions"""
        try:
            positions = self.api.list_positions()
            result = []
            
            for position in positions:
                result.append({
                    'symbol': position.symbol,
                    'quantity': float(position.qty),
                    'market_value': float(position.market_value),
                    'cost_basis': float(position.cost_basis),
                    'current_price': float(position.current_price),
                    'unrealized_pl': float(position.unrealized_pl),
                    'unrealized_plpc': float(position.unrealized_plpc),
                    'side': position.side
                })
            
            return result
        except APIError as e:
            logger.error(f"Error getting positions: {e}")
            raise
    
    async def get_stock_price(self, symbol: str) -> Optional[float]:
        """Get current stock price"""
        try:
            trade = self.api.get_latest_trade(symbol)
            return float(trade.price)
        except APIError as e:
            logger.error(f"Error getting price for {symbol}: {e}")
            return None
    
    async def buy_stock(self, symbol: str, quantity: Union[int, float], order_type: str = 'market') -> Dict:
        """
        Buy stock
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            quantity: Number of shares to buy
            order_type: 'market' or 'limit'
        
        Returns:
            Order information
        """
        try:
            order = self.api.submit_order(
                symbol=symbol,
                qty=quantity,
                side='buy',
                type=order_type,
                time_in_force='day'
            )
            
            result = {
                'order_id': order.id,
                'symbol': order.symbol,
                'quantity': float(order.qty),
                'side': order.side,
                'order_type': order.type,
                'status': order.status,
                'submitted_at': order.submitted_at.isoformat(),
                'filled_qty': float(order.filled_qty or 0),
                'filled_avg_price': float(order.filled_avg_price or 0)
            }
            
            logger.info(f"Buy order submitted: {symbol} x {quantity}")
            return result
            
        except APIError as e:
            logger.error(f"Error buying {symbol}: {e}")
            raise
    
    async def sell_stock(self, symbol: str, quantity: Union[int, float], order_type: str = 'market') -> Dict:
        """
        Sell stock
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            quantity: Number of shares to sell
            order_type: 'market' or 'limit'
        
        Returns:
            Order information
        """
        try:
            order = self.api.submit_order(
                symbol=symbol,
                qty=quantity,
                side='sell',
                type=order_type,
                time_in_force='day'
            )
            
            result = {
                'order_id': order.id,
                'symbol': order.symbol,
                'quantity': float(order.qty),
                'side': order.side,
                'order_type': order.type,
                'status': order.status,
                'submitted_at': order.submitted_at.isoformat(),
                'filled_qty': float(order.filled_qty or 0),
                'filled_avg_price': float(order.filled_avg_price or 0)
            }
            
            logger.info(f"Sell order submitted: {symbol} x {quantity}")
            return result
            
        except APIError as e:
            logger.error(f"Error selling {symbol}: {e}")
            raise
    
    async def get_order_status(self, order_id: str) -> Dict:
        """Get status of a specific order"""
        try:
            order = self.api.get_order(order_id)
            return {
                'order_id': order.id,
                'symbol': order.symbol,
                'quantity': float(order.qty),
                'side': order.side,
                'order_type': order.type,
                'status': order.status,
                'submitted_at': order.submitted_at.isoformat(),
                'filled_qty': float(order.filled_qty or 0),
                'filled_avg_price': float(order.filled_avg_price or 0),
                'filled_at': order.filled_at.isoformat() if order.filled_at else None
            }
        except APIError as e:
            logger.error(f"Error getting order {order_id}: {e}")
            raise
    
    async def get_trade_history(self, days: int = 30) -> List[Dict]:
        """Get recent trade history"""
        try:
            # Get orders from the last N days
            since = datetime.now() - timedelta(days=days)
            orders = self.api.list_orders(
                status='all',
                after=since.isoformat(),
                direction='desc',
                limit=100
            )
            
            trades = []
            for order in orders:
                if order.status == 'filled':
                    trades.append({
                        'order_id': order.id,
                        'symbol': order.symbol,
                        'quantity': float(order.qty),
                        'side': order.side,
                        'price': float(order.filled_avg_price or 0),
                        'total_value': float(order.filled_qty or 0) * float(order.filled_avg_price or 0),
                        'filled_at': order.filled_at.isoformat() if order.filled_at else None,
                        'submitted_at': order.submitted_at.isoformat()
                    })
            
            return trades
        except APIError as e:
            logger.error(f"Error getting trade history: {e}")
            raise
    
    async def liquidate_all_positions(self) -> Dict:
        """
        Sell all current positions (for withdrawal purposes)
        """
        try:
            # Close all positions
            response = self.api.close_all_positions()
            
            # Parse response
            result = {
                'success': True,
                'orders': [],
                'timestamp': datetime.now().isoformat()
            }
            
            for order in response:
                result['orders'].append({
                    'symbol': order.symbol,
                    'quantity': float(order.qty),
                    'side': order.side,
                    'order_id': order.id,
                    'status': order.status
                })
            
            logger.info(f"Liquidated all positions: {len(result['orders'])} orders")
            return result
            
        except APIError as e:
            logger.error(f"Error liquidating positions: {e}")
            raise
    
    async def check_market_hours(self) -> Dict:
        """Check if market is currently open"""
        try:
            clock = self.api.get_clock()
            return {
                'is_open': clock.is_open,
                'next_open': clock.next_open.isoformat(),
                'next_close': clock.next_close.isoformat(),
                'timestamp': clock.timestamp.isoformat()
            }
        except APIError as e:
            logger.error(f"Error checking market hours: {e}")
            raise


# Convenience functions for the AI agent
async def get_alpaca_service(paper_trading: bool = True) -> AlpacaService:
    """Get configured Alpaca service instance"""
    return AlpacaService(paper_trading=paper_trading)


async def test_alpaca_connection():
    """Test Alpaca API connection"""
    try:
        service = await get_alpaca_service(paper_trading=True)
        account = await service.get_account_info()
        print(f"✅ Alpaca connection successful!")
        print(f"Account ID: {account['account_id']}")
        print(f"Buying Power: ${account['buying_power']:,.2f}")
        print(f"Portfolio Value: ${account['portfolio_value']:,.2f}")
        return True
    except Exception as e:
        print(f"❌ Alpaca connection failed: {e}")
        return False


if __name__ == "__main__":
    # Test the connection
    asyncio.run(test_alpaca_connection())