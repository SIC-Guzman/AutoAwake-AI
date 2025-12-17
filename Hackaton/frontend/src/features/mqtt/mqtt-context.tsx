import type { PropsWithChildren } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mqtt from "mqtt";
import type { MqttClient } from "mqtt";
import toast from "react-hot-toast";

type AlertPayload = {
  trip_id?: number;
  alert_type?: string;
  severity?: string;
  message?: string;
  detected_at?: string;
  driver_name?: string;
  vehicle_plate?: string;
  bpm?: number;
  timestamp?: string | number;
};

type BpmSignal = {
  trip_id: number;
  bpm: number;
  timestamp?: string | number;
  receivedAt: number;
  raw: AlertPayload;
};

type MqttState = {
  connected: boolean;
  lastAlert: AlertPayload | null;
  lastError: string | null;
  bpmSignals: BpmSignal[];
};

const defaultState: MqttState = {
  connected: false,
  lastAlert: null,
  lastError: null,
  bpmSignals: [],
};

const MqttContext = createContext<MqttState>(defaultState);

const broker = import.meta.env.VITE_MQTT_BROKER;
const port = import.meta.env.VITE_MQTT_PORT || "8084"; // EMQX wss default
const protocol = import.meta.env.VITE_MQTT_PROTOCOL || (port === "8084" ? "wss" : "ws");
const path = import.meta.env.VITE_MQTT_PATH || "/mqtt";
const mqttUrl =
  import.meta.env.VITE_MQTT_URL ||
  (broker ? `${protocol}://${broker}:${port}${path}` : "ws://localhost:9001");
const topicAlerts = import.meta.env.VITE_MQTT_TOPIC_ALERTS || "autoawake/bpm";
const reconnectMs = Number(import.meta.env.VITE_MQTT_RECONNECT_MS ?? 3000);
const username = import.meta.env.VITE_MQTT_USER;
const password = import.meta.env.VITE_MQTT_PASSWORD;
const clientId =
  import.meta.env.VITE_MQTT_CLIENT_ID ||
  `autoawake-web-${Math.random().toString(16).slice(2, 8)}`;

const severityColor = (severity?: string) => {
  const level = (severity ?? "").toUpperCase();
  if (["HIGH", "CRITICAL"].includes(level)) return "#f87171";
  if (level === "MEDIUM") return "#fbbf24";
  return "#34d399";
};

const showAlertToast = (payload: AlertPayload) => {
  const sev = payload.severity ?? "INFO";
  const color = severityColor(sev);
  toast.custom(
    (t) => (
      <div
        className={`flex max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1428] px-4 py-3 shadow-lg shadow-black/30 ${
          t.visible ? "animate-enter" : "animate-leave"
        }`}
      >
        <div
          className="mt-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
        />
        <div className="flex-1 text-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
            Alerta {sev}
          </p>
          <p className="text-white font-semibold">{payload.alert_type ?? "MQTT"}</p>
          <p className="text-slate-300">{payload.message ?? "Nueva alerta recibida"}</p>
          {payload.trip_id && (
            <p className="text-[11px] text-slate-500 mt-1">
              Viaje #{payload.trip_id} · {new Date().toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    ),
    { duration: 4500 },
  );
};

export const MqttProvider = ({ children }: PropsWithChildren) => {
  const clientRef = useRef<MqttClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertPayload | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [bpmSignals, setBpmSignals] = useState<BpmSignal[]>([]);

  const options = useMemo(
    () => ({
      clientId,
      protocolVersion: 5 as const,
      username,
      password,
      clean: true,
      reconnectPeriod: reconnectMs,
      keepalive: 30,
      connectTimeout: 5000,
    }),
    [clientId, password, reconnectMs, username],
  );

  useEffect(() => {
    const client = mqtt.connect(mqttUrl, options);
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      setLastError(null);
      client.subscribe(topicAlerts, (err) => {
        if (err) {
          setLastError(`No se pudo suscribir a ${topicAlerts}`);
        }
      });
    });

    client.on("reconnect", () => {
      setConnected(false);
    });

    client.on("error", (err) => {
      setLastError(err?.message ?? "Error MQTT");
      setConnected(false);
    });

    client.on("close", () => {
      setConnected(false);
    });

    client.on("message", (_, payload) => {
      try {
        const parsed: AlertPayload = JSON.parse(payload.toString());

        if (typeof parsed.bpm === "number" && typeof parsed.trip_id === "number") {
          const entry: BpmSignal = {
            trip_id: parsed.trip_id,
            bpm: parsed.bpm,
            timestamp: parsed.timestamp,
            receivedAt: Date.now(),
            raw: parsed,
          };
          setBpmSignals((prev) => [entry, ...prev].slice(0, 20));
        }

        if (parsed.alert_type || parsed.message || parsed.severity) {
          setLastAlert(parsed);
          showAlertToast(parsed);
        }
      } catch (err) {
        setLastError(`Error parseando payload MQTT: ${String(err)}`);
      }
    });

    return () => {
      client.removeAllListeners();
      client.end(true);
      clientRef.current = null;
    };
  }, [options]);

  const value = useMemo(
    () => ({
      connected,
      lastAlert,
      lastError,
      bpmSignals,
    }),
    [connected, lastAlert, lastError, bpmSignals],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => useContext(MqttContext);
