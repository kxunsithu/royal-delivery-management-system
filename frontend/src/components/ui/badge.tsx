import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary/15 text-primary border border-primary/30",
        secondary:   "bg-muted text-secondary border border-border",
        destructive: "bg-destructive/15 text-destructive border border-destructive/30",
        success:     "bg-success/15 text-success border border-success/30",
        warning:     "bg-warning/15 text-warning border border-warning/30",
        outline:     "border border-border text-secondary",
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
