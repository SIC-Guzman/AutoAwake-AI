import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  fetchActiveAssignments,
  fetchActiveTripStats,
  fetchAlerts,
  fetchDrivers,
  fetchOpenIssues,
  fetchVehicles,
} from "./api/dashboard";

const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-white/10 ${className ?? ""}`} />
);

const severityBadge = (severity: string) => {
  const level = severity?.toUpperCase();
  if (level === "HIGH" || level === "CRITICAL") {
    return "bg-red-500/15 text-red-200";
  }
  if (level === "MEDIUM") return "bg-amber-500/15 text-amber-200";
  return "bg-emerald-500/15 text-emerald-200";
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return "N/D";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

export const AdminOverviewPage = () => {
  const [
    { data: alerts, isLoading: loadingAlerts, isError: errorAlerts },
    { data: vehicles, isLoading: loadingVehicles },
    { data: drivers, isLoading: loadingDrivers },
    { data: assignments, isLoading: loadingAssignments },
    { data: issues, isLoading: loadingIssues },
    { data: activeTripsStats, isLoading: loadingTrips },
  ] = useQueries({
    queries: [
      { queryKey: ["alerts", "today"], queryFn: () => fetchAlerts(12), refetchInterval: 15_000 },
      { queryKey: ["vehicles"], queryFn: fetchVehicles, refetchInterval: 60_000 },
      { queryKey: ["drivers"], queryFn: fetchDrivers, refetchInterval: 60_000 },
      { queryKey: ["assignments", "active"], queryFn: fetchActiveAssignments, refetchInterval: 30_000 },
      { queryKey: ["issues", "open"], queryFn: () => fetchOpenIssues(6), refetchInterval: 45_000 },
      { queryKey: ["trips", "active-stats"], queryFn: fetchActiveTripStats, refetchInterval: 20_000 },
    ],
  });

  const kpis = useMemo(() => {
    const alertsTotal = alerts?.length || 0;
    const critical = alerts?.filter((a) => ["HIGH", "CRITICAL"].includes(a.severity.toUpperCase()))
      .length || 0;
    const vehiclesActive = vehicles?.filter((v) => v.status !== "INACTIVE").length || 0;
    const driversActive = drivers?.filter((d) => d.status === "ACTIVE").length || 0;
    const onDuty = assignments?.length || 0;
    const activeTrips = activeTripsStats?.total_active_trips || 0;
    return [
      {
        label: "Alertas hoy",
        value: alertsTotal.toString(),
        trend: critical > 0 ? `${critical} críticas` : "sin críticas",
        tone: critical > 0 ? "up" : "down",
      },
      {
        label: "Viajes activos",
        value: activeTrips.toString(),
        trend: `${activeTripsStats?.drivers_alert ?? 0} con alertas`,
        tone: (activeTripsStats?.drivers_alert ?? 0) > 0 ? "up" : "down",
      },
      {
        label: "Conductores en turno",
        value: onDuty.toString(),
        trend: `${driversActive} activos`,
        tone: "up",
      },
      {
        label: "Vehículos operativos",
        value: vehiclesActive.toString(),
        trend: `${vehicles?.length ?? 0} en flota`,
        tone: "up",
      },
    ];
  }, [activeTripsStats, alerts, assignments, drivers, vehicles]);

  const loadingKpis =
    loadingAlerts || loadingVehicles || loadingDrivers || loadingAssignments || loadingTrips;
  const lastAlertTime = alerts?.[0]?.detected_at;
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Panel Admin</p>
          <h1 className="text-3xl font-bold text-white">Resumen operativo</h1>
          <p className="text-sm text-slate-300">
            Datos en vivo desde FastAPI + MySQL: alertas, flota, asignaciones y viajes activos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-cyan-300/40"
          >
            Ver arquitectura
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-xs font-semibold text-[#041022] shadow-lg shadow-cyan-500/25"
          >
            Ir a Home
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingKpis
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`kpi-skeleton-${idx}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-900/40"
              >
                <SkeletonPulse className="h-4 w-24 bg-white/10" />
                <div className="mt-3 flex items-end justify-between">
                  <SkeletonPulse className="h-8 w-16" />
                  <SkeletonPulse className="h-4 w-20" />
                </div>
              </div>
            ))
          : kpis.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-900/40"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <span
                    className={`text-xs font-semibold ${
                      item.tone === "up" ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {item.trend}
                  </span>
                </div>
              </div>
            ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Últimas alertas</p>
              <p className="text-lg font-semibold text-white">Supervisión en vivo</p>
              <p className="text-xs text-slate-500">
                Última actualización: {timeAgo(lastAlertTime)} · Refresco automático
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              {loadingAlerts ? "Cargando..." : "En vivo"}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-[#0a1224]/80">
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>ID</span>
              <span>Piloto</span>
              <span>Vehículo</span>
              <span>Tipo</span>
              <span>Severidad</span>
              <span>Hace</span>
            </div>
            <div className="divide-y divide-white/5">
              {loadingAlerts &&
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`alerts-skeleton-${idx}`}
                    className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm"
                  >
                    <SkeletonPulse className="h-4 w-12" />
                    <SkeletonPulse className="h-4 w-24" />
                    <SkeletonPulse className="h-4 w-20" />
                    <SkeletonPulse className="h-4 w-14" />
                    <SkeletonPulse className="h-6 w-16 rounded-full" />
                    <SkeletonPulse className="h-4 w-10" />
                  </div>
                ))}
              {!loadingAlerts && alerts?.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No hay alertas registradas hoy.
                </div>
              )}
              {alerts?.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm text-slate-200"
                >
                  <span className="font-mono text-xs text-slate-300">{alert.alert_id}</span>
                  <span>{alert.driver_name ?? `ID ${alert.driver_id}`}</span>
                  <span>{alert.vehicle_plate ?? `VH-${alert.vehicle_id}`}</span>
                  <span className="text-slate-300">{alert.alert_type}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-center text-xs font-semibold ${severityBadge(alert.severity)}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-slate-400">{timeAgo(alert.detected_at)}</span>
                </div>
              ))}
            </div>
          </div>
          {errorAlerts && (
            <p className="mt-3 text-xs text-red-200">
              No se pudieron cargar las alertas. Verifica el backend.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-transparent p-5 shadow-xl shadow-cyan-500/30">
            <p className="text-xs uppercase tracking-[0.2em] text-white">Estado</p>
            <h3 className="text-lg font-semibold text-white">Checklist rápido</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>• Conductores en turno: {assignments?.length ?? 0}</li>
              <li>• Viajes activos: {activeTripsStats?.total_active_trips ?? 0}</li>
              <li>• Alertas críticas hoy:{" "}
                {alerts?.filter((a) => ["HIGH", "CRITICAL"].includes(a.severity.toUpperCase())).length ?? 0}
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Incidencias abiertas</p>
            <div className="mt-3 space-y-3">
              {loadingIssues &&
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`issue-skeleton-${idx}`}
                    className="rounded-xl border border-white/5 bg-[#0a1224]/80 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <SkeletonPulse className="h-4 w-24" />
                      <SkeletonPulse className="h-3 w-12" />
                    </div>
                    <SkeletonPulse className="mt-2 h-3 w-full" />
                    <SkeletonPulse className="mt-2 h-3 w-2/3" />
                  </div>
                ))}
              {!loadingIssues && (issues?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-400">No hay incidencias abiertas.</p>
              )}
              {issues?.map((issue) => (
                <div
                  key={issue.issue_id}
                  className="rounded-xl border border-white/5 bg-[#0a1224]/80 px-4 py-3 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{issue.issue_type}</p>
                    <span className="text-xs text-cyan-200">{timeAgo(issue.reported_at)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{issue.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vehículo: {issue.vehicle_plate ?? "N/D"} · Piloto:{" "}
                    {issue.driver_name ?? "N/D"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-900/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Viajes activos</p>
            <p className="text-lg font-semibold text-white">Detalle en vivo</p>
          </div>
          <p className="text-xs text-slate-500">
            Drivers con alertas: {activeTripsStats?.drivers_alert ?? 0}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loadingTrips &&
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`trip-skeleton-${idx}`}
                className="rounded-2xl border border-white/5 bg-[#0a1224]/80 p-4 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between">
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonPulse className="mt-2 h-3 w-3/4" />
                <SkeletonPulse className="mt-3 h-3 w-full" />
                <SkeletonPulse className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          {!loadingTrips && (activeTripsStats?.active_trips.length ?? 0) === 0 && (
            <p className="text-sm text-slate-400">No hay viajes activos.</p>
          )}
          {activeTripsStats?.active_trips.map((trip) => (
            <div
              key={trip.trip_id}
              className="rounded-2xl border border-white/5 bg-[#0a1224]/80 p-4 text-sm text-slate-200"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{trip.vehicle_plate}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    trip.critical_alerts > 0
                      ? "bg-red-500/15 text-red-200"
                      : trip.total_alerts > 0
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-emerald-500/15 text-emerald-200"
                  }`}
                >
                  {trip.total_alerts} alertas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Piloto: {trip.driver_name} · {timeAgo(trip.started_at)} en ruta
              </p>
              <p className="mt-2 text-slate-200">
                {trip.origin} → {trip.destination}
              </p>
              <p className="text-xs text-slate-500">
                Última alerta: {trip.last_alert_time ? timeAgo(trip.last_alert_time) : "sin alertas"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
