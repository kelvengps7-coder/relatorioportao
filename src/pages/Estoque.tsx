
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Download, MoreVertical, Loader2, Camera } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { CodeBadge } from "@/components/ui/code-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { PublicationCover } from "@/components/PublicationCover";
import { Publication } from "@/types";
import QrCodeScanner from "@/components/QrCodeScanner";

const ITEMS_PER_PAGE = 30;

const extractUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
};

const formatCsvValue = (value: any): string => {
  const stringValue = String(value ?? '');
  if (/[";\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const Estoque = () => {
  const { canManageStock } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, title: string} | null>(null);
  
  const { toast } = useToast();
  
  const topRef = useRef<HTMLDivElement>(null);

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
      const { data, error } = await supabase.from('publications').select('category');
      if (error) throw error;
      const distinctCategories = Array.from(new Set(data.map((item: any) => item.category))).sort();
      setCategories(distinctCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };
  
  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadPublications(true);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (page > 1) {
      loadPublications();
    }
  }, [page]);

  const handleExportCSV = async () => { /* ... */ };

  // Correção Definitiva: Lógica de busca robusta com duas queries separadas.
  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    const scanValue = extractUrl(decodedText) || decodedText;

    if (!scanValue) return;

    setLoading(true);
    try {
      // 1. Tenta buscar pelo campo principal `urlDoFabricante`
      const { data: dataByUrl, error: errorByUrl } = await supabase
        .from('publications')
        .select('*')
        .eq('urlDoFabricante', scanValue)
        .limit(1);

      if (errorByUrl) throw errorByUrl;

      let finalData = dataByUrl;

      // 2. Se não encontrar, tenta buscar pelo campo alternativo `codigoExternoQR`
      if (!finalData || finalData.length === 0) {
        const { data: dataByQr, error: errorByQr } = await supabase
          .from('publications')
          .select('*')
          .eq('codigoExternoQR', scanValue)
          .limit(1);
        
        if (errorByQr) throw errorByQr;
        finalData = dataByQr;
      }

      if (finalData && finalData.length > 0) {
        setPublications(finalData);
        setSearchTerm("");
        setCategoryFilter("all");
        setHasMore(false);
        toast({
          title: "Publicação Encontrada",
          description: finalData[0].name,
        });
      } else {
        setPublications([]);
        setSearchTerm(scanValue);
        setHasMore(false);
        toast({
          title: "Publicação Não Encontrada",
          description: "O código lido foi inserido na barra de busca para sua referência.",
          variant: "destructive",
        });
      }
    } catch (dbError) {
      console.error("Erro na busca por QR Code:", dbError);
      toast({
        title: "Erro na Busca",
        description: "Ocorreu um erro ao consultar o banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6" ref={topRef}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
        <p className="text-muted-foreground">Controle de entrada e saída de publicações</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Button onClick={() => setShowScanner(true)} className="w-full md:w-auto">
                  <Camera className="h-4 w-4" />
                </Button>
                {showScanner && (
                  <QrCodeScanner
                    onScan={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                  />
                )}
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
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2" disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? "Exportando..." : "Exportar CSV"}
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
                    <TableRow key={pub.id} ref={publications.length === index + 1 ? lastElementRef : null}>
                      <TableCell>{pub.code && <CodeBadge code={pub.code} />}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <PublicationCover 
                            imageUrl={pub.image_url || undefined} 
                            title={pub.name} 
                            className="w-16 h-20 flex-shrink-0"
                            onClick={() => { if (pub.image_url) { setPreviewImage({url: pub.image_url, title: pub.name}); setImagePreviewOpen(true); }}}
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
                              <DropdownMenuItem disabled={!canManageStock}>Ajustar Estoque</DropdownMenuItem>
                              <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                              <DropdownMenuItem disabled={!canManageStock}>Editar Publicação</DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loadingMore && <div className="text-center py-4"><Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground mt-2">Carregando mais...</p></div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualização da Capa</DialogTitle>
            <DialogDescription>{previewImage?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {previewImage && <img src={previewImage.url} alt={`Capa: ${previewImage.title}`} className="max-w-full max-h-[70vh] object-contain"/>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
