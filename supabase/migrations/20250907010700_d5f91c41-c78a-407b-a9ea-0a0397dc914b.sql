-- Criar trigger para atualizar automaticamente o estoque quando há movimentações
CREATE OR REPLACE TRIGGER update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_counts();