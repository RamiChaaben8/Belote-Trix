import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white hover:bg-emerald-500",
        secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600",
        outline: "border border-slate-600 text-slate-100 hover:bg-slate-800",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        ghost: "hover:bg-slate-800 text-slate-200",
      },
      size: { default: "", sm: "px-3 py-1 text-xs", lg: "px-6 py-3 text-base" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
