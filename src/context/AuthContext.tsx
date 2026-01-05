import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

// Definimos la forma del Usuario (coincide con tu Backend)
interface User {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "BODEGUERO" | "SOLICITANTE" | "VISOR";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al cargar la página, revisamos si ya había sesión guardada
  useEffect(() => {
    const storedToken = localStorage.getItem("dls_token");
    const storedUser = localStorage.getItem("dls_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("dls_token", newToken);
    localStorage.setItem("dls_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("dls_token");
    localStorage.removeItem("dls_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar la auth en cualquier parte
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}