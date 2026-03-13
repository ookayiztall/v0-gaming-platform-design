import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { spaceId } = body

    // Verify user is space admin
    const { data: membership } = await supabase
      .from('space_memberships')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('space_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('space_id', spaceId)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription already cancelled' }, { status: 400 })
    }

    // TODO: Call Stripe API to cancel the subscription
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // await stripe.subscriptions.del(subscription.stripe_subscription_id)

    // Mark subscription as cancelled in database
    const { error } = await supabase
      .from('space_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('space_id', spaceId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled. Your space will remain active for 14 days.',
      graceEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
