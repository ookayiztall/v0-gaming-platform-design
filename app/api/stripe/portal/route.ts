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

    // Get subscription
    const { data: subscription } = await supabase
      .from('space_subscriptions')
      .select('stripe_customer_id')
      .eq('space_id', spaceId)
      .single();

    if (!subscription) {
      return new Response('No subscription found', { status: 404 });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL}/spaces/${space.slug}/billing`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), { status: 200 });
  } catch (error) {
    console.error('Portal error:', error);
    return new Response('Portal access failed', { status: 500 });
  }
}
