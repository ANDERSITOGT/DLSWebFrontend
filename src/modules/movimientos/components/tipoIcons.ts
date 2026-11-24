import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CornerDownLeft,
  RefreshCw,
  type LucideIcon,
} from "lucide-react"
import type { MovimientoTipo } from "../types"

/** Ícono lucide por tipo de movimiento (para tarjetas y detalle). */
export const TIPO_ICONS: Record<MovimientoTipo, LucideIcon> = {
  INGRESO: ArrowDownLeft,
  SALIDA: ArrowUpRight,
  TRANSFERENCIA: ArrowRightLeft,
  AJUSTE: RefreshCw,
  DEVOLUCION: CornerDownLeft,
}
