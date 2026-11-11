import { apiFetch } from "./api";
import type { Modulo } from "@/context/ModuleContext";

export type Formato = "numero" | "moneda" | "libras" | "metros";

export type Kpi = {
  id: string;
  label: string;
  value: number;
  formato: Formato;
  descripcion: string;
  variacionPct: number | null;
  tendencia: number[];
  icono?: "movimientos" | "stock" | "solicitudes" | "inventario" | "cosecha" | "despacho" | "lote";
};

export type Grafica = {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas";
  series: { key: string; label: string }[];
  datos: ({ etiqueta: string } & Record<string, number | string>)[];
};

export type ResumenItem = {
  id: string;
  label: string;
  value: number;
  total: number | null;
  formato: Formato;
};

export type Alerta = {
  id: string;
  nivel: "info" | "warning" | "danger";
  titulo: string;
  descripcion: string;
  cantidad: number;
  ruta: string;
};

export type DashboardResponse = {
  modulo: Modulo;
  generadoEn: string;
  kpis: Kpi[];
  graficas: Grafica[];
  resumenDia: ResumenItem[];
  alertas: Alerta[];
};

export async function fetchDashboard(modulo: Modulo, dias = 7): Promise<DashboardResponse> {
  const res = await apiFetch(`/api/dashboard?modulo=${modulo}&dias=${dias}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Error HTTP ${res.status}`);
  }
  return res.json();
}
