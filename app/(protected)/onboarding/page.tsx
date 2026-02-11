import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OnboardingClient from "@/components/onboarding-client"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has a space
  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("space_id")
    .eq("user_id", user.id)
    .limit(1)

  if (memberships && memberships.length > 0) {
    // User already has a space, redirect to their space
    const { data: space } = await supabase
      .from("spaces")
      .select("slug")
      .eq("id", memberships[0].space_id)
      .single()

    if (space) {
      redirect(`/space/${space.slug}`)
    }
  }

  const spaceType = user.user_metadata?.spaceType || "public"
  const planTier = user.user_metadata?.planTier || "free"

  return <OnboardingClient spaceType={spaceType} planTier={planTier} />
}
