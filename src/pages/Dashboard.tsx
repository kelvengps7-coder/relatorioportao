import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Package, BarChart3, Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicationCover } from "@/components/PublicationCover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Publication } from "@/types";
import { useAuditLog } from "@/hooks/useAuditLog";

const Dashboard = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const navigate = useNavigate();

  useEffect(() => {
    loadPublications();
    // Log dashboard access - using null for record_id since this is a general dashboard access
    logAction('view', 'dashboard', null);
  }, []);

  const loadPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('category, name');
      
      if (error) throw error;
      setPublications(data || []);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPublications = publications.length;
  const totalStock = publications.reduce((sum, pub) => sum + pub.current_stock, 0);
  const lowStockItems = publications.filter(pub => pub.current_stock < 10).length;
  const categoriesCount = new Set(publications.map(pub => pub.category)).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 fade-in-up">
          <h1 className="text-2xl md:text-4xl font-bold text-[hsl(var(--brand-text))] mb-2 text-shadow">
            Publicações Portão
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base px-4">
            Sistema público de gerenciamento de estoque e publicações da Congregação Portão.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 slide-in-right">
          <Card className="pro-card bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Publicações
              </CardTitle>
              <div className="bg-secondary/10 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{totalPublications}</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {categoriesCount} categorias disponíveis
              </p>
            </CardContent>
          </Card>

          <Card className="pro-card bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Total
              </CardTitle>
              <div className="bg-success/10 p-2 rounded-lg">
                <Package className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{totalStock}</div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Unidades em estoque
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <Card className="pro-card scale-in">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Acesso Rápido</CardTitle>
            <CardDescription className="text-sm">Navegue rapidamente pelo sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/movimentacao')}
                className="w-full flex items-center justify-between gap-2 p-3 md:p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 rounded-lg transition-all duration-200 group pro-button mobile-optimized min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium">Movimentação de Estoque</span>
                </div>
                <ArrowRight className="h-4 w-4 text-secondary group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/estoque')}
                className="w-full flex items-center justify-between gap-2 p-3 md:p-4 bg-gradient-to-r from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 rounded-lg transition-all duration-200 group pro-button mobile-optimized min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Consultar Estoque</span>
                </div>
                <ArrowRight className="h-4 w-4 text-success group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/gerenciar')}
                className="w-full flex items-center justify-between gap-2 p-3 md:p-4 bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 rounded-lg transition-all duration-200 group pro-button mobile-optimized min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-accent-foreground" />
                  <span className="text-sm font-medium">Gerenciar Publicações</span>
                </div>
                <ArrowRight className="h-4 w-4 text-accent-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Publications with Images */}
        <Card className="pro-card fade-in-up">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Publicações Recentes
            </CardTitle>
            <CardDescription className="text-sm">Publicações com capas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {publications
                .filter(pub => pub.image_url)
                .slice(0, 12)
                .map((pub) => (
                  <div key={pub.id} className="group cursor-pointer mobile-optimized">
                    <div className="relative mb-2">
                      <PublicationCover 
                        imageUrl={pub.image_url || undefined} 
                        title={pub.name} 
                        className="w-full h-24 md:h-32 rounded-lg group-hover:scale-105 transition-transform duration-200 shadow-sm"
                      />
                      {pub.current_stock < 10 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute top-1 right-1 text-xs px-1 py-0 pro-badge"
                        >
                          Baixo
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-foreground truncate mobile-text" title={pub.name}>
                        {pub.name}
                      </p>
                      <p className="text-muted-foreground">
                        Est: {pub.current_stock}
                      </p>
                    </div>
                  </div>
                ))}
              {publications.filter(pub => pub.image_url).length === 0 && (
                <div className="col-span-full text-center py-6 md:py-8">
                  <BookOpen className="h-8 md:h-12 w-8 md:w-12 mx-auto text-muted-foreground/30 mb-3 md:mb-4" />
                  <p className="text-muted-foreground text-sm md:text-base">
                    Nenhuma publicação com capa cadastrada ainda.
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Acesse "Gerenciar" para adicionar imagens às publicações.
                  </p>
                </div>
              )}
            </div>
            {publications.filter(pub => pub.image_url).length > 12 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/estoque')}
                  className="pro-button"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver todas as publicações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;