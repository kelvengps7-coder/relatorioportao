
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Search, Edit, History, Download, Settings, MoreVertical, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';
import { CodeBadge } from "@/components/ui/code-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { PublicationFormDialog } from "@/components/PublicationFormDialog";
import { PublicationCover } from "@/components/PublicationCover";
import { Publication } from "@/types";

const ITEMS_PER_PAGE = 30;

const Estoque = () => {
  const { canManageStock, canEdit, isVisualizador } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Estados dos Modais
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [newStock, setNewStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [movements, setMovements] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [publicationToEdit, setPublicationToEdit] = useState<Publication | null>(null);
  
  // ESTADO PARA O ZOOM DA IMAGEM (RESTAURADO)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, title: string} | null>(null);
  
  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();

  const observer = useRef<IntersectionObserver>();
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadPublications = useCallback(async (isNewSearch = false) => {
    if (isNewSearch) {
      setPage(1);
      setPublications([]);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isNewSearch ? 1 : page;
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase.from('publications').select('*');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query.order('category, name').range(from, to);

      if (error) throw error;
      
      setPublications(prev => isNewSearch ? data : [...prev, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);

    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      toast({ title: "Erro", description: "Erro ao carregar dados do estoque.", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, searchTerm, categoryFilter, toast]);

  const loadCategories = async () => {
    try {
      // Busca todas as publicações, mas seleciona apenas a coluna 'category'
      const { data, error } = await supabase
        .from('publications')
        .select('category');

      if (error) throw error;

      // Extrai as categorias, remove duplicatas e ordena
      const distinctCategories = Array.from(new Set(data.map((item: any) => item.category))).sort();
      setCategories(distinctCategories);

    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro de Categorias",
        description: "Não foi possível carregar a lista de categorias para o filtro.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const handler = setTimeout(() => loadPublications(true), 500);
    return () => clearTimeout(handler);
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (page > 1) {
      loadPublications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);


  // Funções de manipulação (sem alteração na lógica interna)
  const loadMovements = async (publicationId: string) => { /* ... */ };
  const handleAdjustStock = async () => { /* ... */ };
  const handleViewHistory = async (publication: Publication) => { /* ... */ };
  const handleExportCSV = async () => { /* ... */ };
  
  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
        <p className="text-muted-foreground">Controle de entrada e saída de publicações</p>
      </div>
      
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

      <Card>
        <CardHeader><CardTitle className="text-base md:text-lg flex items-center gap-2"><Package className="h-5 w-5" />Controle de Estoque</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" /><p className="text-muted-foreground">Carregando estoque...</p></div>
          ) : publications.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Package className="h-8 md:h-12 w-8 md:w-12 mx-auto text-muted-foreground/30 mb-3 md:mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">Nenhuma publicação encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Publicação</TableHead><TableHead>Categoria</TableHead><TableHead>Estoque Atual</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {publications.map((pub, index) => (
                    <TableRow 
                      key={pub.id} 
                      ref={publications.length === index + 1 ? lastElementRef : null}
                    >
                      <TableCell>{pub.code && <CodeBadge code={pub.code} />}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <PublicationCover 
                            imageUrl={pub.image_url || undefined} 
                            title={pub.name} 
                            className="w-16 h-20 flex-shrink-0"
                            // ONCLICK PARA O ZOOM (RESTAURADO)
                            onClick={() => { 
                              if (pub.image_url) { 
                                setPreviewImage({url: pub.image_url, title: pub.name}); 
                                setImagePreviewOpen(true); 
                              }
                            }}
                          />
                          <div><span className="font-medium">{pub.name}</span></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{pub.category}</Badge></TableCell>
                      <TableCell><StockBadge stock={pub.current_stock} /></TableCell>
                       <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             {canManageStock && (<DropdownMenuItem onClick={() => { setSelectedPublication(pub); setNewStock(pub.current_stock.toString()); setAdjustDialogOpen(true);}}><Settings className="mr-2 h-4 w-4" />Ajustar Estoque</DropdownMenuItem>)}
                             <DropdownMenuItem onClick={() => handleViewHistory(pub)}><History className="mr-2 h-4 w-4" />Ver Histórico</DropdownMenuItem>
                             {canEdit && (<DropdownMenuItem onClick={() => { setPublicationToEdit(pub); setEditDialogOpen(true);}}><Edit className="mr-2 h-4 w-4" />Editar Publicação</DropdownMenuItem>)}
                             {isVisualizador && (<div className="px-2 py-1.5 text-sm text-muted-foreground">Apenas visualização</div>)}
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loadingMore && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando mais...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ... (Outros Modais - sem alteração) ... */}

      {/* DIÁLOGO PARA ZOOM DA IMAGEM (RESTAURADO) */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualização da Capa</DialogTitle>
            <DialogDescription>{previewImage?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {previewImage && (
              <img 
                src={previewImage.url} 
                alt={`Capa: ${previewImage.title}`} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
