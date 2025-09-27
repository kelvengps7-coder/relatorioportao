import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, User, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InitialSetupInfo = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const adminCredentials = {
    email: 'admin@congregacao.local',
    username: 'admin',
    password: 'admin123'
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-primary">
          <User className="h-5 w-5" />
          Configuração Inicial
        </CardTitle>
        <CardDescription>
          Use as credenciais abaixo para fazer seu primeiro login como administrador
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-2 py-1 rounded">
                {adminCredentials.email}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(adminCredentials.email, 'Email')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Usuário:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-2 py-1 rounded">
                {adminCredentials.username}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(adminCredentials.username, 'Usuário')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Senha:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-2 py-1 rounded">
                {showPassword ? adminCredentials.password : '••••••••'}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(adminCredentials.password, 'Senha')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              Próximos passos
            </Badge>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Faça login com as credenciais acima</li>
            <li>• Acesse Admin → Usuários para gerenciar perfis</li>
            <li>• Altere a senha do admin por questões de segurança</li>
            <li>• Crie novos usuários conforme necessário</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InitialSetupInfo;