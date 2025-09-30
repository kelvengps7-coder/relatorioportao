import { useState, useEffect, useRef } from "react";
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

const normalizeText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

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
  const { canCreate, canEdit, canDelete } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scanResult, setScanResult] = useState<Publication | null>(null);
  
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);
  
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

  const loadPublications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('publications').select('*').order('category, name');
      if (error) throw error;
      setPublications(data || []);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePublication = async () => { /* ... */ };
  const handleSaveUrl = async () => { /* ... */ };
  const handleExportCSV = async () => { /* ... */ };

  const filteredPublications = publications.filter(pub => {
    const normalizedSearch = normalizeText(searchTerm);
    return (
      (categoryFilter === "all" || pub.category === categoryFilter) &&
      (
        normalizeText(pub.name).includes(normalizedSearch) ||
        normalizeText(pub.code).includes(normalizedSearch)
      )
    );
  });
  
  const displayedPublications = scanResult ? [scanResult] : filteredPublications;
  const categories = Array.from(new Set(publications.map(p => p.category))).sort();

  const handleScanSuccess = (scannedValue: string) => {
    setIsScannerOpen(false);
    
    const foundPublication = publications.find(pub => 
      pub.urlDoFabricante === scannedValue || pub.codigoExternoQR === scannedValue
    );

    if (foundPublication) {
      setScanResult(foundPublication);
      setSearchTerm("");
      toast({
        title: "Publicação Encontrada",
        description: `Exibindo "${foundPublication.name}".`,
      });
    } else {
      setScanResult(null);
      setSearchTerm(scannedValue);
      toast({
        title: "Publicação Não Encontrada",
        description: "O código lido foi inserido no campo de busca para referência.",
        variant: "destructive",
      });
    }
  };

  // Função direta para abrir a câmera no topo
  const handleOpenCamera = () => {
    window.scrollTo({ top: 0, behavior: 'instant' }); // Salto instantâneo para o topo
    setIsScannerOpen(true);
  };
  
  if (loading) { /* ... */ }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Catálogo</h1>
        <p className="text-muted-foreground">Adicione, edite e organize suas publicações.</p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        {/* ... */}
        <TabsContent value="catalog" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código, nome ou URL..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setScanResult(null);
                    }}
                    className="pl-10 pr-10"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleOpenCamera} // <-- Ação direta aqui
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Select 
                  value={categoryFilter} 
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setScanResult(null);
                  }}
                >
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
              {displayedPublications.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhuma publicação encontrada.</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                   <Table>
                     {/* ... Table Header ... */}
                    <TableBody>
                      {displayedPublications.map((pub) => (
                        <TableRow key={pub.id}>
                           <TableCell>
                             <PublicationCover 
                               imageUrl={pub.image_url} 
                               title={pub.name}
                               className="w-12 h-16"
                               onClick={() => pub.image_url && setZoomedImage({url: pub.image_url, title: pub.name})}
                             />
                           </TableCell>
                          <TableCell><CodeBadge code={pub.code || 'N/A'} /></TableCell>
                          <TableCell className="font-medium">{pub.name}</TableCell>
                          <TableCell><Badge variant="secondary">{pub.category}</Badge></TableCell>
                          <TableCell>{pub.current_stock}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingPublication(pub); setEditDialogOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setUrlPublication(pub); setUrlDialogOpen(true); setPublicationUrl(pub.urlDoFabricante || ""); }}>
                                  <Link className="mr-2 h-4 w-4" />Cadastrar URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setPublicationToDelete(pub); setDeleteDialogOpen(true); }} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />Excluir
                                </DropdownMenuItem>
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

      {isScannerOpen && (
        <QrCodeScanner
          onScan={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      
      {/* Diálogos */}
      <PublicationFormDialog open={showNewForm} onOpenChange={setShowNewForm} onSuccess={loadPublications} />
      <PublicationFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} publication={editingPublication} onSuccess={() => { loadPublications(); setEditDialogOpen(false); }} />
      {/* ... outros diálogos ... */}
    </div>
  );
};

export default GerenciarSimplified;
