import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingCart, Plus, Search, MoreVertical, Edit, Trash2, AlertTriangle, Check, ChevronsUpDown, Plane, Archive, ArchiveRestore, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/contexts/AuthContext';
import { CodeBadge } from "@/components/ui/code-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { PublicationCover } from "@/components/PublicationCover";
import { UserActivityIndicator } from "@/components/UserActivityIndicator";
import { Publication } from "@/types";

interface PedidoLocal {
  id: string;
  irmao: string;
  publicacao_id: string;
  quantidade: number;
  data_pedido: string;
  enviado: boolean;
  entregue: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  publications?: Publication;
}

const PedidosSimple = () => {
  const { canManageOrders, isVisualizador } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoLocal[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ativos");
  const [showNewPedidoForm, setShowNewPedidoForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoLocal | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, type: string, pedido: PedidoLocal | null}>({open: false, type: "", pedido: null});
  const [open, setOpen] = useState(false);
  const [pubSearchTerm, setPubSearchTerm] = useState("");
  
  // Form states
  const [formData, setFormData] = useState({
    irmao: "",
    publicacao_id: "",
    quantidade: "",
    data_pedido: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadPublications();
    await loadPedidos();
  };

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          publications (
            id,
            code,
            name,
            category,
            current_stock,
            image_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPedidos(data?.map(item => ({
        ...item,
        publications: item.publications ? {
          ...item.publications,
          total_entries: 0,
          total_exits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } : undefined
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPublications(data || []);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSavePedido = async () => {
    if (!formData.irmao.trim() || !formData.publicacao_id || !formData.quantidade || parseInt(formData.quantidade) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const publication = publications.find(p => p.id === formData.publicacao_id);
      
      if (editingPedido) {
        // Atualizar pedido existente
        const { data: updatedData, error } = await supabase
          .from('pedidos')
          .update({
            irmao: formData.irmao,
            publicacao_id: formData.publicacao_id,
            quantidade: parseInt(formData.quantidade),
            data_pedido: formData.data_pedido
          })
          .eq('id', editingPedido.id)
          .select()
          .single();

        if (error) throw error;

        await logAction('update', 'pedidos', editingPedido.id, editingPedido, {
          ...updatedData,
          publication_name: publication?.name,
          order_details: `Pedido para ${formData.irmao}: ${formData.quantidade} unidades de ${publication?.name}`
        });

        showSuccessMessage('update', 'Pedido');
      } else {
        // Criar novo pedido
        const { data: newData, error } = await supabase
          .from('pedidos')
          .insert({
            irmao: formData.irmao,
            publicacao_id: formData.publicacao_id,
            quantidade: parseInt(formData.quantidade),
            data_pedido: formData.data_pedido
          })
          .select()
          .single();

        if (error) throw error;

        await logAction('create', 'pedidos', newData.id, null, {
          ...newData,
          publication_name: publication?.name,
          order_details: `Novo pedido para ${formData.irmao}: ${formData.quantidade} unidades de ${publication?.name}`
        });

        showSuccessMessage('create', 'Pedido');
      }

      await loadPedidos();
      setShowNewPedidoForm(false);
      setEditingPedido(null);
      setFormData({ irmao: "", publicacao_id: "", quantidade: "", data_pedido: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      showErrorMessage(editingPedido ? 'atualizar' : 'criar', 'pedido', error.message);
    }
  };

  const handleToggleEnviado = async (pedido: PedidoLocal) => {
    const newEnviado = !pedido.enviado;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ enviado: newEnviado })
        .eq('id', pedido.id);

      if (error) throw error;

      await logAction('update', 'pedidos', pedido.id, 
        { enviado: pedido.enviado }, 
        { 
          enviado: newEnviado,
          status_change: `Pedido marcado como ${newEnviado ? 'enviado' : 'não enviado'}`,
          order_details: `${pedido.irmao} - ${pedido.publications?.name}`
        }
      );

      setPedidos(prev => prev.map(p => 
        p.id === pedido.id ? { ...p, enviado: newEnviado } : p
      ));
      
      showSuccessMessage('update', `Status do pedido (${newEnviado ? 'enviado' : 'não enviado'})`);
    } catch (error: any) {
      showErrorMessage('atualizar', 'status do pedido', error.message);
    }
  };

  const handleToggleEntregue = async (pedido: PedidoLocal) => {
    const newEntregue = !pedido.entregue;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ entregue: newEntregue })
        .eq('id', pedido.id);

      if (error) throw error;

      await logAction('update', 'pedidos', pedido.id, 
        { entregue: pedido.entregue }, 
        { 
          entregue: newEntregue,
          status_change: `Pedido marcado como ${newEntregue ? 'entregue' : 'não entregue'}`,
          order_details: `${pedido.irmao} - ${pedido.publications?.name}`
        }
      );

      setPedidos(prev => prev.map(p => 
        p.id === pedido.id ? { ...p, entregue: newEntregue } : p
      ));
      
      showSuccessMessage('update', `Status do pedido (${newEntregue ? 'entregue' : 'não entregue'})`);
    } catch (error: any) {
      showErrorMessage('atualizar', 'status do pedido', error.message);
    }
  };

  const handleArchive = async (pedido: PedidoLocal) => {
    if (!pedido.enviado || !pedido.entregue) {
      toast({
        title: "Não é possível arquivar",
        description: "Só é possível arquivar pedidos que foram enviados e entregues.",
        variant: "destructive"
      });
      return;
    }

    const action = pedido.archived ? 'desarquivar' : 'arquivar';
    if (!confirm(`Tem certeza que deseja ${action} este pedido?`)) {
      return;
    }

    try {
      const updates = {
        archived: !pedido.archived
      };

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', pedido.id);

      if (error) throw error;

      await logAction('update', 'pedidos', pedido.id, 
        { archived: pedido.archived }, 
        { 
          ...updates,
          status_change: `Pedido ${!pedido.archived ? 'arquivado' : 'desarquivado'}`,
          order_details: `${pedido.irmao} - ${pedido.publications?.name}`
        }
      );

      setPedidos(prev => prev.map(p => 
        p.id === pedido.id ? { ...p, ...updates } : p
      ));
      
      showSuccessMessage('update', `Pedido ${!pedido.archived ? 'arquivado' : 'desarquivado'} com sucesso`);
    } catch (error: any) {
      showErrorMessage(action, 'pedido', error.message);
    }
  };

  const handleExcluir = async (pedido: PedidoLocal) => {
    if (!confirm(`Tem certeza que deseja excluir o pedido de ${pedido.irmao}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedido.id);

      if (error) throw error;

      await logAction('delete', 'pedidos', pedido.id, {
        ...pedido,
        order_details: `Pedido excluído: ${pedido.irmao} - ${pedido.publications?.name} (${pedido.quantidade} unidades)`
      }, null);

      setPedidos(prev => prev.filter(p => p.id !== pedido.id));
      
      showSuccessMessage('delete', 'Pedido');
    } catch (error: any) {
      showErrorMessage('excluir', 'pedido', error.message);
    }
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.irmao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.publications?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.publications?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "todos" ||
      (statusFilter === "ativos" && !pedido.archived) ||
      (statusFilter === "arquivados" && pedido.archived) ||
      (statusFilter === "nao_enviados" && !pedido.enviado && !pedido.archived) ||
      (statusFilter === "enviados" && pedido.enviado && !pedido.entregue && !pedido.archived) ||
      (statusFilter === "entregues" && pedido.entregue && !pedido.archived) ||
      (statusFilter === "prontos_arquivar" && pedido.enviado && pedido.entregue && !pedido.archived);
    
    return matchesSearch && matchesStatus;
  });

  const pedidosStats = {
    total: pedidos.length,
    ativos: pedidos.filter(p => !p.archived).length,
    arquivados: pedidos.filter(p => p.archived).length,
    prontosParaArquivar: pedidos.filter(p => p.enviado && p.entregue && !p.archived).length,
    pendentes: pedidos.filter(p => !p.enviado && !p.archived).length
  };

  // Group filtered publications by category for mobile selection
  const groupedPublications = publications.reduce((acc, pub) => {
    if (!acc[pub.category]) {
      acc[pub.category] = [];
    }
    acc[pub.category].push(pub);
    return acc;
  }, {} as Record<string, Publication[]>);

  const filteredPublications = publications.filter(pub =>
    pub.name.toLowerCase().includes(pubSearchTerm.toLowerCase()) ||
    pub.code.toLowerCase().includes(pubSearchTerm.toLowerCase()) ||
    pub.category.toLowerCase().includes(pubSearchTerm.toLowerCase())
  );

  const selectedPub = publications.find(p => p.id === formData.publicacao_id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Gerenciamento profissional de pedidos</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <strong>{pedidosStats.ativos}</strong> ativos
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <strong>{pedidosStats.arquivados}</strong> arquivados
            </span>
            {pedidosStats.prontosParaArquivar > 0 && (
              <span className="flex items-center gap-1 text-success font-semibold">
                <Shield className="w-3 h-3" />
                <strong>{pedidosStats.prontosParaArquivar}</strong> prontos para arquivar
              </span>
            )}
          </div>
        </div>
        {canManageOrders && (
          <Button onClick={() => setShowNewPedidoForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        )}
        {isVisualizador && (
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            Apenas visualização permitida
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por irmão ou publicação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Ativos ({pedidosStats.ativos})
                  </div>
                </SelectItem>
                <SelectItem value="arquivados">
                  <div className="flex items-center gap-2">
                    <Archive className="w-3 h-3" />
                    Arquivados ({pedidosStats.arquivados})
                  </div>
                </SelectItem>
                <SelectItem value="prontos_arquivar">
                  <div className="flex items-center gap-2 font-semibold">
                    <Shield className="w-3 h-3 text-success" />
                    Prontos p/ Arquivar ({pedidosStats.prontosParaArquivar})
                  </div>
                </SelectItem>
                <SelectItem value="todos">Todos ({pedidosStats.total})</SelectItem>
                <SelectItem value="nao_enviados">Não Enviados</SelectItem>
                <SelectItem value="enviados">Enviados</SelectItem>
                <SelectItem value="entregues">Entregues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "todos" ? "Nenhum pedido encontrado com os filtros aplicados." : "Nenhum pedido cadastrado ainda."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data do Pedido</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead>Entregue</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPedidos.map((pedido) => (
                    <TableRow 
                      key={pedido.id}
                      className={cn(
                        pedido.archived && "bg-muted/30 opacity-75",
                        !pedido.archived && pedido.entregue && "bg-green-50/50 dark:bg-green-900/10",
                        !pedido.archived && !pedido.entregue && pedido.enviado && "bg-blue-50/50 dark:bg-blue-900/10",
                        pedido.enviado && pedido.entregue && !pedido.archived && "ring-1 ring-success/20"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {pedido.irmao}
                          {pedido.archived && (
                            <Badge variant="secondary" className="text-xs">
                              <Archive className="h-3 w-3 mr-1" />
                              Arquivado
                            </Badge>
                          )}
                          {!pedido.archived && pedido.entregue && (
                            <Check className="h-3 w-3 text-green-600" />
                          )}
                          {!pedido.archived && !pedido.entregue && pedido.enviado && (
                            <Plane className="h-3 w-3 text-blue-600" />
                          )}
                          {!pedido.archived && pedido.enviado && pedido.entregue && (
                            <Badge variant="outline" className="text-xs border-success text-success">
                              <Shield className="h-3 w-3 mr-1" />
                              Pronto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PublicationCover 
                            imageUrl={pedido.publications?.image_url || undefined} 
                            title={pedido.publications?.name || ''} 
                            className="w-16 h-20 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{pedido.publications?.name}</span>
                              {pedido.publications?.code && (
                                <CodeBadge code={pedido.publications.code} />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{pedido.publications?.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {pedido.quantidade}
                      </TableCell>
                      <TableCell>
                        {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           <Checkbox
                             checked={pedido.enviado}
                             onCheckedChange={() => canManageOrders ? handleToggleEnviado(pedido) : null}
                             disabled={!canManageOrders}
                             className={cn(
                               "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                               canManageOrders 
                                 ? "hover:border-primary/60 focus:ring-primary/20 cursor-pointer" 
                                 : "opacity-50 cursor-not-allowed"
                             )}
                             aria-label={`Marcar como ${pedido.enviado ? 'não enviado' : 'enviado'}`}
                           />
                           <Badge 
                             variant={pedido.enviado ? "default" : "secondary"} 
                             className={cn(
                               pedido.enviado 
                                 ? "bg-primary text-primary-foreground" 
                                 : "bg-muted text-muted-foreground hover:bg-muted/80"
                             )}
                           >
                             {pedido.enviado ? "Enviado" : "Não Enviado"}
                           </Badge>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           <Checkbox
                             checked={pedido.entregue}
                             onCheckedChange={() => canManageOrders ? handleToggleEntregue(pedido) : null}
                             disabled={!canManageOrders}
                             className={cn(
                               "data-[state=checked]:bg-success data-[state=checked]:border-success",
                               canManageOrders 
                                 ? "hover:border-success/60 focus:ring-success/20 cursor-pointer" 
                                 : "opacity-50 cursor-not-allowed"
                             )}
                             aria-label={`Marcar como ${pedido.entregue ? 'não entregue' : 'entregue'}`}
                           />
                           <Badge 
                             variant={pedido.entregue ? "default" : "secondary"}
                             className={cn(
                               pedido.entregue 
                                 ? "bg-success text-success-foreground border-success" 
                                 : "bg-muted text-muted-foreground hover:bg-muted/80"
                             )}
                           >
                             {pedido.entregue ? "Entregue" : "Não Entregue"}
                           </Badge>
                         </div>
                       </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!pedido.archived && (
                              <DropdownMenuItem onClick={() => {
                                setEditingPedido(pedido);
                                setFormData({
                                  irmao: pedido.irmao,
                                  publicacao_id: pedido.publicacao_id,
                                  quantidade: pedido.quantidade.toString(),
                                  data_pedido: pedido.data_pedido
                                });
                                setShowNewPedidoForm(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {pedido.enviado && pedido.entregue && !pedido.archived && (
                              <DropdownMenuItem 
                                onClick={() => handleArchive(pedido)}
                                className="text-amber-600"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Arquivar
                              </DropdownMenuItem>
                            )}
                            {pedido.archived && (
                              <DropdownMenuItem 
                                onClick={() => handleArchive(pedido)}
                                className="text-primary"
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Desarquivar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setConfirmDialog({open: true, type: "excluir", pedido})}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
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

      {/* New/Edit Pedido Dialog */}
      {canManageOrders && (
        <Dialog open={showNewPedidoForm} onOpenChange={(open) => {
          setShowNewPedidoForm(open);
          if (!open) {
            setEditingPedido(null);
            setFormData({ irmao: "", publicacao_id: "", quantidade: "", data_pedido: new Date().toISOString().split('T')[0] });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPedido ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
              <DialogDescription>
                {editingPedido ? "Altere os dados do pedido." : "Preencha os dados do novo pedido."}
              </DialogDescription>
            </DialogHeader>
          <div className="p-3 bg-muted/30 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>👤 Usuário responsável pelo pedido:</span>
            </div>
            <UserActivityIndicator size="sm" />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="irmao">Irmão *</Label>
              <Input
                id="irmao"
                value={formData.irmao}
                onChange={(e) => setFormData(prev => ({ ...prev, irmao: e.target.value }))}
                placeholder="Nome do irmão"
              />
            </div>
            <div>
              <Label>Publicação *</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11"
                  >
                    {selectedPub
                      ? `[${selectedPub.code}] ${selectedPub.name}`
                      : "Buscar publicação..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Digite código ou nome da publicação..."
                      value={pubSearchTerm}
                      onValueChange={setPubSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhuma publicação encontrada.</CommandEmpty>
                      <CommandGroup>
                        {filteredPublications.map((pub) => (
                          <CommandItem
                            key={pub.id}
                            value={`${pub.code} ${pub.name}`}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, publicacao_id: pub.id }));
                              setOpen(false);
                              setPubSearchTerm("");
                            }}
                            className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.publicacao_id === pub.id ? "opacity-100" : "opacity-0"
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
                                  <div className="flex items-center gap-2 mb-1">
                                    <CodeBadge code={pub.code} />
                                    <span className="font-medium">{pub.name}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{pub.category}</p>
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
              {selectedPub && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Estoque atual:</span>
                  <StockBadge stock={selectedPub.current_stock} />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                placeholder="Digite a quantidade"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="data_pedido">Data do Pedido</Label>
              <Input
                id="data_pedido"
                type="date"
                value={formData.data_pedido}
                onChange={(e) => setFormData(prev => ({ ...prev, data_pedido: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPedidoForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePedido}>
              {editingPedido ? "Atualizar" : "Criar"} Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({open: false, type: "", pedido: null})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({open: false, type: "", pedido: null})}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirmDialog.pedido) {
                  handleExcluir(confirmDialog.pedido);
                }
                setConfirmDialog({open: false, type: "", pedido: null});
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosSimple;