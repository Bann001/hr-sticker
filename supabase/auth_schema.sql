-- Supabase Auth Schema for Sticker Lab
-- Run this in Supabase SQL Editor

-- Admin check function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- Auto-create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Page settings table
CREATE TABLE IF NOT EXISTS page_settings (
  page_id TEXT PRIMARY KEY,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read page settings" ON page_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update page settings" ON page_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert page settings" ON page_settings
  FOR INSERT WITH CHECK (public.is_admin());

-- Seed default page settings
INSERT INTO page_settings (page_id, visible) VALUES
  ('home', true),
  ('create', true),
  ('projects', true),
  ('tickets', false),
  ('tasks', true),
  ('rpu-stickers', true),
  ('chat', true),
  ('chat-buddy', true),
  ('files', true),
  ('teams', true),
  ('analytics', true),
  ('settings', true)
ON CONFLICT (page_id) DO NOTHING;
