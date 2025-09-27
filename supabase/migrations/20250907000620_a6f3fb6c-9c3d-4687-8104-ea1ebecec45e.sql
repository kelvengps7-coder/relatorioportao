-- Ensure admin user exists and has admin role
UPDATE public.profiles 
SET 
  role = 'admin',
  full_name = 'Administrador',
  username = 'admin',
  email = 'admin@congregacao.local',
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@congregacao.local'
);

-- If no profile exists, create one (in case the trigger didn't work)
INSERT INTO public.profiles (user_id, role, full_name, username, email)
SELECT 
  id as user_id,
  'admin' as role,
  'Administrador' as full_name,
  'admin' as username,
  'admin@congregacao.local' as email
FROM auth.users 
WHERE email = 'admin@congregacao.local'
AND id NOT IN (SELECT user_id FROM public.profiles WHERE user_id = auth.users.id);