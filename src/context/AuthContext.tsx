// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Definimos la forma del Usuario
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
  // 👇 NUEVO ESTADO: Iniciamos cargando
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // 1. Intentamos leer del almacenamiento local
    const storedToken = localStorage.getItem("dls_token");
    const storedUser = localStorage.getItem("dls_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Si hay error al leer (ej. json corrupto), limpiamos todo
        console.error("Error recuperando sesión", error);
        localStorage.removeItem("dls_token");
        localStorage.removeItem("dls_user");
      }
    }
    
    // 2. IMPORTANTE: Avisamos que ya terminamos de revisar
    setLoading(false);
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

  // 👇 LA MAGIA: Si estamos cargando, no renderizamos la App todavía
  // Esto evita que el "RequireAuth" te expulse antes de tiempo.
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}