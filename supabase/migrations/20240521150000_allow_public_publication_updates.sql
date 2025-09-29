-- Grant public update access to publications
DROP POLICY IF EXISTS "Authenticated users can update publications" ON public.publications;

CREATE POLICY "Allow public update of publications"
ON public.publications
FOR UPDATE
USING (true)
WITH CHECK (true);
