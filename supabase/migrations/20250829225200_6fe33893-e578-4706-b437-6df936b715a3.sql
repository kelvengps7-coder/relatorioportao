-- Create publications table
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movements table
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE
);

-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  irmao TEXT NOT NULL,
  publicacao_id UUID NOT NULL,
  quantidade INTEGER NOT NULL,
  data_pedido TEXT NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT false,
  entregue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (publicacao_id) REFERENCES public.publications(id) ON DELETE CASCADE
);

-- Create storage bucket for publication covers
INSERT INTO storage.buckets (id, name, public) VALUES ('publication-covers', 'publication-covers', true);

-- Enable Row Level Security
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for publications (allow all operations for now)
CREATE POLICY "Allow all operations on publications" 
ON public.publications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for movements
CREATE POLICY "Allow all operations on movements" 
ON public.movements 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for pedidos
CREATE POLICY "Allow all operations on pedidos" 
ON public.pedidos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create storage policies for publication covers
CREATE POLICY "Publication covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'publication-covers');

CREATE POLICY "Anyone can upload publication covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'publication-covers');

CREATE POLICY "Anyone can update publication covers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'publication-covers');

CREATE POLICY "Anyone can delete publication covers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'publication-covers');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();