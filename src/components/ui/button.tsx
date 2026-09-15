import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-mono text-[13px] font-medium uppercase tracking-[0.08em]",
    "transition-all duration-200 ease-out-expo",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "active:translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        /* primary: a rust block with notched corners, not a generic pill */
        default:
          "bg-primary text-primary-foreground rounded-notch shadow-rust-glow hover:brightness-110 hover:-translate-y-0.5",
        outline:
          "border border-border bg-transparent text-foreground rounded-notch hover:border-primary hover:text-primary hover:-translate-y-0.5",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-md",
        solid:
          "bg-foreground text-background rounded-notch hover:bg-foreground/90 hover:-translate-y-0.5",
        link: "text-primary underline decoration-primary/40 decoration-2 underline-offset-4 hover:decoration-primary p-0 h-auto normal-case tracking-normal",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[12px]",
        lg: "h-13 px-7 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
