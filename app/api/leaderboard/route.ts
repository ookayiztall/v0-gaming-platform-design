import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "all"

    const supabase = await createClient()

    const query = supabase
      .from("user_stats")
      .select("*, profiles(username, avatar_url)")
      .order("points", { ascending: false })
      .limit(100)

    const { data: stats, error } = await query

    if (error) throw error

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
