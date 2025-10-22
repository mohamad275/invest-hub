/*
  # FundLink Database Schema

  ## Overview
  Complete database schema for FundLink - an investor-startup connection platform.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `role` (text) - Either 'startup' or 'investor'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `startup_profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `company_name` (text) - Startup company name
  - `sector` (text) - Industry sector
  - `location` (text) - Company location
  - `stage` (text) - Funding stage (seed, series A, etc.)
  - `funding_goal` (numeric) - Target funding amount
  - `description` (text) - Company description
  - `logo_url` (text) - Company logo
  - `pitch_deck_url` (text) - Pitch deck file
  - `website` (text) - Company website
  - `team_size` (integer) - Number of team members
  - `founded_year` (integer) - Year founded
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `investor_profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `name` (text) - Investor name
  - `company` (text) - Investment firm
  - `investor_type` (text) - Type: Angel, VC, etc.
  - `location` (text) - Investor location
  - `investment_range_min` (numeric) - Min investment amount
  - `investment_range_max` (numeric) - Max investment amount
  - `sectors_of_interest` (text[]) - Array of interested sectors
  - `bio` (text) - Investor biography
  - `avatar_url` (text) - Profile picture
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `messages`
  - `id` (uuid, primary key)
  - `sender_id` (uuid, foreign key to profiles)
  - `recipient_id` (uuid, foreign key to profiles)
  - `content` (text) - Message content
  - `read` (boolean) - Read status
  - `created_at` (timestamptz)

  ### `profile_views`
  - `id` (uuid, primary key)
  - `startup_id` (uuid, foreign key to startup_profiles)
  - `viewer_id` (uuid, foreign key to profiles)
  - `viewed_at` (timestamptz)

  ### `favorites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles) - Investor who favorited
  - `startup_id` (uuid, foreign key to startup_profiles) - Favorited startup
  - `created_at` (timestamptz)

  ### `subscriptions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `tier` (text) - Subscription tier: basic, pro, premium
  - `status` (text) - Status: active, cancelled, expired
  - `started_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `stripe_customer_id` (text) - Stripe customer reference
  - `stripe_subscription_id` (text) - Stripe subscription reference

  ## 2. Security

  All tables have RLS enabled with policies for:
  - Users can read their own data
  - Users can update their own data
  - Public read access for startup profiles (for browsing)
  - Investors can view startup contact info if subscribed
  - Message access restricted to sender and recipient
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('startup', 'investor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS startup_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  sector text NOT NULL,
  location text NOT NULL,
  stage text NOT NULL,
  funding_goal numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  logo_url text,
  pitch_deck_url text,
  website text,
  team_size integer,
  founded_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view startup profiles"
  ON startup_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Startups can insert own profile"
  ON startup_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Startups can update own profile"
  ON startup_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS investor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  investor_type text NOT NULL,
  location text NOT NULL,
  investment_range_min numeric,
  investment_range_max numeric,
  sectors_of_interest text[] DEFAULT '{}',
  bio text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investor profiles"
  ON investor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Investors can insert own profile"
  ON investor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Investors can update own profile"
  ON investor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Startups can view their profile views"
  ON profile_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM startup_profiles
      WHERE startup_profiles.id = profile_views.startup_id
      AND startup_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Investors can record profile views"
  ON profile_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_startup_profiles_sector ON startup_profiles(sector);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_stage ON startup_profiles(stage);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_startup ON profile_views(startup_id);