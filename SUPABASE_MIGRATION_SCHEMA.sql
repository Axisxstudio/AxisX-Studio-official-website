-- Migration SQL from Firebase Firestore to Supabase PostgreSQL
-- Run this in your Supabase SQL Editor.

-- 1. Create Projects Table
CREATE TABLE public.projects (
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

-- 2. Create Feedback Table
CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clientname text NOT NULL,
  companyname text,
  email text NOT NULL,
  projectname text NOT NULL,
  message text NOT NULL,
  imageurls text[] DEFAULT '{}',
  videourls text[] DEFAULT '{}',
  consenttopublish boolean DEFAULT false,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

-- 3. Create Contacts Table
CREATE TABLE public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  createdat timestamp with time zone DEFAULT now()
);

-- 4. Create Admins Table
CREATE TABLE public.admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uid uuid NOT NULL UNIQUE, -- links to Supabase Auth user id
  email text NOT NULL UNIQUE,
  role text DEFAULT 'owner',
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables (Securing the database)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

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

-- Anonymous/public access
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

-- Admin access
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

-- 5. Storage Buckets & Policies
-- Create 'media' bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

-- Supabase Storage requires Row Level Security (RLS) on storage.objects

-- Allow public read access to all files inside 'media'
CREATE POLICY "Public read access to media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow public inserts for feedback files (Images and Videos)
-- Similar to 'allow create: if true' in Firebase (restricting by path and MIME type can be done on the client, or via complex SQL functions here; this basic policy allows public inserts in those folders)
CREATE POLICY "Public insert access for feedback Images and Videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND (
    (storage.foldername(name))[1] = 'feedback_images' 
    OR (storage.foldername(name))[1] = 'feedback_videos'
  )
);

-- Note: In a production environment, you would use 'auth.role() = ''authenticated''' to limit 
-- admin project uploads and deletions, but for the migration, we make sure it doesn't instantly block you.
CREATE POLICY "Admin media management" ON storage.objects
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
