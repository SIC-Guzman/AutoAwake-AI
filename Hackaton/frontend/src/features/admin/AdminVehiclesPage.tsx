import { useQuery } from "@tanstack/react-query";
import { fetchVehiclesList } from "./api/listings";

export const AdminVehiclesPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles", "list"],
    queryFn: fetchVehiclesList,
    refetchInterval: 45_000,
  });

  return (
    <div className="space-y-4 w-full">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Vehículos</p>
        <h1 className="text-2xl font-bold text-white">Flota registrada</h1>
        <p className="text-sm text-slate-300">Estado operativo y placas.</p>
      </div>

      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-slate-900/50">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>ID</span>
          <span>Placa</span>
          <span>Marca/Modelo</span>
          <span>Status</span>
          <span>Comentarios</span>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Cargando vehículos...</div>
          )}
          {isError && (
            <div className="px-4 py-3 text-sm text-red-200">
              No se pudieron cargar los vehículos. Revisa el backend.
            </div>
          )}
          {!isLoading && !isError && (data?.length ?? 0) === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No hay vehículos.</div>
          )}
          {data?.map((vehicle) => (
            <div
              key={vehicle.vehicle_id}
              className="grid grid-cols-5 items-center gap-2 px-4 py-3 text-sm text-slate-200"
            >
              <span className="font-mono text-xs text-slate-400">{vehicle.vehicle_id}</span>
              <span className="font-semibold text-white">{vehicle.plate}</span>
              <span className="text-slate-200">
                {vehicle.brand} · {vehicle.model}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${
                  vehicle.status === "ACTIVE"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : vehicle.status === "MAINTENANCE"
                      ? "bg-amber-500/15 text-amber-200"
                      : "bg-slate-500/20 text-slate-200"
                }`}
              >
                {vehicle.status}
              </span>
              <span className="text-slate-400">-</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
