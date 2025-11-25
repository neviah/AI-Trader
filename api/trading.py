from http.server import BaseHTTPRequestHandler
import json
import os
import sys
sys.path.append('.')

# Import the Alpaca service
import asyncio
import alpaca_trade_api as tradeapi

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/trading/account':
            asyncio.run(self.handle_account())
        elif self.path == '/api/trading/health':
            self.handle_health()
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/api/trading/order':
            asyncio.run(self.handle_order())
        else:
            self.send_error(404)
    
    def handle_health(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'healthy',
            'service': 'alpaca-trading'
        }).encode())
    
    async def handle_account(self):
        try:
            # Initialize Alpaca API
            api_key = os.getenv('ALPACA_API_KEY')
            secret_key = os.getenv('ALPACA_SECRET_KEY')
            paper_trading = os.getenv('ALPACA_PAPER_TRADING', 'true').lower() == 'true'
            
            if not api_key or not secret_key:
                raise ValueError("Alpaca API credentials not found")
            
            base_url = 'https://paper-api.alpaca.markets' if paper_trading else 'https://api.alpaca.markets'
            
            api = tradeapi.REST(api_key, secret_key, base_url, api_version='v2')
            account = api.get_account()
            
            account_info = {
                'account_id': account.id,
                'buying_power': float(account.buying_power),
                'cash': float(account.cash),
                'portfolio_value': float(account.portfolio_value),
                'equity': float(account.equity),
                'day_trade_count': account.daytrade_count,
                'status': account.status,
                'paper_trading': paper_trading
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': True,
                'account': account_info
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json') 
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
    
    async def handle_order(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode())
        
        try:
            # Initialize Alpaca API
            api_key = os.getenv('ALPACA_API_KEY')
            secret_key = os.getenv('ALPACA_SECRET_KEY')
            paper_trading = os.getenv('ALPACA_PAPER_TRADING', 'true').lower() == 'true'
            
            base_url = 'https://paper-api.alpaca.markets' if paper_trading else 'https://api.alpaca.markets'
            api = tradeapi.REST(api_key, secret_key, base_url, api_version='v2')
            
            # Execute trade
            order = api.submit_order(
                symbol=data['symbol'],
                qty=data['quantity'],
                side=data['action'],  # 'buy' or 'sell'
                type='market',
                time_in_force='day'
            )
            
            order_info = {
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
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': True,
                'order': order_info
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())