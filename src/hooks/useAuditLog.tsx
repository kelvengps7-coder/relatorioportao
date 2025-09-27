import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useAuditLog = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const logAction = async (
    action: 'create' | 'update' | 'delete' | 'movement' | 'login' | 'logout' | 'view' | 'export',
    tableName: string,
    recordId: string | null,
    oldData?: any,
    newData?: any
  ) => {
    try {
      if (!user || !profile) return;

      const userDetails = {
        user_id: user.id,
        full_name: profile.full_name,
        username: profile.username,
        email: user.email,
        role: profile.role
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action,
          table_name: tableName,
          record_id: recordId,
          old_data: oldData,
          new_data: newData,
          user_details: userDetails
        });

      if (error) {
        console.error('Error logging audit action:', error);
      } else {
        console.log(`✅ Audit Log - ${action} on ${tableName}:`, {
          recordId,
          user: profile.username,
          userEmail: user.email,
          userFullName: profile.full_name,
          role: profile.role,
          timestamp: new Date().toISOString(),
          details: newData || oldData
        });
      }
    } catch (error) {
      console.error('Error in audit log:', error);
    }
  };

  const showSuccessMessage = (action: string, entity: string) => {
    const messages = {
      create: `${entity} criado(a) e salvo(a) no Supabase ✅`,
      update: `${entity} atualizado(a) e salvo(a) no Supabase ✅`,
      delete: `${entity} excluído(a) do Supabase ✅`,
      movement: `Movimentação registrada no Supabase ✅`,
      login: `Login realizado com sucesso ✅`,
      logout: `Logout realizado com sucesso ✅`,
      view: `${entity} visualizado(a) ✅`,
      export: `${entity} exportado(a) ✅`,
    };

    toast({
      title: "Sucesso",
      description: messages[action as keyof typeof messages] || `${action} realizada com sucesso ✅`,
      duration: 3000,
    });
  };

  const showErrorMessage = (action: string, entity: string, error?: string) => {
    toast({
      title: "Erro",
      description: `❌ Erro ao ${action} ${entity}. ${error || 'Tente novamente.'}`,
      variant: "destructive",
      duration: 5000,
    });
  };

  return {
    logAction,
    showSuccessMessage,
    showErrorMessage,
  };
};