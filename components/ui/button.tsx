import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
    const variants =
      variant === "outline"
        ? "border bg-transparent hover:bg-gray-50"
        : "bg-black text-white hover:bg-black/90";
    const sizes = size === "sm" ? "h-8 px-3 text-sm" : "h-9 px-4 text-sm";
    return (
      <button ref={ref} className={cn(base, variants, sizes, className)} {...props} />
    );
  }
);
Button.displayName = "Button";
