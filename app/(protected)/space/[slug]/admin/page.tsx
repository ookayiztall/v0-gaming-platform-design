"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Users, Settings, CreditCard, Trash2, Copy, Check } from "lucide-react"
import type { Space } from "@/lib/spaces/context"

interface Member {
  id: string
  user_id: string
  role: string
  user_email?: string
  user_username?: string
}

interface Invite {
  id: string
  invited_email: string
  status: string
  created_at: string
}

export default function SpaceAdminPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createBrowserClient()

  const [space, setSpace] = useState<Space | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSpaceData()
  }, [slug])

  const loadSpaceData = async () => {
    try {
      setIsLoading(true)

      // Get space
      const { data: spaceData } = await supabase
        .from("spaces")
        .select("*")
        .eq("slug", slug)
        .single()

      setSpace(spaceData)

      // Get members
      const { data: membershipsData } = await supabase
        .from("space_memberships")
        .select("*, profiles:user_id(email, username)")
        .eq("space_id", spaceData?.id)

      setMembers(
        membershipsData?.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          user_email: m.profiles?.email,
          user_username: m.profiles?.username,
        })) || []
      )

      // Get invites
      const { data: invitesData } = await supabase
        .from("space_invites")
        .select("*")
        .eq("space_id", spaceData?.id)
        .eq("status", "pending")

      setInvites(invitesData || [])
    } catch (err) {
      setError("Failed to load space data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || !space) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = Math.random().toString(36).substring(7)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: inviteError } = await supabase.from("space_invites").insert([
        {
          space_id: space.id,
          invited_email: inviteEmail,
          invited_by: user?.id,
          token,
          status: "pending",
          expires_at: expiresAt,
        },
      ])

      if (inviteError) {
        setError(inviteError.message)
      } else {
        setSuccess(`Invitation sent to ${inviteEmail}`)
        setInviteEmail("")
        loadSpaceData()
      }
    } catch (err) {
      setError("Failed to send invitation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await supabase.from("space_memberships").delete().eq("id", memberId)
      loadSpaceData()
      setSuccess("Member removed")
    } catch (err) {
      setError("Failed to remove member")
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await supabase
        .from("space_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId)
      loadSpaceData()
      setSuccess("Invite revoked")
    } catch (err) {
      setError("Failed to revoke invite")
    }
  }

  const inviteLink = space ? `${window.location.origin}/invite/${space.id}` : ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{space?.name} - Admin</h1>
        <p className="text-muted-foreground">Manage your space settings and members</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm">
          {success}
        </div>
      )}

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Invite Section */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>Send invitations to friends and family</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={handleInvite} disabled={isLoading || !inviteEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-2">Share Invite Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 rounded border border-border bg-input text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Invitations expire after 7 days. You have {space?.invite_limit || 5} invite slots available.
              </p>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <div>
                        <p className="font-medium">{invite.invited_email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium">{member.user_username || "User"}</p>
                      <p className="text-xs text-muted-foreground">{member.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-primary/20 px-2 py-1 rounded capitalize">
                        {member.role}
                      </span>
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Space Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Space Name</label>
                <Input value={space?.name || ""} readOnly className="bg-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={space?.slug || ""} readOnly className="bg-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Plan</label>
                <Input value={space?.plan_tier || "free"} readOnly className="bg-input capitalize" />
              </div>
              <p className="text-xs text-muted-foreground">
                Contact support to modify these settings
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium">Current Plan: {space?.plan_tier === "free" ? "Free" : "Premium"}</p>
                <p className="text-sm text-muted-foreground">
                  {space?.plan_tier === "free" 
                    ? "Up to 5 members • Limited features"
                    : "Unlimited members • Full features"
                  }
                </p>
              </div>

              {space?.plan_tier === "free" && (
                <Button className="w-full" onClick={() => router.push(`/space/${slug}/billing`)}>
                  Upgrade to Premium
                </Button>
              )}

              {space?.plan_tier === "paid" && (
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
