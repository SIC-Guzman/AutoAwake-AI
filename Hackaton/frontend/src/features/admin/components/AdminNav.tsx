import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/admin", label: "Resumen" },
  { to: "/admin/alerts", label: "Alertas" },
  { to: "/admin/drivers", label: "Pilotos" },
  { to: "/admin/vehicles", label: "Vehículos" },
  { to: "/admin/trips", label: "Viajes" },
  { to: "/admin/trips/plan", label: "Planear" },
];

export const AdminNav = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (!isAdminRoute) return null;

  return (
    <div className="sticky top-[68px] z-20 border-b border-white/5 bg-[#050b18]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 sm:px-6 lg:px-8">
        {links.map((link) => {
          const active =
            location.pathname === link.to ||
            (link.to !== "/admin" && location.pathname.startsWith(link.to));
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full px-3 py-2 transition ${
                active
                  ? "bg-white/10 text-white shadow-inner shadow-cyan-500/20"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
