// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileLayout } from "./layouts/mobile/MobileLayout";
import { DesktopLayout } from "./layouts/desktop/DesktopLayout";
import { InicioPage } from "./modules/inicio/InicioPage";
import { UserRoleProvider } from "./hooks/useUserRole";
import { FakeLoginPage } from "./modules/auth/FakeLoginPage";
import { MovimientosPage } from "./modules/movimientos/MovimientosPage";

// NUEVO: inventario (mismo módulo para todos los roles)
import { Inventario } from "./modules/inventario/Inventario";

function App() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <UserRoleProvider>
      <Layout>
        <Routes>
          {/* Inicio (dashboard según rol) */}
          <Route path="/" element={<InicioPage />} />

          {/* Login de prueba para cambiar rol */}
          <Route path="/login" element={<FakeLoginPage />} />

          {/* Inventario (misma vista para todos los roles) */}
          <Route path="/inventario" element={<Inventario />} />

          {/* Movimientos misma vista para todos los roles */}
          <Route path="/movimientos" element={<MovimientosPage />} />{" "}
          {/* ⬅️ NUEVO */}
        </Routes>
      </Layout>
    </UserRoleProvider>
  );
}

export default App;
