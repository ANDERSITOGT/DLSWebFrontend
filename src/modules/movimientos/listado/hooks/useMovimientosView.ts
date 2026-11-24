import { useCallback, useEffect, useState } from "react"

/** Modo de visualización del listado de movimientos. */
export type MovimientoViewMode = "cards" | "table"

const STORAGE_KEY = "dls_movimientos_view"
const DEFAULT_VIEW: MovimientoViewMode = "table"

function leerPreferencia(): MovimientoViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "cards" || stored === "table") return stored
  } catch {
    // localStorage no disponible (SSR / modo privado): usamos el default.
  }
  return DEFAULT_VIEW
}

/**
 * Preferencia de vista (tarjetas / tabla) persistida en `localStorage`.
 *
 * En pantallas < md el listado SIEMPRE se renderiza en tarjetas (lo decide
 * el componente de vista con clases responsivas), pero la preferencia se
 * conserva para cuando el usuario vuelva a un viewport de escritorio.
 */
export function useMovimientosView() {
  const [view, setView] = useState<MovimientoViewMode>(leerPreferencia)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view)
    } catch {
      // Ignoramos fallos de escritura (modo privado, cuota llena, etc.).
    }
  }, [view])

  const toggle = useCallback(() => {
    setView((prev) => (prev === "table" ? "cards" : "table"))
  }, [])

  return { view, setView, toggle }
}
