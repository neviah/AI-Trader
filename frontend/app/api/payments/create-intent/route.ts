import { NextRequest, NextResponse } from 'next/server'
import PaymentService from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { amount, userId } = await request.json()

    if (!amount || amount < 10 || amount > 50000) {
      return NextResponse.json(
        { error: 'Amount must be between $10 and $50,000' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const paymentIntent = await PaymentService.createDepositIntent(userId, amount)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
