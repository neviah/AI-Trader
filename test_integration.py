#!/usr/bin/env python3
"""
Test script to verify AI-Trader backend integration
"""

import asyncio
import aiohttp
import json
import os

API_BASE_URL = "https://ominous-barnacle-qv6vvxq9gvwc4pw5-8000.app.github.dev"

async def test_api_integration():
    """Test the complete API flow"""
    
    print("🧪 Testing AI-Trader Backend Integration")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Health check
        print("1️⃣ Testing API health...")
        try:
            async with session.get(f"{API_BASE_URL}/api/health") as response:
                data = await response.json()
                print(f"   ✅ Health check: {data['status']}")
        except Exception as e:
            print(f"   ❌ Health check failed: {e}")
            return
        
        # Test 2: User registration
        print("2️⃣ Testing user registration...")
        user_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        
        try:
            async with session.post(f"{API_BASE_URL}/api/auth/register", json=user_data) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get('access_token')
                    print(f"   ✅ User registered successfully")
                    
                    # Set authorization header for subsequent requests
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test 3: Create portfolio
                    print("3️⃣ Testing portfolio creation...")
                    portfolio_data = {
                        "name": "Test Trading Portfolio",
                        "description": "Automated test portfolio",
                        "initial_cash": 10000.0,
                        "market": "us"
                    }
                    
                    async with session.post(f"{API_BASE_URL}/api/portfolio", 
                                          json=portfolio_data, headers=headers) as resp:
                        if resp.status == 200:
                            portfolio = await resp.json()
                            portfolio_id = portfolio['data']['portfolio']['id']
                            print(f"   ✅ Portfolio created (ID: {portfolio_id})")
                            
                            # Test 4: Create agent configuration
                            print("4️⃣ Testing agent configuration...")
                            agent_data = {
                                "name": "Test Trading Agent",
                                "description": "DeepSeek-powered test agent",
                                "portfolio_id": portfolio_id,
                                "strategy_type": "balanced",
                                "risk_tolerance": "medium",
                                "max_position_size": 0.1,
                                "stop_loss_pct": 0.05,
                                "take_profit_pct": 0.15,
                                "use_technical_analysis": True,
                                "use_sentiment_analysis": True,
                                "use_news_analysis": False,
                                "live_trading": False
                            }
                            
                            async with session.post(f"{API_BASE_URL}/api/agents", 
                                                   json=agent_data, headers=headers) as resp:
                                if resp.status == 200:
                                    agent = await resp.json()
                                    agent_id = agent['data']['agent']['id']
                                    print(f"   ✅ Agent configured (ID: {agent_id})")
                                    
                                    # Test 5: Get available strategies
                                    print("5️⃣ Testing strategy list...")
                                    async with session.get(f"{API_BASE_URL}/api/agents/strategies/available",
                                                         headers=headers) as resp:
                                        if resp.status == 200:
                                            strategies = await resp.json()
                                            strategy_count = len(strategies['data']['strategies'])
                                            print(f"   ✅ Found {strategy_count} available strategies")
                                            
                                            # Test 6: Agent status
                                            print("6️⃣ Testing agent status...")
                                            async with session.get(f"{API_BASE_URL}/api/agents/{agent_id}",
                                                                 headers=headers) as resp:
                                                if resp.status == 200:
                                                    agent_status = await resp.json()
                                                    status = agent_status['data']['agent']['status']['running']
                                                    print(f"   ✅ Agent status: {'Running' if status else 'Stopped'}")
                                                    
                                                    print("\n🎉 All tests passed! Integration is working correctly.")
                                                    print("\nNext steps:")
                                                    print(f"📱 Frontend Dashboard: https://ominous-barnacle-qv6vvxq9gvwc4pw5-3000.app.github.dev")
                                                    print(f"🔧 API Documentation: {API_BASE_URL}/api/docs")
                                                    print(f"⚡ Backend API: {API_BASE_URL}")
                                                else:
                                                    print(f"   ❌ Agent status test failed: {resp.status}")
                                        else:
                                            print(f"   ❌ Strategy list test failed: {resp.status}")
                                else:
                                    print(f"   ❌ Agent configuration failed: {resp.status}")
                        else:
                            print(f"   ❌ Portfolio creation failed: {resp.status}")
                else:
                    print(f"   ❌ User registration failed: {response.status}")
                    error_text = await response.text()
                    print(f"       Error: {error_text}")
        except Exception as e:
            print(f"   ❌ Registration test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_integration())