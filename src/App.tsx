// src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileLayout } from "./layouts/mobile/MobileLayout";
import { DesktopLayout } from "./layouts/desktop/DesktopLayout";
import { InicioPage } from "./modules/inicio/InicioPage";
import LoginPage from "./modules/auth/LoginPage";
import { MovimientosPage } from "./modules/movimientos/MovimientosPage";
import { MovimientosLotesPage } from "./modules/movimientos/MovimientosLotesPage";
import { Inventario } from "./modules/inventario/Inventario";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import { ConfiguracionPage } from "./modules/configuracion/ConfiguracionPage";
import UsuariosPage from "./modules/usuarios/UsuariosPage";

// 1. Importar los Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext"; // 👈 NUEVO: Importar el contexto de refresco

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
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Routes>
      {/* Ruta Pública: Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas Privadas (Protegidas) */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<InicioPage />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/movimientos" element={<MovimientosPage />} />
                <Route path="/movimientos/lotes" element={<MovimientosLotesPage />} />
                <Route path="/solicitudes" element={<SolicitudesPage />} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      {/* 2. ENVOLVER LA APP: Esto permite que el Layout hable con las Páginas */}
      <RefreshProvider>
        <AppContent />
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;