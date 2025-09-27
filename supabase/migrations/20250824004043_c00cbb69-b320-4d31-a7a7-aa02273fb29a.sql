-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  irmao TEXT NOT NULL,
  publicacao_id UUID REFERENCES public.publications(id),
  quantidade INTEGER NOT NULL,
  data_pedido DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'nao_enviado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create policies for pedidos
CREATE POLICY "Admin users can view all pedidos" 
ON public.pedidos 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can create pedidos" 
ON public.pedidos 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can update pedidos" 
ON public.pedidos 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin users can delete pedidos" 
ON public.pedidos 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();