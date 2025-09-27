import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Clock, Activity } from "lucide-react";

interface UserActivityIndicatorProps {
  showTimestamp?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export const UserActivityIndicator = ({ 
  showTimestamp = true, 
  size = 'md',
  className = '',
  variant = 'default'
}: UserActivityIndicatorProps) => {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  const sizeConfig = {
    sm: { 
      avatar: 'h-8 w-8', 
      text: 'text-sm', 
      badge: 'text-xs px-2 py-0.5',
      container: 'p-3'
    },
    md: { 
      avatar: 'h-10 w-10', 
      text: 'text-sm', 
      badge: 'text-xs px-2.5 py-0.5',
      container: 'p-4'
    },
    lg: { 
      avatar: 'h-12 w-12', 
      text: 'text-base', 
      badge: 'text-sm px-3 py-1',
      container: 'p-5'
    }
  };

  const config = sizeConfig[size];
  const isAdmin = profile.role === 'admin';

  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });

  if (variant === 'card') {
    return (
      <Card className={`${config.container} bg-gradient-to-br from-background via-background to-muted/20 border-border/50 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className={`${config.avatar} ring-2 ring-primary/20 shadow-lg`}>
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-foreground rounded-full flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-background" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`${config.text} font-semibold text-foreground truncate`}>
                {profile.full_name}
              </h4>
              <Badge 
                variant={isAdmin ? 'default' : 'secondary'} 
                className={`${config.badge} shrink-0`}
              >
                {isAdmin ? 'Admin' : 'Usuário'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-xs truncate">{user.email}</span>
              </div>
              {showTimestamp && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">{currentTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className={`${config.avatar} ring-1 ring-primary/20`}>
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex items-center gap-2">
          <span className={`${config.text} font-medium text-foreground`}>
            {profile.full_name}
          </span>
          <Badge 
            variant={isAdmin ? 'default' : 'outline'} 
            className={`${config.badge} border-0`}
          >
            {isAdmin ? 'Admin' : 'User'}
          </Badge>
          {showTimestamp && (
            <span className="text-xs text-muted-foreground">• {currentTime}</span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 ${className}`}>
      <div className="relative">
        <Avatar className={`${config.avatar} ring-2 ring-primary/10`}>
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${config.text} font-medium text-foreground`}>
            {profile.full_name}
          </span>
          <Badge 
            variant={isAdmin ? 'default' : 'secondary'} 
            className={`${config.badge} flex items-center gap-1`}
          >
            {isAdmin && <Shield className="h-3 w-3" />}
            {isAdmin ? 'Administrador' : 'Usuário'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 text-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="text-xs">{user.email}</span>
          </div>
          {showTimestamp && (
            <>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{currentDate} • {currentTime}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};