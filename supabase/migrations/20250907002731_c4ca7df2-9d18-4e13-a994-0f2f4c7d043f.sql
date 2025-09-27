-- Criar tabela pedidos que está sendo referenciada no código
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  irmao TEXT NOT NULL,
  publicacao_id UUID NOT NULL,
  quantidade INTEGER NOT NULL,
  data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  enviado BOOLEAN NOT NULL DEFAULT false,
  entregue BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (publicacao_id) REFERENCES public.publications(id) ON DELETE CASCADE
);

-- Criar tabela movements (alias para stock_movements) 
CREATE VIEW public.movements AS 
SELECT 
  id,
  publication_id,
  movement_type as type,
  quantity,
  reason as motivo,
  created_at,
  created_by
FROM public.stock_movements;

-- Enable RLS on pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create policies for pedidos
CREATE POLICY "Users can view pedidos" 
ON public.pedidos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert pedidos" 
ON public.pedidos 
FOR INSERT 
WITH CHECK (can_edit());

CREATE POLICY "Editors can update pedidos" 
ON public.pedidos 
FOR UPDATE 
USING (can_edit());

CREATE POLICY "Admins can delete pedidos" 
ON public.pedidos 
FOR DELETE 
USING (is_admin());

-- Create trigger for pedidos updated_at
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();