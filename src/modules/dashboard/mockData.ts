import type { DashboardResponse } from "@/services/dashboardService";
import type { Modulo } from "@/context/ModuleContext";

const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function serie(dias: number, base: number, amp: number) {
  return Array.from({ length: dias }, (_, i) => Math.round(base + Math.abs(Math.sin(i * 1.7 + base)) * amp));
}

// Datos de desarrollo (VITE_DASHBOARD_MOCK=true) con la forma de docs/BACKEND_DASHBOARD.md
export function mockDashboard(modulo: Modulo, dias: number): DashboardResponse {
  const etiquetas = Array.from({ length: dias }, (_, i) => `${DIAS[i % 7]} ${i + 1}`);
  const a = serie(dias, 40, 50);
  const b = serie(dias, 20, 40);
  const base = { modulo, generadoEn: new Date().toISOString() };

  if (modulo === "COSECHAS") {
    return {
      ...base,
      kpis: [
        { id: "libras", label: "Libras cosechadas", value: 48200, formato: "libras", descripcion: "Libras de campo", variacionPct: 8.2, tendencia: a, icono: "cosecha" },
        { id: "rechazo", label: "Rechazo", value: 3100, formato: "libras", descripcion: "Libras rechazadas", variacionPct: -2.1, tendencia: b, icono: "stock" },
        { id: "vendidas", label: "Despachos", value: 41500, formato: "libras", descripcion: "Libras vendidas", variacionPct: 5.4, tendencia: a, icono: "despacho" },
        { id: "rend", label: "Rendimiento", value: 12.4, formato: "metros", descripcion: "Libras por metro lineal", variacionPct: 1.3, tendencia: b, icono: "lote" },
      ],
      graficas: [
        { id: "periodo", titulo: "Cosechas por periodo", tipo: "lineas", series: [{ key: "campo", label: "Campo" }, { key: "vendidas", label: "Vendidas" }], datos: etiquetas.map((etiqueta, i) => ({ etiqueta, campo: a[i], vendidas: b[i] })) },
        { id: "lote", titulo: "Cosechas por lote", tipo: "barras", series: [{ key: "libras", label: "Libras" }], datos: ["L1", "L2", "L3", "L4", "L5"].map((etiqueta, i) => ({ etiqueta, libras: a[i] * 10 })) },
      ],
      resumenDia: [
        { id: "campo", label: "Campo", value: 2400, total: 3000, formato: "libras" },
        { id: "rechazo", label: "Rechazo", value: 180, total: 3000, formato: "libras" },
        { id: "vendidas", label: "Vendidas", value: 2100, total: 3000, formato: "libras" },
      ],
      alertas: [
        { id: "sin-cosecha", nivel: "warning", titulo: "2 lotes sin cosecha", descripcion: "Sin registros en 7 días.", cantidad: 2, ruta: "/cosechas/registro" },
        { id: "sin-boleta", nivel: "danger", titulo: "1 cosecha sin boleta", descripcion: "Falta número de boleta.", cantidad: 1, ruta: "/cosechas/registro" },
      ],
    };
  }

  return {
    ...base,
    kpis: [
      { id: "mov", label: "Movimientos hoy", value: 12, formato: "numero", descripcion: "Registros de entradas y salidas", variacionPct: 12, tendencia: a, icono: "movimientos" },
      { id: "stock", label: "Stock bajo", value: 8, formato: "numero", descripcion: "Productos por debajo del mínimo", variacionPct: -4, tendencia: b, icono: "stock" },
      { id: "sol", label: "Solicitudes", value: 3, formato: "numero", descripcion: "Solicitudes activas", variacionPct: 0, tendencia: a, icono: "solicitudes" },
      { id: "valor", label: "Valor Inv.", value: 150420, formato: "moneda", descripcion: "Valor estimado del inventario", variacionPct: 2.5, tendencia: b, icono: "inventario" },
    ],
    graficas: [
      { id: "ev", titulo: "Entradas vs Salidas de Insumos", tipo: "barras", series: [{ key: "entradas", label: "Entradas" }, { key: "salidas", label: "Salidas" }], datos: etiquetas.map((etiqueta, i) => ({ etiqueta, entradas: a[i], salidas: b[i] })) },
      { id: "tend", titulo: "Movimientos por día", tipo: "lineas", series: [{ key: "total", label: "Movimientos" }], datos: etiquetas.map((etiqueta, i) => ({ etiqueta, total: a[i] + b[i] })) },
    ],
    resumenDia: [
      { id: "ing", label: "Ingresos", value: 7, total: 12, formato: "numero" },
      { id: "sal", label: "Salidas", value: 5, total: 12, formato: "numero" },
      { id: "apr", label: "Aprobadas", value: 2, total: 3, formato: "numero" },
    ],
    alertas: [
      { id: "stock", nivel: "warning", titulo: "8 productos con stock bajo", descripcion: "Revisa el inventario.", cantidad: 8, ruta: "/bodega/inventario" },
      { id: "venc", nivel: "info", titulo: "0 productos próximos a vencer", descripcion: "Lotes en menos de 30 días.", cantidad: 0, ruta: "/bodega/inventario" },
      { id: "pagos", nivel: "danger", titulo: "3 proveedores con pagos pendientes", descripcion: "Facturas vencidas.", cantidad: 3, ruta: "/bodega/proveedores" },
    ],
  };
}
