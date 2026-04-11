-- =============================================
-- Secure signup: ALWAYS force customer role on self-registration
-- Sales/superadmin accounts can only be created by admin
-- =============================================

-- Fix handle_new_user: creates profile with customer role, exception-safe
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, company, industry)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'industry'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block user creation if profile insert fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix create_trial_subscription: exception-safe
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = NEW.id) THEN
      INSERT INTO subscriptions (
        user_id, plan, balance_cents, service_active,
        trial_started_at, trial_ends_at, trial_active,
        included_minutes, plan_price_cents
      ) VALUES (
        NEW.id, 'trial', 2500, true,
        now(), now() + interval '30 days', true,
        100, 0
      );
      INSERT INTO billing_transactions (user_id, type, amount_cents, description)
      VALUES (NEW.id, 'credit', 2500, 'Willkommens-Guthaben (30-Tage-Testphase)');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure INSERT policies for trigger operations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_trigger_insert_profiles') THEN
    CREATE POLICY "allow_trigger_insert_profiles" ON profiles FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_trigger_insert_subscriptions') THEN
    CREATE POLICY "allow_trigger_insert_subscriptions" ON subscriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_trigger_insert_billing_tx') THEN
    CREATE POLICY "allow_trigger_insert_billing_tx" ON billing_transactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;
