// src/components/ui/StatCard.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatVariant = "blue" | "orange" | "green" | "purple" | "yellow";

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  /** color del card */
  variant?: StatVariant;
  /** icono opcional (lucide-react, etc.) */
  icon?: ReactNode;
  className?: string;
};

const variantClasses: Record<StatVariant, { icon: string }> = {
  blue: {
    icon: "text-cyan-700",
  },
  orange: {
    icon: "text-amber-700",
  },
  green: {
    icon: "text-teal-700",
  },
  purple: {
    icon: "text-indigo-700",
  },
  yellow: {
    icon: "text-amber-700",
  },
};

export function StatCard({
  label,
  value,
  description,
  variant = "blue",
  icon,
  className,
}: StatCardProps) {
  const { icon: iconColor } = variantClasses[variant];
  return (
    <Card className={cn("relative overflow-hidden rounded-xl hover:-translate-y-0.5", className)}>
      <CardContent className="flex items-center gap-3 p-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ${iconColor}`}>
          {icon ?? <span className="text-xs">●</span>}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          <span className="text-2xl font-semibold text-slate-900">{value}</span>
          <span className="text-xs text-slate-500">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
