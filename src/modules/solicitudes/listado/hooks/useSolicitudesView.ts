import { useCallback, useEffect, useState } from "react"

/** Modo de visualización del listado de solicitudes. */
export type SolicitudViewMode = "cards" | "table"

const STORAGE_KEY = "dls_solicitudes_view"
const DEFAULT_VIEW: SolicitudViewMode = "table"

function leerPreferencia(): SolicitudViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "cards" || stored === "table") return stored
  } catch {
    // localStorage no disponible (SSR / modo privado): usamos el default.
  }
  return DEFAULT_VIEW
}

/**
 * Preferencia de vista (tarjetas / tabla) persistida en `localStorage`, mismo
 * patrón que el módulo Movimientos.
 */
export function useSolicitudesView() {
  const [view, setView] = useState<SolicitudViewMode>(leerPreferencia)

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
