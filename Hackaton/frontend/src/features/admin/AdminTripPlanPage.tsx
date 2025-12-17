import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTripPlan, fetchDriversList, fetchTripPlans, fetchVehiclesList } from "./api/listings";

export const AdminTripPlanPage = () => {
  const qc = useQueryClient();
  const driversQuery = useQuery({ queryKey: ["drivers", "list"], queryFn: fetchDriversList });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", "list"], queryFn: fetchVehiclesList });
  const plansQuery = useQuery({ queryKey: ["trip-plans"], queryFn: () => fetchTripPlans(true) });

  const [driverId, setDriverId] = useState<number | "">("");
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const mutation = useMutation({
    mutationFn: createTripPlan,
    onSuccess: () => {
      setOrigin("");
      setDestination("");
      setDriverId("");
      setVehicleId("");
      qc.invalidateQueries({ queryKey: ["trip-plans"] });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!driverId || !vehicleId) return;
    mutation.mutate({ driver_id: Number(driverId), vehicle_id: Number(vehicleId), origin, destination });
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Planear viajes</p>
        <h1 className="text-2xl font-bold text-white">Crear viaje pendiente</h1>
        <p className="text-sm text-slate-300">
          Define piloto, vehículo y ruta. El viaje se iniciará automáticamente cuando llegue una alerta TRIP de ese piloto/vehículo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-900/40 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white">Piloto</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            required
          >
            <option value="">Selecciona piloto</option>
            {driversQuery.data?.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>
                {d.first_name} {d.last_name} · {d.license_number}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white">Vehículo</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            required
          >
            <option value="">Selecciona vehículo</option>
            {vehiclesQuery.data?.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.plate} · {v.brand} {v.model}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-semibold text-white">Origen</label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="CDMX Patio Central"
            className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            required
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-semibold text-white">Destino</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Toluca Centro Logístico"
            className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            required
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-[#041022] shadow-lg shadow-cyan-500/25 transition hover:-translate-y-[1px] disabled:opacity-70"
          >
            {mutation.isLoading ? "Guardando..." : "Crear plan"}
          </button>
          {mutation.isError && (
            <p className="text-sm text-red-200">No se pudo crear el plan. Revisa el backend.</p>
          )}
          {mutation.isSuccess && (
            <p className="text-sm text-emerald-200">Plan creado y listo para activar.</p>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Planes activos</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["trip-plans"] })}
            className="text-xs text-cyan-200 hover:text-white"
          >
            Refrescar
          </button>
        </div>
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-slate-900/40">
          <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>ID</span>
            <span>Piloto</span>
            <span>Vehículo</span>
            <span>Origen</span>
            <span>Destino</span>
            <span>Estado</span>
          </div>
          <div className="divide-y divide-white/5">
            {plansQuery.isLoading && (
              <div className="px-4 py-3 text-sm text-slate-400">Cargando planes...</div>
            )}
            {!plansQuery.isLoading && (plansQuery.data?.length ?? 0) === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No hay planes activos.</div>
            )}
            {plansQuery.data?.map((plan) => (
              <div
                key={plan.plan_id}
                className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm text-slate-200"
              >
                <span className="font-mono text-xs text-slate-400">{plan.plan_id}</span>
                <span>{plan.driver_name ?? plan.driver_id}</span>
                <span>{plan.vehicle_plate ?? plan.vehicle_id}</span>
                <span className="text-slate-300">{plan.origin}</span>
                <span className="text-slate-300">{plan.destination}</span>
                <span
                  className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${
                    plan.is_active ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-500/20 text-slate-200"
                  }`}
                >
                  {plan.is_active ? "Activo" : "Usado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
