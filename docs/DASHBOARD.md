<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Documentación — Dashboard</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --ink: #0f172a;
      --muted: #475569;
      --line: #e2e8f0;
      --brand: #2563eb;
      --ok: #16a34a;
      --warn: #f59e0b;
      --danger: #e11d48;
      --code-bg: #0f172a;
      --code-ink: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.6;
    }
    header.hero {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #fff;
      padding: 48px 24px;
    }
    header.hero .wrap { max-width: 1000px; margin: 0 auto; }
    header.hero h1 { margin: 0 0 8px; font-size: 2rem; }
    header.hero p { margin: 0; opacity: 0.9; }
    main { max-width: 1000px; margin: 0 auto; padding: 32px 24px 80px; }
    section {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    h2 { margin-top: 0; font-size: 1.4rem; border-bottom: 2px solid var(--line); padding-bottom: 8px; }
    h3 { font-size: 1.1rem; margin-top: 24px; }
    code {
      background: #eef2ff;
      color: #1e3a8a;
      padding: 2px 6px;
      border-radius: 5px;
      font-size: 0.88em;
      font-family: "SFMono-Regular", Consolas, monospace;
    }
    pre {
      background: var(--code-bg);
      color: var(--code-ink);
      padding: 16px 18px;
      border-radius: 10px;
      overflow-x: auto;
      font-size: 0.85rem;
      font-family: "SFMono-Regular", Consolas, monospace;
      line-height: 1.5;
    }
    pre code { background: none; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.92rem; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .tile {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 16px;
      background: #fcfdff;
    }
    .tile h4 { margin: 0 0 6px; font-size: 0.98rem; }
    .tile p { margin: 0; font-size: 0.86rem; color: var(--muted); }
    .badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      color: #fff;
    }
    .badge.info { background: #0284c7; }
    .badge.warning { background: var(--warn); }
    .badge.danger { background: var(--danger); }
    .flow {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin: 12px 0;
    }
    .flow .step {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .flow .arrow { color: var(--muted); font-weight: 700; }
    .note {
      border-left: 4px solid var(--brand);
      background: #eff6ff;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
      margin: 12px 0;
    }
    footer { text-align: center; color: var(--muted); font-size: 0.82rem; padding: 24px; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <h1>Dashboard — Documentación de funcionamiento</h1>
      <p>Cómo se compone, carga y renderiza la pantalla de Inicio del proyecto (Bodega y Cosechas).</p>
    </div>
  </header>

  <main>
    <section>
      <h2>1. Visión general</h2>
      <p>
        El <strong>Dashboard</strong> es la pantalla de inicio. Muestra un resumen visual del módulo
        activo (<code>BODEGA</code> o <code>COSECHAS</code>) mediante cuatro bloques:
      </p>
      <div class="grid">
        <div class="tile">
          <h4>KPI Cards</h4>
          <p>Indicadores clave con valor, variación porcentual y mini‑gráfica de tendencia.</p>
        </div>
        <div class="tile">
          <h4>Gráficas</h4>
          <p>Comparativas (barras o líneas) por periodo o categoría.</p>
        </div>
        <div class="tile">
          <h4>Resumen del día</h4>
          <p>Barras de progreso con el avance de las métricas del día.</p>
        </div>
        <div class="tile">
          <h4>Alertas</h4>
          <p>Avisos accionables (info / warning / danger) con enlace a la pantalla correspondiente.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>2. Estructura de archivos</h2>
      <pre><code>src/
├── modules/dashboard/
│   ├── Dashboard.tsx        → componente de la vista (layout)
│   ├── useDashboard.ts      → hook: fetch + estado + loading/error
│   ├── widgets.tsx          → KpiCard, ChartCard, ResumenCard, AlertasCard, Skeleton
│   └── mockData.ts          → datos de desarrollo (VITE_DASHBOARD_MOCK)
├── services/
│   ├── dashboardService.ts  → tipos y fetchDashboard()
│   └── api.ts               → apiFetch (token + manejo de 401/403)
└── context/
    └── ModuleContext.tsx    → módulo activo (BODEGA / COSECHAS)</code></pre>
    </section>

    <section>
      <h2>3. Flujo de datos</h2>
      <p>La vista delega toda la lógica de red en un hook, que a su vez llama al servicio HTTP.</p>
      <div class="flow">
        <span class="step">ModuleContext (módulo)</span>
        <span class="arrow">→</span>
        <span class="step">useDashboard()</span>
        <span class="arrow">→</span>
        <span class="step">dashboardService.fetchDashboard()</span>
        <span class="arrow">→</span>
        <span class="step">apiFetch()</span>
        <span class="arrow">→</span>
        <span class="step">GET /api/dashboard</span>
      </div>
      <p>
        El endpoint recibe el módulo y la ventana de días:
        <code>GET /api/dashboard?modulo=&lt;MODULO&gt;&amp;dias=7</code>.
        Devuelve un objeto <code>DashboardResponse</code> que el componente pinta.
      </p>
      <div class="note">
        <strong>Mock:</strong> si la variable de entorno <code>VITE_DASHBOARD_MOCK=true</code> está activa,
        <code>useDashboard</code> resuelve con <code>mockDashboard(modulo, dias)</code> en lugar de llamar a la API.
        Útil para desarrollar el frontend sin backend.
      </div>
    </section>

    <section>
      <h2>4. El hook <code>useDashboard</code></h2>
      <p>
        Recibe el módulo y, opcionalmente, el número de días (por defecto <code>7</code>). Construye una
        clave <code>`${modulo}:${dias}`</code> para saber si los datos mostrados corresponden a la petición actual.
      </p>
      <ul>
        <li><strong>loading</strong>: es <code>true</code> mientras la clave del estado no coincida con la solicitada.</li>
        <li><strong>data</strong>: resultado del fetch (o del mock).</li>
        <li><strong>error</strong>: mensaje si la petición falla.</li>
        <li><strong>cancelled</strong>: bandera de limpieza para evitar actualizar estado tras desmontar o cambiar de módulo (race conditions).</li>
      </ul>
      <pre><code>const loading = state.key !== key;
return { data: loading ? null : state.data,
         error: loading ? null : state.error,
         loading };</code></pre>
    </section>

    <section>
      <h2>5. El componente <code>Dashboard</code></h2>
      <p>Obtiene el módulo activo y el estado del hook, y renderiza tres estados posibles:</p>
      <table>
        <tr><th>Estado</th><th>Qué se muestra</th></tr>
        <tr><td><code>loading</code></td><td><code>&lt;DashboardSkeleton /&gt;</code> (placeholders animados).</td></tr>
        <tr><td><code>error</code></td><td>Caja de alerta roja con el mensaje de error.</td></tr>
        <tr><td><code>data</code></td><td>Cuadrícula con KPI, gráficas y barra lateral (resumen + alertas).</td></tr>
      </table>
      <h3>Layout</h3>
      <pre><code>grid xl:grid-cols-[1fr_320px]
├── columna principal
│   ├── KPIs   → grid sm:grid-cols-2 2xl:grid-cols-4
│   └── Gráficas → grid 2xl:grid-cols-2
└── aside (320px)
    ├── ResumenCard
    └── AlertasCard</code></pre>
      <p>El título varía según el módulo: <em>“Resumen de Bodega”</em> o <em>“Resumen de Cosechas”</em>.</p>
    </section>

    <section>
      <h2>6. Widgets</h2>

      <h3>KpiCard</h3>
      <p>Tarjeta de indicador. Muestra icono coloreado, etiqueta, valor formateado, descripción, variación porcentual (↑ verde / ↓ rojo / · neutral) y una mini‑gráfica de área (Recharts).</p>
      <p>Los colores rotan desde <code>KPI_COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#7c3aed"]</code>.</p>
      <table>
        <tr><th>Icono (<code>kpi.icono</code>)</th><th>Lucide</th></tr>
        <tr><td>movimientos</td><td>Activity</td></tr>
        <tr><td>stock</td><td>AlertTriangle</td></tr>
        <tr><td>solicitudes</td><td>ClipboardList</td></tr>
        <tr><td>inventario</td><td>DollarSign</td></tr>
        <tr><td>cosecha</td><td>Sprout</td></tr>
        <tr><td>despacho</td><td>Truck</td></tr>
        <tr><td>lote</td><td>Ruler</td></tr>
      </table>

      <h3>ChartCard</h3>
      <p>Renderiza una gráfica de <strong>barras</strong> o <strong>líneas</strong> según <code>grafica.tipo</code>. Cada serie se mapea a un color (<code>["#16a34a", "#2563eb", "#f59e0b"]</code>) y el eje X usa <code>etiqueta</code>.</p>

      <h3>ResumenCard</h3>
      <p>Lista de métricas del día. Si el ítem tiene <code>total</code>, calcula el porcentaje (<code>value / total</code>, truncado a 100) y lo dibuja como barra de <code>Progress</code>.</p>

      <h3>AlertasCard</h3>
      <p>Cada alerta tiene un nivel con icono y color, título, descripción y un botón <em>Ver</em> que navega a <code>alerta.ruta</code>.</p>
      <p>
        <span class="badge info">info</span> azul ·
        <span class="badge warning">warning</span> ámbar ·
        <span class="badge danger">danger</span> rojo
      </p>

      <h3>DashboardSkeleton</h3>
      <p>Placeholders grises mostrados durante la carga para evitar saltos de layout.</p>
    </section>

    <section>
      <h2>7. Formato de valores</h2>
      <p>La función <code>formatValue(value, formato)</code> normaliza la presentación:</p>
      <table>
        <tr><th>formato</th><th>Ejemplo</th></tr>
        <tr><td><code>moneda</code></td><td><code>Q150,420</code></td></tr>
        <tr><td><code>libras</code></td><td><code>48,200 lb</code></td></tr>
        <tr><td><code>metros</code></td><td><code>12.4 lb/m</code></td></tr>
        <tr><td><code>numero</code></td><td><code>12</code></td></tr>
      </table>
      <p>Todos los números usan formato <code>es-GT</code>.</p>
    </section>

    <section>
      <h2>8. Seguridad e integración con el módulo</h2>
      <p>
        <code>apiFetch</code> inyecta el token guardado en <code>localStorage["dls_token"]</code> como cabecera
        <code>Authorization: Bearer …</code>. Ante un <code>401</code> o <code>403</code>, limpia la sesión y
        redirige a <code>/login</code>.
      </p>
      <p>El módulo activo lo decide <code>ModuleContext</code> según el rol:</p>
      <table>
        <tr><th>Rol</th><th>Módulo</th></tr>
        <tr><td>ADMIN</td><td>El que elija el usuario (persistido en <code>localStorage["dls_modulo"]</code>).</td></tr>
        <tr><td>COSECHA</td><td>Siempre <code>COSECHAS</code>.</td></tr>
        <tr><td>Otros</td><td>Siempre <code>BODEGA</code>.</td></tr>
      </table>
      <div class="note">
        Si el usuario no tiene permiso para un módulo, el backend responde <code>403</code> y el
        <code>apiFetch</code> cierra la sesión por seguridad.
      </div>
    </section>

    <section>
      <h2>9. Contrato de datos (resumen)</h2>
      <pre><code>DashboardResponse {
  modulo: "BODEGA" | "COSECHAS";
  generadoEn: string (ISO);
  kpis: Kpi[];
  graficas: Grafica[];
  resumenDia: ResumenItem[];
  alertas: Alerta[];
}</code></pre>
      <p>Los detalles completos del contrato del backend están en <code>docs/BACKEND_DASHBOARD.md</code>.</p>
    </section>
  </main>

  <footer>Documentación generada para el módulo Dashboard · proyecto DLS</footer>
</body>
</html>
