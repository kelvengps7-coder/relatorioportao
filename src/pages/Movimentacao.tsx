import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp, BarChart3, Search, Truck, Send, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/contexts/AuthContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { PublicationCover } from "@/components/PublicationCover";
import { UserActivityIndicator } from "@/components/UserActivityIndicator";
import { CodeBadge } from "@/components/ui/code-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { Publication } from "@/types";
import QrCodeScanner from "@/components/QrCodeScanner";

interface MovementLocal {
  id: string;
  publication_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  created_at: string;
  publications: Publication;
}

// Função para extrair URL de uma string
const extractUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
};

const Movimentacao = () => {
  const { canManageStock, isVisualizador } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [movements, setMovements] = useState<MovementLocal[]>([]);
  const [selectedPublication, setSelectedPublication] = useState<string>("");
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('saida');
  const [quantity, setQuantity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();
  const [searchParams] = useSearchParams();
  const [showScanner, setShowScanner] = useState(false);
  
  // Estado para o modal de zoom da imagem
  const [zoomedImage, setZoomedImage] = useState<{url: string, title: string} | null>(null);

  useEffect(() => {
    loadData();
    // Set movement type from URL params
    const typeParam = searchParams.get('type');
    if (typeParam === 'entrada' || typeParam === 'saida') {
      setMovementType(typeParam);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [pubResult, movResult] = await Promise.all([
        supabase.from('publications').select('*').order('category, name'),
        supabase
          .from('stock_movements')
          .select(`
            *,
            publications (*)
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (pubResult.error) throw pubResult.error;
      if (movResult.error) throw movResult.error;

      setPublications(pubResult.data || []);
      setMovements((movResult.data || []).map(movement => ({
        ...movement,
        type: movement.movement_type as 'entrada' | 'saida'
      })));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMovement = async () => {
    if (!selectedPublication || !quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma publicação e informe uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }

    const pub = publications.find(p => p.id === selectedPublication);
    if (!pub) return;

    const qty = parseInt(quantity);
    
    if (movementType === 'saida' && qty > pub.current_stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Disponível apenas ${pub.current_stock} unidades de "${pub.name}".`,
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Registrar movimentação
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          publication_id: selectedPublication,
          movement_type: movementType,
          quantity: qty
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // O estoque é atualizado automaticamente pelo trigger update_stock_counts()
      // Buscar estoque atualizado
      const { data: updatedPub, error: fetchError } = await supabase
        .from('publications')
        .select('current_stock')
        .eq('id', selectedPublication)
        .single();

      if (fetchError) throw fetchError;
      const newStock = updatedPub.current_stock;

      // Log das ações
      await logAction('movement', 'stock_movements', movementData.id, null, {
        publication_id: selectedPublication,
        type: movementType,
        quantity: qty,
        publication_name: pub.name,
        movement_type: `${movementType === 'entrada' ? 'Entrada' : 'Saída'} de ${qty} unidades`
      });

      await logAction('update', 'publications', selectedPublication, 
        { current_stock: pub.current_stock }, 
        { current_stock: newStock }
      );

      // Atualizar estado local
      setPublications(prev => prev.map(p => 
        p.id === selectedPublication ? { ...p, current_stock: newStock } : p
      ));

      // Recarregar movimentações
      loadData();

      setQuantity("");
      setSelectedPublication("");
      
      showSuccessMessage('movement', `${movementType === 'entrada' ? 'Entrada' : 'Saída'} de ${qty} unidades de "${pub.name}"`);
      
    } catch (error: any) {
      console.error('Erro ao salvar movimento:', error);
      showErrorMessage('registrar', 'movimentação', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Vibra o dispositivo assim que o scan for bem-sucedido
    if (navigator.vibrate) {
      navigator.vibrate(150);
    }
    
    setShowScanner(false);
    
    const url = extractUrl(decodedText);
    const searchTerm = url || decodedText;

    const publication = publications.find(p => 
      p.codigoExternoQR === searchTerm || 
      p.urlDoFabricante === searchTerm
    );
    
    if (publication) {
      setSelectedPublication(publication.id);
      toast({
        title: "Sucesso",
        description: `Publicação "${publication.name}" selecionada.`,
      });
    } else {
      setSearchTerm(searchTerm);
      toast({
        title: "Publicação Não Encontrada",
        description: "Nenhuma publicação corresponde ao QR Code lido. O valor foi inserido na busca para facilitar o cadastro.",
        variant: "destructive",
      });
    }
  };
  
  const filteredPublications = publications.filter(pub =>
    pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pub.codigoExternoQR && pub.codigoExternoQR.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedPub = publications.find(p => p.id === selectedPublication);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Carregando movimentações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Movement Form */}
      {canManageStock ? (
        <Card className="border-2 border-border/70 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-6 w-6" />
              Registrar Movimentação de Estoque
            </CardTitle>
            <CardDescription>
              Selecione la publicación, informe la cantidad y el tipo de movimiento.
            </CardDescription>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>Responsável pela movimentação</span>
              </div>
              <UserActivityIndicator size="sm" variant="card" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Publication Selector */}
            <div className="space-y-2">
              <Label>Publicação</Label>
              <div className="flex items-center gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-11 text-foreground hover:text-foreground focus:text-foreground border-2 border-border/70 hover:border-border/80 bg-background hover:bg-background shadow-sm hover:shadow-md"
                    >
                      <span className="truncate">
                        {selectedPub
                          ? `[${selectedPub.code}] ${selectedPub.name}`
                          : "Buscar publicação..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover border-2 border-border shadow-lg z-50" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Digite código ou nome da publicação..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma publicação encontrada.</CommandEmpty>
                        <CommandGroup>
                          {filteredPublications.map((pub) => (
                            <CommandItem
                              key={pub.id}
                              value={`${pub.code} ${pub.name}`}
                              onSelect={() => {
                                setSelectedPublication(pub.id);
                                setOpen(false);
                                setSearchTerm("");
                              }}
                              className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPublication === pub.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <PublicationCover 
                                    imageUrl={pub.image_url || undefined} 
                                    title={pub.name} 
                                    className="w-10 h-12 flex-shrink-0"
                                  />
                                  <div>
                                    <CodeBadge code={pub.code} className="mr-2" />
                                    <span className="font-medium">{pub.name}</span>
                                    <p className="text-xs text-muted-foreground mt-1">{pub.category}</p>
                                  </div>
                                </div>
                                <StockBadge stock={pub.current_stock} className="ml-2" />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={() => setShowScanner(true)} className="h-11">
                  <Camera className="h-5 w-5" />
                </Button>
              </div>

              {selectedPub && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Estoque atual:</span>
                  <StockBadge stock={selectedPub.current_stock} />
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 50"
                min="1"
                className="h-11"
              />
            </div>
          </div>

          {/* Movement Type */}
          <div className="space-y-3">
            <Label>Tipo de Movimentação</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setMovementType('entrada')}
                variant={movementType === 'entrada' ? 'default' : 'outline'}
                className={`flex-1 justify-center gap-2 text-base py-6 ${
                  movementType === 'entrada' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
                }`}
              >
                <ArrowUp className="h-5 w-5" />
                Entrada
              </Button>
              <Button
                onClick={() => setMovementType('saida')}
                variant={movementType === 'saida' ? 'default' : 'outline'}
                className={`flex-1 justify-center gap-2 text-base py-6 ${
                  movementType === 'saida' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'border-red-500 text-red-500 hover:bg-red-500/10'
                }`}
              >
                <ArrowDown className="h-5 w-5" />
                Saída
              </Button>
            </div>
          </div>

          {/* Summary */}
          {selectedPub && quantity && parseInt(quantity) > 0 && (
            <div className="p-4 bg-muted/60 border-2 border-muted rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Movimentação</h4>
              <div className="text-sm space-y-2">
                <p className="flex flex-wrap items-center gap-1">
                  <span>Publicação:</span> 
                  <span className="font-semibold text-foreground break-all">[{selectedPub.code}] {selectedPub.name}</span>
                </p>
                <p className="flex flex-wrap items-center gap-1">
                  <span>Saldo anterior:</span> 
                  <span className="font-semibold text-foreground">{selectedPub.current_stock} unidades</span>
                </p>
                <p className="flex flex-wrap items-center gap-1">
                  <span>Movimento:</span> 
                  <span className={`font-bold ${movementType === 'entrada' ? 'text-blue-500' : 'text-red-500'}`}>
                    {movementType === 'entrada' ? '+' : '-'}{quantity} unidades
                  </span>
                </p>
                <p className="flex flex-wrap items-center gap-1">
                  <span>Saldo final:</span> 
                  <span className="font-semibold text-foreground">
                  {movementType === 'entrada' 
                    ? selectedPub.current_stock + parseInt(quantity)
                    : selectedPub.current_stock - parseInt(quantity)
                  } unidades
                </span></p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleMovement} 
            disabled={processing || !selectedPublication || !quantity || parseInt(quantity) <= 0}
            className="w-full text-lg py-7 bg-green-600 hover:bg-green-700 text-white"
          >
            {processing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="mr-2 h-5 w-5" />
            )}
            {processing ? "Registrando..." : "Registrar Movimentação"}
          </Button>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Movimentação - Apenas Visualização
            </CardTitle>
            <CardDescription>
              Você tem permissão apenas para visualizar as movimentações. Entre em contato com um administrador para registrar movimentações.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {new Date(movement.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <PublicationCover 
                            imageUrl={movement.publications.image_url || undefined} 
                            title={movement.publications.name} 
                            className="w-10 h-12 md:w-12 md:h-16 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => movement.publications.image_url && setZoomedImage({url: movement.publications.image_url, title: movement.publications.name})}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <CodeBadge code={movement.publications.code} className="text-xs" />
                            </div>
                            <p className="font-medium text-sm break-words leading-tight">{movement.publications.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{movement.publications.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={movement.type === 'entrada' ? 'default' : 'secondary'}
                          className={movement.type === 'entrada' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}
                        >
                          {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={movement.type === 'entrada' ? 'text-blue-500' : 'text-red-500'}>
                          {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showScanner && (
        <QrCodeScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Capa: {zoomedImage?.title}</DialogTitle>
            <DialogDescription>
              Visualização ampliada da capa da publicação.
            </DialogDescription>
          </DialogHeader>
          {zoomedImage && (
            <div className="flex justify-center py-4">
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

export default Movimentacao;
