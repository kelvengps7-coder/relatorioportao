import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedImage } from '@/components/OptimizedImage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const { signIn, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [systemLogoUrl, setSystemLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch system logo
  useEffect(() => {
    const fetchSystemLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('system_logo_url')
          .eq('role', 'admin')
          .not('system_logo_url', 'is', null)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar logo do sistema:', error);
          setSystemLogoUrl('/public/tower-logo.png'); // Fallback to default
        } else if (data && data.system_logo_url) {
          setSystemLogoUrl(data.system_logo_url);
        } else {
          setSystemLogoUrl('/public/tower-logo.png'); // Fallback to default if no custom logo
        }
      } catch (error) {
        console.error('Erro ao buscar logo do sistema:', error);
        setSystemLogoUrl('/public/tower-logo.png'); // Fallback to default on error
      } finally {
        setLogoLoading(false);
      }
    };

    fetchSystemLogo();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email/usuário ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Confirme seu email antes de fazer login';
        } else if (error.message.includes('Usuário não encontrado')) {
          errorMessage = 'Usuário não encontrado';
        }
        
        toast({
          title: "Erro no Login",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };


  if (loading || logoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with theme colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-background to-accent/30"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo and Title Section */}
          <div className="text-center mb-10">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-none">
                {systemLogoUrl && (
                  <OptimizedImage 
                    src={systemLogoUrl}
                    alt="Logo da Congregação" 
                    className="w-full h-full object-cover rounded-none"
                    objectFit="cover"
                  />
                )}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
              Sistema de Publicações
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Gerenciamento de publicações da congregação
            </p>
          </div>

          <Card className="border border-border/20 shadow-2xl bg-card/95 backdrop-blur-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl text-foreground font-semibold">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                <LogIn className="h-4 w-4 text-white" />
              </div>
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Digite suas credenciais para gerenciar as publicações
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-7">
              <div className="space-y-4">
                 <Label htmlFor="login-email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                   👤 Usuário
                 </Label>
                 <Input
                   id="login-email"
                   type="text"
                   value={loginEmail}
                   onChange={(e) => setLoginEmail(e.target.value)}
                   required
                   placeholder="Digite seu usuário"
                   className="h-12 border-2 border-border hover:border-ring focus:border-secondary bg-background/80 rounded-xl text-base transition-all duration-200 placeholder:text-muted-foreground/60"
                 />
              </div>
              
              <div className="space-y-4">
                 <Label htmlFor="login-password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                   🔒 Senha
                 </Label>
                 <Input
                   id="login-password"
                   type="password"
                   value={loginPassword}
                   onChange={(e) => setLoginPassword(e.target.value)}
                   required
                   placeholder="Digite sua senha"
                   className="h-12 border-2 border-border hover:border-ring focus:border-secondary bg-background/80 rounded-xl text-base transition-all duration-200 placeholder:text-muted-foreground/60"
                 />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-secondary via-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl text-base btn-hover" 
                disabled={loginLoading}
              >
                {loginLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {loginLoading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
              
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  Sistema desenvolvido para gerenciamento de publicações
                </p>
              </div>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}