# DLS Web Frontend: Ã¡rbol explicado

Esta guÃ­a resume la estructura vigente del frontend, sus rutas y los lÃ­mites
entre la aplicaciÃ³n y la API.

> **Alcance:** este repositorio contiene el frontend. La aplicaciÃ³n consume un
> backend externo mediante `VITE_API_URL`; `src/services/api.ts` usa
> `http://localhost:4000` como alternativa cuando esa variable no estÃ¡ definida.

## Ãrbol del proyecto

Se omiten `node_modules/` y `dist/`: son dependencias instaladas y artefactos
generados, no cÃ³digo fuente mantenido manualmente.

```text
DLSWebFrontend/
â”œâ”€â”€ index.html                   # Documento HTML, metadatos y elemento #root
â”œâ”€â”€ package.json                 # Dependencias y comandos npm
â”œâ”€â”€ package-lock.json            # Versiones resueltas de dependencias
â”œâ”€â”€ components.json              # ConfiguraciÃ³n de componentes UI
â”œâ”€â”€ .gitignore                   # Archivos excluidos de Git
â”œâ”€â”€ eslint.config.js             # ConfiguraciÃ³n de ESLint
â”œâ”€â”€ tsconfig*.json               # ConfiguraciÃ³n de TypeScript
â”œâ”€â”€ vite.config.ts               # ConfiguraciÃ³n de Vite
â”œâ”€â”€ postcss.config.js            # ConfiguraciÃ³n de PostCSS
â”œâ”€â”€ tailwind.config.js           # ConfiguraciÃ³n de Tailwind CSS
â”œâ”€â”€ public/                      # Recursos estÃ¡ticos servidos sin procesar
â”‚   â”œâ”€â”€ favicon.svg
â”‚   â”œâ”€â”€ Icono.svg
â”‚   â”œâ”€â”€ ant-icon.svg
â”‚   â”œâ”€â”€ farm-pattern.svg
â”‚   â””â”€â”€ manifest.json
â””â”€â”€ src/
    â”œâ”€â”€ main.tsx                 # Monta React, StrictMode y BrowserRouter
    â”œâ”€â”€ App.tsx                  # Providers, rutas y protecciÃ³n de sesiÃ³n
    â”œâ”€â”€ App.css                  # Estilos de aplicaciÃ³n
    â”œâ”€â”€ index.css                # Estilos globales y Tailwind
    â”œâ”€â”€ assets/
    â”‚   â”œâ”€â”€ logo-dls.png
    â”‚   â””â”€â”€ react.svg            # Recurso heredado de la plantilla
    â”œâ”€â”€ components/
    â”‚   â”œâ”€â”€ ui/                  # Badge, Breadcrumbs, botones, tarjetas, diÃ¡logos,
    â”‚   â”‚                        # formularios, navegaciÃ³n y acciones rÃ¡pidas
    â”‚   â””â”€â”€ dta.txt
    â”œâ”€â”€ config/
    â”‚   â”œâ”€â”€ navigation.ts        # NavegaciÃ³n de Bodega y Cosechas
    â”‚   â””â”€â”€ permissions.ts       # Matriz rol -> mÃ³dulos y permisos de acciÃ³n
    â”œâ”€â”€ context/
    â”‚   â”œâ”€â”€ AuthContext.tsx      # SesiÃ³n, usuario y operaciones de login/logout
    â”‚   â””â”€â”€ RefreshContext.tsx   # SeÃ±al compartida para refrescar solicitudes
    â”œâ”€â”€ hooks/
    â”‚   â”œâ”€â”€ useDebounce.ts       # Retraso de un valor (bÃºsquedas en servidor)
    â”‚   â”œâ”€â”€ useIsMobile.ts       # DetecciÃ³n del viewport mÃ³vil
    â”‚   â””â”€â”€ useUserRole.ts       # Acceso auxiliar al rol
    â”œâ”€â”€ layouts/
    â”‚   â”œâ”€â”€ MainLayout.tsx       # Marco actual: encabezado, navegaciÃ³n y acciones
    â”‚   â”œâ”€â”€ desktop/             # Layout de escritorio alternativo
    â”‚   â””â”€â”€ mobile/              # Layout mÃ³vil alternativo
    â”œâ”€â”€ lib/
    â”‚   â””â”€â”€ utils.ts             # Utilidades compartidas
    â”œâ”€â”€ modules/                 # Funcionalidades agrupadas por dominio
    â”‚   â”œâ”€â”€ auth/                # LoginPage y FakeLoginPage
    â”‚   â”œâ”€â”€ bodega/
    â”‚   â”‚   â””â”€â”€ BodegaDashboard.tsx
    â”‚   â”œâ”€â”€ configuracion/       # ConfiguracionPage, AsignacionLotesPage,
    â”‚   â”‚                        # EdicionCriticaPage
    â”‚   â”œâ”€â”€ cosechas/            # CosechasDashboard y CosechasPage
    â”‚   â”‚   â””â”€â”€ components/
    â”‚   â”‚       â””â”€â”€ RegistroCosechaModal.tsx
    â”‚   â”œâ”€â”€ inicio/              # InicioPage (home unificado)
    â”‚   â”œâ”€â”€ inventario/          # Inventario
    â”‚   â”‚   â””â”€â”€ components/      # CrearProductoModal, InfoProductoModal
    â”‚   â”œâ”€â”€ movimientos/         # MovimientosPage, MovimientosLotesPage,
    â”‚   â”‚                        # IngresoModal, AjusteInventarioModal
    â”‚   â”œâ”€â”€ solicitudes/         # SolicitudesPage y modales de solicitud/devoluciÃ³n
    â”‚   â””â”€â”€ usuarios/            # UsuariosPage y UsuariosManager
    â”œâ”€â”€ pages/
    â”‚   â”œâ”€â”€ fincas/
    â”‚   â”‚   â””â”€â”€ FincasPage.tsx
    â”‚   â””â”€â”€ proveedores/         # MÃ³dulo Proveedores (ver secciÃ³n propia)
    â”‚       â”œâ”€â”€ ProveedoresPage.tsx   # ComposiciÃ³n: cabecera, vistas y Sheet
    â”‚       â”œâ”€â”€ useProveedores.ts     # Hook: listado paginado, bÃºsqueda y mutaciones
    â”‚       â”œâ”€â”€ types.ts              # Proveedor, Contacto, Meta y payloads
    â”‚       â””â”€â”€ components/
    â”‚           â”œâ”€â”€ ProveedoresToolbar.tsx    # BÃºsqueda debounced + botÃ³n Nuevo
    â”‚           â”œâ”€â”€ ProveedoresTable.tsx      # Vista md+ (Table)
    â”‚           â”œâ”€â”€ ProveedoresCards.tsx      # Vista < md (tarjetas)
    â”‚           â”œâ”€â”€ ProveedoresPagination.tsx # Rango, lÃ­mite nativo y prev/next
    â”‚           â”œâ”€â”€ ProveedoresSkeleton.tsx   # Cargadores por vista
    â”‚           â”œâ”€â”€ ProveedoresError.tsx      # Error recuperable / "Sin acceso"
    â”‚           â”œâ”€â”€ ProveedorSheet.tsx        # Sheet lateral con Tabs
    â”‚           â”œâ”€â”€ ProveedorForm.tsx         # Tab "Datos generales"
    â”‚           â””â”€â”€ ContactosTab.tsx          # Tab "Contactos (N)"
    â”œâ”€â”€ services/
    â”‚   â”œâ”€â”€ api.ts                # Cliente HTTP con kill-switch y 403 de modulo
    â”‚   â”œâ”€â”€ apiError.ts           # Error HTTP tipado (FORBIDDEN_MODULE vs sesion)
    â”‚   â”œâ”€â”€ catalogosService.ts   # Consultas de catÃ¡logos
    â”‚   â”œâ”€â”€ cosechasService.ts   # Consultas y registro de cosechas
    â”‚   â””â”€â”€ proveedoresService.ts # CRUD de proveedores/contactos sobre apiFetch
    â”œâ”€â”€ utils/
    â”‚   â””â”€â”€ cn.ts                # CombinaciÃ³n de clases CSS
```

`MainLayout` es el layout montado actualmente por `App.tsx`. Los directorios
`layouts/desktop` y `layouts/mobile` permanecen en el cÃ³digo, pero no son los
layouts que selecciona el enrutador actual.

## Arranque y composiciÃ³n

1. `index.html` carga `src/main.tsx` y proporciona el elemento `#root`.
2. `main.tsx` monta la aplicaciÃ³n dentro de `StrictMode` y `BrowserRouter`.
3. `App.tsx` envuelve las rutas con `AuthProvider` y `RefreshProvider`.
4. `/login` es pÃºblica; el resto de rutas se muestran dentro de `RequireAuth`
   y `MainLayout`.
5. `MainLayout` ofrece navegaciÃ³n adaptable: menÃº lateral en escritorio,
   navegaciÃ³n inferior en mÃ³vil, selector de mÃ³dulo para administradores y
   acciones rÃ¡pidas.
6. Las pÃ¡ginas consumen servicios o llaman a la API directamente, y presentan
   los datos con componentes compartidos de `components/ui`.

## Rutas

| Ruta | PÃ¡gina | PropÃ³sito |
|---|---|---|
| `/login` | `LoginPage` | Inicio de sesiÃ³n |
| `/bodega` | `BodegaDashboard` | Acceso a las funciones de Bodega |
| `/bodega/inventario` | `Inventario` | Consulta y gestiÃ³n del inventario |
| `/bodega/movimientos` | `MovimientosPage` | Movimientos de inventario |
| `/bodega/movimientos/lotes` | `MovimientosLotesPage` | Movimientos agrupados por lote |
| `/bodega/solicitudes` | `SolicitudesPage` | Consulta y gestiÃ³n de solicitudes |
| `/bodega/configuracion` | `ConfiguracionPage` | ConfiguraciÃ³n de Bodega |
| `/bodega/configuracion/usuarios` | `UsuariosPage` | AdministraciÃ³n de usuarios |
| `/bodega/configuracion/asignacion-lotes` | `AsignacionLotesPage` | AsignaciÃ³n de lotes |
| `/bodega/configuracion/edicion-critica` | `EdicionCriticaPage` | Ediciones crÃ­ticas |
| `/bodega/proveedores` | `ProveedoresPage` | GestiÃ³n de proveedores |
| `/cosechas` | `CosechasDashboard` | Acceso a las funciones de Cosechas |
| `/cosechas/fincas` | `FincasPage` | GestiÃ³n de fincas |
| `/cosechas/registro` | `CosechasPage` | Registro y consulta de cosechas |

El home (`/`) lo resuelve `InicioPage` â†’ `Dashboard` para **todos los roles**.
Cada rol consume `GET /api/dashboard?modulo=BODEGA|COSECHAS` y el backend recorta
el payload (modo completo vs simple). Ver `docs/DASHBOARD_FRONTEND.md`. La navegaciÃ³n
de `MainLayout` se define por separado en `config/navigation.ts`.

## SesiÃ³n y comunicaciÃ³n con la API

- `AuthContext` restaura y mantiene el usuario y el token en `localStorage`
  (`dls_user` y `dls_token`), y expone las operaciones de login y logout.
- `api.ts` exporta `apiFetch`, que agrega el token almacenado. Ante `401` aplica el
  kill-switch (limpia sesiÃ³n y va a `/login`). Ante `403` **distingue**: si el mensaje
  indica "mÃ³dulo no permitido" lanza `ApiError` con `FORBIDDEN_MODULE` (la vista muestra
  "Sin acceso" **sin** cerrar sesiÃ³n); en cualquier otro 403 (cuenta desactivada / token)
  o si no se puede diferenciar, cierra sesiÃ³n por seguridad.
- `cosechasService.ts` usa `apiFetch` para listar y registrar cosechas y cargar
  sus catÃ¡logos. `catalogosService.ts` agrupa consultas de bodegas, proveedores,
  productos, fincas y lotes.
