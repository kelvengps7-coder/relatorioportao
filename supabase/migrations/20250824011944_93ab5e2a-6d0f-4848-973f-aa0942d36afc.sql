-- Update profiles table to support new role types
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operador';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'visualizador';