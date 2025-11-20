// src/components/ui/IconCircle.tsx
import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

type IconCircleProps = {
  children: ReactNode;
  className?: string;
};

export function IconCircle({ children, className }: IconCircleProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-white/70 shadow-sm shadow-black/5",
        className
      )}
    >
      {children}
    </div>
  );
}
