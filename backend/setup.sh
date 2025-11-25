#!/bin/bash

# AI-Trader Backend Setup Script
# This script sets up the development environment for the AI-Trader FastAPI backend

set -e

echo "🚀 Setting up AI-Trader Backend Development Environment"
echo "======================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📋 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env
    echo "✏️  Please edit .env with your actual configuration values"
fi

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "🐘 PostgreSQL is available"
    
    # Create database if it doesn't exist
    echo "🗄️  Setting up database..."
    
    # Try to create user and database
    sudo -u postgres psql -c "CREATE USER aitrader WITH PASSWORD 'password123';" 2>/dev/null || echo "User aitrader already exists"
    sudo -u postgres psql -c "CREATE DATABASE aitrader OWNER aitrader;" 2>/dev/null || echo "Database aitrader already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aitrader TO aitrader;" 2>/dev/null
    
    echo "✅ Database setup complete"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL and run:"
    echo "   sudo apt-get install postgresql postgresql-contrib"
    echo "   Or use Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password123 postgres:13"
fi

# Check if Redis is available
if command -v redis-cli &> /dev/null; then
    echo "🔴 Redis is available"
else
    echo "⚠️  Redis not found. Please install Redis and run:"
    echo "   sudo apt-get install redis-server"
    echo "   Or use Docker: docker run -d --name redis -p 6379:6379 redis:alpine"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Start the development server:"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8080"
echo ""
echo "3. Visit the API docs at: http://localhost:8080/api/docs"
echo ""
echo "Optional: Set up the database tables:"
echo "   python -c 'from app.core.database import init_db; import asyncio; asyncio.run(init_db())'"