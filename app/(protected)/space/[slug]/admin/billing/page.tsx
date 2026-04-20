'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { createBrowserClient } from '@/lib/supabase/client'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CreditCard, CheckCircle, AlertTriangle, Loader } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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

function BillingPageContent() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createBrowserClient()

  const [space, setSpace] = useState<SpaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [spaceId, setSpaceId] = useState<string>('')
  
  const { subscription, isLoading: subscriptionLoading, createSubscription, cancelSubscription } = useSubscription(spaceId)

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
      setSpaceId(spaceData.id)

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
    } catch (error) {
      console.error('[v0] Error loading billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradeToSubscription = async () => {
    if (!space || subscriptionLoading) return

    try {
      setIsSaving(true)
      const result = await createSubscription()
      
      if (result?.clientSecret) {
        // Redirect to payment confirmation
        window.location.href = `/space/${slug}/admin/billing/payment?clientSecret=${result.clientSecret}`
      }
    } catch (error) {
      console.error('[v0] Error creating subscription:', error)
      alert('Failed to create subscription. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!space || !subscription || subscription.status !== 'active') return

    if (!confirm('Are you sure you want to cancel your subscription? Your space will remain active until the end of the billing period.')) {
      return
    }

    try {
      setIsSaving(true)
      await cancelSubscription()
      alert('Subscription cancelled successfully.')
    } catch (error) {
      console.error('[v0] Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setIsSaving(false)
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
                  <Badge className={`mt-1 ${subscription?.status === 'active' ? 'bg-green-500/20 text-green-700' : space.plan_tier === 'free' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-700'}`}>
                    {subscription?.status || (space.plan_tier === 'free' ? 'Active' : 'Setup Required')}
                  </Badge>
                </div>
              </div>

              {space.plan_tier !== 'free' && subscription?.status !== 'active' && (
                <div className="p-4 rounded-lg bg-yellow-50/30 dark:bg-yellow-950/20 border border-yellow-200/30 dark:border-yellow-800/30">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-1">Payment Required</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">Your {planInfo.name} plan requires a payment method. Set up your payment method below to activate billing.</p>
                    </div>
                  </div>
                </div>
              )}

              {space.plan_tier !== 'free' && subscription?.current_period_end && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next billing date:</span>{' '}
                    <span className="font-semibold">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              )}

              {space.plan_tier === 'free' && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-3">
                    Want to upgrade to more members and features?
                  </p>
                  <Button onClick={handleUpgradeToSubscription} disabled={subscriptionLoading || isSaving}>
                    {subscriptionLoading || isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Upgrade to Standard (10 members)'
                    )}
                  </Button>
                </div>
              )}

              {space.plan_tier !== 'free' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Subscription Actions</p>
                  <div className="flex gap-2">
                    {subscription?.status === 'active' ? (
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleCancelSubscription}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
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
                  : 'Set up your payment method for subscription billing'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {space.plan_tier === 'free' ? (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground">
                    Payment methods are only needed for paid plans (Standard and Premium). Your free plan doesn't require any payment information.
                  </p>
                </div>
              ) : subscription?.stripe_subscription_id ? (
                <div className="p-4 rounded-lg bg-green-50/30 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/30 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-sm text-green-800 dark:text-green-300">Payment Method Connected</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Your {planInfo.name} plan subscription is active and billing is enabled</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    To activate your {planInfo.name} plan subscription, you need to add a valid payment method.
                  </p>

                  <div className="p-4 rounded-lg border border-border/40 bg-accent/5">
                    <PaymentSetupForm 
                      spaceId={space?.id || ''} 
                      onSuccess={() => {
                        alert('Payment method added successfully!')
                        loadData()
                      }}
                    />
                  </div>
                </div>
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
              ) : subscription?.status === 'active' && subscription.current_period_start ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg border border-border/40 hover:bg-accent/5">
                    <div>
                      <p className="font-semibold text-sm">Monthly Subscription</p>
                      <p className="text-xs text-muted-foreground">{new Date(subscription.current_period_start).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold">${subscription.price_monthly}</p>
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

function PaymentSetupForm({ spaceId, onSuccess }: { spaceId: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError('Stripe is not loaded')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create setup intent
      const setupResponse = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_id: spaceId }),
      })

      if (!setupResponse.ok) {
        throw new Error('Failed to create setup intent')
      }

      const { clientSecret } = await setupResponse.json()

      // Confirm setup intent
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {},
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment method setup failed')
        return
      }

      // Create subscription
      const subscriptionResponse = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          action: 'create_subscription',
        }),
      })

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="p-3 border border-border/40 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#1f2937',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
                invalid: {
                  color: '#dc2626',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50/30 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Setting up payment...
          </>
        ) : (
          'Add Payment Method & Activate'
        )}
      </Button>
    </form>
  )
}

export default function BillingPage() {
  return (
    <Elements stripe={stripePromise}>
      <BillingPageContent />
    </Elements>
  )
}
