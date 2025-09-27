-- Add archived column to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Add archived_at column to track when the order was archived
ALTER TABLE public.pedidos 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Add archived_by column to track who archived the order
ALTER TABLE public.pedidos 
ADD COLUMN archived_by UUID REFERENCES auth.users(id);

-- Create index for better performance on archived queries
CREATE INDEX idx_pedidos_archived ON public.pedidos(archived);
CREATE INDEX idx_pedidos_status ON public.pedidos(enviado, entregue, archived);