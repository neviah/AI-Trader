import { NextRequest, NextResponse } from 'next/server'

interface UserRegistration {
  email: string
  password: string
  full_name: string
}

export async function POST(request: NextRequest) {
  try {
    const userData: UserRegistration = await request.json()
    
    // Enhanced validation with detailed error messages
    const errors: string[] = []
    
    // Email validation
    if (!userData.email || !userData.email.includes('@')) {
      errors.push('Please enter a valid email address')
    }
    
    // Password validation with specific requirements
    if (!userData.password || userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(userData.password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)')
    }
    if (!/[a-z]/.test(userData.password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)')
    }
    if (!/\d/.test(userData.password)) {
      errors.push('Password must contain at least one number (0-9)')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(userData.password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)')
    }
    
    // Full name validation
    if (!userData.full_name || userData.full_name.length < 2) {
      errors.push('Please enter your full name (at least 2 characters)')
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        message: errors.join('; '),
        details: errors
      }, { status: 400 })
    }
    
    // Simulate successful registration
    return NextResponse.json({
      access_token: 'demo_token_' + Date.now(),
      token_type: 'bearer',
      user: {
        id: Math.floor(Math.random() * 1000),
        email: userData.email,
        full_name: userData.full_name,
        is_active: true
      },
      message: 'Registration successful! Enhanced validation working perfectly.'
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'Registration failed',
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}