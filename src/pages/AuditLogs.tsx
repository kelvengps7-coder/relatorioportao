
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CalendarIcon, Download, Filter, Search, Shield, User, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  user_details: {
    full_name?: string;
    username?: string;
  };
  created_at: string;
}

const ROWS_PER_PAGE = 15;

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [actions, setActions] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalLogs / ROWS_PER_PAGE);

  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const loadFilterOptions = async () => {
    try {
      const [
        { data: actionsData, error: actionsError },
        { data: tablesData, error: tablesError },
        { data: usersData, error: usersError }
      ] = await Promise.all([
        supabase.rpc('get_distinct_actions'),
        supabase.rpc('get_distinct_table_names'),
        supabase.rpc('get_distinct_audit_users')
      ]);

      if (actionsError) throw actionsError;
      if (tablesError) throw tablesError;
      if (usersError) throw usersError;

      setActions(actionsData.map((a: any) => a.action).filter(Boolean));
      setTables(tablesData.map((t: any) => t.table_name).filter(Boolean));
      setUsers(usersData.map((u: any) => u.username).filter(Boolean));
      
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as opções de filtros.", variant: "destructive" });
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Filters
      if (searchTerm) {
        query = query.or(`user_details->>full_name.ilike.%${searchTerm}%,user_details->>username.ilike.%${searchTerm}%,record_id.ilike.%${searchTerm}%`);
      }
      if (actionFilter !== "all") {
        query = query.eq('action', actionFilter);
      }
      if (tableFilter !== "all") {
        query = query.eq('table_name', tableFilter);
      }
      if (userFilter !== "all") {
        query = query.eq('user_details->>username', userFilter);
      }
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      // Pagination
      const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
      const endIndex = startIndex + ROWS_PER_PAGE - 1;
      query = query.range(startIndex, endIndex);

      // Order
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      
      setLogs(data || []);
      setTotalLogs(count || 0);

    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({ title: "Erro", description: "Erro ao carregar logs de auditoria.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        loadAuditLogs();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, actionFilter, tableFilter, userFilter, dateRange]);

  const handleExportCSV = async () => {
    toast({ title: "Exportando...", description: "Gerando arquivo CSV. Isso pode levar um momento." });
    
    try {
      // Re-run query without pagination for export
      let query = supabase
        .from('audit_logs')
        .select('created_at,user_details,action,table_name,record_id,old_data,new_data', { count: 'exact' });

      // Apply same filters
      if (searchTerm) query = query.or(`user_details->>full_name.ilike.%${searchTerm}%,user_details->>username.ilike.%${searchTerm}%,record_id.ilike.%${searchTerm}%`);
      if (actionFilter !== "all") query = query.eq('action', actionFilter);
      if (tableFilter !== "all") query = query.eq('table_name', tableFilter);
      if (userFilter !== "all") query = query.eq('user_details->>username', userFilter);
      if (dateRange?.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange?.to) query = query.lte('created_at', dateRange.to.toISOString());
      
      query = query.order('created_at', { ascending: false }).limit(5000); // Safety limit for export

      const { data: exportData, error, count } = await query;
      if (error) throw error;

      if(count && count > 5000) {
        toast({ title: "Atenção", description: "A exportação está limitada aos 5000 registros mais recentes devido ao volume de dados. Refine seus filtros para um resultado mais específico.", variant: "destructive", duration: 7000 });
      }

      const csvData = [
        ['Data/Hora', 'Usuário', 'Nome Completo', 'Ação', 'Tabela', 'ID do Registro', 'Dados Antigos', 'Dados Novos'],
        ...(exportData || []).map(log => [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.user_details?.username || 'N/A',
          log.user_details?.full_name || 'N/A',
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

      toast({ title: "Exportação concluída", description: `${exportData?.length || 0} logs de auditoria foram exportados com sucesso.` });
      logAction('export', 'audit_logs', 'csv_export', undefined, { exported_logs_count: exportData?.length, filters: { searchTerm, actionFilter, tableFilter, userFilter, dateRange } });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({ title: "Erro na Exportação", description: "Não foi possível exportar os dados. Tente refinar seus filtros.", variant: "destructive" });
    }
  };

  const getActionBadgeVariant = (action: string) => ({ create: 'default', update: 'secondary', delete: 'destructive', login: 'outline', logout: 'outline', movement: 'default', view: 'secondary', export: 'outline' }[action] || 'secondary') as any;
  const getActionLabel = (action: string) => ({ create: 'Criar', update: 'Atualizar', delete: 'Excluir', login: 'Login', logout: 'Logout', movement: 'Movimentação', view: 'Visualizar', export: 'Exportar' }[action] || action);
  const getTableLabel = (tableName: string) => ({ publications: 'Publicações', movements: 'Movimentações', profiles: 'Perfis', auth: 'Autenticação', dashboard: 'Dashboard', audit_logs: 'Logs de Auditoria' }[tableName] || tableName);

  const filteredStats = useMemo(() => ({
    total: totalLogs,
    uniqueUsers: users.length,
    today: logs.filter(log => new Date(log.created_at).toDateString() === new Date().toDateString()).length,
  }), [logs, totalLogs, users.length]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Shield className="h-8 w-8 text-foreground" />Logs de Auditoria</h1>
        <p className="text-muted-foreground">Histórico completo de ações realizadas no sistema.</p>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
            <div className="relative xl:col-span-2">
              <label className="text-sm font-medium">Buscar</label>
              <Search className="absolute left-3 top-[calc(50%+8px)] transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por usuário, nome, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="Todas as ações" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas as ações</SelectItem>{actions.map(a => <SelectItem key={a} value={a}>{getActionLabel(a)}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Tabela</label>
              <Select value={tableFilter} onValueChange={setTableFilter} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="Todas as tabelas" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas as tabelas</SelectItem>{tables.map(t => <SelectItem key={t} value={t}>{getTableLabel(t)}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={userFilter} onValueChange={setUserFilter} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="Todos os usuários" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos os usuários</SelectItem>{users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yyyy")) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR}/></PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end mt-4">
             <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2"><Download className="h-4 w-4" />Exportar CSV</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" /><p className="text-muted-foreground">Carregando logs...</p></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8"><Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhum log encontrado com os filtros aplicados.</p></div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold">{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{log.user_details?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">@{log.user_details?.username || 'n/a'}</p>
                      </TableCell>
                      <TableCell><Badge variant={getActionBadgeVariant(log.action)}>{getActionLabel(log.action)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{getTableLabel(log.table_name)}</Badge></TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {log.record_id && log.record_id !== 'csv_export' && !log.record_id.startsWith('auth') && (
                            <p className="text-xs text-muted-foreground truncate font-mono">ID: {log.record_id}</p>
                          )}
                          {log.new_data?.publication_name && (<p className="text-sm truncate">Publicação: {log.new_data.publication_name}</p>)}
                          {log.new_data?.quantity && (<p className="text-xs text-muted-foreground">Quantidade: {log.new_data.quantity}</p>)}
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

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1}/></PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</PaginationLink>
                </PaginationItem>
            )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} disabled={currentPage === totalPages}/></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

    </div>
  );
};

export default AuditLogs;
