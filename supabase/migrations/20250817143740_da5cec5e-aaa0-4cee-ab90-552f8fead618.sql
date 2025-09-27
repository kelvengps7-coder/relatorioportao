-- First, remove the foreign key constraint that's causing the issue
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

-- Drop all existing users and profiles
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Create the admin user with proper credentials
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
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
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@congregacao.local',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '',
  NOW(),
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador"}',
  false,
  NOW(),
  NOW(),
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
  NULL
);

-- Insert profile for admin user
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
  id,
  'admin',
  'Administrador',
  'admin',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin@congregacao.local';