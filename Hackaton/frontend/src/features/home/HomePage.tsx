import { Link } from "react-router-dom";

const stats = [
  { label: "Alertas atendidas", value: "2.4k", detail: "respuestas en <10s" },
  { label: "Flota activa", value: "128", detail: "vehículos conectados" },
  { label: "Reducción de riesgo", value: "38%", detail: "menos incidentes" },
];

const capabilities = [
  {
    title: "Monitoreo en vivo",
    desc: "Cámaras embarcadas detectan somnolencia con IA y envían telemetría al instante.",
    tag: "Edge + nube",
  },
  {
    title: "Alertas inteligentes",
    desc: "Prioriza eventos críticos, dispara buzzer y notifica al panel para actuar en segundos.",
    tag: "Respuesta inmediata",
  },
  {
    title: "Analítica ejecutiva",
    desc: "Panel para admins: incidencias por conductor, vehículo y horarios con históricos claros.",
    tag: "Decisiones de negocio",
  },
];

const steps = [
  "La Raspberry Pi detecta signos de somnolencia con visión por computadora.",
  "Si hay riesgo, activa alarma local y envía el evento al backend FastAPI.",
  "El panel web recibe la alerta, muestra al conductor y vehículo afectados.",
  "El administrador confirma, escalando a RRHH o logística con trazabilidad.",
];

export const HomePage = () => {
  return (
    <div className="space-y-14">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Monitoreo de somnolencia en tiempo real
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Control inteligente para flotas despiertas y seguras.
            </h1>
            <p className="text-lg text-slate-300">
              AutoAwake AI combina hardware IoT, FastAPI y un panel web para
              alertar a los administradores cuando un conductor muestra signos
              de fatiga. Responde rápido, protege a tu equipo y mantén la
              operación sin sobresaltos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-[#041022] shadow-lg shadow-cyan-500/30 transition hover:-translate-y-[1px]"
            >
              Entrar al panel admin
              <span aria-hidden>↗</span>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
            >
              Cómo lo construimos
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-900/40"
              >
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="text-xs text-cyan-200/90">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-6 h-64 w-64 rounded-full bg-cyan-400/20 blur-[90px]" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-slate-950/30 shadow-xl shadow-cyan-500/20">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Panel de alertas
                </p>
                <p className="text-lg font-semibold text-white">
                  Turno nocturno · Flota GT
                </p>
              </div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                En vivo
              </div>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-emerald-100">
                  <span>Somnolencia detectada</span>
                  <span className="text-xs text-emerald-200">hace 18s</span>
                </div>
                <p className="mt-2 text-sm text-slate-100">
                  Piloto <strong className="text-white">D-142</strong> en
                  vehículo <strong className="text-white">GT-09</strong>. Se
                  activó buzzer y luz de emergencia.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Respuesta media
                  </p>
                  <p className="text-2xl font-bold text-white">08s</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Estado de flota
                  </p>
                  <p className="text-2xl font-bold text-white">96% estable</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 p-4 text-slate-200">
                <p className="text-sm font-semibold text-white">Listo para admins</p>
                <p className="text-sm text-slate-300">
                  Ingresa con tu cuenta para configurar vehículos, pilotos y
                  recibir alertas priorizadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-cyan-500/20 text-center text-lg font-bold text-cyan-200 shadow-lg shadow-cyan-500/30">
            ↑
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Capabilities
            </p>
            <p className="text-xl font-semibold text-white">
              Diseñado para administradores de flota
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => (
            <div
              key={capability.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-900/50 transition hover:-translate-y-[2px] hover:border-cyan-300/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-white">
                  {capability.title}
                </p>
                <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                  {capability.tag}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{capability.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-slate-900/60 to-[#040915] p-8 shadow-xl shadow-cyan-500/10">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
            Flujo operativo
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Cómo AutoAwake protege a tu equipo
          </h2>
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-100">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
