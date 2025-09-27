-- Remove existing overly permissive policies
DROP POLICY IF EXISTS "Publications are publicly accessible" ON public.publications;
DROP POLICY IF EXISTS "Movements are publicly accessible" ON public.movements;

-- Create secure RLS policies for publications table
CREATE POLICY "Authenticated users can view publications" 
ON public.publications 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create publications" 
ON public.publications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update publications" 
ON public.publications 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete publications" 
ON public.publications 
FOR DELETE 
TO authenticated
USING (true);

-- Create secure RLS policies for movements table
CREATE POLICY "Authenticated users can view movements" 
ON public.movements 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create movements" 
ON public.movements 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update movements" 
ON public.movements 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete movements" 
ON public.movements 
FOR DELETE 
TO authenticated
USING (true);