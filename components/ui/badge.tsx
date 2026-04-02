import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "easy" | "medium" | "hard";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  easy: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  hard: "border-rose-400/40 bg-rose-400/10 text-rose-200",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
