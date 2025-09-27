-- Update the admin user profile to have admin role
UPDATE public.profiles 
SET 
  role = 'admin',
  full_name = 'Administrador',
  username = 'admin',
  email = 'admin@congregacao.local',
  updated_at = now()
WHERE user_id = 'edefe63d-08d3-463d-b9b4-90eefd1187d9';