-- Fix critical security issue: Replace overly permissive RLS policies
-- Replace true conditions with proper role-based access

-- Drop existing permissive policies for publications
DROP POLICY IF EXISTS "Authenticated users can view publications" ON public.publications;
DROP POLICY IF EXISTS "Authenticated users can create publications" ON public.publications;
DROP POLICY IF EXISTS "Authenticated users can update publications" ON public.publications;
DROP POLICY IF EXISTS "Authenticated users can delete publications" ON public.publications;

-- Drop existing permissive policies for movements
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated users can create movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated users can update movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated users can delete movements" ON public.movements;

-- Create secure role-based policies for publications
CREATE POLICY "Admin users can view all publications" 
ON public.publications 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can create publications" 
ON public.publications 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can update publications" 
ON public.publications 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can delete publications" 
ON public.publications 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create secure role-based policies for movements
CREATE POLICY "Admin users can view all movements" 
ON public.movements 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can create movements" 
ON public.movements 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can update movements" 
ON public.movements 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can delete movements" 
ON public.movements 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add function to allow profile self-editing
CREATE OR REPLACE FUNCTION public.can_edit_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() = profile_user_id OR is_admin(auth.uid());
$$;

-- Add policy for users to edit their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (can_edit_profile(user_id))
WITH CHECK (can_edit_profile(user_id));