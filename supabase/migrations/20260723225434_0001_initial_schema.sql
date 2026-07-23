/*
# LuxEstate - Initial Schema

1. Overview
This migration creates the complete database for a premium real estate website.
It supports public browsing, client accounts, agent accounts, and an admin who
manages everything in-place (no separate admin panel). The admin is identified
by their email and gains extra powers automatically on login.

2. New Tables
- `profiles` - extends auth.users with full_name, phone, avatar_url, role.
  role is one of: 'client', 'agent', 'admin'. Default 'client'.
  The admin email is set to 'admin@luxestate.com' via a trigger.
- `properties` - real estate listings with title, description, price, status,
  type, beds, baths, area, address, city, state, lat/lng, images, features,
  agent_id, featured flag.
- `property_images` - individual images for each property gallery.
- `favorites` - links a client to a saved property.
- `inquiries` - messages from clients about a property.
- `tours` - scheduled property visit appointments.
- `blog_posts` - articles with title, content, excerpt, cover image, author.
- `testimonials` - client reviews with name, role, quote, rating, avatar.
- `newsletter_subscribers` - email addresses from newsletter signup.
- `team_members` - invited team members with email, role, status.

3. Security (RLS)
- Public can read published properties, blog posts, testimonials, agents.
- Clients can manage their own favorites, inquiries, tours, profile.
- Agents can see inquiries/tours for their properties.
- Admins can manage everything.
- All tables have RLS enabled.

4. Triggers
- `handle_new_user` - creates a profile row when a new auth user signs up.
  If the email is admin@luxestate.com, role is set to 'admin'.
- `update_updated_at` - keeps updated_at columns current.
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin')),
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function: is current user an agent or admin?
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agent', 'admin')
  );
$$;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "profiles_admin_insert" ON profiles;
CREATE POLICY "profiles_admin_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'for_sale' CHECK (status IN ('for_sale', 'for_rent', 'sold')),
  type text NOT NULL DEFAULT 'house' CHECK (type IN ('house', 'apartment', 'villa', 'land', 'commercial')),
  beds integer NOT NULL DEFAULT 0,
  baths integer NOT NULL DEFAULT 0,
  area numeric(10,2) NOT NULL DEFAULT 0,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  lat numeric(10,7),
  lng numeric(10,7),
  features text[] DEFAULT '{}',
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select" ON properties;
CREATE POLICY "properties_select" ON properties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "properties_staff_insert" ON properties;
CREATE POLICY "properties_staff_insert" ON properties FOR INSERT
  TO authenticated WITH CHECK (is_staff());

DROP POLICY IF EXISTS "properties_staff_update" ON properties;
CREATE POLICY "properties_staff_update" ON properties FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "properties_staff_delete" ON properties;
CREATE POLICY "properties_staff_delete" ON properties FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- PROPERTY IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_images_select" ON property_images;
CREATE POLICY "property_images_select" ON property_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "property_images_staff_insert" ON property_images;
CREATE POLICY "property_images_staff_insert" ON property_images FOR INSERT
  TO authenticated WITH CHECK (is_staff());

DROP POLICY IF EXISTS "property_images_staff_update" ON property_images;
CREATE POLICY "property_images_staff_update" ON property_images FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "property_images_staff_delete" ON property_images;
CREATE POLICY "property_images_staff_delete" ON property_images FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_select" ON inquiries;
CREATE POLICY "inquiries_select" ON inquiries FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR is_staff()
  );

DROP POLICY IF EXISTS "inquiries_insert_own" ON inquiries;
CREATE POLICY "inquiries_insert_own" ON inquiries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inquiries_staff_update" ON inquiries;
CREATE POLICY "inquiries_staff_update" ON inquiries FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "inquiries_staff_delete" ON inquiries;
CREATE POLICY "inquiries_staff_delete" ON inquiries FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- TOURS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tours_select" ON tours;
CREATE POLICY "tours_select" ON tours FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR is_staff()
  );

DROP POLICY IF EXISTS "tours_insert_own" ON tours;
CREATE POLICY "tours_insert_own" ON tours FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tours_staff_update" ON tours;
CREATE POLICY "tours_staff_update" ON tours FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "tours_staff_delete" ON tours;
CREATE POLICY "tours_staff_delete" ON tours FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_select" ON blog_posts;
CREATE POLICY "blog_select" ON blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR is_staff());

DROP POLICY IF EXISTS "blog_staff_insert" ON blog_posts;
CREATE POLICY "blog_staff_insert" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (is_staff());

DROP POLICY IF EXISTS "blog_staff_update" ON blog_posts;
CREATE POLICY "blog_staff_update" ON blog_posts FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "blog_staff_delete" ON blog_posts;
CREATE POLICY "blog_staff_delete" ON blog_posts FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  quote text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url text DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_select" ON testimonials;
CREATE POLICY "testimonials_select" ON testimonials FOR SELECT
  TO anon, authenticated USING (published = true OR is_staff());

DROP POLICY IF EXISTS "testimonials_staff_insert" ON testimonials;
CREATE POLICY "testimonials_staff_insert" ON testimonials FOR INSERT
  TO authenticated WITH CHECK (is_staff());

DROP POLICY IF EXISTS "testimonials_staff_update" ON testimonials;
CREATE POLICY "testimonials_staff_update" ON testimonials FOR UPDATE
  TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "testimonials_staff_delete" ON testimonials;
CREATE POLICY "testimonials_staff_delete" ON testimonials FOR DELETE
  TO authenticated USING (is_staff());

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_anon_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_anon_insert" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_admin_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_select" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "newsletter_admin_delete" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_delete" ON newsletter_subscribers FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "team_members_admin_insert" ON team_members;
CREATE POLICY "team_members_admin_insert" ON team_members FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "team_members_admin_update" ON team_members;
CREATE POLICY "team_members_admin_update" ON team_members FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "team_members_admin_delete" ON team_members;
CREATE POLICY "team_members_admin_delete" ON team_members FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER tours_updated_at BEFORE UPDATE ON tours
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- handle_new_user trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role text;
  tm_status text;
BEGIN
  -- Check if this email was invited as a team member
  SELECT role, status INTO assigned_role, tm_status
    FROM team_members WHERE email = NEW.email LIMIT 1;

  IF assigned_role IS NOT NULL THEN
    -- Use the assigned role from team_members
    INSERT INTO profiles (id, email, role, full_name)
    VALUES (NEW.id, NEW.email, assigned_role, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    -- Mark team member as active
    UPDATE team_members SET status = 'active' WHERE email = NEW.email;
  ELSE
    -- Default: admin email becomes admin, everyone else is client
    IF NEW.email = 'admin@luxestate.com' THEN
      INSERT INTO profiles (id, email, role, full_name)
      VALUES (NEW.id, NEW.email, 'admin', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrator'));
    ELSE
      INSERT INTO profiles (id, email, role, full_name)
      VALUES (NEW.id, NEW.email, 'client', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_agent ON inquiries(agent_id);
CREATE INDEX IF NOT EXISTS idx_tours_user ON tours(user_id);
CREATE INDEX IF NOT EXISTS idx_tours_agent ON tours(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
