// src/context/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

// Definimos la forma del Usuario
interface User {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "BODEGUERO" | "SOLICITANTE" | "VISOR" | "COSECHA";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Restaura la sesion desde localStorage de forma SÍNCRONA durante la
 * inicialización de estado (no en un efecto), evitando renders en cascada y
 * el "flash" de redirección a /login mientras RequireAuth espera la sesión.
 */
function readStoredSession(): { user: User | null; token: string | null } {
  try {
    const storedToken = localStorage.getItem("dls_token");
    const storedUser = localStorage.getItem("dls_user");
    if (storedToken && storedUser) {
      return { token: storedToken, user: JSON.parse(storedUser) as User };
    }
  } catch {
    // JSON corrupto: limpiamos para no dejar una sesión inválida.
    localStorage.removeItem("dls_token");
    localStorage.removeItem("dls_user");
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readStoredSession);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("dls_token", newToken);
    localStorage.setItem("dls_user", JSON.stringify(newUser));
    setSession({ token: newToken, user: newUser });
  };

  const logout = () => {
    localStorage.removeItem("dls_token");
    localStorage.removeItem("dls_user");
    setSession({ token: null, user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        isAuthenticated: !!session.user,
        login,
        logout,
      }}
    >
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
