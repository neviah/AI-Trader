#!/usr/bin/env python3
"""
Alpaca Trading Bridge
HTTP server that bridges Next.js frontend with Python Alpaca trading service
"""
import asyncio
import json
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sys

# Add parent directory to path to import Alpaca service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.alpaca_service import get_alpaca_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Alpaca Trading Bridge", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Alpaca service instance
alpaca_service = None


class TradeRequest(BaseModel):
    action: str  # 'buy' or 'sell'
    symbol: str
    quantity: float


class LiquidateRequest(BaseModel):
    user_id: str


@app.on_event("startup")
async def startup_event():
    """Initialize Alpaca service on startup"""
    global alpaca_service
    try:
        # Start with paper trading for safety
        paper_trading = os.getenv('ALPACA_PAPER_TRADING', 'true').lower() == 'true'
        alpaca_service = await get_alpaca_service(paper_trading=paper_trading)
        logger.info(f"Alpaca service initialized - Paper trading: {paper_trading}")
    except Exception as e:
        logger.error(f"Failed to initialize Alpaca service: {e}")
        raise


@app.get("/account")
async def get_account():
    """Get account information"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        account_info = await alpaca_service.get_account_info()
        return {"success": True, "account": account_info}
    except Exception as e:
        logger.error(f"Error getting account: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/positions")
async def get_positions():
    """Get current positions"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        positions = await alpaca_service.get_positions()
        return {"success": True, "positions": positions}
    except Exception as e:
        logger.error(f"Error getting positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/price/{symbol}")
async def get_stock_price(symbol: str):
    """Get current stock price"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        price = await alpaca_service.get_stock_price(symbol.upper())
        if price is None:
            raise HTTPException(status_code=404, detail=f"Price not found for {symbol}")
        
        return {"success": True, "symbol": symbol.upper(), "price": price}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/trade")
async def execute_trade(trade: TradeRequest):
    """Execute buy or sell trade"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        if trade.action.lower() == 'buy':
            order = await alpaca_service.buy_stock(trade.symbol.upper(), trade.quantity)
        elif trade.action.lower() == 'sell':
            order = await alpaca_service.sell_stock(trade.symbol.upper(), trade.quantity)
        else:
            raise HTTPException(status_code=400, detail="Action must be 'buy' or 'sell'")
        
        return {"success": True, "order": order}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trades")
async def get_trade_history(days: int = 30):
    """Get recent trade history"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        trades = await alpaca_service.get_trade_history(days)
        return {"success": True, "trades": trades}
    except Exception as e:
        logger.error(f"Error getting trade history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/liquidate")
async def liquidate_portfolio(request: LiquidateRequest):
    """Liquidate all positions for withdrawal"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        result = await alpaca_service.liquidate_all_positions()
        return {"success": True, "liquidation": result}
    except Exception as e:
        logger.error(f"Error liquidating portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market-hours")
async def get_market_hours():
    """Check current market status"""
    try:
        if not alpaca_service:
            raise HTTPException(status_code=500, detail="Alpaca service not initialized")
        
        market_info = await alpaca_service.check_market_hours()
        return {"success": True, "market": market_info}
    except Exception as e:
        logger.error(f"Error checking market hours: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "alpaca-bridge"}


if __name__ == "__main__":
    port = int(os.getenv("ALPACA_BRIDGE_PORT", "8002"))
    uvicorn.run(
        "alpaca_bridge:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )