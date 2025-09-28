import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import AppHeader from "@/components/AppHeader";
import { LoadingState } from "@/components/LoadingState";

// Carregamento lento das páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Movimentacao = lazy(() => import('@/pages/Movimentacao'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const PedidosSimple = lazy(() => import('@/pages/PedidosSimple'));
const GerenciarSimplified = lazy(() => import('@/pages/GerenciarSimplified'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const Auth = lazy(() => import('@/pages/Auth'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const RelatoriosUsuarios = lazy(() => import('@/pages/RelatoriosUsuarios'));
const InsertPublications = lazy(() => import('./pages/InsertPublications'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient();

// Layout principal que inclui o cabeçalho e um fallback de suspense mais sutil
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader />
    <main className="scroll-container">
      <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Carregando...</div>}>
        {children}
      </Suspense>
    </main>
  </>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NetworkStatus />
            <div className="min-h-screen bg-background light mobile-optimized">
              <Suspense fallback={<LoadingState message="Carregando sistema..." />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Rotas para usuários comuns */}
                  <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
                  <Route path="/movimentacao" element={<ProtectedRoute><MainLayout><Movimentacao /></MainLayout></ProtectedRoute>} />
                  <Route path="/estoque" element={<ProtectedRoute><MainLayout><Estoque /></MainLayout></ProtectedRoute>} />
                  <Route path="/pedidos" element={<ProtectedRoute><MainLayout><PedidosSimple /></MainLayout></ProtectedRoute>} />
                  
                  {/* Rotas que exigem permissão de Administrador */}
                  <Route path="/gerenciar" element={<ProtectedRoute requireAdmin><MainLayout><GerenciarSimplified /></MainLayout></ProtectedRoute>} />
                  <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><MainLayout><AdminUsers /></MainLayout></ProtectedRoute>} />
                  <Route path="/auditoria" element={<ProtectedRoute requireAdmin><MainLayout><AuditLogs /></MainLayout></ProtectedRoute>} />
                  <Route path="/insert-publications" element={<ProtectedRoute requireAdmin><MainLayout><InsertPublications /></MainLayout></ProtectedRoute>} />

                  {/* Rota para visualização de relatórios */}
                  <Route path="/relatorios-usuarios" element={<ProtectedRoute requireReportAccess><MainLayout><RelatoriosUsuarios /></MainLayout></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
