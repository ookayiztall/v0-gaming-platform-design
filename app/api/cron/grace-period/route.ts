import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint should be called daily via a cron job (e.g., Vercel Cron)
// It manages grace periods for cancelled subscriptions and notifies space members

export async function GET(request: NextRequest) {
  // Verify the request is from a trusted cron service
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerClient()
  
  try {
    const now = new Date()
    
    // Find subscriptions that were cancelled more than 14 days ago
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const { data: expiredGracePeriods } = await supabase
      .from('space_subscriptions')
      .select('space_id, updated_at')
      .eq('status', 'cancelled')
      .lt('updated_at', fourteenDaysAgo.toISOString())

    if (!expiredGracePeriods || expiredGracePeriods.length === 0) {
      return NextResponse.json({ message: 'No expired grace periods' })
    }

    console.log(`[Grace Period Cron] Processing ${expiredGracePeriods.length} expired subscriptions`)

    const results = []

    for (const item of expiredGracePeriods) {
      try {
        // Get space details
        const { data: space } = await supabase
          .from('spaces')
          .select('id, name, owner_id')
          .eq('id', item.space_id)
          .single()

        if (!space) continue

        // Revert space to free plan or deactivate
        // If space has more members than free plan allows, deactivate it
        const { data: members } = await supabase
          .from('space_memberships')
          .select('id', { count: 'exact' })
          .eq('space_id', space.id)

        const memberCount = members?.length || 0

        if (memberCount > 5) {
          // Too many members for free plan - deactivate the space
          await supabase
            .from('spaces')
            .update({
              is_public: false, // Mark as inactive
              plan_tier: 'free',
            })
            .eq('id', space.id)

          // Notify space owner
          const { data: owner } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', space.owner_id)
            .single()

          if (owner) {
            // TODO: Send email notification to space owner
            console.log(`[Grace Period Cron] Space ${space.name} deactivated due to expired grace period`)
          }

          results.push({
            spaceId: space.id,
            spaceName: space.name,
            action: 'deactivated',
            reason: `More than 5 members (${memberCount}) not allowed on free plan`,
          })
        } else {
          // Revert to free plan
          await supabase
            .from('spaces')
            .update({
              plan_tier: 'free',
              invite_limit: 5,
            })
            .eq('id', space.id)

          // Delete old subscription record
          await supabase
            .from('space_subscriptions')
            .delete()
            .eq('space_id', space.id)

          results.push({
            spaceId: space.id,
            spaceName: space.name,
            action: 'reverted_to_free',
            memberCount,
          })
        }
      } catch (error) {
        console.error(`[Grace Period Cron] Error processing space ${item.space_id}:`, error)
        results.push({
          spaceId: item.space_id,
          action: 'error',
          error: String(error),
        })
      }
    }

    return NextResponse.json({
      message: 'Grace period processing complete',
      processed: expiredGracePeriods.length,
      results,
    })
  } catch (error) {
    console.error('[Grace Period Cron] Error:', error)
    return NextResponse.json(
      { error: 'Grace period processing failed', details: String(error) },
      { status: 500 }
    )
  }
}
