import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const supabase = await createServerClient()
  const { spaceId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is platform super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get space members with their roles
    const { data: members } = await supabase
      .from('space_memberships')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id(username, email, avatar_url)
      `)
      .eq('space_id', spaceId)
      .order('role', { ascending: false })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[v0] Error fetching admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const supabase = await createServerClient()
  const { spaceId } = await params
  const { memberId, role } = await request.json()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is platform super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate role
    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update member role
    const { error } = await supabase
      .from('space_memberships')
      .update({ role })
      .eq('id', memberId)
      .eq('space_id', spaceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error updating admin role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
