import axios from "axios";
import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      const next = (location.state as { from?: string } | null)?.from;
      navigate(next || "/admin");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : (err as Error)?.message;
      setError(message || "No se pudo iniciar sesión.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
          Acceso seguro
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Inicia sesión para administrar la flota
        </h1>
        <p className="text-sm text-slate-200">
          Este panel es exclusivo para administradores. Las sesiones se guardan
          con tokens JWT y se limpian automáticamente si el backend devuelve un
          401. Usa tus credenciales asignadas en el hackathon.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-lg shadow-slate-900/40">
          <p className="font-semibold text-white">Recordatorios rápidos</p>
          <ul className="mt-2 space-y-2">
            <li>· Los tokens se guardan en almacenamiento local seguro.</li>
            <li>· Axios envía el bearer automáticamente en cada request.</li>
            <li>· TanStack Query maneja reintentos suaves ante fallos.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-500/20">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-white">Correo</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@samsung.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a1224] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contraseña</p>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a1224] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {(error || loginError) && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error || loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-semibold text-[#041022] shadow-lg shadow-cyan-500/25 transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingIn ? "Conectando..." : "Iniciar sesión"}
          </button>

          <p className="text-center text-xs text-slate-400">
            ¿Necesitas una cuenta? Solicítala al equipo de infraestructura o{" "}
            <Link to="/about" className="text-cyan-200 hover:text-white">
              conoce el proyecto
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
};
