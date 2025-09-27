import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  icon?: React.ReactNode;
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState = ({ 
  icon, 
  message = "Carregando...", 
  className = "",
  size = "md" 
}: LoadingStateProps) => {
  const sizeConfig = {
    sm: { icon: "h-6 w-6", text: "text-sm", container: "min-h-[200px]" },
    md: { icon: "h-8 w-8", text: "text-lg", container: "min-h-[400px]" },
    lg: { icon: "h-12 w-12", text: "text-xl", container: "min-h-[600px]" }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center justify-center", config.container, className)}>
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          {icon || <Loader2 className={cn(config.icon, "animate-spin text-primary")} />}
        </div>
        <p className={cn(config.text, "text-muted-foreground")}>{message}</p>
      </div>
    </div>
  );
};