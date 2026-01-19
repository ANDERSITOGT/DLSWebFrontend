import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, ShieldCheck } from "lucide-react";
import { UsuariosManager } from "./UsuariosManager";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

export default function UsuariosPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Estado de acceso
  const [accesoConcedido, setAccesoConcedido] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerificarAcceso = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerificando(true);
      setError(null);

      try {
          const res = await fetch(`${API_BASE}/api/usuarios/verificar-acceso`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ password: passwordInput })
          });

          if (res.ok) {
              setAccesoConcedido(true);
          } else {
              setError("Contraseña incorrecta.");
          }
      } catch (err) {
          setError("Error de conexión.");
      } finally {
          setVerificando(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate("/configuracion")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Volver a Configuración
        </button>
        
        <h1 className="text-2xl font-bold text-slate-900">Administración de Usuarios</h1>
        <p className="text-sm text-slate-500">Control de accesos y seguridad.</p>
      </div>

      {/* --- PUERTA DE SEGURIDAD --- */}
      {!accesoConcedido ? (
          <div className="flex justify-center mt-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                      <Lock size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Protegido</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      Esta es una zona sensible. Por favor, confirma tu contraseña de administrador para continuar.
                  </p>

                  <form onSubmit={handleVerificarAcceso} className="space-y-4">
                      <input 
                          type="password" 
                          placeholder="Tu contraseña actual..."
                          className="w-full text-center border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          autoFocus
                      />
                      
                      {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}

                      <button 
                          type="submit" 
                          disabled={verificando || !passwordInput}
                          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                          {verificando ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                          Verificar Acceso
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          /* SI ACCESO CONCEDIDO: Mostramos el Manager */
          <UsuariosManager />
      )}

    </div>
  );
}