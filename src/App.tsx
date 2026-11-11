// src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { InicioPage } from "./modules/inicio/InicioPage";
import LoginPage from "./modules/auth/LoginPage";
import { MovimientosPage } from "./modules/movimientos/MovimientosPage";
import { MovimientosLotesPage } from "./modules/movimientos/MovimientosLotesPage";
import { Inventario } from "./modules/inventario/Inventario";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import { ConfiguracionPage } from "./modules/configuracion/ConfiguracionPage";
import UsuariosPage from "./modules/usuarios/UsuariosPage";
import { AsignacionLotesPage } from "./modules/configuracion/AsignacionLotesPage";
import ProveedoresPage from "./pages/proveedores/ProveedoresPage";
import FincasPage from "./pages/fincas/FincasPage";
import { EdicionCriticaPage } from './modules/configuracion/EdicionCriticaPage';
import { CosechasPage } from "./modules/cosechas/CosechasPage";


// Importar los Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";
import { ModuleProvider } from "./context/ModuleContext";

// Componente Guardia: Protege las rutas
function RequireAuth({ children }: { children: ReactNode }) { 
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RequireModule({ modulo, children }: { modulo: "BODEGA" | "COSECHAS"; children: ReactNode }) {
  const { user } = useAuth();
  const rol = user?.rol;
  const allowed =
    rol === "ADMIN" || (modulo === "COSECHAS" ? rol === "COSECHA" : rol !== "COSECHA");

  return allowed ? children : <Navigate to="/" replace />;
}

function AppContent() {
  return (
    <Routes>
      {/* Ruta Pública: Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas Privadas (Protegidas) */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <MainLayout>
              <Routes>
                <Route path="/" element={<InicioPage />} />
                <Route path="/bodega" element={<Navigate to="/" replace />} />
                <Route path="/bodega/inventario" element={<RequireModule modulo="BODEGA"><Inventario /></RequireModule>} />
                <Route path="/bodega/movimientos" element={<RequireModule modulo="BODEGA"><MovimientosPage /></RequireModule>} />
                <Route path="/bodega/movimientos/lotes" element={<RequireModule modulo="BODEGA"><MovimientosLotesPage /></RequireModule>} />
                <Route path="/bodega/solicitudes" element={<RequireModule modulo="BODEGA"><SolicitudesPage /></RequireModule>} />
                <Route path="/bodega/configuracion" element={<RequireModule modulo="BODEGA"><ConfiguracionPage /></RequireModule>} />
                <Route path="/bodega/configuracion/usuarios" element={<RequireModule modulo="BODEGA"><UsuariosPage /></RequireModule>} />
                <Route path="/bodega/configuracion/asignacion-lotes" element={<RequireModule modulo="BODEGA"><AsignacionLotesPage /></RequireModule>} />
                <Route path="/bodega/proveedores" element={<RequireModule modulo="BODEGA"><ProveedoresPage /></RequireModule>} />
                <Route path="/bodega/configuracion/edicion-critica" element={<RequireModule modulo="BODEGA"><EdicionCriticaPage /></RequireModule>} />
                <Route path="/cosechas" element={<Navigate to="/" replace />} />
                <Route path="/cosechas/fincas" element={<RequireModule modulo="COSECHAS"><FincasPage /></RequireModule>} />
                <Route path="/cosechas/registro" element={<RequireModule modulo="COSECHAS"><CosechasPage /></RequireModule>} />
                
              </Routes>
            </MainLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      {/* Envolver la APP con RefreshProvider */}
      <RefreshProvider>
        <ModuleProvider>
          <AppContent />
        </ModuleProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;