-- Criar política para permitir acesso público ao logo do sistema (admin)
-- Esta política permite que qualquer pessoa (mesmo não autenticada) veja o logo do admin
CREATE POLICY "Allow public access to admin logo" 
ON public.profiles 
FOR SELECT 
USING (role = 'admin');

-- Esta política deve ser PERMISSIVE (permitir junto com outras políticas)
-- e ter precedência sobre outras políticas restritivas