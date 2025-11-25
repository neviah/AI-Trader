# Supabase Integration Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create/Configure Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in with your existing account
3. Create a new project or select existing:
   - **Name**: `AI-Trader` or similar
   - **Password**: Choose a secure database password
   - **Region**: Select closest to your users

### 2. Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOi...`)
   - **service_role secret** key (starts with `eyJhbGciOi...`)

### 3. Set Environment Variables

Create `.env.local` in your frontend directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and run the SQL from `supabase/schema.sql`
3. This creates all necessary tables and functions

### 5. Deploy Edge Function

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the AI trading function
supabase functions deploy ai-trader
```

### 6. Update Frontend to Use Supabase

Replace your master-ai API endpoint:

```typescript
// Change from:
fetch('/api/master-ai-hkuds', { ... })

// To:
fetch('/api/master-ai-supabase', { ... })
```

## 🎯 What This Gives You

### ✅ **Scalable Backend**
- PostgreSQL database that scales automatically
- Real-time subscriptions for live trading updates
- Edge functions running globally

### ✅ **Professional Features**
- User authentication and profiles
- Real-time portfolio updates
- Performance analytics with Sharpe ratio calculation
- Historical trading data

### ✅ **Production Ready**
- Automatic backups
- Security with Row Level Security (RLS)
- Global CDN for fast performance
- Built-in monitoring and logging

### ✅ **HKUDS Integration Path**
- Edge functions can call external HKUDS API
- Database stores all trading decisions and positions
- Real-time updates push to frontend instantly

## 🔧 Next Steps

1. **Test the Integration**: Run the frontend and test AI decisions
2. **Connect Real Market Data**: Add Alpha Vantage or similar API to edge function
3. **HKUDS Bridge**: Modify edge function to call your HKUDS BaseAgent
4. **Deploy to Production**: Everything works on Vercel + Supabase

## 📊 Benefits vs Local Development

| Feature | Local HKUDS | Supabase + HKUDS |
|---------|-------------|-------------------|
| **Scalability** | Single machine | Global edge network |
| **Database** | Local files | PostgreSQL with backups |
| **Real-time** | Polling | WebSocket subscriptions |
| **User Management** | Manual | Built-in auth |
| **Deployment** | Complex server setup | One-click deploy |
| **Monitoring** | Manual logs | Built-in dashboard |

Your Supabase account provides the perfect foundation for a production-ready AI trading platform! 🚀