"""
FastAPI Backend for AI-Trader Subscription Service

This backend provides REST API endpoints for managing AI trading agents,
user subscriptions, and portfolio management for a SaaS AI trading platform.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.trades import router as trades_router
from app.api.portfolio import router as portfolio_router
from app.api.agents import router as agents_router
from app.api.subscriptions import router as subscriptions_router
from app.api.users import router as users_router

security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting AI-Trader Backend API")
    await init_db()
    print("✅ Database initialized")
    
    # Start background monitoring task for AI agents
    from app.services.ai_trader_bridge import ai_trader_bridge
    from app.core.database import get_db
    
    async def monitor_task():
        """Background task to monitor AI trading agents"""
        async for db in get_db():
            try:
                await ai_trader_bridge.monitor_agents(db)
            except Exception as e:
                print(f"❌ Error in agent monitoring: {e}")
            finally:
                await db.close()
    
    # Start monitoring task
    import asyncio
    monitoring_task = asyncio.create_task(monitor_task())
    print("🤖 AI Agent monitoring started")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI-Trader Backend API")
    monitoring_task.cancel()
    try:
        await monitoring_task
    except asyncio.CancelledError:
        pass


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="AI-Trader Backend API",
        description="REST API for AI trading agent subscription service",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(auth_router, prefix="/api", tags=["Authentication"])
    app.include_router(users_router, prefix="/api", tags=["Users"])
    app.include_router(trades_router, prefix="/api", tags=["Trades"])
    app.include_router(portfolio_router, prefix="/api", tags=["Portfolio"])
    app.include_router(agents_router, prefix="/api", tags=["Agents"])
    app.include_router(subscriptions_router, prefix="/api", tags=["Subscriptions"])

    @app.get("/")
    async def root():
        """Welcome endpoint for the AI-Trader Backend API"""
        return {
            "message": "🚀 AI-Trader Backend API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/api/docs",
            "health": "/api/health",
            "endpoints": {
                "authentication": "/api/auth",
                "users": "/api/users", 
                "portfolios": "/api/portfolio",
                "trades": "/api/trades",
                "agents": "/api/agents",
                "subscriptions": "/api/subscriptions"
            }
        }

    @app.get("/api/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "service": "ai-trader-backend",
            "version": "1.0.0"
        }

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8090,  # Changed to avoid conflict with web dashboard
        reload=True,
        log_level="info"
    )