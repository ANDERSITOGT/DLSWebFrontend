// src/components/ui/SectionTitle.tsx
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode; // para links tipo "Ver todas"
  className?: string;
};

export function SectionTitle({
  title,
  subtitle,
  rightSlot,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightSlot && <div className="text-xs">{rightSlot}</div>}
    </div>
  );
}
