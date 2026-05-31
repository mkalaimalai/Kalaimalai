import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-target",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,122,102,0.35)] hover:opacity-90",
        outline:
          "border-2 border-border bg-background text-brand shadow-sm hover:bg-muted",
        ghost: "text-brand hover:bg-muted",
      },
      size: {
        md: "px-5 py-2 text-base",
        lg: "px-6 py-3 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
