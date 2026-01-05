// src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileLayout } from "./layouts/mobile/MobileLayout";
import { DesktopLayout } from "./layouts/desktop/DesktopLayout";
import { InicioPage } from "./modules/inicio/InicioPage";
import LoginPage from "./modules/auth/LoginPage"; // <--- Login Real
import { MovimientosPage } from "./modules/movimientos/MovimientosPage";
import { MovimientosLotesPage } from "./modules/movimientos/MovimientosLotesPage";
import { Inventario } from "./modules/inventario/Inventario";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import { ConfiguracionPage } from "./modules/configuracion/ConfiguracionPage";

// 1. Importar el Provider y el Hook
import { AuthProvider, useAuth } from "./context/AuthContext";

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
      <AppContent />
    </AuthProvider>
  );
}

export default App;