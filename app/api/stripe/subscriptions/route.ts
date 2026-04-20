import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spaceId = request.nextUrl.searchParams.get('space_id');
    if (!spaceId) {
      return NextResponse.json({ error: 'Missing space_id' }, { status: 400 });
    }

    // Check if user owns this space
    const { data: space } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', spaceId)
      .eq('created_by', user.id)
      .single();

    if (!space) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get subscription details
    const { data: subscription } = await supabase
      .from('space_subscriptions')
      .select('*')
      .eq('space_id', spaceId)
      .single();

    return NextResponse.json(subscription || { status: 'inactive' });
  } catch (error: any) {
    console.error('[v0] Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { space_id, action } = await request.json();

    // Verify ownership
    const { data: space } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', space_id)
      .eq('created_by', user.id)
      .single();

    if (!space) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get or create customer
    let { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('stripe_customer_id')
      .eq('space_id', space_id)
      .eq('user_id', user.id)
      .single();

    let customerId = paymentMethod?.stripe_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          space_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer
      await supabase.from('payment_methods').insert({
        space_id,
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    if (action === 'create_subscription') {
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: STRIPE_PRICE_MONTHLY }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

      await supabase.from('space_subscriptions').insert({
        space_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        plan_type: 'monthly',
        status: subscription.status as any,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } else if (action === 'cancel_subscription') {
      const { data: subscription } = await supabase
        .from('space_subscriptions')
        .select('stripe_subscription_id')
        .eq('space_id', space_id)
        .single();

      if (subscription?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        await supabase
          .from('space_subscriptions')
          .update({ status: 'canceled' })
          .eq('space_id', space_id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[v0] Subscription error:', error);
    return NextResponse.json({ error: 'Subscription operation failed' }, { status: 500 });
  }
}
