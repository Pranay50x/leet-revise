import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "sm" | "default" | "lg" | "icon";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "border border-cyan-400/50 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/20",
  outline:
    "border border-zinc-700 bg-zinc-900/70 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800",
  ghost: "border border-transparent bg-transparent text-zinc-200 hover:bg-zinc-800/70",
  danger:
    "border border-rose-500/50 bg-rose-500/10 text-rose-200 hover:border-rose-300 hover:bg-rose-500/20",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  default: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
