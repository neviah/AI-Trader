#!/bin/bash

# Alpaca Integration Setup Script

echo "🚀 Setting up Alpaca integration..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install alpaca-trade-api fastapi uvicorn

# Create .env template if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env template..."
    cat > .env << EOL
# Add your Alpaca API credentials here
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_PAPER_TRADING=true

# Alpaca bridge server port
ALPACA_BRIDGE_PORT=8002
EOL
    echo "✅ Created .env template - please add your Alpaca API keys"
else
    echo "ℹ️  .env file already exists"
fi

# Test Alpaca connection
echo "🔧 Testing Alpaca connection..."
if python services/alpaca_service.py; then
    echo "✅ Alpaca connection test successful!"
else
    echo "❌ Alpaca connection test failed. Please check your API keys in .env"
    echo "📋 Setup instructions:"
    echo "1. Go to https://alpaca.markets"
    echo "2. Create an account and get API keys"
    echo "3. Add them to your .env file"
    echo "4. Run this script again"
    exit 1
fi

# Start the Alpaca bridge server
echo "🌉 Starting Alpaca bridge server..."
echo "You can now start the bridge with:"
echo "python services/alpaca_bridge.py"
echo ""
echo "🎯 Next steps:"
echo "1. Get Alpaca API keys from https://alpaca.markets"
echo "2. Add them to .env file"
echo "3. Start bridge: python services/alpaca_bridge.py"
echo "4. Test connection: curl http://localhost:8002/health"
echo ""
echo "✅ Alpaca integration setup complete!"