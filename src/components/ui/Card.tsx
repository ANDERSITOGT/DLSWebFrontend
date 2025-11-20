// src/components/ui/Card.tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-slate-200",
        className
      )}
      {...props}
    />
  );
}

type CardSectionProps = {
  className?: string;
  children?: ReactNode;
};

export function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div className={cn("px-4 pt-4 pb-2", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: CardSectionProps) {
  return (
    <h3 className={cn("font-semibold text-slate-900", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: CardSectionProps) {
  return (
    <p className={cn("text-sm text-slate-500", className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: CardSectionProps) {
  return (
    <div className={cn("px-4 pb-4 pt-1", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div className={cn("px-4 pb-4 pt-2 border-t border-slate-100", className)}>
      {children}
    </div>
  );
}
