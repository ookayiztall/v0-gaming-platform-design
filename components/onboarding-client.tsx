"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface OnboardingClientProps {
  spaceType: "private" | "public"
  planTier: "free" | "paid"
}

export default function OnboardingClient({ spaceType, planTier }: OnboardingClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [spaceName, setSpaceName] = useState("")
  const supabase = createBrowserClient()

  const handleSkip = async () => {
    // If public user, redirect to public dashboard
    if (spaceType === "public") {
      router.push("/dashboard")
      return
    }
    // If private user but doesn't want to create space yet
    router.push("/dashboard")
  }

  const handleCreateSpace = async () => {
    if (!spaceName.trim()) {
      setError("Please enter a space name")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("User not found")
        setIsLoading(false)
        return
      }

      // Generate slug from space name
      const slug = spaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      // Create space
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .insert([
          {
            name: spaceName,
            slug,
            description: "",
            owner_id: user.id,
            plan_tier: planTier,
            invite_limit: planTier === "free" ? 5 : 50,
            is_public: false,
          },
        ])
        .select()
        .single()

      if (spaceError) {
        setError(spaceError.message)
        setIsLoading(false)
        return
      }

      // Add owner as admin
      const { error: memberError } = await supabase.from("space_memberships").insert([
        {
          space_id: space.id,
          user_id: user.id,
          role: "owner",
        },
      ])

      if (memberError) {
        setError(memberError.message)
        setIsLoading(false)
        return
      }

      // If paid plan, redirect to billing to setup subscription
      if (planTier === "paid") {
        router.push(`/space/${space.slug}/billing`)
      } else {
        router.push(`/space/${space.slug}`)
      }
    } catch (err) {
      setError("Failed to create space")
      setIsLoading(false)
    }
  }

  if (spaceType === "public") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to GameVerse</CardTitle>
            <CardDescription>Join our global gaming community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're all set! Start exploring games, connect with players worldwide, and climb the leaderboards.
            </p>
            <Button onClick={handleSkip} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Private Space</CardTitle>
          <CardDescription>
            Set up a private gaming space for your family or friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Space Name</label>
            <Input
              placeholder="e.g., My Family Gaming"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              disabled={isLoading}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              Choose a name for your private space
            </p>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium">Plan: {planTier === "free" ? "Free" : "Premium"}</p>
            <p className="text-xs text-muted-foreground">
              {planTier === "free" ? "Up to 5 members" : "Unlimited members"}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCreateSpace}
              disabled={isLoading || !spaceName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Space"
              )}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
