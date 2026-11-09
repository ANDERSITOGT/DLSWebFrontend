# DLS Web Frontend: árbol explicado

Esta guía resume la estructura vigente del frontend, sus rutas y los límites
entre la aplicación y la API.

> **Alcance:** este repositorio contiene el frontend. La aplicación consume un
> backend externo mediante `VITE_API_URL`; `src/services/api.ts` usa
> `http://localhost:4000` como alternativa cuando esa variable no está definida.

## Árbol del proyecto

Se omiten `node_modules/` y `dist/`: son dependencias instaladas y artefactos
generados, no código fuente mantenido manualmente.

```text
DLSWebFrontend/
├── index.html                   # Documento HTML, metadatos y elemento #root
├── package.json                 # Dependencias y comandos npm
├── package-lock.json            # Versiones resueltas de dependencias
├── components.json              # Configuración de componentes UI
├── .gitignore                   # Archivos excluidos de Git
├── eslint.config.js             # Configuración de ESLint
├── tsconfig*.json               # Configuración de TypeScript
├── vite.config.ts               # Configuración de Vite
├── postcss.config.js            # Configuración de PostCSS
├── tailwind.config.js           # Configuración de Tailwind CSS
├── public/                      # Recursos estáticos servidos sin procesar
│   ├── favicon.svg
│   ├── Icono.svg
│   ├── ant-icon.svg
│   ├── farm-pattern.svg
│   └── manifest.json
└── src/
    ├── main.tsx                 # Monta React, StrictMode y BrowserRouter
    ├── App.tsx                  # Providers, rutas y protección de sesión
    ├── App.css                  # Estilos de aplicación
    ├── index.css                # Estilos globales y Tailwind
    ├── assets/
    │   ├── logo-dls.png
    │   └── react.svg            # Recurso heredado de la plantilla
    ├── components/
    │   ├── ui/                  # Badge, Breadcrumbs, botones, tarjetas, diálogos,
    │   │                        # formularios, navegación y acciones rápidas
    │   └── dta.txt
    ├── config/
    │   └── navigation.ts        # Navegación de Bodega y Cosechas
    ├── context/
    │   ├── AuthContext.tsx      # Sesión, usuario y operaciones de login/logout
    │   └── RefreshContext.tsx   # Señal compartida para refrescar solicitudes
    ├── hooks/
    │   ├── useIsMobile.ts       # Detección del viewport móvil
    │   └── useUserRole.ts       # Acceso auxiliar al rol
    ├── layouts/
    │   ├── MainLayout.tsx       # Marco actual: encabezado, navegación y acciones
    │   ├── desktop/             # Layout de escritorio alternativo
    │   └── mobile/              # Layout móvil alternativo
    ├── lib/
    │   └── utils.ts             # Utilidades compartidas
    ├── modules/                 # Funcionalidades agrupadas por dominio
    │   ├── auth/                # LoginPage y FakeLoginPage
    │   ├── bodega/
    │   │   └── BodegaDashboard.tsx
    │   ├── configuracion/       # ConfiguracionPage, AsignacionLotesPage,
    │   │                        # EdicionCriticaPage
    │   ├── cosechas/            # CosechasDashboard y CosechasPage
    │   │   └── components/
    │   │       └── RegistroCosechaModal.tsx
    │   ├── inicio/              # InicioPage y paneles por rol
    │   ├── inventario/          # Inventario
    │   │   └── components/      # CrearProductoModal, InfoProductoModal
    │   ├── movimientos/         # MovimientosPage, MovimientosLotesPage,
    │   │                        # IngresoModal, AjusteInventarioModal
    │   ├── solicitudes/         # SolicitudesPage y modales de solicitud/devolución
    │   └── usuarios/            # UsuariosPage y UsuariosManager
    ├── pages/
    │   ├── fincas/
    │   │   └── FincasPage.tsx
    │   └── proveedores/         # ProveedoresPage y componentes de edición/contactos
    ├── services/
    │   ├── api.ts                # Cliente HTTP autenticado
    │   ├── apiInicio.ts          # Consulta del panel del bodeguero
    │   ├── catalogosService.ts   # Consultas de catálogos
    │   └── cosechasService.ts   # Consultas y registro de cosechas
    ├── utils/
    │   └── cn.ts                # Combinación de clases CSS
```

`MainLayout` es el layout montado actualmente por `App.tsx`. Los directorios
`layouts/desktop` y `layouts/mobile` permanecen en el código, pero no son los
layouts que selecciona el enrutador actual.

