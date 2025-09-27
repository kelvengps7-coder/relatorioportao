-- Corrigir a função com search_path adequado
CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não houver mais nenhum admin após a atualização/exclusão
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Deve existir pelo menos um administrador no sistema';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para proteger exclusão do último admin
CREATE TRIGGER protect_last_admin_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role = 'admin' AND NEW.role != 'admin')
  EXECUTE FUNCTION public.ensure_admin_exists();

CREATE TRIGGER protect_last_admin_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role = 'admin')
  EXECUTE FUNCTION public.ensure_admin_exists();