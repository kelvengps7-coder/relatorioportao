
import { useState, useEffect } from "react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/contexts/AuthContext';
import { CodeBadge } from "@/components/ui/code-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { PublicationFormDialog } from "@/components/PublicationFormDialog";
import { PublicationCover } from "@/components/PublicationCover";
import { Publication } from "@/types";

interface MovementLocal {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  created_at: string;
  motivo?: string;
}

const ROWS_PER_PAGE = 10;

const Estoque = () => {
  const { canManageStock, canEdit, isVisualizador } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [newStock, setNewStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [movements, setMovements] = useState<MovementLocal[]>([]);
  const [processing, setProcessing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [publicationToEdit, setPublicationToEdit] = useState<Publication | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, title: string} | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalPublications, setTotalPublications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalPublications / ROWS_PER_PAGE);

  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.rpc('get_distinct_categories');
      if (error) throw error;
      setCategories(data.map((c: any) => c.category));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadPublications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('publications')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
      const endIndex = startIndex + ROWS_PER_PAGE - 1;
      query = query.range(startIndex, endIndex);

      query = query.order('category, name');

      const { data, error, count } = await query;
      
      if (error) throw error;
      setPublications(data || []);
      setTotalPublications(count || 0);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      toast({ title: "Erro", description: "Erro ao carregar dados do estoque.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        loadPublications();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, categoryFilter]);

  const loadMovements = async (publicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setMovements((data || []).map(movement => ({
        ...movement,
        type: movement.movement_type as 'entrada' | 'saida' | 'ajuste',
        motivo: movement.reason
      })));
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({ title: "Erro", description: "Erro ao carregar histórico.", variant: "destructive" });
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedPublication || !newStock || !adjustReason.trim()) {
      showErrorMessage('ajustar', 'estoque', 'Por favor, preencha todos os campos.');
      return;
    }
    const newStockValue = parseInt(newStock);
    if (isNaN(newStockValue) || newStockValue < 0) {
      showErrorMessage('ajustar', 'estoque', 'Por favor, informe um valor válido para o estoque.');
      return;
    }
    setProcessing(true);
    try {
      const difference = newStockValue - selectedPublication.current_stock;
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements').insert({
          publication_id: selectedPublication.id,
          movement_type: 'ajuste',
          quantity: Math.abs(difference),
          reason: adjustReason
        }).select().single();
      if (movementError) throw movementError;

      const { error: updateError } = await supabase
        .from('publications').update({ current_stock: newStockValue }).eq('id', selectedPublication.id);
      if (updateError) throw updateError;

      await logAction('movement', 'stock_movements', movementData.id, null, {
        type: 'ajuste', quantity: Math.abs(difference), motivo: adjustReason, publication_name: selectedPublication.name,
        adjustment_details: `Ajuste de estoque: ${selectedPublication.current_stock} → ${newStockValue} unidades`
      });
      await logAction('update', 'publications', selectedPublication.id, { current_stock: selectedPublication.current_stock }, { current_stock: newStockValue });

      loadPublications(); // Reload data
      setAdjustDialogOpen(false);
      setNewStock("");
      setAdjustReason("");
      showSuccessMessage('update', `Estoque de "${selectedPublication.name}" ajustado para ${newStockValue} unidades`);
      setSelectedPublication(null);
    } catch (error: any) {
      showErrorMessage('ajustar', 'estoque', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewHistory = async (publication: Publication) => {
    setSelectedPublication(publication);
    await loadMovements(publication.id);
    setHistoryDialogOpen(true);
  };

  const handleExportCSV = async () => {
     toast({ title: "Exportando...", description: "Gerando arquivo CSV..." });
    try {
      let { data, error } = await supabase.from('publications').select('code,name,category,current_stock').order('category, name');
      if (error) throw error;
      
      const csvData = [['Código', 'Nome', 'Categoria', 'Estoque Atual'], ...(data || []).map(pub => [pub.code, pub.name, pub.category, pub.current_stock.toString()])];
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast({ title: "Exportação concluída", description: "Dados do estoque exportados com sucesso." });
      logAction('export', 'publications', 'csv_export', undefined, {exported_rows: data?.length});
    } catch (error: any) {
      showErrorMessage('exportar', 'estoque', error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Estoque</h1>
        <p className="text-muted-foreground text-sm md:text-base">Controle e ajustes do estoque de publicações</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 flex-1 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 w-full md:w-auto"><Download className="h-4 w-4" />Exportar CSV</Button>
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
                  {publications.map((pub) => (
                    <TableRow key={pub.id}>
                      <TableCell>{pub.code && <CodeBadge code={pub.code} />}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <PublicationCover imageUrl={pub.image_url || undefined} title={pub.name} className="w-16 h-20 flex-shrink-0"
                            onClick={() => { if (pub.image_url) { setPreviewImage({url: pub.image_url, title: pub.name}); setImagePreviewOpen(true); }}}/>
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
            </div>
          )}
        </CardContent>
      </Card>
      
       {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1}/></PaginationItem>
            {[...Array(totalPages)].map((_, i) => (<PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} disabled={currentPage === totalPages}/></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {canManageStock && (
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle><DialogDescription>Ajuste o estoque de "{selectedPublication?.name}".</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label htmlFor="newStock">Novo Saldo</Label><Input id="newStock" type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="Digite o novo saldo" min="0"/>{selectedPublication && (<p className="text-sm text-muted-foreground mt-1">Saldo atual: {selectedPublication.current_stock} unidades</p>)}</div>
              <div><Label htmlFor="adjustReason">Motivo do Ajuste</Label><Textarea id="adjustReason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Descreva o motivo..." rows={3}/></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancelar</Button><Button onClick={handleAdjustStock} disabled={processing}>{processing ? "Ajustando..." : "Ajustar Estoque"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de Movimentações</DialogTitle><DialogDescription>Últimas movimentações de "{selectedPublication?.name}"</DialogDescription></DialogHeader>
          <div className="max-h-96 overflow-y-auto py-4">
            {movements.length === 0 ? (<div className="text-center py-8"><History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma movimentação registrada.</p></div>) : (
              <div className="space-y-3 pr-4">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={movement.type === 'entrada' ? 'default' : movement.type === 'saida' ? 'secondary' : 'outline'} className={movement.type === 'entrada' ? 'bg-green-600 text-white' : ''}>{movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}</Badge>
                        <span className="font-medium">{movement.type === 'entrada' ? '+' : movement.type === 'saida' ? '-' : '±'}{movement.quantity} unidades</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{new Date(movement.created_at).toLocaleString('pt-BR')}</p>
                      {movement.motivo && (<p className="text-sm text-muted-foreground italic mt-1">Motivo: {movement.motivo}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {canEdit && (<PublicationFormDialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setPublicationToEdit(null);}} publication={publicationToEdit} onSuccess={loadPublications}/>)}

      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Visualização da Capa</DialogTitle><DialogDescription>{previewImage?.title}</DialogDescription></DialogHeader><div className="flex justify-center py-4">{previewImage && (<img src={previewImage.url} alt={`Capa: ${previewImage.title}`} className="max-w-full max-h-[70vh] object-contain"/>)}</div></DialogContent></Dialog>
    </div>
  );
};

export default Estoque;
