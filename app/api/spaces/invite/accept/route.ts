import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from("space_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 })
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    // Check if user email matches invited email
    if (invite.invited_email !== user.email) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from("space_memberships")
      .select("id")
      .eq("space_id", invite.space_id)
      .eq("user_id", user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this space" },
        { status: 400 }
      )
    }

    // Add user to space
    const { error: memberError } = await supabase
      .from("space_memberships")
      .insert({
        space_id: invite.space_id,
        user_id: user.id,
        role: "member",
      })

    if (memberError) throw memberError

    // Update invite status
    const { error: updateError } = await supabase
      .from("space_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)

    if (updateError) throw updateError

    // Get space info
    const { data: space } = await supabase
      .from("spaces")
      .select("slug")
      .eq("id", invite.space_id)
      .single()

    return NextResponse.json(
      {
        message: "Invite accepted successfully",
        spaceSlug: space?.slug,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error accepting invite:", error)
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    )
  }
}
