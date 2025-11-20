// src/components/ui/Badge.tsx
import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

type BadgeVariant = "success" | "danger" | "warning" | "outline";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const baseClasses =
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-medium";

const variantClasses: Record<BadgeVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger:
    "bg-rose-50 text-rose-700 border-rose-200",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200",
  outline:
    "bg-white text-slate-600 border-slate-200",
};

export function Badge({
  children,
  variant = "outline",
  className,
}: BadgeProps) {
  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}
