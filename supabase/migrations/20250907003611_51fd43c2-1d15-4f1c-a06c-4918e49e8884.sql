-- Fix security issue: Remove SECURITY DEFINER from view
DROP VIEW IF EXISTS public.movements;

-- Recreate the view without SECURITY DEFINER
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