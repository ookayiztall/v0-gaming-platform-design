import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this space
    const { data: membership } = await supabase
      .from("space_memberships")
      .select("id")
      .eq("space_id", params.spaceId)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get space members with their stats
    const { data: members, error } = await supabase
      .from("space_memberships")
      .select(`
        user_id,
        role,
        profiles:user_id(username, avatar_url),
        user_stats!inner(points, level, rank, total_wins)
      `)
      .eq("space_id", params.spaceId)
      .order("user_stats(points)", { ascending: false })
      .limit(100)

    if (error) throw error

    // Format leaderboard data
    const leaderboard = (members || []).map((member: any, index) => ({
      rank: index + 1,
      userId: member.user_id,
      username: member.profiles?.username || "Unknown",
      avatar: member.profiles?.avatar_url || "👤",
      points: member.user_stats?.[0]?.points || 0,
      level: member.user_stats?.[0]?.level || 1,
      wins: member.user_stats?.[0]?.total_wins || 0,
      role: member.role,
    }))

    return NextResponse.json({
      spaceId: params.spaceId,
      memberCount: members?.length || 0,
      leaderboard,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}
