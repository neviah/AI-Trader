import { NextRequest, NextResponse } from 'next/server'
import PaymentService from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({
        error: 'Missing stripe signature'
      }, { status: 400 })
    }

    // Process Stripe webhook
    const result = await PaymentService.handleWebhook(body, signature)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({
      error: 'Webhook processing failed'
    }, { status: 400 })
  }
}