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

    // Get games available in this space
    const { data: games, error } = await supabase
      .from("games")
      .select(`
        id,
        title,
        description,
        category,
        difficulty,
        thumbnail_url,
        is_multiplayer,
        max_players
      `)
      .eq("space_id", params.spaceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      spaceId: params.spaceId,
      gameCount: games?.length || 0,
      games: games || [],
    })
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    )
  }
}
