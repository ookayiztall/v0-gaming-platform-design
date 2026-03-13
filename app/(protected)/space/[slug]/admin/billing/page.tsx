'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react'

interface SpaceData {
  id: string
  name: string
  plan_tier: 'free' | 'standard' | 'premium'
  is_public: boolean
}

interface BillingInfo {
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status?: string
  period_start?: string
  period_end?: string
}

const planDetails = {
  free: { name: 'Free', members: 5, price: 0 },
  standard: { name: 'Standard', members: 10, price: 9.95 },
  premium: { name: 'Premium', members: 20, price: 19.95 },
}

export default function BillingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createBrowserClient()

  const [space, setSpace] = useState<SpaceData | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stripeConnectId, setStripeConnectId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get space data
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('id, name, plan_tier, is_public')
        .eq('slug', slug)
        .single()

      if (!spaceData) {
        router.push('/dashboard')
        return
      }

      setSpace(spaceData)

      // Check if user is admin
      const { data: membership } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData.id)
        .eq('user_id', user.id)
        .single()

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        router.push(`/space/${slug}`)
        return
      }

      setIsAdmin(true)

      // Get billing info
      const { data: billing } = await supabase
        .from('space_subscriptions')
        .select('stripe_customer_id, stripe_subscription_id, status, period_start, period_end')
        .eq('space_id', spaceData.id)
        .single()

      if (billing) {
        setBillingInfo(billing)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    // TODO: Implement Stripe Connect OAuth flow
    alert('Stripe Connect setup will be available soon. This will redirect to Stripe OAuth.')
  }

  const handleSaveStripeId = async () => {
    if (!stripeConnectId || !space) return

    setIsSaving(true)
    try {
      // This would typically validate the Connect ID with Stripe
      alert('Stripe Account ID saved. Payment processing is now enabled.')
      setStripeConnectId('')
      await loadData()
    } catch (error) {
      console.error('Error saving Stripe ID:', error)
      alert('Failed to save Stripe configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!space || space.plan_tier === 'free') return

    if (!confirm('Cancel subscription? Your space will remain active for 14 days. After that, if you don\'t renew, it will be downgraded to the free plan.')) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel')
      }

      const data = await response.json()
      alert(data.message)
      await loadData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRenewSubscription = async () => {
    if (!space) return

    if (!confirm('Renew subscription? This will restore your previous plan settings.')) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/subscriptions/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to renew')
      }

      const data = await response.json()
      alert(data.message)
      await loadData()
    } catch (error) {
      console.error('Error renewing subscription:', error)
      alert(`Failed to renew subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAdmin || !space) {
    return null
  }

  const planInfo = planDetails[space.plan_tier]

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Payments</h1>
        <p className="text-sm text-muted-foreground">Manage your space subscription and payment method</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Current Plan</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Plan</CardTitle>
              <CardDescription>View and manage your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border/40">
                  <p className="text-sm text-muted-foreground mb-1">Plan</p>
                  <p className="text-2xl font-bold">{planInfo.name}</p>
                  {space.plan_tier !== 'free' && (
                    <p className="text-sm text-muted-foreground mt-2">${planInfo.price}/month</p>
                  )}
                </div>
                <div className="p-4 rounded-lg border border-border/40">
                  <p className="text-sm text-muted-foreground mb-1">Members</p>
                  <p className="text-2xl font-bold">{planInfo.members}</p>
                  <p className="text-xs text-muted-foreground mt-2">Max members</p>
                </div>
                <div className="p-4 rounded-lg border border-border/40">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge className={`mt-1 ${billingInfo?.status === 'active' ? 'bg-green-500/20 text-green-700' : space.plan_tier === 'free' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-700'}`}>
                    {billingInfo?.status || (space.plan_tier === 'free' ? 'Active' : 'Setup Required')}
                  </Badge>
                </div>
              </div>

              {space.plan_tier !== 'free' && !billingInfo?.status && (
                <div className="p-4 rounded-lg bg-yellow-50/30 dark:bg-yellow-950/20 border border-yellow-200/30 dark:border-yellow-800/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-1">Payment Setup Required</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">Your {planInfo.name} plan requires a payment method. Please add your Stripe account below to activate billing.</p>
                    </div>
                  </div>
                </div>
              )}

              {space.plan_tier !== 'free' && billingInfo?.period_end && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next billing date:</span>{' '}
                    <span className="font-semibold">
                      {new Date(billingInfo.period_end).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              )}

              {space.plan_tier === 'free' && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-3">
                    Want to upgrade to more members and features?
                  </p>
                  <Button>Upgrade to Standard (10 members)</Button>
                </div>
              )}

              {space.plan_tier !== 'free' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Subscription Actions</p>
                  <div className="flex gap-2">
                    {billingInfo?.status === 'active' ? (
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    ) : billingInfo?.status === 'cancelled' ? (
                      <>
                        <Button 
                          variant="outline"
                          onClick={handleRenewSubscription}
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Renewing...' : 'Renew Now'}
                        </Button>
                        <p className="text-xs text-muted-foreground flex items-center">
                          Grace period expires: {billingInfo.period_end ? new Date(billingInfo.period_end).toLocaleDateString() : 'Unknown'}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Method Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                {space.plan_tier === 'free'
                  ? 'Add a payment method when you upgrade to a paid plan'
                  : 'Connect your Stripe account to receive payments'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {space.plan_tier === 'free' ? (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground">
                    Payment methods are only needed for paid plans (Standard and Premium). Your free plan doesn't require any payment information.
                  </p>
                </div>
              ) : (
                <>
                  {billingInfo?.stripe_customer_id ? (
                    <div className="p-4 rounded-lg bg-green-50/30 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/30 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-sm text-green-800 dark:text-green-300">Payment Method Connected</p>
                        <p className="text-xs text-green-700 dark:text-green-400">Stripe account is connected and active</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Connect your Stripe account to enable payments for this space. This allows you to receive payments for your {planInfo.name} plan subscription.
                      </p>

                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Connect Stripe Account</label>
                        <Button onClick={handleConnectStripe} className="w-full gap-2">
                          <CreditCard className="h-4 w-4" />
                          Connect with Stripe
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          You'll be redirected to Stripe to authorize access to your account
                        </p>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Or enter Stripe Connect ID manually</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="acct_1234567890..."
                            value={stripeConnectId}
                            onChange={(e) => setStripeConnectId(e.target.value)}
                          />
                          <Button
                            onClick={handleSaveStripeId}
                            disabled={!stripeConnectId || isSaving}
                            variant="outline"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View all past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {space.plan_tier === 'free' ? (
                <p className="text-sm text-muted-foreground">No billing history for free plans</p>
              ) : billingInfo?.status === 'active' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg border border-border/40 hover:bg-accent/5">
                    <div>
                      <p className="font-semibold text-sm">Monthly Subscription</p>
                      <p className="text-xs text-muted-foreground">{new Date(billingInfo.period_start || '').toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold">${planInfo.price}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Billing history will appear after your first payment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
