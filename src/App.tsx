// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileLayout } from "./layouts/mobile/MobileLayout";
import { DesktopLayout } from "./layouts/desktop/DesktopLayout";
import { InicioPage } from "./modules/inicio/InicioPage";
import { UserRoleProvider } from "./hooks/useUserRole";
import { FakeLoginPage } from "./modules/auth/FakeLoginPage";



function App() {
  const isMobile = useIsMobile();

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
  <BrowserRouter>
    <UserRoleProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<InicioPage />} />
          <Route path="/login" element={<FakeLoginPage />} />
          {/* las demás rutas que ya tenías */}
        </Routes>
      </Layout>
    </UserRoleProvider>
  </BrowserRouter>
);
}

export default App;
