-- supabase/migrations/YYYYMMDDHHMMSS_allow_anon_read_admin_logo.sql

CREATE POLICY "Allow anonymous read access to admin logo"
ON "public"."profiles"
FOR SELECT
TO anon
USING (role = 'admin'::text);

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
