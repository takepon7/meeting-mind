-- Add Stripe billing columns to profiles

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro')),
  add column if not exists stripe_customer_id text unique;

-- Webhook handler uses service role key and bypasses RLS, so no extra policy needed.
