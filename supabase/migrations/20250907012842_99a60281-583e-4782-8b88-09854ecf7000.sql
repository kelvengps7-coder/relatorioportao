-- Criar bucket para capas das publicações
INSERT INTO storage.buckets (id, name, public) VALUES ('publication-covers', 'publication-covers', true);

-- Políticas para permitir upload das capas
CREATE POLICY "Usuários podem ver capas das publicações" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'publication-covers');

CREATE POLICY "Editores podem fazer upload de capas" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'publication-covers' AND can_edit());

CREATE POLICY "Editores podem atualizar capas" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'publication-covers' AND can_edit());

CREATE POLICY "Editores podem deletar capas" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'publication-covers' AND can_edit());