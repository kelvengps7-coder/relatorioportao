-- Primeiro, vamos resolver o problema de recursão infinita nas políticas RLS
-- Removemos todas as políticas existentes que estão causando recursão
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem inserir perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON public.profiles;

-- Função SECURITY DEFINER para verificar se o usuário é admin (resolve recursão)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
    
    RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função SECURITY DEFINER para verificar se é o próprio usuário
CREATE OR REPLACE FUNCTION public.is_owner(profile_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Novas políticas usando as funções SECURITY DEFINER
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin() OR public.is_owner(user_id));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin() OR public.is_owner(user_id));

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin());

-- Criar usuário administrador inicial
-- Primeiro verificamos se já existe
DO $$
DECLARE
    admin_exists BOOLEAN := FALSE;
    new_admin_id UUID;
    admin_user_id UUID;
BEGIN
    -- Verifica se já existe um admin
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Criar usuário no auth.users se não existir
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'admin@congregacao.local' 
        LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            -- Inserir usuário diretamente na tabela auth.users
            new_admin_id := gen_random_uuid();
            
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                new_admin_id,
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated',
                'admin@congregacao.local',
                crypt('admin123', gen_salt('bf')),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                '{"full_name": "Administrador", "username": "admin", "role": "admin"}',
                now(),
                now(),
                '',
                '',
                '',
                ''
            );
            
            admin_user_id := new_admin_id;
        END IF;
        
        -- Inserir perfil do admin
        INSERT INTO public.profiles (
            user_id,
            full_name,
            username,
            role,
            email,
            is_active
        ) VALUES (
            admin_user_id,
            'Administrador',
            'admin',
            'admin',
            'admin@congregacao.local',
            true
        ) ON CONFLICT (user_id) DO UPDATE SET
            role = 'admin',
            full_name = 'Administrador',
            username = 'admin';
            
        RAISE NOTICE 'Usuário administrador criado com sucesso';
    ELSE
        RAISE NOTICE 'Usuário administrador já existe';
    END IF;
END $$;