- `dashboardService.ts` consume `/api/dashboard` y propaga el `ApiError` tipado.
  `config/permissions.ts` centraliza la matriz rol â†’ mÃ³dulos usada por `ModuleContext`,
  `RequireModule` y el selector de `MainLayout`.
- `RefreshContext` mantiene un contador para solicitar que las pantallas
  consumidoras actualicen solicitudes tras ciertas acciones. No obtiene datos
  por sÃ­ mismo.

La URL base de la API se configura con `VITE_API_URL`. `api.ts` incluye el
alternativo `http://localhost:4000`; algunos servicios y pantallas usan la
variable directamente.

## MÃ³dulo Proveedores

PatrÃ³n de referencia (mismo estilo que `modules/solicitudes/nueva-solicitud` y
`modules/dashboard`): pÃ¡gina de composiciÃ³n + hook orquestador + servicio sobre
`apiFetch` + componentes de vista.

- **Datos en servidor**: `useProveedores` mantiene `page`, `limit` (nativo,
  10/20/50) y el tÃ©rmino de bÃºsqueda pasado por `useDebounce` (350 ms). Cada
  cambio en `(q, page, limit)` dispara un `GET /api/proveedores?page&limit&q`,
  que devuelve `{ data, meta }`. Las respuestas fuera de orden se descartan con
  un contador de peticiones.
- **SincronizaciÃ³n del panel**: la pÃ¡gina guarda **solo** el `id` del proveedor
  seleccionado; el objeto se deriva con `items.find(...)`. Tras crear/editar o
  agregar/eliminar un contacto, `refetch()` actualiza al instante el Sheet
  abierto y el badge de contactos de la tabla.
- **Permisos**: `canManageProveedores(rol)` en `config/permissions.ts` habilita
  mutaciones a `ADMIN` y `BODEGUERO`. Un `403` de mÃ³dulo se muestra como
  "Sin acceso" en `ProveedoresError` (la sesiÃ³n no se cierra gracias a
  `apiFetch`).
- **UI**: `Sheet` lateral (`z-[60]`, por encima del FAB mÃ³vil) con pestaÃ±as
  "Datos generales" y "Contactos (N)"; tabla Shadcn en `md+`, tarjetas en mÃ³vil;
  paginaciÃ³n al pie y `pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0` para
  esquivar la navegaciÃ³n inferior.
- **Tema**: `sheet.tsx`, `table.tsx` y `tabs.tsx` fijan estilos claros
  (`bg-white text-slate-900 border-slate-200`) porque `:root` en `index.css` es
  oscuro; no dependen de `--muted` ni de `--foreground`.

## Frontera con el backend

Este repositorio no implementa el servidor, sus controladores ni su base de
datos. El flujo de datos principal es:

```text
Navegador
  â””â”€â”€ React y Vite (este repositorio)
       â””â”€â”€ fetch / apiFetch â”€â”€ HTTP â”€â”€> API externa
                                      â”œâ”€â”€ autenticaciÃ³n
                                      â”œâ”€â”€ Bodega e inventario
                                      â”œâ”€â”€ movimientos y solicitudes
                                      â”œâ”€â”€ usuarios y catÃ¡logos
                                      â””â”€â”€ cosechas y fincas
```

Para consultar los endpoints concretos, revisar los servicios en `src/services/`
y las llamadas directas de cada pÃ¡gina o mÃ³dulo.

## Comandos principales

```bash
npm run dev       # Servidor local con recarga en caliente
npm run build     # Verifica TypeScript y genera el build de producciÃ³n
npm run lint      # RevisiÃ³n estÃ¡tica con ESLint
npm run preview   # Sirve localmente el build generado
```
