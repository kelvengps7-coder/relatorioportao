import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBadgeProps {
  code: string;
  className?: string;
}

export const CodeBadge = ({ code, className }: CodeBadgeProps) => {
  const { toast } = useToast();

  if (!code) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Código copiado",
        description: `Código "${code}" copiado para a área de transferência.`,
      });
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    });
  };

  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2 py-1 text-xs font-mono font-semibold rounded-full group cursor-pointer transition-colors",
        "bg-secondary/90 text-secondary-foreground border-2 border-secondary hover:bg-secondary/100 hover:shadow-md",
        className
      )}
      onClick={handleCopyCode}
      title="Clique para copiar o código"
    >
      <span className="mr-1">{code}</span>
      <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
    </span>
  );
};