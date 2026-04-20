import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('[v0] Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get space_id from payment_methods table using customer_id
        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('space_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (paymentMethod) {
          await supabase
            .from('space_subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              status: subscription.status as 'active' | 'canceled' | 'past_due',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('space_id', paymentMethod.space_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('space_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (paymentMethod) {
          await supabase
            .from('space_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('space_id', paymentMethod.space_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('space_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (paymentMethod && invoice.subscription) {
          // Record payment in payment_history
          await supabase.from('payment_history').insert({
            space_id: paymentMethod.space_id,
            space_subscription_id: (
              await supabase
                .from('space_subscriptions')
                .select('id')
                .eq('stripe_subscription_id', invoice.subscription)
                .single()
            ).data?.id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency as string,
            status: 'succeeded',
            description: invoice.description || `Invoice for ${paymentMethod.space_id}`,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('space_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (paymentMethod) {
          // Update subscription status to past_due
          await supabase
            .from('space_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('space_id', paymentMethod.space_id);

          // Record failed payment
          await supabase.from('payment_history').insert({
            space_id: paymentMethod.space_id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount_cents: invoice.amount_due,
            currency: invoice.currency as string,
            status: 'failed',
            description: `Failed payment for ${paymentMethod.space_id}`,
          });
        }
        break;
      }

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[v0] Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
