-- Fix security issues
-- Remove the problematic view with SECURITY DEFINER
DROP VIEW IF EXISTS public.movements;