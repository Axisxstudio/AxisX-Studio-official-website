-- Idempotent Supabase schema for AxisX.
-- Safe to re-run in the Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  clientname text NOT NULL,
  description text NOT NULL,
  technologies text[] DEFAULT '{}',
  coverimageurl text,
  galleryimageurls text[] DEFAULT '{}',
  videourls text[] DEFAULT '{}',
  ispublished boolean DEFAULT false,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS clientname text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS technologies text[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS coverimageurl text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS galleryimageurls text[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS videourls text[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ispublished boolean DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS createdat timestamp with time zone DEFAULT now();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updatedat timestamp with time zone DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key ON public.projects (slug);

-- 2. Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clientname text NOT NULL,
  companyname text,
  email text,
  rating integer DEFAULT 5,
  projectname text NOT NULL,
  message text NOT NULL,
  imageurls text[] DEFAULT '{}',
  videourls text[] DEFAULT '{}',
  consenttopublish boolean DEFAULT false,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS clientname text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS companyname text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS rating integer DEFAULT 5;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS projectname text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS imageurls text[] DEFAULT '{}';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS videourls text[] DEFAULT '{}';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS consenttopublish boolean DEFAULT false;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS createdat timestamp with time zone DEFAULT now();
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS updatedat timestamp with time zone DEFAULT now();

-- 3. Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  createdat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text DEFAULT 'unread';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS createdat timestamp with time zone DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contacts_status_check'
      AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_status_check CHECK (status IN ('unread', 'read'));
  END IF;
END $$;

-- 4. Admins
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uid uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'owner',
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS uid uuid;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role text DEFAULT 'owner';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS createdat timestamp with time zone DEFAULT now();
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS updatedat timestamp with time zone DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS admins_uid_key ON public.admins (uid);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON public.admins (email);

-- 5. Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY,
  maintenancemode boolean DEFAULT false,
  maintenancemessage text DEFAULT 'Temporary maintenance work',
  updatedat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS maintenancemode boolean DEFAULT false;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS maintenancemessage text DEFAULT 'Temporary maintenance work';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS updatedat timestamp with time zone DEFAULT now();

INSERT INTO public.site_settings (id, maintenancemode, maintenancemessage, updatedat)
VALUES ('global', false, 'Temporary maintenance work', now())
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE uid = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Policies: drop and recreate so the file can be re-run safely.
DROP POLICY IF EXISTS "Public read access to published projects" ON public.projects;
DROP POLICY IF EXISTS "Public read access to approved feedback" ON public.feedback;
DROP POLICY IF EXISTS "Public insert access to feedback" ON public.feedback;
DROP POLICY IF EXISTS "Public insert access to contacts" ON public.contacts;
DROP POLICY IF EXISTS "Public read access to site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access projects" ON public.projects;
DROP POLICY IF EXISTS "Admin full access feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admin full access contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admin full access admins" ON public.admins;
DROP POLICY IF EXISTS "Admin full access site settings" ON public.site_settings;

CREATE POLICY "Public read access to published projects"
ON public.projects
FOR SELECT
USING (ispublished = true);

CREATE POLICY "Public read access to approved feedback"
ON public.feedback
FOR SELECT
USING (consenttopublish = true);

CREATE POLICY "Public insert access to feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public insert access to contacts"
ON public.contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public read access to site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admin full access projects"
ON public.projects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access feedback"
ON public.feedback
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access admins"
ON public.admins
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public read access to media files" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access for feedback Images and Videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin media management" ON storage.objects;

CREATE POLICY "Public read access to media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Public insert access for feedback Images and Videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND (
    (storage.foldername(name))[1] = 'feedback_images'
    OR (storage.foldername(name))[1] = 'feedback_videos'
  )
);

CREATE POLICY "Admin media management"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'media'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'media'
  AND public.is_admin()
);

-- 4. Pricing Packages
CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  displayprice text NOT NULL,
  rawprice integer NOT NULL,
  ispopular boolean DEFAULT false,
  badge text,
  bestfor text NOT NULL,
  features text[] DEFAULT '{}',
  contactsubject text,
  enabled boolean DEFAULT true,
  sortorder integer DEFAULT 0,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS displayprice text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS rawprice integer;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS ispopular boolean DEFAULT false;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS bestfor text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS contactsubject text;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS sortorder integer DEFAULT 0;
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS createdat timestamp with time zone DEFAULT now();
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS updatedat timestamp with time zone DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS pricing_packages_slug_key ON public.pricing_packages (slug);
