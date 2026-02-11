import { createServerClient } from '@/lib/supabase/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const { spaceId } = await req.json();

    if (!spaceId) {
      return new Response('Missing spaceId', { status: 400 });
    }

    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user is space owner
    const { data: space } = await supabase
      .from('spaces')
      .select('owner_id')
      .eq('id', spaceId)
      .single();

    if (!space || space.owner_id !== user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('space_subscriptions')
      .select('stripe_customer_id')
      .eq('space_id', spaceId)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          spaceId,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/spaces/${space.slug}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/spaces/${space.slug}/billing`,
      metadata: {
        spaceId,
      },
    });

    // Save customer ID if new
    if (!existingSub) {
      await supabase
        .from('space_subscriptions')
        .insert({
          space_id: spaceId,
          stripe_customer_id: customerId,
          status: 'pending',
        });
    }

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response('Checkout failed', { status: 500 });
  }
}
