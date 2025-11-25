import { NextRequest, NextResponse } from 'next/server'

interface UserLogin {
  username_or_email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const loginData: UserLogin = await request.json()
    
    // Simple demo login (replace with real authentication)
    if (loginData.username_or_email === 'demo@aitrader.com' && loginData.password === 'Demo123!') {
      return NextResponse.json({
        access_token: 'demo_token_' + Date.now(),
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'demo@aitrader.com',
          full_name: 'Demo User',
          is_active: true
        }
      })
    }
    
    return NextResponse.json({
      error: 'Invalid credentials',
      message: 'Incorrect email/username or password. Try demo@aitrader.com / Demo123!'
    }, { status: 401 })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      error: 'Login failed',
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}