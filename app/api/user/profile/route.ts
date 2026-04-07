import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next"

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is undefined")
      return NextResponse.json({ error: "Server error" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("[v0] Error fetching profile from database:", error)
      throw error
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Error fetching profile:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is undefined")
      return NextResponse.json({ error: "Server error" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, bio, avatar_url, theme } = body

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        bio,
        avatar_url,
        theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating profile in database:", error)
      throw error
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Error updating profile:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
