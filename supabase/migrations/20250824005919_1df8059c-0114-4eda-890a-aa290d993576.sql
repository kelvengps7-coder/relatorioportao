-- Add enviado and entregue columns to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN enviado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN entregue BOOLEAN NOT NULL DEFAULT false;