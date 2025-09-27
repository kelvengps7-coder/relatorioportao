-- Atualizar o usuário atual para administrador
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = '7021d5f1-9556-47c0-af25-a4e11bd5a0c8';

-- Criar um trigger para garantir que sempre haja pelo menos um admin
CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não houver mais nenhum admin após a atualização/exclusão
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Deve existir pelo menos um administrador no sistema';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;