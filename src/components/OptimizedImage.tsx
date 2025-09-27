import { useState } from "react";
import { cn } from "@/lib/utils";
import { Image } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  fallback,
  objectFit = "cover"
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  if (error || !src) {
    return (
      <div className={cn(
        "bg-muted/30 border border-border rounded-lg flex items-center justify-center",
        className
      )}>
        {fallback || (
          <div className="text-center p-2">
            <Image className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1" />
            <span className="text-xs text-muted-foreground/80">
              Imagem não disponível
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 bg-muted/30 skeleton rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-lg transition-opacity duration-300",
          objectFit === "contain" && "object-contain",
          objectFit === "cover" && "object-cover",
          objectFit === "fill" && "object-fill",
          objectFit === "none" && "object-none",
          objectFit === "scale-down" && "object-scale-down",
          loading ? "opacity-0" : "opacity-100",
          className
        )}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};