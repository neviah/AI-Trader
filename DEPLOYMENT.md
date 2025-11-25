# Vercel Deployment Guide for AI-Trader

## Quick Setup

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to your project** and login to Vercel:
   ```bash
   cd /workspaces/AI-Trader
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```

## Configuration Files Created

- `vercel.json` - Deployment configuration
- `/frontend/app/api/auth/register/route.ts` - Registration endpoint with enhanced validation
- `/frontend/app/api/auth/login/route.ts` - Login endpoint

## Project Structure for Vercel

Your project is now configured as a Next.js app with API routes:
```
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts
│   │       └── register/route.ts
│   ├── page.tsx (main login/register interface)
│   └── layout.tsx
├── lib/
│   └── auth.ts
└── package.json
```

## API Endpoints

After deployment, your endpoints will be available at:
- `https://your-app.vercel.app/api/auth/login` - Login functionality
- `https://your-app.vercel.app/api/auth/register` - Registration with enhanced validation

## Enhanced Validation Features

The registration endpoint now includes:
- ✅ Password must be 8+ characters
- ✅ Must contain uppercase letter
- ✅ Must contain lowercase letter  
- ✅ Must contain number
- ✅ Must contain special character
- ✅ Detailed error messages for each requirement
- ✅ Username validation (3+ chars, alphanumeric + underscore)

## Demo Credentials

For testing the deployed app:
- **Email**: demo@aitrader.com
- **Password**: Demo123!

## Next Steps

1. Run `vercel` to deploy
2. Test the enhanced validation on the live site
3. Users will now get clear feedback on why registration fails
4. No more being "left clueless" about password requirements!

## Environment Variables (Optional)

If you need environment variables for production:
```bash
vercel env add
```

The current setup works with demo data, but you can later add:
- Database connections
- JWT secret keys
- External API keys