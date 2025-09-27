import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Plus, Search, Edit, Trash2, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CodeBadge } from "@/components/ui/code-badge";
import { PublicationFormDialog } from "@/components/PublicationFormDialog";
import { PublicationCover } from "@/components/PublicationCover";

import { useAuth } from '@/contexts/AuthContext';
import { Publication } from "@/types";

const GerenciarSimplified = () => {
  const { canSave, canCreate, canEdit, canDelete, isVisualizador } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{url: string, title: string} | null>(null);
  const { toast } = useToast();
  // Remove admin check - all users can access in public mode

  useEffect(() => {
    loadPublications();
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
        description: "Erro ao carregar catálogo de publicações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove the old handleUpdatePublication - now handled by PublicationFormDialog

  const handleDeletePublication = async () => {
    if (!publicationToDelete) return;

    setProcessing(true);

    try {
      // Excluir todas as movimentações associadas primeiro
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('publication_id', publicationToDelete.id);

      if (movementsError) {
        console.warn('Erro ao excluir movimentações:', movementsError);
      }

      // Excluir todos os pedidos associados
      const { error: pedidosError } = await supabase
        .from('pedidos')
        .delete()
        .eq('publicacao_id', publicationToDelete.id);

      if (pedidosError) {
        console.warn('Erro ao excluir pedidos:', pedidosError);
      }

      // Agora excluir a publicação
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', publicationToDelete.id);

      if (error) throw error;

      setPublications(prev => prev.filter(p => p.id !== publicationToDelete.id));
      setDeleteDialogOpen(false);
      setPublicationToDelete(null);
      
      toast({
        title: "Publicação excluída",
        description: "Publicação removida do catálogo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir publicação.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      ['Código', 'Nome', 'Categoria', 'Estoque Atual'],
      ...filteredPublications.map(pub => [
        pub.code,
        pub.name,
        pub.category,
        pub.current_stock.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `catalogo_publicacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "Catálogo exportado com sucesso.",
    });
  };

  // Filters
  const filteredPublications = publications.filter(pub => {
    const matchesSearch = pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || pub.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(publications.map(p => p.category)));

  // Remove admin check - public access allowed

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FolderOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Carregando catálogo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar</h1>
        <p className="text-muted-foreground">Administração do catálogo de publicações</p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          {canCreate && (
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Publicação
            </TabsTrigger>
          )}
        </TabsList>

        {canCreate && (
          <TabsContent value="new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nova Publicação</CardTitle>
                <CardDescription>Adicione uma nova publicação ao catálogo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setShowNewForm(true)} 
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Publicação
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✅ Sistema reorganizado com {publications.length} publicações por categoria. 
                  Use o botão acima para adicionar novas publicações ou edite as existentes na aba Catálogo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="catalog" className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Publications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Catálogo de Publicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPublications.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {publications.length === 0 ? "Nenhuma publicação cadastrada ainda." : "Nenhuma publicação encontrada com os filtros aplicados."}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-16">Capa</TableHead>
                         <TableHead>Código</TableHead>
                         <TableHead>Nome</TableHead>
                         <TableHead>Categoria</TableHead>
                         <TableHead>Estoque</TableHead>
                         <TableHead className="text-right">Ações</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                        {filteredPublications.map((pub) => (
                          <TableRow key={pub.id} className="hover:bg-secondary/50 transition-colors">
                             <TableCell>
                               <PublicationCover 
                                 imageUrl={pub.image_url} 
                                 title={pub.name}
                                 className="w-12 h-16 cursor-pointer hover:scale-105 transition-transform"
                                 onClick={() => pub.image_url && setZoomedImage({url: pub.image_url, title: pub.name})}
                               />
                             </TableCell>
                            <TableCell>
                              {pub.code && <CodeBadge code={pub.code} />}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{pub.name}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                {pub.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{pub.current_stock} unidades</span>
                            </TableCell>
                           <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                               {canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPublication(pub);
                                    setEditDialogOpen(true);
                                  }}
                                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                               )}
                               {canDelete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPublicationToDelete(pub);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive hover:text-destructive 
                                           hover:bg-destructive/10 hover:border-destructive/40"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                               )}
                               {isVisualizador && (
                                 <span className="text-sm text-muted-foreground">
                                   Apenas visualização
                                 </span>
                               )}
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publication Form Dialogs */}
      {canCreate && (
        <PublicationFormDialog
          open={showNewForm}
          onOpenChange={setShowNewForm}
          onSuccess={loadPublications}
        />
      )}
      
      {canEdit && (
        <PublicationFormDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingPublication(null);
          }}
          publication={editingPublication}
          onSuccess={loadPublications}
        />
      )}

      {/* Delete Dialog */}
      {canDelete && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Publicação</DialogTitle>
              <DialogDescription>
                Tem certeza de que deseja excluir "{publicationToDelete?.name}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeletePublication} 
                disabled={processing}
              >
                {processing ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Capa: {zoomedImage?.title}</DialogTitle>
            <DialogDescription>
              Visualização em tamanho ampliado da capa da publicação
            </DialogDescription>
          </DialogHeader>
          {zoomedImage && (
            <div className="flex justify-center">
              <img 
                src={zoomedImage.url} 
                alt={`Capa: ${zoomedImage.title}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarSimplified;