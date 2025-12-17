const highlights = [
  {
    title: "Stack robusto",
    body: "FastAPI + MySQL en backend; React + Vite + Tailwind v4.1 en frontend; Raspberry Pi en campo.",
  },
  {
    title: "Seguridad primero",
    body: "Autenticación vía token JWT, interceptores Axios y limpieza de sesión cuando el backend devuelve 401.",
  },
  {
    title: "Listo para producción",
    body: "Arquitectura por features, clientes reusables y TanStack Query para reintentos y caché controlada.",
  },
];

const values = [
  "Prevención de accidentes por somnolencia.",
  "Experiencia clara para administradores de flotas.",
  "Insights accionables: tendencias, horarios críticos y pilotos a capacitar.",
  "Respuesta inmediata con buzzer y luz de emergencia en el vehículo.",
];

export const AboutPage = () => {
  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-900/50">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
          Samsung Hackathon · Contexto
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          AutoAwake AI: diseño centrado en seguridad y claridad
        </h1>
        <p className="mt-3 text-sm text-slate-200">
          El panel web permite a los administradores detectar y atender
          somnolencia al volante en segundos. La interfaz privilegia la
          legibilidad, el contraste y una jerarquía clara de llamadas a la
          acción para operaciones nocturnas o de alto estrés.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/40"
          >
            <p className="text-lg font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-transparent p-6 shadow-xl shadow-cyan-500/20">
          <p className="text-xs uppercase tracking-[0.25em] text-white">
            Qué defendemos
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Seguridad operacional
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {values.map((value) => (
              <li key={value} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-cyan-200">
                  •
                </span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-900/40">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Arquitectura
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Cómo se conecta todo
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            <p>
              1) La Raspberry Pi procesa video y detecta eventos con el modelo
              de IA. 2) Envía la alerta al backend FastAPI que persiste en
              MySQL y valida el JWT de la sesión admin. 3) El frontend consulta
              el endpoint `/auth/login` con Axios y TanStack Query maneja
              reintentos suaves.
            </p>
            <p>
              Este proyecto está listo para extenderse con dashboards en vivo,
              listas de alertas y CRUD de pilotos/vehículos manteniendo la
              misma arquitectura por features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
