"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Building2, Users, CreditCard } from "lucide-react"

interface SpaceData {
  id: string
  name: string
  slug: string
  plan_tier: string
  owner_id: string
  invite_limit: number
  is_public: boolean
  created_at: string
  member_count?: number
}

export default function SuperAdminSpacesPage() {
  const [spaces, setSpaces] = useState<SpaceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createBrowserClient()

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    try {
      setIsLoading(true)
      // Fetch all spaces (super admin can see all)
      const { data: spacesData } = await supabase
        .from("spaces")
        .select("*, space_memberships(count)")
        .order("created_at", { ascending: false })

      const spacesWithCounts = (spacesData || []).map((space: any) => ({
        ...space,
        member_count: space.space_memberships?.[0]?.count || 0,
      }))

      setSpaces(spacesWithCounts)
    } catch (err) {
      console.error("Failed to load spaces:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: spaces.length,
    free: spaces.filter((s) => s.plan_tier === "free").length,
    paid: spaces.filter((s) => s.plan_tier === "paid").length,
    totalMembers: spaces.reduce((sum, s) => sum + (s.member_count || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Super Admin</h1>
        <p className="text-muted-foreground">Manage all spaces and administrators</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Free Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premium Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="spaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spaces" className="gap-2">
            <Building2 className="h-4 w-4" />
            Spaces
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Users className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Spaces</CardTitle>
              <CardDescription>Manage and monitor all private spaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search spaces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading spaces...</div>
              ) : (
                <div className="space-y-2">
                  {filteredSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{space.name}</p>
                          <Badge variant={space.plan_tier === "free" ? "secondary" : "default"}>
                            {space.plan_tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {space.slug} • {space.member_count} members • {space.invite_limit} invite slots
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(space.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Space Administrators</CardTitle>
              <CardDescription>Manage and monitor space owners</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Space administrator management coming soon. You can view admin details in the Spaces tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
              <CardDescription>Manage Stripe pricing and subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Premium Plan Price ID</label>
                <Input
                  placeholder="price_xxxxxxxxxx"
                  value={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || ""}
                  readOnly
                  className="bg-input"
                />
                <p className="text-xs text-muted-foreground">
                  Set via environment variable: NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stripe Public Key</label>
                <Input
                  placeholder="pk_live_xxxxxxxxxx"
                  value={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + "..." || "Not configured"}
                  readOnly
                  className="bg-input"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Billing configuration is managed via environment variables for security.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
