import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMqtt } from "../mqtt/mqtt-context";
import { fetchActiveTripStats } from "./api/dashboard";

const timeAgo = (value?: string | number) => {
  if (!value) return "N/D";
  const ts = typeof value === "number" ? value : new Date(value).getTime();
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

const bpmTone = (bpm: number) => {
  if (bpm >= 120) return "text-red-300";
  if (bpm >= 90) return "text-amber-200";
  return "text-emerald-200";
};

export const AdminSignalsPage = () => {
  const { connected, lastAlert, lastError, bpmSignals } = useMqtt();
  const { data: activeTrips } = useQuery({
    queryKey: ["trips", "active-stats", "signals"],
    queryFn: fetchActiveTripStats,
    refetchInterval: 30_000,
  });

  const latestBpm = bpmSignals[0];

  const bpmWithDriver = useMemo(
    () =>
      bpmSignals.map((entry) => {
        const trip = activeTrips?.active_trips.find((t) => t.trip_id === entry.trip_id);
        return { entry, trip };
      }),
    [bpmSignals, activeTrips?.active_trips],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Señales MQTT</p>
          <h1 className="text-3xl font-bold text-white">Alertas en vivo + BPM</h1>
          <p className="text-sm text-slate-300">
            Suscripción directa al broker MQTT: toasts de alerta inmediatos y bitácora de BPM
            por viaje (trip_id).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
              connected ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-300"}`} />
            {connected ? "Conectado al broker" : "Reconectando MQTT"}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-slate-200">
            Topic: {import.meta.env.VITE_MQTT_TOPIC_ALERTS ?? "autoawake/bpm"}
          </span>
        </div>
      </header>

      {lastError && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {lastError}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Última alerta</p>
              <p className="text-lg font-semibold text-white">
                {lastAlert?.alert_type ?? "Sin alertas recibidas"}
              </p>
            </div>
            {lastAlert?.severity && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {lastAlert.severity}
              </span>
            )}
          </div>
          {lastAlert ? (
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              <p>{lastAlert.message}</p>
              <p className="text-xs text-slate-400">
                Viaje #{lastAlert.trip_id ?? "N/D"} · {new Date().toLocaleTimeString()}
              </p>
              {lastAlert.driver_name && (
                <p className="text-xs text-slate-400">Piloto: {lastAlert.driver_name}</p>
              )}
              {lastAlert.vehicle_plate && (
                <p className="text-xs text-slate-400">Vehículo: {lastAlert.vehicle_plate}</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              En cuanto llegue una alerta MQTT, la verás aquí y como toast instantáneo.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/30">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ejemplo payload</p>
          <p className="text-sm text-slate-200">
            Desde el dispositivo publica así para BPM:
          </p>
          <pre className="mt-3 overflow-auto rounded-2xl bg-[#0a1224]/90 p-4 text-xs text-emerald-100">
{`mqtt_handler.publish_alert(
    trip_id=1,
    timestamp="2024-11-30T12:45:00",
    bpm=92
)`}
          </pre>
          <p className="mt-2 text-xs text-slate-400">
            La app mostrará el BPM en vivo y lo intentará mapear al viaje/chofer activo.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Señales BPM</p>
            <p className="text-lg font-semibold text-white">Últimos 20 eventos</p>
            <p className="text-xs text-slate-500">
              Se almacena solo en memoria (no se consulta al backend).
            </p>
          </div>
          {latestBpm && (
            <div className="rounded-2xl bg-emerald-400/10 px-4 py-2 text-center shadow-inner shadow-emerald-400/20">
              <p className="text-xs text-emerald-200">Último BPM</p>
              <p className="text-2xl font-bold text-white">{latestBpm.bpm}</p>
              <p className="text-[10px] text-slate-400">
                Viaje #{latestBpm.trip_id} · {timeAgo(latestBpm.timestamp ?? latestBpm.receivedAt)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-[#0a1224]/70">
          <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Viaje</span>
            <span>Piloto</span>
            <span>Vehículo</span>
            <span>BPM</span>
            <span>Timestamp</span>
            <span>Recibido</span>
          </div>
          <div className="divide-y divide-white/5">
            {bpmWithDriver.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">
                Aún no se reciben señales de BPM por MQTT.
              </div>
            )}
            {bpmWithDriver.map(({ entry, trip }) => (
              <div
                key={`${entry.trip_id}-${entry.receivedAt}`}
                className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm text-slate-200"
              >
                <span className="font-mono text-xs text-slate-300">{entry.trip_id}</span>
                <span>{trip?.driver_name ?? "N/D"}</span>
                <span>{trip?.vehicle_plate ?? "N/D"}</span>
                <span className={`font-semibold ${bpmTone(entry.bpm)}`}>{entry.bpm} bpm</span>
                <span className="text-slate-300 text-xs">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "N/D"}
                </span>
                <span className="text-slate-400 text-xs">{timeAgo(entry.receivedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
