import { useState, useEffect } from "react";
import { Home, BarChart3, Package, ShoppingCart, FolderOpen, Menu, BookOpen, Users, LogOut, User, Shield, Settings, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoConfig } from "./LogoConfig";
import { OptimizedImage } from "./OptimizedImage";
import { supabase } from "@/integrations/supabase/client";

const AppHeader = () => {
  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoConfigOpen, setLogoConfigOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  // Buscar logo do admin no Supabase
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('system_logo_url')
          .eq('role', 'admin')
          .not('system_logo_url', 'is', null)
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar logo:', error);
          setCustomLogo(null);
          return;
        }
        
        if (data && data.system_logo_url) {
          console.log('Logo encontrado:', data.system_logo_url);
          setCustomLogo(data.system_logo_url);
        } else {
          console.log('Nenhum logo personalizado encontrado');
          setCustomLogo(null);
        }
      } catch (error) {
        console.error('Erro ao buscar logo:', error);
        setCustomLogo(null);
      }
    };

    fetchLogo();
  }, [logoConfigOpen]); // Atualizar quando o dialog de logo fechar

  const navigationItems = [
    { name: "Início", href: "/", icon: Home },
    { name: "Movimentação", href: "/movimentacao", icon: BarChart3 },
    { name: "Estoque", href: "/estoque", icon: Package },
    { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
    { name: "Gerenciar", href: "/gerenciar", icon: FolderOpen },
    ...(isAdmin ? [{ name: "Usuários", href: "/admin/usuarios", icon: Users }] : []),
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header className="wol-header sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 overflow-hidden border-2 border-border/20">
                  {customLogo ? (
                    <OptimizedImage 
                      src={customLogo} 
                      alt="Logo do sistema" 
                      className="w-full h-full object-cover"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="bg-[#8DB0D9] w-full h-full">
                      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" fill="#8DB0D9"/>
                        <path d="M12 8h24v8h-2v4h2v20H12V20h2v-4h-2V8zm4 4v4h4V12h-4zm8 0v4h4V12h-4zm8 0v4h4V12h-4zm-16 8v16h16V20H16z" fill="white"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--brand-text))]">CONGREGAÇÃO PORTÃO</h1>
                </div>
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActiveRoute(item.href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Menu */}
            <div className="flex items-center gap-2">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 overflow-hidden border-2 border-border/20">
                      {customLogo ? (
                        <OptimizedImage 
                          src={customLogo} 
                          alt="Logo do sistema" 
                          className="w-full h-full object-cover"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="bg-[#8DB0D9] w-full h-full">
                          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" fill="#8DB0D9"/>
                            <path d="M8 5h16v6h-1v2h1v14H8V13h1v-2H8V5zm3 3v2h3V8h-3zm5 0v2h3V8h-3zm5 0v2h3V8h-3zm-10 5v11h10V13H11z" fill="white"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[hsl(var(--brand-text))]">CONGREGAÇÃO PORTÃO</h2>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActiveRoute(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </NavLink>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              {/* User Profile */}
              {profile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-variant text-primary-foreground text-sm font-semibold">
                          <Settings className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 wol-card border-border/20 p-0">
                    <div className="flex items-center justify-center p-6 border-b border-border/20">
                      <div className="text-center">
                        <Badge variant="default" className="text-xs px-3 py-1.5 bg-gradient-to-r from-primary to-primary-variant text-primary-foreground border-0 shadow-md font-medium">
                          {profile.role === 'admin' && <Shield className="h-3 w-3 mr-1.5" />}
                          {profile.role === 'servo de balcao' && <Package className="h-3 w-3 mr-1.5" />}
                          {profile.role === 'visualizador' && <Eye className="h-3 w-3 mr-1.5" />}
                          {profile.role === 'admin' && 'Administrador'}
                          {profile.role === 'servo de balcao' && 'Servo de Balcão'}
                          {profile.role === 'visualizador' && 'Visualizador'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <DropdownMenuItem asChild className="hover:bg-foreground/5 rounded-lg">
                        <NavLink to="/relatorios-usuarios" className="flex items-center gap-3 px-3 py-3">
                          <BarChart3 className="h-5 w-5 text-foreground" />
                          <span className="font-medium">Relatórios por Usuário</span>
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setLogoConfigOpen(true)}
                        className="hover:bg-foreground/5 rounded-lg px-3 py-3"
                      >
                        <Settings className="h-5 w-5 text-foreground mr-3" />
                        <span className="font-medium">Configurar Logo</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/30 my-2" />
                      
                      <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive hover:bg-destructive/10 px-3 py-3 rounded-lg">
                        <LogOut className="h-5 w-5 mr-3" />
                        <span className="font-medium">Sair</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logo Configuration Dialog */}
      <LogoConfig 
        isOpen={logoConfigOpen} 
        onOpenChange={setLogoConfigOpen} 
      />
    </>
  );
};

export default AppHeader;