import { useQuery } from "@tanstack/react-query";
import { fetchDriversList } from "./api/listings";

export const AdminDriversPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers", "list"],
    queryFn: fetchDriversList,
    refetchInterval: 45_000,
  });

  return (
    <div className="space-y-4 w-full">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Pilotos</p>
        <h1 className="text-2xl font-bold text-white">Listado de conductores</h1>
        <p className="text-sm text-slate-300">Datos en vivo desde FastAPI + MySQL.</p>
      </div>

      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-slate-900/50">
        <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>ID</span>
          <span>Nombre</span>
          <span>Licencia</span>
          <span>Estado</span>
          <span>Último login</span>
          <span>Rol</span>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Cargando conductores...</div>
          )}
          {isError && (
            <div className="px-4 py-3 text-sm text-red-200">
              No se pudieron cargar los conductores. Revisa el backend.
            </div>
          )}
          {!isLoading && !isError && (data?.length ?? 0) === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No hay conductores.</div>
          )}
          {data?.map((driver) => (
            <div
              key={driver.driver_id}
              className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm text-slate-200"
            >
              <span className="font-mono text-xs text-slate-400">{driver.driver_id}</span>
              <span>
                {driver.first_name} {driver.last_name}
              </span>
              <span className="text-slate-300">{driver.license_number}</span>
              <span
                className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${
                  driver.status === "ACTIVE"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-amber-500/15 text-amber-200"
                }`}
              >
                {driver.status}
              </span>
              <span className="text-slate-400">-</span>
              <span className="text-slate-400">DRIVER</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
