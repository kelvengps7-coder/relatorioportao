import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 mobile-optimized",
  {
    variants: {
      variant: {
        default:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm",
        secondary:
          "border-muted bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        success:
          "border-success bg-success text-success-foreground hover:bg-success/90 shadow-sm",
        warning:
          "border-warning bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
        outline: "text-[hsl(var(--brand-text))] border-border hover:bg-muted shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
