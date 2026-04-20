import { useEffect, useState } from 'react';

export interface Subscription {
  id?: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  plan_type?: string;
  price_monthly?: number;
  current_period_end?: string;
  stripe_subscription_id?: string;
}

export function useSubscription(spaceId: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/stripe/subscriptions?space_id=${spaceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }

        const data = await response.json();
        setSubscription(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (spaceId) {
      fetchSubscription();
    }
  }, [spaceId]);

  const createSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          action: 'create_subscription',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          action: 'cancel_subscription',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      setSubscription((prev) => prev ? { ...prev, status: 'canceled' } : null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    createSubscription,
    cancelSubscription,
  };
}
