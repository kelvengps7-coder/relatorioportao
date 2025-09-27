import { OptimizedImage } from "./OptimizedImage";
import { Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicationCoverProps {
  imageUrl?: string;
  title: string;
  className?: string;
  onClick?: () => void;
}

export const PublicationCover = ({ imageUrl, title, className = "", onClick }: PublicationCoverProps) => {
  const fallback = (
    <div className="text-center p-2">
      <Image className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1" />
      <span className="text-xs text-muted-foreground/80 leading-none">
        Sem capa
      </span>
    </div>
  );

  if (!imageUrl) {
    return (
      <div className={cn("bg-muted/30 border border-border flex items-center justify-center aspect-[3/4]", className)}>
        {fallback}
      </div>
    );
  }

  return (
    <div 
      className={onClick ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <OptimizedImage
        src={imageUrl}
        alt={`Capa: ${title}`}
        className={cn("aspect-[3/4] bg-white border border-border", className)}
        fallback={fallback}
        objectFit="contain"
      />
    </div>
  );
};