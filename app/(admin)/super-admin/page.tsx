"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Settings, AlertCircle, Trash2, TrendingUp, Shield } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SpaceAdmin {
  id: string
  name: string
  slug: string
  plan_tier: "free" | "standard" | "premium"
  owner_id: string
  invite_limit: number
  owner_username: string
  owner_email: string
  created_at: string
  member_count: number
}

interface SpaceMember {
  id: string
  user_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  profiles: {
    username: string
    email: string
    avatar_url?: string
  }
}

export default function SuperAdminPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [spaces, setSpaces] = useState<SpaceAdmin[]>([])
  const [selectedSpaceForAdmins, setSelectedSpaceForAdmins] = useState<string>("")
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalUsers: 0,
    standardSpaces: 0,
    premiumSpaces: 0,
    freeSpaces: 0,
    monthlyRevenue: 0,
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
      const standardSpaces = spacesWithCounts.filter(s => s.plan_tier === "standard").length
      const premiumSpaces = spacesWithCounts.filter(s => s.plan_tier === "premium").length
      const monthlyRevenue = (standardSpaces * 9.95) + (premiumSpaces * 19.95)
      
      setStats({
        totalSpaces: spacesWithCounts.length,
        standardSpaces,
        premiumSpaces,
        freeSpaces: spacesWithCounts.filter(s => s.plan_tier === "free").length,
        totalUsers: spacesWithCounts.reduce((sum, s) => sum + s.member_count, 0),
        monthlyRevenue,
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

  const loadSpaceMembers = async (spaceId: string) => {
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/spaces/${spaceId}/admins`)
      if (!response.ok) throw new Error("Failed to fetch members")
      
      const { members } = await response.json()
      setSpaceMembers(members || [])
    } catch (error) {
      console.error("Error loading members:", error)
      alert("Failed to load space members")
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedSpaceForAdmins) return

    try {
      const response = await fetch(`/api/spaces/${selectedSpaceForAdmins}/admins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update role")
      
      await loadSpaceMembers(selectedSpaceForAdmins)
      alert("Role updated successfully")
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update member role")
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <TrendingUp className="w-4 h-4 text-green-500" />
              Standard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.standardSpaces}</div>
            <p className="text-xs text-muted-foreground mt-1">$9.95/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.premiumSpaces}</div>
            <p className="text-xs text-muted-foreground mt-1">$19.95/month</p>
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
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="spaces" className="w-full">
        <TabsList>
          <TabsTrigger value="spaces">
            <Building2 className="w-4 h-4 mr-2" />
            All Spaces
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="w-4 h-4 mr-2" />
            Manage Admins
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
                              space.plan_tier === "premium" 
                                ? "bg-accent/20 text-accent" 
                                : space.plan_tier === "standard"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-primary/20 text-primary"
                            }`}>
                              {space.plan_tier === "premium" ? "Premium (20)" : space.plan_tier === "standard" ? "Standard (10)" : "Free (5)"}
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

        {/* Manage Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Space Admins</CardTitle>
              <CardDescription>Promote or demote space members to admin roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Select Space</label>
                <Select value={selectedSpaceForAdmins} onValueChange={(value) => {
                  setSelectedSpaceForAdmins(value)
                  loadSpaceMembers(value)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a space..." />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name} ({space.member_count} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSpaceForAdmins && (
                <div>
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : spaceMembers.length > 0 ? (
                    <div className="border border-border/40 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border/40 bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold">Member</th>
                            <th className="text-left py-3 px-4 font-semibold">Current Role</th>
                            <th className="text-left py-3 px-4 font-semibold">Change Role</th>
                            <th className="text-left py-3 px-4 font-semibold">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spaceMembers.map(member => (
                            <tr key={member.id} className="border-b border-border/20 hover:bg-accent/5">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold text-sm">{member.profiles.username}</p>
                                  <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  member.role === "owner" ? "bg-accent/20 text-accent" :
                                  member.role === "admin" ? "bg-primary/20 text-primary" :
                                  "bg-muted/20 text-muted-foreground"
                                }`}>
                                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {member.role !== "owner" && (
                                  <Select 
                                    defaultValue={member.role}
                                    onValueChange={(newRole) => handleUpdateMemberRole(member.id, newRole)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {member.role === "owner" && (
                                  <span className="text-xs text-muted-foreground">Cannot change owner</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {new Date(member.joined_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members in this space</p>
                  )}
                </div>
              )}
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
                  <li>✓ Up to 5 members</li>
                  <li>✓ Private chat and games</li>
                  <li>✓ Space leaderboard</li>
                  <li>✓ Blog & Events</li>
                </ul>
                <p className="text-sm font-medium">Price: Free Forever</p>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium mb-2">Standard Plan</p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>✓ Up to 10 members</li>
                  <li>✓ Everything in Free</li>
                  <li>✓ Advanced leaderboards</li>
                  <li>✓ Voice chat</li>
                  <li>✓ Priority support</li>
                </ul>
                <p className="text-sm font-medium">Price: $9.95/month</p>
              </div>

              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm font-medium mb-2">Premium Plan</p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>✓ Up to 20 members</li>
                  <li>✓ Everything in Standard</li>
                  <li>✓ Custom branding</li>
                  <li>✓ Analytics dashboard</li>
                  <li>✓ 24/7 priority support</li>
                </ul>
                <p className="text-sm font-medium">Price: $19.95/month</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                <p className="font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Stripe Payment Setup
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure Stripe keys for payment processing. Each space admin can link their own Stripe account for payments, and the super admin receives all revenue.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Required env vars:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</li>
                    <li>STRIPE_SECRET_KEY</li>
                    <li>STRIPE_WEBHOOK_SECRET</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                <p className="font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Subscription Management
                </p>
                <p className="text-sm text-muted-foreground">
                  Cancelled subscriptions have a 14-day grace period. Spaces get daily reminders and after 14 days without payment renewal, they are deactivated. All member data is retained for 30 days before cleanup.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
