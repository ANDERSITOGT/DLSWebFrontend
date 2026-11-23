import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type StepperStep = {
  /** Etiqueta corta visible en el paso. */
  label: string
  /** Etiqueta aún más corta para pantallas angostas (< sm). */
  shortLabel?: string
  /** Descripción opcional bajo la etiqueta. */
  description?: string
}

type StepperProps = {
  steps: StepperStep[]
  /** Índice (0-based) del paso activo. */
  current: number
  /** Permite volver a un paso anterior al hacer clic (solo pasos <= current). */
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Stepper horizontal custom (no hay primitivo Shadcn para esto).
 * Marca visualmente los pasos completados (< current), el activo y los pendientes.
 *
 * Extraído a components/ui para compartirse entre los wizards de
 * "Nueva solicitud" y "Nuevo ingreso".
 */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-center gap-1.5 sm:gap-3", className)}>
      {steps.map((step, index) => {
        const isDone = index < current
        const isActive = index === current
        const clickable = !!onStepClick && index < current

        return (
          <li key={step.label} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(index)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex min-w-0 items-center gap-1.5 text-left transition-colors sm:gap-3",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                  isDone && "border-emerald-600 bg-emerald-600 text-white",
                  isActive && "border-emerald-600 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100",
                  !isDone && !isActive && "border-slate-300 bg-white text-slate-400"
                )}
              >
                {isDone ? <Check size={15} strokeWidth={3} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-[11px] font-bold sm:text-sm",
                    isActive ? "text-slate-900" : isDone ? "text-emerald-700" : "text-slate-400"
                  )}
                >
                  {step.shortLabel ? (
                    <>
                      <span className="sm:hidden">{step.shortLabel}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </>
                  ) : (
                    step.label
                  )}
                </span>
                {step.description && (
                  <span className="hidden truncate text-[11px] text-slate-400 sm:block">
                    {step.description}
                  </span>
                )}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "hidden h-px min-w-4 flex-1 rounded-full transition-colors sm:block",
                  index < current ? "bg-emerald-500" : "bg-slate-200"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