## Arranque y composición

1. `index.html` carga `src/main.tsx` y proporciona el elemento `#root`.
2. `main.tsx` monta la aplicación dentro de `StrictMode` y `BrowserRouter`.
3. `App.tsx` envuelve las rutas con `AuthProvider` y `RefreshProvider`.
4. `/login` es pública; el resto de rutas se muestran dentro de `RequireAuth`
   y `MainLayout`.
5. `MainLayout` ofrece navegación adaptable: menú lateral en escritorio,
   navegación inferior en móvil, selector de módulo para administradores y
   acciones rápidas.
6. Las páginas consumen servicios o llaman a la API directamente, y presentan
   los datos con componentes compartidos de `components/ui`.

## Rutas

| Ruta | Página | Propósito |
|---|---|---|
| `/login` | `LoginPage` | Inicio de sesión |
| `/` | `InicioPage` | Inicio seleccionado según el rol |
| `/bodega` | `BodegaDashboard` | Acceso a las funciones de Bodega |
| `/bodega/inventario` | `Inventario` | Consulta y gestión del inventario |
| `/bodega/movimientos` | `MovimientosPage` | Movimientos de inventario |
| `/bodega/movimientos/lotes` | `MovimientosLotesPage` | Movimientos agrupados por lote |
| `/bodega/solicitudes` | `SolicitudesPage` | Consulta y gestión de solicitudes |
| `/bodega/configuracion` | `ConfiguracionPage` | Configuración de Bodega |
| `/bodega/configuracion/usuarios` | `UsuariosPage` | Administración de usuarios |
| `/bodega/configuracion/asignacion-lotes` | `AsignacionLotesPage` | Asignación de lotes |
| `/bodega/configuracion/edicion-critica` | `EdicionCriticaPage` | Ediciones críticas |
| `/bodega/proveedores` | `ProveedoresPage` | Gestión de proveedores |
| `/cosechas` | `CosechasDashboard` | Acceso a las funciones de Cosechas |
| `/cosechas/fincas` | `FincasPage` | Gestión de fincas |
| `/cosechas/registro` | `CosechasPage` | Registro y consulta de cosechas |

`InicioPage` muestra `InicioBodeguero` para el rol `BODEGUERO`, `InicioSolicitante`
para `SOLICITANTE` y `InicioAdmin` para los demás roles. La navegación de
`MainLayout` se define por separado en `config/navigation.ts`.

## Sesión y comunicación con la API

- `AuthContext` restaura y mantiene el usuario y el token en `localStorage`
  (`dls_user` y `dls_token`), y expone las operaciones de login y logout.
- `RequireAuth` redirige a `/login` si no hay un usuario autenticado.
- `api.ts` exporta `apiFetch`, que agrega el token almacenado y, ante respuestas
  `401` o `403`, elimina las claves de sesión y redirige a `/login`.
- `cosechasService.ts` usa `apiFetch` para listar y registrar cosechas y cargar
  sus catálogos. `catalogosService.ts` agrupa consultas de bodegas, proveedores,
  productos, fincas y lotes.
- `apiInicio.ts` consulta el resumen inicial del bodeguero. Algunas pantallas
  también realizan peticiones HTTP directamente; no todas las llamadas pasan
  por un único cliente.
- `RefreshContext` mantiene un contador para solicitar que las pantallas
  consumidoras actualicen solicitudes tras ciertas acciones. No obtiene datos
  por sí mismo.

La URL base de la API se configura con `VITE_API_URL`. `api.ts` incluye el
alternativo `http://localhost:4000`; algunos servicios y pantallas usan la
variable directamente.

## Frontera con el backend

Este repositorio no implementa el servidor, sus controladores ni su base de
datos. El flujo de datos principal es:

```text
Navegador
  └── React y Vite (este repositorio)
       └── fetch / apiFetch ── HTTP ──> API externa
                                      ├── autenticación
                                      ├── Bodega e inventario
                                      ├── movimientos y solicitudes
                                      ├── usuarios y catálogos
                                      └── cosechas y fincas
```

Para consultar los endpoints concretos, revisar los servicios en `src/services/`
y las llamadas directas de cada página o módulo.

## Comandos principales

```bash
npm run dev       # Servidor local con recarga en caliente
npm run build     # Verifica TypeScript y genera el build de producción
npm run lint      # Revisión estática con ESLint
npm run preview   # Sirve localmente el build generado
```
