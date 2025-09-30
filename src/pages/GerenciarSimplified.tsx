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
import { FolderOpen, Plus, Search, Edit, Trash2, Download, Settings, Loader2, MoreVertical, QrCode, Camera, Link } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CodeBadge } from "@/components/ui/code-badge";
import { PublicationFormDialog } from "@/components/PublicationFormDialog";
import { PublicationCover } from "@/components/PublicationCover";
import QrCodeScanner from '@/components/QrCodeScanner';

import { useAuth } from '@/contexts/AuthContext';
import { Publication } from "@/types";

// Função para normalizar texto (usada para busca geral)
const normalizeText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

// Função para validar se uma string é uma URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
};

const formatCsvValue = (value: any): string => {
  const stringValue = String(value ?? '');
  if (/[";\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const GerenciarSimplified = () => {
  const { canCreate, canEdit, canDelete, isVisualizador } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);
  
  // Novo estado para o diálogo de URL
  const [urlPublication, setUrlPublication] = useState<Publication | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [publicationUrl, setPublicationUrl] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{url: string, title: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPublications();
  }, []);

  // Efeito para rolar a página para o topo ao abrir o scanner
  useEffect(() => {
    if (isScannerOpen) {
      window.scrollTo(0, 0);
    }
  }, [isScannerOpen]);


  const loadPublications = async () => {
    try {
      setLoading(true);
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

  const handleDeletePublication = async () => {
    if (!publicationToDelete) return;
    setProcessing(true);
    try {
      await supabase.from('stock_movements').delete().eq('publication_id', publicationToDelete.id);
      await supabase.from('pedidos').delete().eq('publicacao_id', publicationToDelete.id);
      const { error } = await supabase.from('publications').delete().eq('id', publicationToDelete.id);
      if (error) throw error;
      setPublications(prev => prev.filter(p => p.id !== publicationToDelete.id));
      setDeleteDialogOpen(false);
      setPublicationToDelete(null);
      toast({ title: "Publicação excluída", description: "Publicação removida com sucesso." });
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      toast({ title: "Erro", description: "Erro ao excluir publicação.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!urlPublication) return;
    
    if (!isValidUrl(publicationUrl)) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL válida.", variant: "destructive" });
      return;
    }
    
    setProcessing(true);
    
    try {
      const { data, error } = await supabase
        .from('publications')
        .update({ urlDoFabricante: publicationUrl })
        .eq('id', urlPublication.id)
        .select()
        .single();
  
      if (error) throw error;
  
      setPublications(prev => prev.map(p => (p.id === urlPublication.id ? data : p)));
      setUrlDialogOpen(false);
      setUrlPublication(null);
      setPublicationUrl("");
      toast({ title: "Sucesso", description: "URL do Fabricante salva com sucesso!" });
    } catch (error: any) {
      console.error('Erro ao salvar URL:', error);
      toast({ title: "Erro", description: `Erro ao salvar a URL: ${error.message}`, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    toast({ title: "Exportando dados", description: "Preparando seu arquivo CSV..." });
    try {
      const dataToExport = filteredPublications;
      const headers = ['Código', 'Publicação', 'Categoria', 'Estoque Atual', 'URL do Fabricante'];
      const csvRows = [
        headers.join(';'),
        ...dataToExport.map(pub => [
          formatCsvValue(pub.code),
          formatCsvValue(pub.name),
          formatCsvValue(pub.category),
          formatCsvValue(pub.current_stock),
          formatCsvValue(pub.urlDoFabricante)
        ].join(';'))
      ];
      const csvContent = csvRows.join('\n');
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `catalogo_publicacoes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Exportação Concluída", description: `${dataToExport.length} registros exportados.` });
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo CSV.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPublications = publications.filter(pub => {
    const normalizedSearch = normalizeText(searchTerm);
    return (
      (categoryFilter === "all" || pub.category === categoryFilter) &&
      (
        normalizeText(pub.name).includes(normalizedSearch) ||
        normalizeText(pub.code).includes(normalizedSearch) ||
        (pub.urlDoFabricante && normalizeText(pub.urlDoFabricante).includes(normalizedSearch))
      )
    );
  });
  
  const categories = Array.from(new Set(publications.map(p => p.category))).sort();

  const handleScanSuccess = (scannedUrl: string) => {
    setIsScannerOpen(false);
    
    if (!isValidUrl(scannedUrl)) {
      toast({ title: "QR Code Inválido", description: "O conteúdo lido não é uma URL válida.", variant: "destructive" });
      setSearchTerm(scannedUrl);
      return;
    }
  
    const foundPublication = publications.find(pub => pub.urlDoFabricante === scannedUrl);
  
    if (foundPublication) {
      setEditingPublication(foundPublication);
      setEditDialogOpen(true);
      toast({
        title: "Publicação Encontrada!",
        description: `Editando "${foundPublication.name}".`,
      });
    } else {
      setSearchTerm(scannedUrl);
      toast({
        title: "Publicação Não Encontrada",
        description: "Nenhuma publicação corresponde à URL lida. Verifique se a URL está cadastrada.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Catálogo</h1>
        <p className="text-muted-foreground">Adicione, edite e organize suas publicações.</p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-1 md:w-auto">
          <TabsTrigger value="catalog" className="flex items-center gap-2"><FolderOpen className="h-4 w-4" />Catálogo</TabsTrigger>
          {canCreate && <TabsTrigger value="new" className="flex items-center gap-2"><Plus className="h-4 w-4" />Nova Publicação</TabsTrigger>}
        </TabsList>

        {canCreate && (
          <TabsContent value="new">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Adicionar Nova Publicação</CardTitle>
                <CardDescription>Clique no botão abaixo para abrir o formulário de cadastro.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowNewForm(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Publicação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="catalog" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código, nome ou URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleExportCSV} variant="outline" className="w-full md:w-auto" disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Publicações</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPublications.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhuma publicação encontrada.</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-16 hidden md:table-cell">Capa</TableHead>
                         <TableHead>Código</TableHead>
                         <TableHead>Nome</TableHead>
                         <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                         <TableHead className="hidden sm:table-cell">Estoque</TableHead>
                         <TableHead className="text-right">Ações</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {filteredPublications.map((pub) => (
                        <TableRow key={pub.id}>
                           <TableCell className="hidden md:table-cell">
                             <PublicationCover 
                               imageUrl={pub.image_url} 
                               title={pub.name}
                               className="w-12 h-16 cursor-pointer"
                               onClick={() => pub.image_url && setZoomedImage({url: pub.image_url, title: pub.name})}
                             />
                           </TableCell>
                          <TableCell><CodeBadge code={pub.code || 'N/A'} /></TableCell>
                          <TableCell className="font-medium">{pub.name}</TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{pub.category}</Badge></TableCell>
                          <TableCell className="hidden sm:table-cell">{pub.current_stock}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && <DropdownMenuItem onClick={() => { setEditingPublication(pub); setEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => { setUrlPublication(pub); setUrlDialogOpen(true); setPublicationUrl(pub.urlDoFabricante || ""); }}><Link className="mr-2 h-4 w-4" />Cadastrar URL</DropdownMenuItem>
                                {canDelete && <DropdownMenuItem onClick={() => { setPublicationToDelete(pub); setDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>}
                                {isVisualizador && <DropdownMenuItem disabled>Apenas visualização</DropdownMenuItem>}
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
        </TabsContent>
      </Tabs>

      {/* Renderiza o Scanner como um componente de tela cheia */}
      {isScannerOpen && (
        <QrCodeScanner
          onScan={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      
      {canCreate && <PublicationFormDialog open={showNewForm} onOpenChange={setShowNewForm} onSuccess={loadPublications} />}
      {canEdit && <PublicationFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} publication={editingPublication} onSuccess={() => { loadPublications(); setEditDialogOpen(false); }} />}
      
      {canDelete && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Excluir Publicação</DialogTitle><DialogDescription>Tem certeza que deseja excluir "{publicationToDelete?.name}"? Esta ação é irreversível.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeletePublication} disabled={processing}>{processing ? "Excluindo..." : "Excluir"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de URL do Fabricante */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>URL do Fabricante</DialogTitle><DialogDescription>Insira a URL completa obtida do QR Code do fabricante.</DialogDescription></DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="publicationUrl">URL do Fabricante</Label>
            <Input id="publicationUrl" value={publicationUrl} onChange={(e) => setPublicationUrl(e.target.value)} placeholder="https://exemplo.com/produto/123"/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUrl} disabled={processing}>{processing ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Capa: {zoomedImage?.title}</DialogTitle></DialogHeader>
          {zoomedImage && <img src={zoomedImage.url} alt={`Capa: ${zoomedImage.title}`} className="max-w-full max-h-[70vh] object-contain rounded-lg"/>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarSimplified;
