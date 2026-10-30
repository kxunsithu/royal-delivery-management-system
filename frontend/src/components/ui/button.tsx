import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm",
        destructive: "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white",
        outline:     "border border-border bg-transparent text-foreground hover:bg-muted hover:border-border",
        secondary:   "bg-muted text-secondary hover:bg-muted/80 hover:text-foreground",
        ghost:       "text-secondary hover:bg-muted hover:text-foreground",
        link:        "text-primary underline-offset-4 hover:underline p-0 h-auto",
        success:     "bg-success/15 text-success border border-success/30 hover:bg-success hover:text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-10 px-6",
        icon:    "h-9 w-9",
        "icon-sm": "h-7 w-7",
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded animate-spin" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
