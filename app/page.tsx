import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has already completed onboarding
  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("space_id")
    .eq("user_id", user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
    // User hasn't completed onboarding yet
    redirect("/onboarding")
  }

  // Check if user selected public mode
  const spaceType = user.user_metadata?.spaceType || "public"

  if (spaceType === "public") {
    redirect("/dashboard")
  }

  // Redirect to their first space
  const { data: space } = await supabase
    .from("spaces")
    .select("slug")
    .eq("id", memberships[0].space_id)
    .single()

  if (space) {
    redirect(`/space/${space.slug}`)
  }

  redirect("/dashboard")
}
