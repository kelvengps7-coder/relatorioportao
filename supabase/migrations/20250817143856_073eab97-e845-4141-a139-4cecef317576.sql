-- Create profile for existing admin user
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
WHERE u.email = 'admin@congregacao.local'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);