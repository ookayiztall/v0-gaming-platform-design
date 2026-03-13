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
    const { data: space } = await supabase
      .from('spaces')
      .select('plan_tier, id')
      .eq('id', spaceId)
      .single()

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('space_subscriptions')
      .select('*')
      .eq('space_id', spaceId)
      .single()

    if (!subscription || subscription.status !== 'cancelled') {
      return NextResponse.json({ error: 'No cancelled subscription to renew' }, { status: 400 })
    }

    // TODO: In a real implementation, this would:
    // 1. Create a new Stripe subscription for the plan tier
    // 2. Update the subscription record with new subscription ID
    // 3. Mark space as active again

    // For now, just restore the subscription status
    const newPeriodEnd = new Date()
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

    const { error } = await supabase
      .from('space_subscriptions')
      .update({
        status: 'active',
        period_end: newPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('space_id', spaceId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Subscription renewed for ${space.plan_tier} plan`,
      nextBillingDate: newPeriodEnd.toISOString(),
    })
  } catch (error) {
    console.error('Error renewing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to renew subscription' },
      { status: 500 }
    )
  }
}
