import { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";

const baseLinks = [
  { to: "/", label: "Inicio" },
  { to: "/about", label: "Visión" },
];

export const AppLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navLinks = isAuthenticated
    ? [...baseLinks, { to: "/admin", label: "Panel" }]
    : baseLinks;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b18] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="absolute right-0 top-28 h-96 w-96 rounded-full bg-sky-400/10 blur-[110px]" />
        <div className="absolute -bottom-10 left-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-[110px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050b18]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/80 to-sky-500/70 shadow-lg shadow-cyan-500/30">
              <span className="text-xl font-extrabold text-[#050b18]">A</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                AutoAwake AI
              </p>
              <p className="text-base font-semibold text-white">
                Guardian de la flota
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 sm:flex">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== "/" && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`transition-colors hover:text-white ${
                    isActive ? "text-white" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-200/90 ring-1 ring-white/10 sm:inline-flex">
              Samsung Hackathon Edition
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white sm:inline-flex">
                  {user.email ?? "Admin"} · {user.role ?? "admin"}
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-[#041022] shadow-lg shadow-cyan-500/25 transition hover:-translate-y-[1px]"
              >
                Acceso Admin
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-white/5 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>AutoAwake AI · Seguridad y eficiencia para flotas modernas.</p>
          <p className="text-slate-500">
            Hardware IoT + IA + FastAPI + React & Tailwind v4.1
          </p>
        </div>
      </footer>
    </div>
  );
};
