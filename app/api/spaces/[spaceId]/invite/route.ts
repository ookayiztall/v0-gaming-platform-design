import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user is space owner/admin
    const { data: membership } = await supabase
      .from("space_memberships")
      .select("role")
      .eq("space_id", params.spaceId)
      .eq("user_id", user.id)
      .single()

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check space limits
    const { data: space } = await supabase
      .from("spaces")
      .select("plan_tier, invite_limit")
      .eq("id", params.spaceId)
      .single()

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    // Count pending invites
    const { count } = await supabase
      .from("space_invites")
      .select("id", { count: "exact" })
      .eq("space_id", params.spaceId)
      .eq("status", "pending")

    if (count && count >= space.invite_limit) {
      return NextResponse.json(
        { error: "Invite limit reached for this plan" },
        { status: 400 }
      )
    }

    // Create invite
    const token = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)

    const { error: inviteError } = await supabase
      .from("space_invites")
      .insert({
        space_id: params.spaceId,
        invited_email: email,
        token,
        status: "pending",
        invited_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

    if (inviteError) throw inviteError

    return NextResponse.json(
      {
        message: "Invite sent successfully",
        token,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    )
  }
}
