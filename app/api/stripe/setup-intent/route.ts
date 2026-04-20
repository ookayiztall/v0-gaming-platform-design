import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { space_id } = await request.json();

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
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          space_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase.from('payment_methods').insert({
        space_id,
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    // Create setup intent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error('[v0] Setup intent error:', error);
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 });
  }
}
