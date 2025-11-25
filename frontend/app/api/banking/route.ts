import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

// Connect bank account for withdrawals
export async function POST(request: Request) {
  try {
    const { action, userId, ...data } = await request.json()

    switch (action) {
      case 'connect_bank':
        return await connectBankAccount(userId, data)
      case 'withdraw':
        return await withdrawFunds(userId, data)
      case 'get_bank_accounts':
        return await getBankAccounts(userId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Bank API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function connectBankAccount(userId: string, data: any) {
  try {
    // Create or get Stripe customer
    let customer
    try {
      const customers = await stripe.customers.list({
        email: data.email,
        limit: 1
      })
      customer = customers.data[0]
    } catch (e) {
      customer = null
    }

    if (!customer) {
      customer = await stripe.customers.create({
        email: data.email,
        metadata: { userId }
      })
    }

    // Create setup intent for ACH payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['us_bank_account'],
      usage: 'off_session'
    })

    return NextResponse.json({
      success: true,
      setupIntent: {
        client_secret: setupIntent.client_secret,
        id: setupIntent.id
      },
      customerId: customer.id
    })
  } catch (error: any) {
    throw new Error(`Failed to connect bank account: ${error.message}`)
  }
}

async function withdrawFunds(userId: string, data: any) {
  try {
    const { amount, paymentMethodId, customerId, liquidationRequired = true } = data

    // Validate amount
    if (!amount || amount < 1) {
      throw new Error('Invalid withdrawal amount')
    }

    // If liquidation is required, trigger stock selling
    if (liquidationRequired) {
      // Call Alpaca liquidation endpoint
      const liquidationResponse = await fetch('http://localhost:8002/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (!liquidationResponse.ok) {
        throw new Error('Failed to liquidate portfolio for withdrawal')
      }

      const liquidationData = await liquidationResponse.json()
      console.log('Portfolio liquidated:', liquidationData)
    }

    // Create transfer to bank account (ACH)
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: paymentMethodId, // This should be the bank account ID
      metadata: {
        userId,
        type: 'withdrawal',
        liquidated: liquidationRequired.toString()
      }
    })

    // Record withdrawal in your database
    // TODO: Store withdrawal record
    
    return NextResponse.json({
      success: true,
      withdrawal: {
        id: transfer.id,
        amount: amount,
        status: 'pending',
        estimatedArrival: '3-5 business days',
        created: new Date().toISOString()
      }
    })
  } catch (error: any) {
    throw new Error(`Withdrawal failed: ${error.message}`)
  }
}

async function getBankAccounts(userId: string) {
  try {
    // Get customer from Stripe
    const customers = await stripe.customers.list({
      limit: 100 // Search through customers to find by metadata
    })

    const customer = customers.data.find(c => c.metadata.userId === userId)

    if (!customer) {
      return NextResponse.json({
        success: true,
        bankAccounts: []
      })
    }

    // Get payment methods (bank accounts)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'us_bank_account'
    })

    const bankAccounts = paymentMethods.data.map(pm => ({
      id: pm.id,
      bank_name: pm.us_bank_account?.bank_name,
      last4: pm.us_bank_account?.last4,
      account_type: pm.us_bank_account?.account_type,
      status: 'verified' // Simplified for demo
    }))

    return NextResponse.json({
      success: true,
      bankAccounts
    })
  } catch (error: any) {
    throw new Error(`Failed to get bank accounts: ${error.message}`)
  }
}

// Get withdrawal history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get withdrawal history from Stripe transfers
    const transfers = await stripe.transfers.list({
      limit: 50,
      expand: ['data.destination']
    })

    const userWithdrawals = transfers.data
      .filter(transfer => transfer.metadata.userId === userId)
      .map(transfer => ({
        id: transfer.id,
        amount: transfer.amount / 100, // Convert from cents
        status: 'pending', // Simplified for demo
        created: new Date(transfer.created * 1000).toISOString(),
        estimated_arrival: null // Simplified for demo
      }))

    return NextResponse.json({
      success: true,
      withdrawals: userWithdrawals
    })
  } catch (error: any) {
    console.error('Error getting withdrawal history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}