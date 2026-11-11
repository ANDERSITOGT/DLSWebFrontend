# Contrato backend: Dashboard compartido

El frontend renderiza un único dashboard para Bodega y Cosechas. **Todo el
cálculo (sumas, agrupaciones, tendencias, variaciones) lo hace el backend**; el
frontend solo pinta lo que recibe.

## Endpoint nuevo

`GET /api/dashboard?modulo=BODEGA|COSECHAS&dias=7` 🔒 (token obligatorio)

- `modulo`: `BODEGA` (por defecto) o `COSECHAS`.
- `dias`: ventana de las series y sparklines (7 por defecto, máximo 90).
- Respeta el rol: `SOLICITANTE` solo ve datos de sus lotes/solicitudes;
  `BODEGUERO` y `ADMIN` ven todo; `VISOR` solo lectura.
- Reemplaza a `/api/inicio/admin`, `/api/inicio/bodeguero` y
  `/api/inicio/solicitante`, que hoy no exigen token. Mantenerlos hasta migrar.
- Errores: `{ "message": "..." }` como en el resto de la API.

## Respuesta

```ts
type DashboardResponse = {
  modulo: "BODEGA" | "COSECHAS";
  generadoEn: string;                 // ISO
  kpis: Kpi[];                        // 4 tarjetas
  graficas: Grafica[];                // 1 a 3 gráficas
  resumenDia: ResumenItem[];          // indicadores de progreso del día
  alertas: Alerta[];                  // columna derecha
};

type Formato = "numero" | "moneda" | "libras" | "metros";

type Kpi = {
  id: string;
  label: string;
  value: number;
  formato: Formato;
  descripcion: string;
  variacionPct: number | null;        // vs. periodo anterior de igual duración
  tendencia: number[];                // un valor por día (sparkline), orden cronológico
  icono?: "movimientos" | "stock" | "solicitudes" | "inventario" | "cosecha" | "despacho" | "lote";
};

type Grafica = {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas";
  series: { key: string; label: string }[];       // p. ej. entradas, salidas
  datos: ({ etiqueta: string } & Record<string, number | string>)[];
};

type ResumenItem = {
  id: string;
  label: string;
  value: number;
  total: number | null;               // para calcular el % de progreso, si aplica
  formato: Formato;
};

type Alerta = {
  id: string;
  nivel: "info" | "warning" | "danger";
  titulo: string;
  descripcion: string;
  cantidad: number;
  ruta: string;                       // ruta del frontend, p. ej. "/bodega/inventario"
};
```

## Contenido por módulo

### BODEGA
- **KPIs**: movimientos de hoy, productos bajo el stock mínimo, solicitudes
  activas (`PENDIENTE` + `APROBADA`), valor del inventario (`precioref` × stock).
  Cada uno con `tendencia` diaria de `dias` días.
- **Gráficas**: `entradas-vs-salidas` (barras, por día: `entradas` =
  `INGRESO`, `salidas` = `SALIDA`, solo documentos `APROBADO`) y
  `movimientos-tendencia` (líneas, total por día).
- **Resumen del día**: ingresos, salidas y solicitudes aprobadas de hoy.
- **Alertas**: stock bajo, productos próximos a vencer (30 días) y proveedores
  con pagos pendientes.

### COSECHAS
- **KPIs**: libras cosechadas, libras de rechazo, libras vendidas/despachadas y
  rendimiento por área. Si se puede usar `areametroslineales` de los lotes,
  devolver el rendimiento en `formato: "metros"` (libras por metro lineal).
- **Gráficas**: `cosechas-por-periodo` (líneas: `campo`, `vendidas`) y
  `cosechas-por-lote` (barras: top 8 lotes por libras).
- **Resumen del día**: libras de campo, rechazo y vendidas de hoy.
- **Alertas**: lotes sin cosecha registrada en N días, cosechas sin boleta y
  lotes `ABIERTO` sin actividad.

## Reglas
- Todas las series deben traer **todos los días de la ventana**, con 0 cuando
  no haya datos (el frontend no rellena huecos).
- `etiqueta` ya viene formateada para mostrar (p. ej. `"lun 10"` o `"2026-11"`).
- Fechas calculadas en zona horaria `America/Guatemala`.
- Un módulo no permitido para el rol devuelve `403`.
