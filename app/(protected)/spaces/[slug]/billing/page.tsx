'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  plan_tier: string;
  owner_id: string;
}

interface Subscription {
  stripe_subscription_id: string;
  status: string;
  period_end: string;
}

export default function SpaceBillingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<Space | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch space
        const { data: spaceData } = await supabase
          .from('spaces')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!spaceData) return;

        setSpace(spaceData);
        setIsOwner(spaceData.owner_id === user.id);

        // Fetch subscription if paid
        if (spaceData.plan_tier === 'paid') {
          const { data: subData } = await supabase
            .from('space_subscriptions')
            .select('*')
            .eq('space_id', spaceData.id)
            .single();

          setSubscription(subData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, supabase]);

  const handleUpgrade = async () => {
    if (!space || !isOwner) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      });

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!space || !isOwner) return;

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      });

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error accessing portal:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!space) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Upgrade</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Free Plan Card */}
        <Card className={space.plan_tier === 'free' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>$0/month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Up to 5 members
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Private chat & games
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Leaderboards & profiles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Moderation tools
              </li>
            </ul>

            {space.plan_tier === 'free' && isOwner && (
              <Button onClick={handleUpgrade} className="w-full gap-2" disabled={checkoutLoading}>
                <Zap className="w-4 h-4" />
                {checkoutLoading ? 'Loading...' : 'Upgrade to Premium'}
              </Button>
            )}

            {space.plan_tier === 'free' && !isOwner && (
              <Badge variant="secondary" className="w-full justify-center">
                Current Plan
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Premium Plan Card */}
        <Card className={space.plan_tier === 'paid' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Premium Plan
            </CardTitle>
            <CardDescription>$5/month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Up to 50 members
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Unlimited invites
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                All free features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Priority support
              </li>
            </ul>

            {space.plan_tier === 'paid' && isOwner && (
              <Button onClick={handleManageSubscription} variant="outline" className="w-full bg-transparent">
                Manage Subscription
              </Button>
            )}

            {space.plan_tier === 'free' && isOwner && (
              <Button onClick={handleUpgrade} className="w-full gap-2" disabled={checkoutLoading}>
                <Zap className="w-4 h-4" />
                {checkoutLoading ? 'Loading...' : 'Upgrade Now'}
              </Button>
            )}

            {space.plan_tier === 'paid' && !isOwner && (
              <Badge className="w-full justify-center bg-yellow-500">
                Current Plan
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {subscription && space.plan_tier === 'paid' && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Billing Date:</span>
              <span>{new Date(subscription.period_end).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-5 h-5" />
              Not Space Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">Only the space owner can manage billing and subscriptions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
