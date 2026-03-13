import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const supabase = await createServerClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Find space with this customer ID
        const { data: existingSubData } = await supabase
          .from('space_subscriptions')
          .select('space_id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (existingSubData) {
          // Determine plan tier based on subscription amount
          const priceId = subscription.items?.data?.[0]?.price?.id
          let planTier: 'standard' | 'premium' = 'standard'
          let inviteLimit = 10

          // You'd need to configure these price IDs in environment variables
          if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
            planTier = 'premium'
            inviteLimit = 20
          }

          // Update existing subscription
          await supabase
            .from('space_subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              status: subscription.status === 'active' ? 'active' : subscription.status === 'paused' ? 'paused' : 'cancelled',
              period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('space_id', existingSubData.space_id);

          // Update space plan tier if subscription is active
          if (subscription.status === 'active') {
            await supabase
              .from('spaces')
              .update({
                plan_tier: planTier,
                invite_limit: inviteLimit,
              })
              .eq('id', existingSubData.space_id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Find and update subscription
        const { data: subData } = await supabase
          .from('space_subscriptions')
          .select('space_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData) {
          // Mark subscription as cancelled (enters 14-day grace period)
          const graceEndDate = new Date()
          graceEndDate.setDate(graceEndDate.getDate() + 14)

          await supabase
            .from('space_subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('space_id', subData.space_id);

          // Keep space active during grace period - don't change plan tier yet
          // After 14 days without renewal, a background job will revert to free plan
          console.log(`[Stripe Webhook] Subscription cancelled for space ${subData.space_id}. Grace period until ${graceEndDate.toISOString()}`);
        }
        break;
      }

      case 'charge.refunded': {
        // Handle refunds if needed
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
