-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'visualizador',
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para profiles
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Admins podem ver todos os perfis" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins podem inserir perfis" ON public.profiles;
CREATE POLICY "Admins podem inserir perfis" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON public.profiles;
CREATE POLICY "Admins podem atualizar todos os perfis" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins podem deletar perfis" ON public.profiles;
CREATE POLICY "Admins podem deletar perfis" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Criar tabela audit_logs se não existir
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para audit_logs
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs" ON public.audit_logs;
CREATE POLICY "Usuários autenticados podem inserir logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON public.audit_logs;
CREATE POLICY "Admins podem ver todos os logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário for criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'visualizador'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();