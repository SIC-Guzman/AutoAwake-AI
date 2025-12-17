import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlertHistory } from "./api/alerts";

const severityBadge = (severity: string) => {
  const level = severity?.toUpperCase();
  if (level === "HIGH" || level === "CRITICAL") return "bg-red-500/15 text-red-200";
  if (level === "MEDIUM") return "bg-amber-500/15 text-amber-200";
  return "bg-emerald-500/15 text-emerald-200";
};

const formatDateForApi = (value: string) => {
  if (!value) return undefined;
  // value comes as YYYY-MM-DDTHH:mm
  return value.replace("T", " ") + ":00";
};

export const AdminAlertsPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryParams = useMemo(
    () => ({
      start_date: formatDateForApi(from),
      end_date: formatDateForApi(to),
    }),
    [from, to],
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["alerts", "history", queryParams],
    queryFn: () => fetchAlertHistory(queryParams),
    refetchInterval: 45_000,
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Alertas</p>
          <h1 className="text-2xl font-bold text-white">Historial de alertas</h1>
          <p className="text-sm text-slate-300">
            Consulta alertas con filtros por fecha. Refresco automático cada 45s.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex flex-col text-slate-200">
            <label className="text-xs text-slate-400">Desde</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="flex flex-col text-slate-200">
            <label className="text-xs text-slate-400">Hasta</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1224] px-3 py-2 text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="self-end rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 font-semibold text-[#041022] shadow-lg shadow-cyan-500/25 transition hover:-translate-y-[1px]"
          >
            {isFetching ? "Actualizando..." : "Aplicar filtros"}
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-slate-900/50">
        <div className="grid grid-cols-7 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>ID</span>
          <span>Piloto</span>
          <span>Vehículo</span>
          <span>Tipo</span>
          <span>Severidad</span>
          <span>Mensaje</span>
          <span>Fecha</span>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Cargando alertas...</div>
          )}
          {isError && (
            <div className="px-4 py-3 text-sm text-red-200">
              No se pudo cargar el historial. Verifica el backend.
            </div>
          )}
          {!isLoading && !isError && (data?.length ?? 0) === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No hay alertas en el rango.</div>
          )}
          {data?.map((alert) => (
            <div
              key={alert.alert_id}
              className="grid grid-cols-7 items-center gap-2 px-4 py-3 text-sm text-slate-200"
            >
              <span className="font-mono text-xs text-slate-400">{alert.alert_id}</span>
              <span>{alert.driver_name ?? `ID ${alert.driver_id}`}</span>
              <span>{alert.vehicle_plate ?? `ID ${alert.vehicle_id}`}</span>
              <span className="text-slate-300">{alert.alert_type}</span>
              <span
                className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${severityBadge(alert.severity)}`}
              >
                {alert.severity}
              </span>
              <span className="text-slate-300 line-clamp-2">{alert.message}</span>
              <span className="text-slate-400">
                {new Date(alert.detected_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
