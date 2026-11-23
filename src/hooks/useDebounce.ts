import { useEffect, useState } from "react"

/**
 * Devuelve `value` retrasado `delay` ms. Útil para búsquedas en servidor:
 * el valor devuelto solo cambia cuando el usuario deja de escribir.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
