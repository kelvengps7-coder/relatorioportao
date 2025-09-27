-- Remove any existing admin profile first
DELETE FROM public.profiles WHERE username = 'admin';

-- Try to remove existing user if it exists
DO $$
BEGIN
  -- Delete from auth.users if it exists
  DELETE FROM auth.users WHERE email = 'admin@congregacao.local';
EXCEPTION WHEN OTHERS THEN
  -- Ignore any errors during deletion
  NULL;
END $$;

-- Create admin user using Supabase's auth.users table directly
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@congregacao.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador", "username": "admin"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
);

-- Create the profile for the admin user  
INSERT INTO public.profiles (
  id,
  user_id,
  username,
  full_name,
  role,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  u.id,
  'admin',
  'Administrador',
  'admin'::user_role,
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'admin@congregacao.local';