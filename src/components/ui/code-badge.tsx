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

    // Forçando o uso do método de fallback (document.execCommand)
    // por ser mais compatível em todos os ambientes, incluindo HTTP.
    const textArea = document.createElement("textarea");
    textArea.value = code;

    // Estilos para tornar o textarea invisível e evitar "pulos" na tela.
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast({
          title: "Código copiado",
          description: `Código "${code}" copiado para a área de transferência.`,
        });
      } else {
        // Lança um erro se o comando não for bem-sucedido
        throw new Error('A cópia falhou');
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2 py-1 text-xs font-mono font-semibold rounded-full group cursor-pointer transition-colors",
        "bg-secondary/90 text-secondary-foreground border-2 border-secondary hover:bg-secondary/100 hover:shadow-md",
        className
      )}
      onClick={handleCopyCode} // Usando onClick como padrão
      title="Clique para copiar o código"
    >
      <span className="mr-1">{code}</span>
      <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
    </span>
  );
};
