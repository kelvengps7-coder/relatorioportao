import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireReportAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireReportAccess = false
}) => {
  const { user, profile, loading, isAdmin, canAccessReports } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (requireReportAccess && !canAccessReports) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar os relatórios.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};