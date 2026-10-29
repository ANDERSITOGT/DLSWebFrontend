# DLS Web Frontend: árbol explicado

Este documento describe la estructura funcional del repositorio y el recorrido
principal de la aplicación. Está pensado como una guía para encontrar
rápidamente cada pieza y entender qué responsabilidad tiene.

> **Alcance:** este repositorio contiene el frontend. No hay un servidor
> backend, controladores, modelos de base de datos ni migraciones aquí. El
> frontend consume una API externa mediante `VITE_API_URL` (o
> `http://localhost:4000` como valor alternativo en `src/services/api.ts`).

## Árbol del proyecto

Se omiten `node_modules/` y `dist/` porque son dependencias instaladas y
artefactos de compilación, no código fuente mantenido manualmente.

```text
DLSWebFrontend/
├── .env.local                 # Variables locales, por ejemplo VITE_API_URL
├── index.html                 # Documento HTML base y punto donde se monta React
├── package.json               # Dependencias y comandos npm del frontend
├── eslint.config.js           # Reglas de revisión estática
├── tsconfig.json              # Configuración base de TypeScript
├── tsconfig.app.json          # TypeScript de la aplicación
├── tsconfig.node.json         # TypeScript para herramientas/configuración
├── vite.config.ts             # Configuración del servidor y build de Vite
├── postcss.config.js          # Integración de PostCSS/Tailwind
├── tailwind.config.js         # Configuración de Tailwind CSS
├── public/
│   ├── ICONO.png              # Icono público de la aplicación
│   ├── manifest.json          # Metadatos de la aplicación web instalable
│   └── vite.svg               # Recurso estático de ejemplo
├── src/
│   ├── main.tsx               # Arranque: React, StrictMode y BrowserRouter
│   ├── App.tsx                # Providers, rutas y protección de sesión
│   ├── App.css                # Estilos asociados a la aplicación
│   ├── index.css              # Estilos globales y directivas de Tailwind
│   ├── assets/                # Recursos importados desde componentes
│   │   ├── logo-dls.png       # Logo de DLS
│   │   └── react.svg          # Recurso heredado de la plantilla
│   ├── components/            # Componentes reutilizables sin pertenecer a un módulo
│   │   ├── dta.txt            # Archivo auxiliar/documentación de componentes
│   │   └── ui/                # Piezas visuales reutilizables
│   │       ├── Badge.tsx              # Etiqueta visual para estados/categorías
│   │       ├── BuscadorSelect.tsx      # Selector con búsqueda para catálogos
│   │       ├── Card.tsx               # Contenedor visual de contenido
│   │       ├── ConfirmModal.tsx       # Modal para confirmar acciones
│   │       ├── IconCircle.tsx          # Icono dentro de un círculo
│   │       ├── QuickActionsModal.tsx   # Menú de acciones rápidas
│   │       ├── SectionTitle.tsx        # Título reutilizable de sección
│   │       └── StatCard.tsx            # Tarjeta de indicador/resumen
│   ├── context/               # Estado transversal compartido por la aplicación
│   │   ├── AuthContext.tsx    # Usuario, token, login, logout y recuperación de sesión
│   │   └── RefreshContext.tsx # Señal para solicitar actualización de solicitudes
│   ├── hooks/                 # Lógica React reutilizable
│   │   ├── useIsMobile.ts     # Detecta si el viewport está bajo el breakpoint móvil
│   │   └── useUserRole.ts     # Contexto auxiliar para consultar/cambiar el rol
│   ├── layouts/               # Estructuras visuales que rodean las páginas
│   │   ├── desktop/
│   │   │   └── DesktopLayout.tsx # Menú y estructura para escritorio
│   │   └── mobile/
│   │       └── MobileLayout.tsx  # Header, navegación inferior y modales móviles
│   ├── modules/                # Funcionalidades principales del negocio
│   │   ├── auth/
│   │   │   ├── FakeLoginPage.tsx # Pantalla de login alternativa/de pruebas
│   │   │   └── LoginPage.tsx     # Pantalla real de inicio de sesión
│   │   ├── inicio/
│   │   │   ├── InicioPage.tsx      # Página inicial según el usuario
│   │   │   ├── InicioAdmin.tsx     # Panel inicial del administrador
│   │   │   ├── InicioBodeguero.tsx # Panel inicial del bodeguero
│   │   │   └── InicioSolicitante.tsx # Panel inicial del solicitante
│   │   ├── inventario/
│   │   │   ├── Inventario.tsx       # Consulta y gestión del inventario
│   │   │   └── components/
│   │   │       ├── CrearProductoModal.tsx # Alta de productos
│   │   │       └── InfoProductoModal.tsx  # Consulta/edición de información de producto
│   │   ├── cosechas/
│   │   │   ├── CosechasPage.tsx            # Tabla, estados y KPIs de cosechas
│   │   │   └── components/
│   │   │       └── RegistroCosechaModal.tsx # Alta de una cosecha
│   │   ├── movimientos/
│   │   │   ├── MovimientosPage.tsx      # Movimientos generales de inventario
│   │   │   ├── MovimientosLotesPage.tsx # Movimientos agrupados por lote
│   │   │   ├── IngresoModal.tsx         # Registro de ingresos
│   │   │   └── AjusteInventarioModal.tsx # Ajustes manuales de inventario
│   │   ├── solicitudes/
│   │   │   ├── SolicitudesPage.tsx          # Consulta y gestión de solicitudes
│   │   │   ├── NuevaSolicitudModal.tsx      # Creación de solicitudes
│   │   │   └── SolicitudDevolucionModal.tsx # Solicitud de devoluciones
│   │   ├── configuracion/
│   │   │   ├── ConfiguracionPage.tsx     # Entrada de configuración
│   │   │   ├── AsignacionLotesPage.tsx   # Asignación de lotes
│   │   │   └── EdicionCriticaPage.tsx    # Ediciones sensibles o restringidas
│   │   └── usuarios/
│   │       ├── UsuariosPage.tsx           # Página de administración de usuarios
│   │       └── UsuariosManager.tsx        # Lógica/interfaz de gestión de usuarios
│   ├── pages/                  # Páginas de catálogos o entidades independientes
│   │   ├── fincas/
│   │   │   └── FincasPage.tsx             # Gestión/consulta de fincas
│   │   └── proveedores/
│   │       ├── ProveedoresPage.tsx        # Gestión/consulta de proveedores
│   │       └── components/
│   │           ├── ContactosModal.tsx     # Contactos de un proveedor
│   │           └── EditableCell.tsx       # Celda editable para tablas
│   ├── services/               # Adaptadores para llamadas HTTP al backend
│   │   ├── api.ts              # Cliente común: URL, token y manejo 401/403
│   │   ├── apiInicio.ts        # Consulta del panel del bodeguero
│   │   ├── catalogosService.ts # Consultas de catálogos de fincas, inventario y productos
│   │   └── cosechasService.ts  # Consulta y registro de cosechas y catálogos relacionados
│   ├── store/                  # Reservado para estado global adicional (actualmente vacío)
│   ├── types/                  # Reservado para tipos compartidos (actualmente vacío)
│   └── utils/
│       └── cn.ts               # Combina clases CSS ignorando valores vacíos
└── README.md                   # README base de la plantilla de Vite/React
```

