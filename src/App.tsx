import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/pages/Dashboard";
import Movimentacao from "@/pages/Movimentacao";
import Estoque from "@/pages/Estoque";
import PedidosSimple from "@/pages/PedidosSimple";
import GerenciarSimplified from "@/pages/GerenciarSimplified";
import AdminUsers from "@/pages/AdminUsers";
import Auth from "@/pages/Auth";
import AuditLogs from "@/pages/AuditLogs";
import RelatoriosUsuarios from "@/pages/RelatoriosUsuarios";
import InsertPublications from './pages/InsertPublications';
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PerformanceMonitor />
            <NetworkStatus />
            <div className="min-h-screen bg-background light mobile-optimized">
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppHeader />
                  <main className="scroll-container">
                    <Dashboard />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/movimentacao" element={
                <ProtectedRoute>
                  <AppHeader />
                  <main className="scroll-container">
                    <Movimentacao />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/estoque" element={
                <ProtectedRoute>
                  <AppHeader />
                  <main className="scroll-container">
                    <Estoque />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/pedidos" element={
                <ProtectedRoute>
                  <AppHeader />
                  <main className="scroll-container">
                    <PedidosSimple />
                  </main>
                </ProtectedRoute>
              } />
               <Route path="/gerenciar" element={
                <ProtectedRoute>
                  <AppHeader />
                  <main className="scroll-container">
                    <GerenciarSimplified />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios" element={
                <ProtectedRoute requireAdmin={true}>
                  <AppHeader />
                  <main className="scroll-container">
                    <AdminUsers />
                  </main>
                </ProtectedRoute>
              } />
               <Route path="/auditoria" element={
                 <ProtectedRoute requireAdmin={true}>
                   <AppHeader />
                   <main className="scroll-container">
                     <AuditLogs />
                   </main>
                 </ProtectedRoute>
               } />
               <Route path="/relatorios-usuarios" element={
                 <ProtectedRoute requireReportAccess={true}>
                   <AppHeader />
                   <main className="scroll-container">
                     <RelatoriosUsuarios />
                   </main>
                 </ProtectedRoute>
               } />
               <Route path="/insert-publications" element={
                 <ProtectedRoute requireAdmin={true}>
                   <AppHeader />
                   <main className="scroll-container">
                     <InsertPublications />
                   </main>
                 </ProtectedRoute>
               } />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
