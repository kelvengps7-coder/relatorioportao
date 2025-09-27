import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 mobile-optimized",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm border border-secondary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-destructive/20",
        outline:
          "border-2 border-border bg-background hover:bg-muted hover:text-accent-foreground shadow-sm",
        secondary:
          "bg-muted text-muted-foreground hover:bg-muted/80 border border-border shadow-sm",
        ghost: "hover:bg-accent hover:text-[hsl(var(--brand-text))]",
        link: "text-secondary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm border border-success/20",
        premium: "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 shadow-md border border-secondary/30",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[36px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "btn-hover")}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
