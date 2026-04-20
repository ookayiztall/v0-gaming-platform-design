-- Drop existing tables and recreate them cleanly
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS stripe_connect_accounts CASCADE;
DROP TABLE IF EXISTS space_subscriptions CASCADE;

-- Create stripe_connect_accounts table
CREATE TABLE stripe_connect_accounts (
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

-- Create payment_methods table
CREATE TABLE payment_methods (
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

-- Create space_subscriptions table
CREATE TABLE space_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 9.99,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT plan_type_check CHECK (plan_type IN ('free', 'monthly', 'yearly')),
  CONSTRAINT status_check CHECK (status IN ('active', 'canceled', 'past_due', 'inactive'))
);

-- Create payment_history table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  space_subscription_id UUID REFERENCES space_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payment_status_check CHECK (status IN ('succeeded', 'processing', 'requires_payment_method', 'requires_action', 'failed'))
);

-- Add stripe_customer_id column to spaces if it doesn't exist
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create indexes
CREATE INDEX idx_stripe_connect_accounts_space_id ON stripe_connect_accounts(space_id);
CREATE INDEX idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX idx_payment_methods_space_id ON payment_methods(space_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_space_subscriptions_space_id ON space_subscriptions(space_id);
CREATE INDEX idx_space_subscriptions_stripe_customer_id ON space_subscriptions(stripe_customer_id);
CREATE INDEX idx_payment_history_space_id ON payment_history(space_id);
CREATE INDEX idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own stripe_connect_accounts"
  ON stripe_connect_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe_connect_accounts"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stripe_connect_accounts"
  ON stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment_methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment_methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment_methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their space subscriptions"
  ON space_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM spaces WHERE id = space_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Users can view their payment_history"
  ON payment_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM spaces WHERE id = space_id AND owner_id = auth.uid()
  ));
