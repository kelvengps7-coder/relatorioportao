import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, Filter, Search, Shield, User, Database, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  user_details: any;
  created_at: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    const csvData = [
      ['Data/Hora', 'Usuário', 'Ação', 'Tabela', 'ID do Registro', 'Dados Antigos', 'Dados Novos'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        `${log.user_details?.full_name || 'N/A'} (${log.user_details?.username || 'N/A'})`,
        log.action,
        log.table_name,
        log.record_id || 'N/A',
        JSON.stringify(log.old_data || {}),
        JSON.stringify(log.new_data || {})
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "Logs de auditoria exportados com sucesso.",
    });

    // Log the export action
    try {
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'export',
        table_name: 'audit_logs',
        record_id: 'csv_export',
        new_data: {
          exported_logs_count: filteredLogs.length,
          export_timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging export action:', error);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': return 'outline';
      case 'logout': return 'outline';
      case 'movement': return 'default';
      case 'view': return 'secondary';
      case 'export': return 'outline';
      default: return 'secondary';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
      login: 'Login',
      logout: 'Logout',
      movement: 'Movimentação',
      view: 'Visualizar',
      export: 'Exportar'
    };
    return labels[action] || action;
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      publications: 'Publicações',
      movements: 'Movimentações',
      profiles: 'Perfis',
      auth: 'Autenticação',
      dashboard: 'Dashboard'
    };
    return labels[tableName] || tableName;
  };

  // Filtros
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_details?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    const matchesUser = userFilter === "all" || log.user_details?.username === userFilter;
    
    return matchesSearch && matchesAction && matchesTable && matchesUser;
  });

  const actions = Array.from(new Set(logs.map(log => log.action)));
  const tables = Array.from(new Set(logs.map(log => log.table_name)));
  const users = Array.from(new Set(logs.map(log => log.user_details?.username).filter(Boolean)));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
            <p className="text-lg text-muted-foreground">Carregando logs de auditoria...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-foreground" />
          Logs de Auditoria
        </h1>
        <p className="text-muted-foreground">Histórico completo de ações realizadas no sistema</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as tabelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {getTableLabel(table)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Usuários Únicos</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">
                  {logs.filter(log => 
                    new Date(log.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Filtrados</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-foreground" />
            Histórico de Ações
          </CardTitle>
          <CardDescription>
            Últimas {logs.length} ações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {logs.length === 0 ? "Nenhum log de auditoria encontrado." : "Nenhum log encontrado com os filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 100).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {log.user_details?.full_name || 'N/A'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTableLabel(log.table_name)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {log.new_data?.publication_name && (
                            <p className="text-sm truncate">
                              Publicação: {log.new_data.publication_name}
                            </p>
                          )}
                          {log.new_data?.quantity && (
                            <p className="text-xs text-muted-foreground">
                              Quantidade: {log.new_data.quantity}
                            </p>
                          )}
                          {log.record_id && log.record_id !== 'dashboard_access' && (
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {log.record_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLogs.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Mostrando os 100 primeiros resultados de {filteredLogs.length} logs encontrados.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;