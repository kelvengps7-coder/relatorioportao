import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Package } from "lucide-react";

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export const StockBadge = ({ stock, className }: StockBadgeProps) => {
  const getStockStatus = (stockValue: number) => {
    if (stockValue === 0) {
      return {
        icon: XCircle,
        text: "0 uni",
        bgColor: "bg-destructive/90",
        textColor: "text-destructive-foreground",
        borderColor: "border-destructive",
        iconColor: "text-destructive-foreground"
      };
    } else if (stockValue === 1) {
      return {
        icon: AlertTriangle,
        text: "1 uni",
        bgColor: "bg-warning/90",
        textColor: "text-warning-foreground",
        borderColor: "border-warning",
        iconColor: "text-warning-foreground"
      };
    } else {
      return {
        icon: CheckCircle,
        text: `${stockValue} uni`,
        bgColor: "bg-success/90",
        textColor: "text-success-foreground",
        borderColor: "border-success",
        iconColor: "text-success-foreground"
      };
    }
  };

  const status = getStockStatus(stock);
  const Icon = status.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-medium text-xs",
        "transition-all duration-200 hover:shadow-sm border-2",
        "min-w-[100px] justify-center font-semibold",
        status.bgColor,
        status.textColor,
        status.borderColor,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status.iconColor)} />
      <span className="font-semibold">{status.text}</span>
    </div>
  );
};