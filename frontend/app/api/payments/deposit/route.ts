import { NextRequest, NextResponse } from 'next/server'
import PaymentService from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { amount, userId } = await request.json()
    
    // Validate amount
    if (!amount || amount < 10 || amount > 50000) {
      return NextResponse.json({
        error: 'Invalid amount',
        message: 'Deposit amount must be between $10 and $50,000'
      }, { status: 400 })
    }

    // Create Stripe payment intent
    const paymentIntent = await PaymentService.createDepositIntent(userId, amount)
    
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      message: 'Payment intent created successfully'
    })
    
  } catch (error) {
    console.error('Deposit API error:', error)
    return NextResponse.json({
      error: 'Payment processing failed',
      message: 'Unable to process deposit at this time'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user deposit history
    // TODO: Fetch from database
    
    const mockHistory = [
      {
        id: '1',
        amount: 5000,
        status: 'completed',
        date: '2025-11-15',
        paymentMethod: 'card_****4242'
      },
      {
        id: '2', 
        amount: 1000,
        status: 'completed',
        date: '2025-11-10',
        paymentMethod: 'card_****4242'
      }
    ]

    return NextResponse.json({
      success: true,
      deposits: mockHistory
    })
    
  } catch (error) {
    console.error('Deposit history API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch deposit history'
    }, { status: 500 })
  }
}