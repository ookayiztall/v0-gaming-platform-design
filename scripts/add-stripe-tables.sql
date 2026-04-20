-- Create stripe_connect_accounts table for storing Stripe Connect account info
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Create payment_methods table for storing customer payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  card_last_four TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Create space_subscriptions table for tracking subscription status
CREATE TABLE IF NOT EXISTS space_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'monthly', 'yearly')),
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 9.99,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'inactive')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_history table for tracking all transactions
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  space_subscription_id UUID REFERENCES space_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'processing', 'requires_payment_method', 'requires_action', 'failed')),
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add stripe_customer_id to spaces table if it doesn't exist
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_space_id ON stripe_connect_accounts(space_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_space_id ON payment_methods(space_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_space_subscriptions_space_id ON space_subscriptions(space_id);
CREATE INDEX IF NOT EXISTS idx_space_subscriptions_stripe_customer_id ON space_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_space_id ON payment_history(space_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);

-- Enable RLS (Row Level Security)
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own Stripe Connect accounts
CREATE POLICY IF NOT EXISTS "Users can view own stripe_connect_accounts"
  ON stripe_connect_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own stripe_connect_accounts"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own stripe_connect_accounts"
  ON stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only see their own payment methods
CREATE POLICY IF NOT EXISTS "Users can view own payment_methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payment_methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own payment_methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can view space_subscriptions for their spaces
CREATE POLICY IF NOT EXISTS "Users can view their space subscriptions"
  ON space_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM spaces WHERE id = space_id AND owner_id = auth.uid()
  ));

-- RLS Policy: Users can view payment_history for their spaces
CREATE POLICY IF NOT EXISTS "Users can view their payment_history"
  ON payment_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM spaces WHERE id = space_id AND owner_id = auth.uid()
  ));
