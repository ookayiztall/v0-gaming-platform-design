"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Settings, AlertCircle, Trash2, TrendingUp } from "lucide-react"

interface SpaceAdmin {
  id: string
  name: string
  slug: string
  plan_tier: "free" | "paid"
  owner_id: string
  invite_limit: number
  owner_username: string
  owner_email: string
  created_at: string
  member_count: number
}

export default function SuperAdminPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [spaces, setSpaces] = useState<SpaceAdmin[]>([])
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalUsers: 0,
    paidSpaces: 0,
    freeSpaces: 0,
  })

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is platform admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single()

      if (!profile?.is_admin) {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      await loadSpaces()
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const loadSpaces = async () => {
    try {
      // Get all spaces with owner info and member count
      const { data: spacesData } = await supabase
        .from("spaces")
        .select(`
          id,
          name,
          slug,
          plan_tier,
          owner_id,
          invite_limit,
          created_at,
          profiles:owner_id(username, email)
        `)
        .order("created_at", { ascending: false })

      // Count members for each space
      const spacesWithCounts = await Promise.all(
        (spacesData || []).map(async (space: any) => {
          const { count } = await supabase
            .from("space_memberships")
            .select("id", { count: "exact" })
            .eq("space_id", space.id)

          return {
            id: space.id,
            name: space.name,
            slug: space.slug,
            plan_tier: space.plan_tier,
            owner_id: space.owner_id,
            invite_limit: space.invite_limit,
            owner_username: space.profiles?.username || "Unknown",
            owner_email: space.profiles?.email || "Unknown",
            created_at: space.created_at,
            member_count: count || 0,
          }
        })
      )

      setSpaces(spacesWithCounts)

      // Calculate stats
      setStats({
        totalSpaces: spacesWithCounts.length,
        paidSpaces: spacesWithCounts.filter(s => s.plan_tier === "paid").length,
        freeSpaces: spacesWithCounts.filter(s => s.plan_tier === "free").length,
        totalUsers: spacesWithCounts.reduce((sum, s) => sum + s.member_count, 0),
      })
    } catch (error) {
      console.error("Error loading spaces:", error)
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm("Are you sure? This will delete the space and all its data.")) return

    try {
      const { error } = await supabase
        .from("spaces")
        .delete()
        .eq("id", spaceId)

      if (error) throw error
      await loadSpaces()
      alert("Space deleted successfully")
    } catch (error) {
      console.error("Error deleting space:", error)
      alert("Failed to delete space")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold glow-text">Platform Super Admin</h1>
        <p className="text-sm text-muted-foreground">Manage all spaces and administrators</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Total Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpaces}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Paid Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.paidSpaces}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSpaces > 0 ? ((stats.paidSpaces / stats.totalSpaces) * 100).toFixed(1) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Free Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.freeSpaces}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="spaces" className="w-full">
        <TabsList>
          <TabsTrigger value="spaces">
            <Building2 className="w-4 h-4 mr-2" />
            All Spaces
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Spaces Tab */}
        <TabsContent value="spaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Spaces</CardTitle>
              <CardDescription>View and manage all created spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr>
                      <th className="text-left py-2 px-4 font-semibold">Space Name</th>
                      <th className="text-left py-2 px-4 font-semibold">Owner</th>
                      <th className="text-left py-2 px-4 font-semibold">Plan</th>
                      <th className="text-left py-2 px-4 font-semibold">Members</th>
                      <th className="text-left py-2 px-4 font-semibold">Created</th>
                      <th className="text-right py-2 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spaces.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No spaces created yet
                        </td>
                      </tr>
                    ) : (
                      spaces.map((space) => (
                        <tr key={space.id} className="border-b border-border/20 hover:bg-accent/5">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold">{space.name}</p>
                              <p className="text-xs text-muted-foreground">{space.slug}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-sm">{space.owner_username}</p>
                              <p className="text-xs text-muted-foreground">{space.owner_email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              space.plan_tier === "paid" 
                                ? "bg-accent/20 text-accent" 
                                : "bg-primary/20 text-primary"
                            }`}>
                              {space.plan_tier === "paid" ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{space.member_count}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(space.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/space/${space.slug}/admin`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSpace(space.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>Configure pricing and billing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-2">Free Plan</p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>✓ Up to 5 invites</li>
                  <li>✓ Private chat and games</li>
                  <li>✓ Space leaderboard</li>
                </ul>
                <p className="text-sm font-medium">Price: Free</p>
              </div>

              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm font-medium mb-2">Premium Plan</p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>✓ Unlimited invites</li>
                  <li>✓ Everything in Free</li>
                  <li>✓ Advanced features</li>
                  <li>✓ Priority support</li>
                </ul>
                <p className="text-sm font-medium">Price: $9.99/month</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                <p className="font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Stripe Configuration
                </p>
                <p className="text-sm text-muted-foreground">
                  Price IDs and webhook secrets are configured in environment variables for security.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Required env vars: STRIPE_PRICE_ID_MONTHLY, STRIPE_WEBHOOK_SECRET
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
