-- Criar bucket para logos do sistema
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-logos', 'system-logos', true);

-- Criar políticas para o bucket de logos
CREATE POLICY "Logos são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'system-logos');

CREATE POLICY "Admins podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'system-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'system-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'system-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Adicionar coluna para logo do sistema na tabela profiles
ALTER TABLE public.profiles ADD COLUMN system_logo_url TEXT;