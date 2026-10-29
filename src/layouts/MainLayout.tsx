import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
} from "lucide-react";

import { QuickActionsModal } from "../components/ui/QuickActionsModal";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { useAuth } from "../context/AuthContext";
import { useRefresh } from "../context/RefreshContext";
import { AjusteInventarioModal } from "../modules/movimientos/AjusteInventarioModal";
import { IngresoModal } from "../modules/movimientos/IngresoModal";
import { NuevaSolicitudModal } from "../modules/solicitudes/NuevaSolicitudModal";
import { SolicitudDevolucionModal } from "../modules/solicitudes/SolicitudDevolucionModal";
import CrearProductoModal from "../modules/inventario/components/CrearProductoModal";
import InfoProductoModal from "../modules/inventario/components/InfoProductoModal";
import { Button } from "@/components/ui/button";
import {
  bodegaNavigation,
  cosechasNavigation,
} from "../config/navigation";

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { triggerRefreshSolicitudes } = useRefresh();
  const [moduloActivo, setModuloActivo] = useState("BODEGA");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showCrearProductoModal, setShowCrearProductoModal] = useState(false);
  const [showInfoProductoModal, setShowInfoProductoModal] = useState(false);

  const isAdmin = user?.rol === "ADMIN";
  const activeModule = isAdmin ? moduloActivo : "BODEGA";
  const navigationItems =
    activeModule === "BODEGA" ? bodegaNavigation : cosechasNavigation;

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 h-16 w-full bg-slate-800">
        <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
              className="hidden shrink-0 rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white md:inline-flex"
            >
              <Menu size={19} />
            </button>
            <Link
              to="/"
              onClick={() => navigate("/")}
              className="flex min-w-0 items-center gap-2"
            >
              <img
                src="/ICONO.png"
                alt="DLS Web"
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
              <span className="truncate text-sm font-semibold tracking-wide">
                DLS Web
              </span>
            </Link>
            {isAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModuleMenuOpen((open) => !open)}
                  aria-expanded={moduleMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1 rounded-full bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {activeModule === "BODEGA" ? "Bodega" : "Cosechas"}
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${
                      moduleMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {moduleMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-40 mt-2 min-w-36 rounded-xl bg-card p-1 shadow-xl shadow-black/30"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setModuloActivo("BODEGA");
                        navigate("/bodega");
                        setModuleMenuOpen(false);
                      }}
                      className={`flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeModule === "BODEGA"
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      Bodega
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setModuloActivo("COSECHAS");
                        navigate("/cosechas");
                        setModuleMenuOpen(false);
                      }}
                      className={`flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeModule === "COSECHAS"
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      Cosechas
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="rounded-full px-3 py-2 text-sm text-muted-foreground">
                Bodega
              </span>
            )}
          </div>

          <label className="hidden w-full max-w-md items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-muted-foreground md:flex">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar..."
              aria-label="Buscar"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-medium">
                {user?.nombre}
              </p>
              <p className="max-w-40 truncate text-xs text-muted-foreground">
                {user?.rol}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut size={16} />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 top-16 flex min-h-0 overflow-hidden bg-slate-800">
        <aside
          className={`hidden h-full shrink-0 flex-col overflow-hidden bg-slate-800 transition-all duration-300 ease-in-out md:flex ${
            sidebarOpen ? "w-64" : "w-16"
          }`}
        >
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={sidebarOpen ? undefined : item.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${sidebarOpen ? "" : "justify-center"}`}
                >
                  <Icon size={18} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-3">
            <button
              type="button"
              onClick={() => setShowActions(true)}
              title={sidebarOpen ? undefined : "Acciones rápidas"}
              className={`flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 ${
                sidebarOpen ? "" : "h-10 w-10 rounded-full px-0"
              }`}
            >
              <Plus size={17} />
              {sidebarOpen && "Acciones rápidas"}
            </button>
          </div>
        </aside>

        <main className="app-surface my-2 ml-2 mr-2 min-h-0 min-w-0 flex-1 overflow-y-auto rounded-tl-3xl p-6 pb-24 text-slate-900 md:p-8 md:pb-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-slate-800 bg-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] md:hidden">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={`flex h-full min-w-0 flex-1 items-center justify-center transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowActions(true)}
        aria-label="Abrir acciones rápidas"
        className="fixed bottom-20 right-4 z-50 rounded-full bg-primary p-3 text-white shadow-lg md:hidden"
      >
        <Plus size={24} />
      </button>

      {showActions && (
        <QuickActionsModal
          onClose={() => setShowActions(false)}
          onIngresoClick={() => setShowIngresoModal(true)}
          onSolicitudClick={() => setShowSolicitudModal(true)}
          onAjusteClick={() => setShowAjusteModal(true)}
          onDevolucionClick={() => setShowDevolucionModal(true)}
          onCreateProductClick={() => setShowCrearProductoModal(true)}
          onInfoProductoClick={() => setShowInfoProductoModal(true)}
        />
      )}

      {showIngresoModal && (
        <IngresoModal
          onClose={() => setShowIngresoModal(false)}
          onSuccess={() => {
            setShowIngresoModal(false);
            triggerRefreshSolicitudes();
          }}
        />
      )}

      {showSolicitudModal && (
        <NuevaSolicitudModal
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={() => {
            setShowSolicitudModal(false);
            triggerRefreshSolicitudes();
          }}
        />
      )}

      {showAjusteModal && (
        <AjusteInventarioModal
          onClose={() => setShowAjusteModal(false)}
          onSuccess={() => setShowAjusteModal(false)}
        />
      )}

      {showDevolucionModal && (
        <SolicitudDevolucionModal
          onClose={() => setShowDevolucionModal(false)}
          onSuccess={() => {
            setShowDevolucionModal(false);
            triggerRefreshSolicitudes();
          }}
        />
      )}

      {showCrearProductoModal && (
        <CrearProductoModal
          isOpen={showCrearProductoModal}
          onClose={() => setShowCrearProductoModal(false)}
          onSuccess={() => setShowCrearProductoModal(false)}
        />
      )}

      {showInfoProductoModal && (
        <InfoProductoModal
          isOpen={showInfoProductoModal}
          onClose={() => setShowInfoProductoModal(false)}
          onSuccess={() => setShowInfoProductoModal(false)}
        />
      )}
    </div>
  );
}
