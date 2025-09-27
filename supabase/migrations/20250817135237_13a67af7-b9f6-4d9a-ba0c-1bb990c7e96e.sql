-- Create default admin user
-- This will create an admin user with username 'admin' and password 'admin123'
-- The user can change the password later through the admin interface

-- Insert the default admin user into auth.users
-- Note: In production, this should be done securely through the Supabase dashboard
-- For now, we'll create a placeholder that can be updated manually

-- Create a function to create the default admin user if it doesn't exist
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users 
  WHERE email = 'admin@congregacao.local'
  LIMIT 1;
  
  -- If admin user doesn't exist, we need to create it manually
  -- This is a placeholder - the actual user creation should be done through Supabase Auth
  IF admin_user_id IS NULL THEN
    -- Log that admin user needs to be created
    RAISE NOTICE 'Default admin user needs to be created manually with email: admin@congregacao.local';
  END IF;
END;
$$;

-- Call the function
SELECT create_default_admin();