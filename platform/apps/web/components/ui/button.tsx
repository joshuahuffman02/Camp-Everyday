import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white",
  {
    variants: {
      variant: {
        default: "bg-action-primary text-action-primary-foreground hover:bg-action-primary-hover focus-visible:ring-action-primary/50",
        secondary: "bg-action-secondary text-action-secondary-foreground hover:bg-action-secondary-hover focus-visible:ring-action-secondary/50",
        ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-950/20",
        outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-950/20",
        destructive: "bg-status-error text-status-error-foreground hover:bg-red-700 focus-visible:ring-status-error/50"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
