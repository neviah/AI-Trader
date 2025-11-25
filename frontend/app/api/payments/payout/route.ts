import { NextRequest, NextResponse } from 'next/server'
import PaymentService from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { amount, userId, bankAccount } = await request.json()

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is $10' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account information is required' },
        { status: 400 }
      )
    }

    // TODO: Verify user has sufficient available balance
    // const userBalance = await getUserBalance(userId)
    // if (amount > userBalance.available) {
    //   return NextResponse.json(
    //     { error: 'Insufficient available balance' },
    //     { status: 400 }
    //   )
    // }

    const payout = await PaymentService.createPayout(userId, amount, bankAccount)

    return NextResponse.json({
      payoutId: payout.id,
      status: 'pending',
      estimatedArrival: '3-5 business days'
    })
  } catch (error: any) {
    console.error('Payout creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 500 }
    )
  }
}
