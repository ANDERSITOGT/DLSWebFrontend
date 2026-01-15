// src/modules/auth/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box } from "lucide-react"; // Usamos un icono como logo provisional

// 👇 CAMBIO: Usamos URLs de internet en lugar de archivos locales para evitar errores
const bgImg = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"; // Imagen de almacén/bodega
// Si tuvieras un logo online, pondrías la URL aquí. Por ahora usaremos un Icono + Texto.

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      login(data.token, data.user);
      navigate("/");

    } catch (err: any) {
      setError(err.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      
      {/* SECCIÓN IZQUIERDA - IMAGEN DE FONDO */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-60" 
            style={{ backgroundImage: `url(${bgImg})` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20"></div>
        
        <div className="relative z-10 w-full flex items-end p-16 text-white">
            <div>
                <h2 className="text-4xl font-bold tracking-tight mb-4">Gestión Integral</h2>
                <p className="text-lg text-slate-300 max-w-md">
                  Control total de inventarios, fincas y movimientos en una sola plataforma robusta y segura.
                </p>
            </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA - FORMULARIO */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-8">
          
          {/* HEADER DEL FORMULARIO */}
          <div className="text-center">
            {/* Logo provisional con Icono */}
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Box className="text-white w-8 h-8" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa a tu cuenta DLS Web
            </p>
          </div>

          {/* MANEJO DE ERRORES */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="text-red-500">⚠️</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* FORMULARIO */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>

           <div className="mt-8 text-center text-xs text-slate-400">
            © 2026 DLS Web System. v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}