## Cómo arranca la aplicación

1. `index.html` proporciona el elemento `#root`.
2. `src/main.tsx` crea el root de React y lo envuelve en `StrictMode` y
   `BrowserRouter`.
3. `src/App.tsx` monta `AuthProvider` y `RefreshProvider`.
4. `AppContent` elige `MobileLayout` o `DesktopLayout` con `useIsMobile`.
5. React Router muestra `LoginPage` públicamente o pasa las demás rutas por
   `RequireAuth`.
6. Las páginas usan `services/` para consultar la API y los componentes
   reutilizables para presentar formularios, tarjetas y modales.

## Rutas definidas

| Ruta | Página | Propósito |
|---|---|---|
| `/login` | `LoginPage` | Autenticación |
| `/` | `InicioPage` | Panel inicial según rol |
| `/inventario` | `Inventario` | Inventario y productos |
| `/movimientos` | `MovimientosPage` | Movimientos de inventario |
| `/movimientos/lotes` | `MovimientosLotesPage` | Movimientos por lote |
| `/solicitudes` | `SolicitudesPage` | Solicitudes |
| `/configuracion` | `ConfiguracionPage` | Configuración |
| `/usuarios` | `UsuariosPage` | Usuarios |
| `/asignacion-lotes` | `AsignacionLotesPage` | Asignación de lotes |
| `/proveedores` | `ProveedoresPage` | Proveedores |
| `/fincas` | `FincasPage` | Fincas |
| `/cosechas` | `CosechasPage` | Registro, seguimiento y KPIs de cosechas |
| `/configuracion/edicion-critica` | `EdicionCriticaPage` | Ediciones críticas |

## Autenticación y datos

- `AuthContext` guarda el usuario y el token en memoria y en
  `localStorage` (`dls_user` y `dls_token`).
- `RequireAuth` redirige a `/login` cuando no existe una sesión.
- `api.ts` centraliza las peticiones que necesitan el token y limpia la sesión
  cuando la API responde `401` o `403`.
- `apiInicio.ts`, `catalogosService.ts` y `cosechasService.ts` son adaptadores
  específicos para endpoints concretos.
- `CosechasPage` calcula los totales de libras cosechadas, vendidas y rechazadas
  para mostrarlos mediante `StatCard`. La tabla determina el estado como
  `Liquidado`, `Enviado` o `En Campo` según las boletas y libras vendidas.
- `RefreshContext` no trae datos por sí mismo: incrementa un contador para que
  las pantallas que lo consumen vuelvan a consultar sus datos después de una
  operación.

## Frontera con el backend

Este repositorio **no implementa el backend**. La separación actual es:

```text
Navegador
  └── React/Vite (este repositorio)
       └── fetch(...) ── HTTP ──> API externa
                                  ├── autenticación
                                  ├── inventario
                                  ├── movimientos
                                  ├── solicitudes
                                  ├── usuarios
                                  ├── cosechas
                                  └── catálogos
```

Para localizar o ejecutar el backend hay que revisar otro repositorio o
servicio. En este proyecto, la URL se configura mediante `VITE_API_URL`.

Los principales endpoints consumidos por el frontend incluyen:

| Servicio | Endpoints |
|---|---|
| Cosechas | `/api/cosechas`, `/api/cosechas/empacadoras`, `/api/cosechas/cultivos` |
| Lotes | `/api/lotes/catalogo` |
| Fincas | `/api/fincas/fincas-lotes` |
| Proveedores | `/api/proveedores/catalogo` |
| Inventario | `/api/inventario/bodegas` |
| Productos | `/api/productos/categorias`, `/api/productos/unidades`, `/api/productos/productos-busqueda`, `/api/productos/productos/buscar` |

## Comandos principales

```bash
npm run dev       # Servidor local con recarga en caliente
npm run build     # TypeScript + build de producción
npm run lint      # Revisión estática
npm run preview   # Servir localmente el build generado
```
