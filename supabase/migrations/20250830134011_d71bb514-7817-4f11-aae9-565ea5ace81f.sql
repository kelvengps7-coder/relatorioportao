-- Fix search path for is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;