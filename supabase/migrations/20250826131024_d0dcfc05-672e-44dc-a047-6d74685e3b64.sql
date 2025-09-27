-- Fix the security vulnerability in profiles table RLS policies

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a security definer function to get current user role
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create secure policies for profile access
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

-- Update other policies to also use the security definer function
-- This prevents potential recursion issues

-- Drop existing admin policy that might cause recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Recreate admin management policy with security definer function
CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Also update publication and movement policies to use the same pattern
DROP POLICY IF EXISTS "Users can manage publications" ON public.publications;
DROP POLICY IF EXISTS "Users can manage movements" ON public.movements;

-- Recreate with security definer function
CREATE POLICY "Users can manage publications" 
  ON public.publications 
  FOR ALL 
  TO authenticated 
  USING (public.get_current_user_role() IN ('admin', 'operador'));

CREATE POLICY "Users can manage movements" 
  ON public.movements 
  FOR ALL 
  TO authenticated 
  USING (public.get_current_user_role() IN ('admin', 'operador'));