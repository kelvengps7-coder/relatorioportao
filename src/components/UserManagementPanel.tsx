import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Trash2, Users, Shield, Key, Eye, Package, UserX, CheckCircle } from 'lucide-react';

// Tipos de permissão expandidos
export type UserRole = 'admin' | 'servo de balcao' | 'visualizador';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}

// Configuração de permissões
export const ROLE_CONFIG = {
  admin: {
    label: 'Administrador',
    description: 'Acesso total ao sistema, incluindo gestão de usuários',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: Shield,
    permissions: ['create', 'read', 'update', 'delete', 'admin']
  },
  'servo de balcao': {
    label: 'Servo de Balcão',
    description: 'Pode gerenciar estoque e movimentações',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Package,
    permissions: ['create', 'read', 'update']
  },
  visualizador: {
    label: 'Visualizador',
    description: 'Acesso somente leitura a relatórios e consultas',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: Eye,
    permissions: ['read']
  }
} as const;

export default function UserManagementPanel() {
  const { isAdmin } = useAuth();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'visualizador',
    is_active: true
  });

  const [newPassword, setNewPassword] = useState('');

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Usar dados diretos do banco
      const mappedData = (data || []).map(profile => ({
        ...profile,
        role: profile.role,
        is_active: profile.is_active !== undefined ? profile.is_active : true,
        email: profile.email || `${profile.username}@congregacao.local`
      })) as Profile[];
      
      setProfiles(mappedData);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const resetForm = () => {
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'visualizador',
      is_active: true
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEditUser = async () => {
    if (!selectedProfile || !formData.full_name.trim() || 
        !formData.username.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido",
        variant: "destructive",
      });
      return;
    }

    // Verificar duplicatas (excluindo o usuário atual)
    const existingUser = profiles.find(p => 
      p.id !== selectedProfile.id && (
        p.username.toLowerCase() === formData.username.toLowerCase() ||
        p.email?.toLowerCase() === formData.email.toLowerCase()
      )
    );

    if (existingUser) {
      toast({
        title: "Dados já existem",
        description: "Nome de usuário ou email já está em uso por outro usuário",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const oldData = { ...selectedProfile };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active
        })
        .eq('id', selectedProfile.id);

      if (profileError) throw profileError;

      const newData = {
        ...selectedProfile,
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };

      showSuccessMessage('update', 'Usuário');
      await logAction('update', 'profiles', selectedProfile.id, oldData, newData);
      
      setEditDialogOpen(false);
      setSelectedProfile(null);
      resetForm();
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error updating user:', error);
      showErrorMessage('atualizar', 'usuário', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedProfile || !newPassword.trim() || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Usar edge function para alterar senha (mais seguro)
      const { error } = await supabase.functions.invoke('change-password', {
        body: {
          user_id: selectedProfile.user_id,
          new_password: newPassword
        }
      });

      if (error) throw error;

      showSuccessMessage('update', 'Senha do usuário');
      await logAction('update', 'auth', selectedProfile.user_id, null, {
        action: 'password_changed',
        target_user: selectedProfile.username
      });
      
      setPasswordDialogOpen(false);
      setSelectedProfile(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      showErrorMessage('alterar', 'senha', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (profile.role === 'admin') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível excluir usuários administradores",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${profile.full_name}?`)) {
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);
      
      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (authError) throw authError;

      showSuccessMessage('delete', 'Usuário');
      await logAction('delete', 'profiles', profile.id, profile, null);
      
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showErrorMessage('excluir', 'usuário', error.message);
    }
  };

  const handleToggleStatus = async (profile: Profile) => {
    try {
      // Como não temos is_active na tabela ainda, vamos simular localmente
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Ativação/desativação será implementada com atualização do banco",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      showErrorMessage('alterar', 'status do usuário', error.message);
    }
  };

  const openEditDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormData({
      full_name: profile.full_name,
      username: profile.username,
      email: profile.email || `${profile.username}@congregacao.local`,
      password: '',
      role: profile.role,
      is_active: profile.is_active
    });
    setEditDialogOpen(true);
  };

  const openPasswordDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <Eye className="h-3 w-3 mr-1 text-foreground" />
          {role || 'Desconhecido'}
        </Badge>
      );
    }
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            Acesso Restrito
          </h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Administração de Usuários
          </h2>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e monitore atividades do sistema
          </p>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.full_name}</div>
                        <div className="text-sm text-muted-foreground">@{profile.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{profile.email}</div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(profile.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {profile.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <UserX className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPasswordDialog(profile)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(profile)}
                          className={profile.is_active ? "text-orange-600" : "text-green-600"}
                        >
                          {profile.is_active ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        {profile.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(profile)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && profiles.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Nenhum usuário cadastrado no sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique os dados do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome completo do usuário"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-username">Nome de Usuário *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Nome de usuário único"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Nível de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">{config.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="edit-active">Usuário ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditUser}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário "{selectedProfile?.full_name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova Senha *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPasswordDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}