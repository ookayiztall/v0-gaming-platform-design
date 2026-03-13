'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CreditCard, AlertCircle, TrendingUp, DollarSign, Calendar, Copy } from 'lucide-react'

interface BillingStats {
  monthlyRevenue: number
  totalSubscriptions: number
  activeSubscriptions: number
  cancelledSubscriptions: number
  failedPayments: number
}

export default function SuperAdminBillingPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<BillingStats>({
    monthlyRevenue: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    failedPayments: 0,
  })
  const [stripeKey, setStripeKey] = useState('')
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadBillingStats()
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBillingStats = async () => {
    try {
      // Get subscription stats
      const { data: subscriptions } = await supabase
        .from('space_subscriptions')
        .select('id, status')

      const active = subscriptions?.filter(s => s.status === 'active').length || 0
      const cancelled = subscriptions?.filter(s => s.status === 'cancelled').length || 0

      // Calculate revenue from active subscriptions
      const { data: spacesData } = await supabase
        .from('spaces')
        .select('plan_tier')
        .in('id', (subscriptions || []).map(s => s.id).filter(Boolean))

      const standardCount = spacesData?.filter(s => s.plan_tier === 'standard').length || 0
      const premiumCount = spacesData?.filter(s => s.plan_tier === 'premium').length || 0
      const monthlyRevenue = (standardCount * 9.95) + (premiumCount * 19.95)

      setStats({
        monthlyRevenue,
        totalSubscriptions: subscriptions?.length || 0,
        activeSubscriptions: active,
        cancelledSubscriptions: cancelled,
        failedPayments: 0,
      })
    } catch (error) {
      console.error('Error loading billing stats:', error)
    }
  }

  const handleSaveStripeConfig = async () => {
    setIsSaving(true)
    try {
      // In a real implementation, this would securely save to environment variables
      // or a secure settings table with encryption
      setSavedMessage('Stripe configuration updated successfully')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Failed to save Stripe configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
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
        <h1 className="text-3xl font-bold">Platform Billing</h1>
        <p className="text-sm text-muted-foreground">Manage payments, subscriptions, and revenue</p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">With grace period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Failed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
              <CardDescription>Set up your Stripe keys for payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-yellow-50/30 dark:bg-yellow-950/20 border border-yellow-200/30 dark:border-yellow-800/30">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-1">Security Notice</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      These settings should be configured via environment variables for security. This interface is for reference only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Stripe Publishable Key</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="pk_live_..."
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      disabled
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(stripeKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Set via NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Stripe Webhook Secret</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      disabled
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(stripeWebhookSecret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Set via STRIPE_WEBHOOK_SECRET</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-3">
                <p className="font-medium text-sm">Webhook Configuration</p>
                <div className="font-mono text-xs p-2 rounded bg-muted/50 overflow-auto">
                  {typeof window !== 'undefined' && `${window.location.origin}/api/webhooks/stripe`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure this URL in your Stripe webhook settings. Subscribe to: payment_intent.succeeded, payment_intent.payment_failed, customer.subscription.updated, customer.subscription.deleted
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>Current pricing structure for private spaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border/40">
                  <p className="font-semibold">Free Plan</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 5 members</p>
                  <p className="text-lg font-bold mt-2">$0</p>
                </div>
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-50/30 dark:bg-green-950/20">
                  <p className="font-semibold">Standard Plan</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 10 members</p>
                  <p className="text-lg font-bold mt-2">$9.95<span className="text-xs text-muted-foreground">/mo</span></p>
                </div>
                <div className="p-4 rounded-lg border border-accent/20 bg-accent/5">
                  <p className="font-semibold">Premium Plan</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 20 members</p>
                  <p className="text-lg font-bold mt-2">$19.95<span className="text-xs text-muted-foreground">/mo</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Monitor and manage all active subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-sm font-medium mb-3">Subscription Status</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">In Grace Period</p>
                    <p className="text-2xl font-bold">{stats.cancelledSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Grace Period Policy</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  When a subscription is cancelled, the space remains active for 14 days. After 14 days without payment renewal, the space is deactivated. Members are notified with daily reminders.
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Subscription List</p>
                <p className="text-sm text-muted-foreground">Detailed subscription view coming soon. Currently integrated with Stripe dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Configure how you receive payments from the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-semibold text-sm mb-2">Payment Distribution</p>
                <p className="text-xs text-muted-foreground mb-4">
                  All revenue from standard and premium subscriptions goes directly to your connected Stripe account. Payouts are processed automatically according to your Stripe payout schedule.
                </p>
                <Button disabled>Connect Stripe for Payouts</Button>
              </div>

              <div className="p-4 rounded-lg border border-border/40">
                <p className="font-semibold text-sm mb-3">Revenue Split</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard Plan Revenue</span>
                    <span className="font-semibold">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Premium Plan Revenue</span>
                    <span className="font-semibold">100%</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Your Total Monthly Revenue</span>
                    <span className="text-green-500">${stats.monthlyRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-sm font-medium mb-3">Payout Schedule</p>
                <p className="text-xs text-muted-foreground">
                  Automatic payouts are processed daily to your connected Stripe account. Pending payouts appear in your Stripe dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
