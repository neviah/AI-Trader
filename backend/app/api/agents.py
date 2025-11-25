"""
Agent management endpoints for AI trading agents
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.agent_config import AgentConfig
from app.models.portfolio import Portfolio
from app.schemas import AgentConfigCreate, AgentConfigUpdate, AgentConfigResponse, APIResponse
from app.services.ai_trader_bridge import ai_trader_bridge

router = APIRouter()

@router.get("/", response_model=APIResponse)
async def list_agent_configs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all agent configurations for the current user"""
    try:
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(Portfolio.user_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        agents = result.scalars().all()
        
        # Get status for each agent
        agents_with_status = []
        for agent in agents:
            agent_dict = agent.__dict__.copy()
            agent_dict['status'] = await ai_trader_bridge.get_agent_status(agent.id)
            agents_with_status.append(agent_dict)
        
        return APIResponse(
            success=True,
            data={"agents": agents_with_status},
            message=f"Retrieved {len(agents)} agent configurations"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/", response_model=APIResponse)
async def create_agent_config(
    agent_data: AgentConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new agent configuration"""
    try:
        # Verify portfolio belongs to user
        result = await db.execute(
            select(Portfolio).where(
                Portfolio.id == agent_data.portfolio_id,
                Portfolio.user_id == current_user.id
            )
        )
        portfolio = result.scalar_one_or_none()
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        # Create agent configuration
        agent_config = AgentConfig(**agent_data.dict())
        db.add(agent_config)
        await db.commit()
        await db.refresh(agent_config)
        
        return APIResponse(
            success=True,
            data={"agent": agent_config.__dict__},
            message="Agent configuration created successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{agent_id}", response_model=APIResponse)
async def get_agent_config(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get agent configuration by ID"""
    try:
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        agent_dict = agent.__dict__.copy()
        agent_dict['status'] = await ai_trader_bridge.get_agent_status(agent_id)
        
        return APIResponse(
            success=True,
            data={"agent": agent_dict},
            message="Agent configuration retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{agent_id}", response_model=APIResponse)
async def update_agent_config(
    agent_id: int,
    agent_data: AgentConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update agent configuration"""
    try:
        # Verify agent belongs to user
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        # Update agent config
        update_data = agent_data.dict(exclude_unset=True)
        await db.execute(
            update(AgentConfig)
            .where(AgentConfig.id == agent_id)
            .values(**update_data)
        )
        await db.commit()
        
        # Get updated agent
        await db.refresh(agent)
        
        return APIResponse(
            success=True,
            data={"agent": agent.__dict__},
            message="Agent configuration updated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{agent_id}", response_model=APIResponse)
async def delete_agent_config(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete agent configuration"""
    try:
        # First stop the agent if running
        await ai_trader_bridge.stop_agent(agent_id, db)
        
        # Verify agent belongs to user
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        await db.delete(agent)
        await db.commit()
        
        return APIResponse(
            success=True,
            message="Agent configuration deleted successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{agent_id}/start", response_model=APIResponse)
async def start_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Start an AI trading agent"""
    try:
        # Verify agent belongs to user
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        # Check if agent is already running
        status_info = await ai_trader_bridge.get_agent_status(agent_id)
        if status_info['running']:
            return APIResponse(
                success=True,
                data={"status": status_info},
                message="Agent is already running"
            )
        
        # Start the agent
        success = await ai_trader_bridge.start_agent(agent_id, db)
        
        if success:
            return APIResponse(
                success=True,
                data={"status": await ai_trader_bridge.get_agent_status(agent_id)},
                message="Agent started successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to start agent"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{agent_id}/stop", response_model=APIResponse)
async def stop_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Stop an AI trading agent"""
    try:
        # Verify agent belongs to user
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        # Stop the agent
        success = await ai_trader_bridge.stop_agent(agent_id, db)
        
        if success:
            return APIResponse(
                success=True,
                data={"status": await ai_trader_bridge.get_agent_status(agent_id)},
                message="Agent stopped successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to stop agent"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{agent_id}/performance", response_model=APIResponse)
async def get_agent_performance(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get agent trading performance metrics"""
    try:
        # Verify agent belongs to user
        result = await db.execute(
            select(AgentConfig)
            .join(Portfolio)
            .where(
                AgentConfig.id == agent_id,
                Portfolio.user_id == current_user.id
            )
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )
        
        # Calculate performance metrics
        performance = {
            "total_trades": agent.trades_executed or 0,
            "successful_trades": agent.successful_trades or 0,
            "success_rate": (agent.successful_trades / max(agent.trades_executed, 1)) * 100 if agent.trades_executed else 0,
            "total_profit": agent.total_profit_loss or 0.0,
            "average_profit_per_trade": (agent.total_profit_loss / max(agent.trades_executed, 1)) if agent.trades_executed else 0.0,
            "created_at": agent.created_at,
            "last_trade_at": agent.last_trade_at
        }
        
        return APIResponse(
            success=True,
            data={"performance": performance},
            message="Agent performance retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/strategies/available", response_model=APIResponse)
async def get_available_strategies():
    """Get list of available trading strategies"""
    strategies = [
        {
            "id": "conservative",
            "name": "Conservative Growth",
            "description": "Low-risk strategy focusing on stable, dividend-paying stocks",
            "risk_level": "low",
            "expected_return": "5-8% annually"
        },
        {
            "id": "balanced",
            "name": "Balanced Portfolio",
            "description": "Moderate risk with mix of growth and value stocks",
            "risk_level": "medium",
            "expected_return": "8-12% annually"
        },
        {
            "id": "aggressive_growth",
            "name": "Aggressive Growth",
            "description": "High-risk, high-reward growth stock strategy",
            "risk_level": "high",
            "expected_return": "12-20% annually"
        },
        {
            "id": "momentum",
            "name": "Momentum Trading",
            "description": "Fast-moving strategy based on market momentum and trends",
            "risk_level": "high",
            "expected_return": "15-25% annually"
        },
        {
            "id": "value",
            "name": "Value Investing",
            "description": "Long-term strategy targeting undervalued stocks",
            "risk_level": "medium",
            "expected_return": "8-15% annually"
        }
    ]
    
    return APIResponse(
        success=True,
        data={"strategies": strategies},
        message="Available strategies retrieved successfully"
    )

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.agent_config import AgentConfig
from app.models.portfolio import Portfolio
from app.schemas import (
    AgentConfigResponse, 
    AgentConfigCreate, 
    AgentConfigUpdate, 
    APIResponse, 
    PaginatedResponse
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_agent_configs(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    strategy_type: Optional[str] = Query(None, description="Filter by strategy type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's agent configurations with pagination"""
    
    query = db.query(AgentConfig).filter(AgentConfig.user_id == current_user.id)
    
    if is_active is not None:
        query = query.filter(AgentConfig.is_active == is_active)
    
    if strategy_type:
        query = query.filter(AgentConfig.strategy_type == strategy_type)
    
    total = query.count()
    agent_configs = query.order_by(AgentConfig.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=[AgentConfigResponse.from_orm(config) for config in agent_configs],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.post("/", response_model=AgentConfigResponse)
async def create_agent_config(
    agent_data: AgentConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new agent configuration"""
    
    # Check if user has reached agent limit based on subscription
    existing_agents = db.query(AgentConfig).filter(
        AgentConfig.user_id == current_user.id,
        AgentConfig.is_active == True
    ).count()
    
    # For now, limit to 3 active agents per user
    if existing_agents >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of active agents reached"
        )
    
    # Create new agent configuration
    agent_config = AgentConfig(
        user_id=current_user.id,
        name=agent_data.name,
        description=agent_data.description,
        strategy_type=agent_data.strategy_type,
        risk_level=agent_data.risk_level,
        max_position_size=agent_data.max_position_size,
        stop_loss_pct=agent_data.stop_loss_pct,
        take_profit_pct=agent_data.take_profit_pct,
        initial_cash=agent_data.initial_cash,
        max_daily_trades=agent_data.max_daily_trades,
        market=agent_data.market,
        allowed_symbols=agent_data.allowed_symbols or [],
        excluded_symbols=agent_data.excluded_symbols or []
    )
    
    db.add(agent_config)
    db.commit()
    db.refresh(agent_config)
    
    return AgentConfigResponse.from_orm(agent_config)


@router.get("/{agent_id}", response_model=AgentConfigResponse)
async def get_agent_config(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific agent configuration"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    return AgentConfigResponse.from_orm(agent_config)


@router.put("/{agent_id}", response_model=AgentConfigResponse)
async def update_agent_config(
    agent_id: int,
    agent_update: AgentConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update agent configuration"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    # Check if agent is currently running
    if agent_config.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update configuration while agent is running"
        )
    
    # Update fields
    update_data = agent_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent_config, field, value)
    
    agent_config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent_config)
    
    return AgentConfigResponse.from_orm(agent_config)


@router.delete("/{agent_id}", response_model=APIResponse)
async def delete_agent_config(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an agent configuration"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    # Check if agent is currently running
    if agent_config.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete agent while it is running. Stop the agent first."
        )
    
    # Check if agent has associated portfolios
    portfolio = db.query(Portfolio).filter(Portfolio.agent_config_id == agent_id).first()
    if portfolio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete agent with associated portfolios. Delete the portfolio first."
        )
    
    db.delete(agent_config)
    db.commit()
    
    return APIResponse(
        success=True,
        message="Agent configuration deleted successfully"
    )


@router.post("/{agent_id}/start", response_model=APIResponse)
async def start_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start an AI trading agent"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    if not agent_config.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start inactive agent"
        )
    
    if agent_config.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is already running"
        )
    
    # Check if agent has an associated portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.agent_config_id == agent_id).first()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent must have an associated portfolio to start trading"
        )
    
    # This would integrate with the actual AI-Trader system
    # For now, we'll just mark the agent as running
    agent_config.is_running = True
    agent_config.last_run_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message="Agent started successfully",
        data={"agent_id": agent_id, "status": "running"}
    )


@router.post("/{agent_id}/stop", response_model=APIResponse)
async def stop_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop an AI trading agent"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    if not agent_config.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is not currently running"
        )
    
    # This would integrate with the actual AI-Trader system
    # For now, we'll just mark the agent as stopped
    agent_config.is_running = False
    db.commit()
    
    return APIResponse(
        success=True,
        message="Agent stopped successfully",
        data={"agent_id": agent_id, "status": "stopped"}
    )


@router.get("/{agent_id}/performance", response_model=APIResponse)
async def get_agent_performance(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get agent performance metrics"""
    
    agent_config = db.query(AgentConfig).filter(
        AgentConfig.id == agent_id,
        AgentConfig.user_id == current_user.id
    ).first()
    
    if not agent_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent configuration not found"
        )
    
    # Get associated portfolio performance
    portfolio = db.query(Portfolio).filter(Portfolio.agent_config_id == agent_id).first()
    
    performance_data = {
        "agent_id": agent_id,
        "agent_name": agent_config.name,
        "strategy_type": agent_config.strategy_type,
        "total_trades": agent_config.total_trades,
        "successful_trades": agent_config.successful_trades,
        "win_rate": agent_config.win_rate,
        "is_running": agent_config.is_running,
        "last_run_at": agent_config.last_run_at,
        "portfolio_data": {
            "total_value": portfolio.total_value if portfolio else 0,
            "total_return": portfolio.total_return if portfolio else 0,
            "total_return_pct": portfolio.total_return_pct if portfolio else 0,
            "max_drawdown": portfolio.max_drawdown if portfolio else 0,
            "sharpe_ratio": portfolio.sharpe_ratio if portfolio else None
        } if portfolio else None
    }
    
    return APIResponse(
        success=True,
        message="Agent performance data",
        data=performance_data
    )


@router.get("/strategies/available", response_model=APIResponse)
async def get_available_strategies(
    current_user: User = Depends(get_current_user)
):
    """Get available trading strategies"""
    
    strategies = [
        {
            "name": "aggressive",
            "display_name": "Aggressive Growth",
            "description": "High-risk, high-reward strategy focusing on growth stocks and momentum trading",
            "risk_level": 0.8,
            "recommended_for": "Experienced traders comfortable with high volatility"
        },
        {
            "name": "balanced",
            "display_name": "Balanced Portfolio",
            "description": "Moderate risk strategy balancing growth and stability",
            "risk_level": 0.5,
            "recommended_for": "Most traders seeking steady growth with moderate risk"
        },
        {
            "name": "conservative",
            "display_name": "Conservative Income",
            "description": "Low-risk strategy focusing on dividend stocks and stable companies",
            "risk_level": 0.2,
            "recommended_for": "Risk-averse investors prioritizing capital preservation"
        },
        {
            "name": "momentum",
            "display_name": "Momentum Trading",
            "description": "Strategy based on technical momentum and trend following",
            "risk_level": 0.7,
            "recommended_for": "Traders who want to capitalize on market trends"
        },
        {
            "name": "value",
            "display_name": "Value Investing",
            "description": "Long-term strategy focusing on undervalued stocks",
            "risk_level": 0.3,
            "recommended_for": "Patient investors with long-term horizons"
        }
    ]
    
    return APIResponse(
        success=True,
        message="Available trading strategies",
        data=strategies
    )