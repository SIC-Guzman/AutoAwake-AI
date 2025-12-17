import { useQuery } from "@tanstack/react-query";
import { fetchTripsList } from "./api/listings";

const statusBadge = (status: string) => {
  const s = status?.toUpperCase();
  if (s === "IN_PROGRESS") return "bg-emerald-500/15 text-emerald-200";
  if (s === "CANCELLED") return "bg-red-500/15 text-red-200";
  return "bg-amber-500/15 text-amber-200";
};

export const AdminTripsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["trips", "list"],
    queryFn: () => fetchTripsList(undefined, 60),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4 w-full">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Viajes</p>
        <h1 className="text-2xl font-bold text-white">Historial reciente</h1>
        <p className="text-sm text-slate-300">
          Últimos viajes con piloto, vehículo y estado.
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-slate-900/50">
        <div className="grid grid-cols-7 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>ID</span>
          <span>Vehículo</span>
          <span>Piloto</span>
          <span>Origen</span>
          <span>Destino</span>
          <span>Estado</span>
          <span>Inicio</span>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Cargando viajes...</div>
          )}
          {isError && (
            <div className="px-4 py-3 text-sm text-red-200">
              No se pudieron cargar los viajes. Revisa el backend.
            </div>
          )}
          {!isLoading && !isError && (data?.length ?? 0) === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No hay viajes registrados.</div>
          )}
          {data?.map((trip) => (
            <div
              key={trip.trip_id}
              className="grid grid-cols-7 items-center gap-2 px-4 py-3 text-sm text-slate-200"
            >
              <span className="font-mono text-xs text-slate-400">{trip.trip_id}</span>
              <span>{trip.vehicle_plate ?? `ID ${trip.vehicle_id}`}</span>
              <span>{trip.driver_name ?? `ID ${trip.driver_id}`}</span>
              <span className="text-slate-300">{trip.origin}</span>
              <span className="text-slate-300">{trip.destination}</span>
              <span
                className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${statusBadge(trip.status)}`}
              >
                {trip.status}
              </span>
              <span className="text-slate-400">
                {new Date(trip.started_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
