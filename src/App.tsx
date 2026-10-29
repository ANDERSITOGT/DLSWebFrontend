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
import { BodegaDashboard } from "./modules/bodega/BodegaDashboard";
import { CosechasDashboard } from "./modules/cosechas/CosechasDashboard";


// Importar los Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";

// Componente Guardia: Protege las rutas
function RequireAuth({ children }: { children: ReactNode }) { 
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
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
                <Route path="/bodega" element={<BodegaDashboard />} />
                <Route path="/bodega/inventario" element={<Inventario />} />
                <Route path="/bodega/movimientos" element={<MovimientosPage />} />
                <Route path="/bodega/movimientos/lotes" element={<MovimientosLotesPage />} />
                <Route path="/bodega/solicitudes" element={<SolicitudesPage />} />
                <Route path="/bodega/configuracion" element={<ConfiguracionPage />} />
                <Route path="/bodega/configuracion/usuarios" element={<UsuariosPage />} />
                <Route path="/bodega/configuracion/asignacion-lotes" element={<AsignacionLotesPage />} />
                <Route path="/bodega/proveedores" element={<ProveedoresPage />} />
                <Route path="/bodega/configuracion/edicion-critica" element={<EdicionCriticaPage />} />
                <Route path="/cosechas" element={<CosechasDashboard />} />
                <Route path="/cosechas/fincas" element={<FincasPage />} />
                <Route path="/cosechas/registro" element={<CosechasPage />} />
                
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
        <AppContent />
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;