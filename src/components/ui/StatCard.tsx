// src/components/ui/StatCard.tsx
import type { ReactNode } from "react";

type StatVariant = "blue" | "orange" | "green" | "purple" | "yellow";

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  /** color del card */
  variant?: StatVariant;
  /** icono opcional (lucide-react, etc.) */
  icon?: ReactNode;
};

const variantClasses: Record<
  StatVariant,
  { wrapper: string; icon: string }
> = {
  blue: {
    wrapper: "bg-sky-50 border-sky-100",
    icon: "text-sky-600",
  },
  orange: {
    wrapper: "bg-amber-50 border-amber-100",
    icon: "text-amber-600",
  },
  green: {
    wrapper: "bg-emerald-50 border-emerald-100",
    icon: "text-emerald-600",
  },
  purple: {
    wrapper: "bg-violet-50 border-violet-100",
    icon: "text-violet-600",
  },
  yellow: {
    wrapper: "bg-yellow-50 border-yellow-100",
    icon: "text-yellow-600",
  },
};

export function StatCard({
  label,
  value,
  description,
  variant = "blue",
  icon,
}: StatCardProps) {
  const { wrapper, icon: iconColor } = variantClasses[variant];

  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${wrapper}`}
    >
      {/* Icono (si no mandas icon, se muestra un puntito por defecto) */}
      <div className={`h-10 w-10 rounded-full bg-white/80 flex items-center justify-center ${iconColor}`}>
        {icon ?? <span className="text-xs">●</span>}
      </div>

      {/* Texto */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500">{description}</span>
      </div>
    </div>
  );
}
