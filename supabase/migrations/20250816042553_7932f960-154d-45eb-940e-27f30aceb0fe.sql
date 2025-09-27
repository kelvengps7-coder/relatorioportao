-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "Permitir acesso total às publicações" ON public.publications;
DROP POLICY IF EXISTS "Permitir acesso total às movimentações" ON public.movements;

-- Criar políticas seguras que requerem autenticação
CREATE POLICY "Usuários autenticados podem acessar publicações" 
ON public.publications 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar movimentações" 
ON public.movements 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Opcional: Criar tabela de perfis para informações adicionais dos usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para perfis - usuários só podem ver/editar seus próprios perfis
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seus próprios perfis" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();