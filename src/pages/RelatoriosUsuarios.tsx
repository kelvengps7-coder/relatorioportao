import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, TrendingDown, Package, ShoppingCart, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserActivity {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  total_movements: number;
  total_orders: number;
  entries: number;
  exits: number;
  last_activity: string;
}

interface MonthlyStats {
  month: string;
  year: number;
  movements: number;
  orders: number;
  entries: number;
  exits: number;
}

interface ActivityDetail {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  record_id: string;
  new_data?: any;
  publication?: {
    code: string;
    name: string;
    category: string;
  };
}

const RelatoriosUsuarios = () => {
  const { canAccessReports } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [activityDetails, setActivityDetails] = useState<ActivityDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (canAccessReports) {
      fetchUserActivities();
    }
  }, [selectedMonth, selectedYear, canAccessReports]);

  useEffect(() => {
    if (selectedUser) {
      fetchActivityDetails();
    }
  }, [selectedUser, selectedMonth, selectedYear]);

  const fetchUserActivities = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      // Buscar estatísticas dos usuários - apenas movimentações, pedidos e logins
      const { data: auditData, error } = await supabase
        .from('audit_logs')
        .select('user_id, user_details, action, table_name, created_at, new_data')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('action', ['create', 'movement', 'login'])
        .in('table_name', ['stock_movements', 'pedidos', 'auth'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuário
      const userStats = new Map<string, UserActivity>();

      auditData?.forEach((log) => {
        const userDetails = log.user_details as any;
        if (!userDetails) return;

        const userId = log.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            full_name: userDetails.full_name || 'N/A',
            username: userDetails.username || 'N/A',
            email: userDetails.email || 'N/A',
            role: userDetails.role || 'user',
            total_movements: 0,
            total_orders: 0,
            entries: 0,
            exits: 0,
            last_activity: log.created_at
          });
        }

        const stats = userStats.get(userId)!;
        
        if (log.table_name === 'stock_movements') {
          stats.total_movements++;
          const type = (log as any).new_data?.type;
          if (type === 'entrada') {
            stats.entries++;
          } else if (type === 'saida') {
            stats.exits++;
          }
        } else if (log.table_name === 'pedidos') {
          stats.total_orders++;
        }

        // Atualizar última atividade se for mais recente
        if (new Date(log.created_at) > new Date(stats.last_activity)) {
          stats.last_activity = log.created_at;
        }
      });

      setUserActivities(Array.from(userStats.values()));
    } catch (error) {
      console.error('Erro ao buscar atividades dos usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityDetails = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, record_id, new_data')
        .eq('user_id', selectedUser)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('action', ['create', 'movement', 'login'])
        .in('table_name', ['stock_movements', 'pedidos', 'auth'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar detalhes das publicações para movimentações e pedidos
      const detailsWithPublications = await Promise.all((data || []).map(async (detail) => {
        if (detail.table_name === 'stock_movements' || detail.table_name === 'pedidos') {
          let publicationId = null;
          
          if (detail.table_name === 'stock_movements' && detail.new_data && typeof detail.new_data === 'object' && (detail.new_data as any).publication_id) {
            publicationId = (detail.new_data as any).publication_id;
          } else if (detail.table_name === 'pedidos' && detail.new_data && typeof detail.new_data === 'object' && (detail.new_data as any).publicacao_id) {
            publicationId = (detail.new_data as any).publicacao_id;
          }

          if (publicationId) {
            const { data: publication } = await supabase
              .from('publications')
              .select('code, name, category')
              .eq('id', publicationId)
              .single();
            
            return { ...detail, publication };
          }
        }
        return detail;
      }));

      setActivityDetails(detailsWithPublications);
    } catch (error) {
      console.error('Erro ao buscar detalhes da atividade:', error);
    }
  };

  const getActionBadge = (action: string, tableName: string, newData?: any) => {
    if (tableName === 'stock_movements') {
      const type = newData?.type;
      if (type === 'entrada') {
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Entrada</Badge>;
      } else if (type === 'saida') {
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Saída</Badge>;
      }
      return <Badge variant="outline">Movimentação</Badge>;
    }
    
    if (tableName === 'pedidos') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pedido</Badge>;
    }
    
    if (tableName === 'auth' && action === 'login') {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Login</Badge>;
    }

    const config = {
      create: { variant: "default" as const, text: "Criação" },
      update: { variant: "secondary" as const, text: "Atualização" },
      delete: { variant: "destructive" as const, text: "Exclusão" },
      movement: { variant: "outline" as const, text: "Movimentação" }
    };

    const actionConfig = config[action as keyof typeof config] || { variant: "outline" as const, text: action };
    
    return (
      <Badge variant={actionConfig.variant} className="text-xs">
        {actionConfig.text}
      </Badge>
    );
  };

  const getMovementDescription = (activity: ActivityDetail) => {
    if (activity.table_name === 'stock_movements' && activity.new_data && activity.publication) {
      const quantity = activity.new_data.quantity;
      const type = activity.new_data.type;
      const code = activity.publication.code;
      const name = activity.publication.name;
      const category = activity.publication.category;
      
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {type === 'entrada' ? 'Entrada' : 'Saída'} de {quantity} [{code}] {name}
          </div>
          <div className="text-xs text-muted-foreground">{category}</div>
          {activity.new_data.motivo && (
            <div className="text-xs text-muted-foreground">Motivo: {activity.new_data.motivo}</div>
          )}
        </div>
      );
    }
    
    if (activity.table_name === 'pedidos' && activity.new_data && activity.publication) {
      const quantity = activity.new_data.quantidade;
      const code = activity.publication.code;
      const name = activity.publication.name;
      const category = activity.publication.category;
      const irmao = activity.new_data.irmao;
      
      return (
        <div className="space-y-1">
          <div className="font-medium">
            Pedido de {quantity} [{code}] {name}
          </div>
          <div className="text-xs text-muted-foreground">{category}</div>
          <div className="text-xs text-muted-foreground">Para: {irmao}</div>
        </div>
      );
    }
    
    if (activity.table_name === 'auth' && activity.action === 'login') {
      return (
        <div className="text-sm text-muted-foreground">
          Login realizado no sistema
        </div>
      );
    }
    
    return <div className="text-xs text-muted-foreground">Sem detalhes disponíveis</div>;
  };

  if (!canAccessReports) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">Apenas administradores e servos de balcão podem acessar os relatórios de usuários.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-8 border border-primary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[hsl(var(--brand-text))]">
                  Relatórios por Usuário
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Análise detalhada das atividades dos usuários no sistema
              </p>
            </div>
            
            {/* Enhanced date selectors */}
            <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-40 bg-background border-2 border-border/50 hover:border-primary/50 transition-colors font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-2 border-border/50">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()} className="hover:bg-primary/10 hover:text-primary font-medium">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-28 bg-background border-2 border-border/50 hover:border-primary/50 transition-colors font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-2 border-border/50">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="hover:bg-primary/10 hover:text-primary font-medium">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Selection */}
      <Card className="overflow-hidden shadow-lg border-2 border-border/20">
        <CardHeader className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-primary/5 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Selecionar Usuário</CardTitle>
              <CardDescription className="mt-1">
                Escolha um usuário para ver análise detalhada de suas atividades
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full h-12 pl-10 bg-background border-2 border-border/60 hover:border-primary/50 focus:border-primary transition-all duration-200 font-medium text-base shadow-sm">
                  <SelectValue placeholder="🔍 Selecione um usuário para análise detalhada..." className="text-muted-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-background/98 backdrop-blur-sm border-2 border-border/50 shadow-xl z-[100]">
                  <div className="p-2 border-b border-border/30">
                    <p className="text-xs text-muted-foreground font-medium px-2 py-1">
                      {userActivities.length} usuários encontrados
                    </p>
                  </div>
                  {userActivities
                    .sort((a, b) => (b.total_movements + b.total_orders) - (a.total_movements + a.total_orders))
                    .map((user) => (
                      <SelectItem 
                        key={user.user_id} 
                        value={user.user_id}
                        className="p-3 hover:bg-primary/8 focus:bg-primary/12 cursor-pointer transition-colors border-b border-border/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Avatar className="h-8 w-8 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground text-sm">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : 'secondary'} 
                                className="text-xs px-2 py-0.5"
                              >
                                {user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {user.total_movements + user.total_orders} atividades
                              </div>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {!selectedUser && userActivities.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    Estatísticas rápidas: {userActivities.length} usuários ativos • {' '}
                    {userActivities.reduce((acc, user) => acc + user.total_movements, 0)} movimentações totais • {' '}
                    {userActivities.reduce((acc, user) => acc + user.total_orders, 0)} pedidos totais
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="mt-8 space-y-6">
              {/* Enhanced Stats Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-green-50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                    <CardTitle className="text-sm font-semibold text-green-800 dark:text-green-300">Movimentações</CardTitle>
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                      <Package className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {userActivities.find(u => u.user_id === selectedUser)?.total_movements || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      📦 Total no período selecionado
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                    <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300">Pedidos</CardTitle>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                      {userActivities.find(u => u.user_id === selectedUser)?.total_orders || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      🛒 Total no período selecionado
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
                    <CardTitle className="text-sm font-semibold text-purple-800 dark:text-purple-300">Última Atividade</CardTitle>
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {userActivities.find(u => u.user_id === selectedUser)?.last_activity && 
                        format(new Date(userActivities.find(u => u.user_id === selectedUser)!.last_activity), "dd/MM HH:mm", { locale: ptBR })
                      }
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      🕒 Data e hora da última ação
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card className="overflow-hidden shadow-lg border-2 border-border/20">
          <CardHeader className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Detalhes das Atividades</CardTitle>
                <CardDescription className="mt-1">
                  Histórico detalhado de movimentações, pedidos e logins do usuário selecionado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activityDetails.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-muted/30">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                      Nenhuma atividade encontrada
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Este usuário não possui atividades registradas no período selecionado
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/30 border-b border-border/30">
                      <TableHead className="font-semibold text-foreground py-4">📅 Data/Hora</TableHead>
                      <TableHead className="font-semibold text-foreground py-4">🏷️ Tipo</TableHead>
                      <TableHead className="font-semibold text-foreground py-4">📋 Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityDetails.map((activity, index) => (
                      <TableRow 
                        key={activity.id} 
                        className={`
                          hover:bg-primary/5 transition-colors border-b border-border/20 last:border-b-0
                          ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}
                        `}
                      >
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {format(new Date(activity.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded inline-block">
                              {format(new Date(activity.created_at), "HH:mm:ss", { locale: ptBR })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-start">
                            {getActionBadge(activity.action, activity.table_name, activity.new_data)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="max-w-md">
                            {getMovementDescription(activity)}
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
      )}
    </div>
  );
};

export default RelatoriosUsuarios;