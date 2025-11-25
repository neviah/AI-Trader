# Alpaca API Setup Instructions

## 1. Create Alpaca Account

1. Go to https://alpaca.markets
2. Click "Get Started for Free"
3. Sign up with your email
4. Complete identity verification (may take 24-48 hours)

## 2. Get API Keys

1. Log into Alpaca dashboard
2. Go to "Paper Trading" section first (for testing)
3. Navigate to API section
4. Generate new API key pair
5. Copy both the Key ID and Secret Key

## 3. Environment Variables

Add these to your `.env` file:

```bash
# Alpaca API Credentials (Paper Trading)
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here

# Set to false for live trading (after testing)
ALPACA_PAPER_TRADING=true
```

## 4. Testing Your Setup

Run the test script:

```bash
cd /workspaces/AI-Trader
python services/alpaca_service.py
```

You should see:
```
✅ Alpaca connection successful!
Account ID: your-account-id
Buying Power: $100,000.00
Portfolio Value: $100,000.00
```

## 5. Important Notes

- **Paper Trading**: Start with paper trading (fake money) to test
- **Buying Power**: Paper accounts start with $100,000 fake money
- **Market Hours**: Trading only works during market hours (9:30 AM - 4:00 PM ET)
- **Regulation**: For live trading, you need to be approved by Alpaca

## 6. Live Trading Requirements

To switch to live trading:
1. Complete Alpaca account approval process
2. Fund your account with real money
3. Generate live trading API keys
4. Set `ALPACA_PAPER_TRADING=false`

## Example Paper Trading API Keys

For testing only (these won't work, get your own):
```
ALPACA_API_KEY=PKTEST123ABC
ALPACA_SECRET_KEY=abcdef123456789
```