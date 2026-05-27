import { useCallback, useEffect, useRef, useState } from "react";
import mqtt, { type MqttClient } from "mqtt";
import {
  COMMAND_LOG_MAX,
  MQTT_TOPIC_COMMANDS,
  MQTT_TOPIC_LOGS,
  MQTT_TOPIC_TELEMETRY,
  MQTT_WS_URL,
} from "../config/mqtt";
import type { TelemetrySnapshot } from "../types/telemetry";

function localTimestamp() {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseTelemetryPayload(raw: string): TelemetrySnapshot | null {
  try {
    const data = JSON.parse(raw) as TelemetrySnapshot;
    if (typeof data.ts !== "number" || !data.sensores || !data.actuadores) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export interface CommandLogEntry {
  id: number;
  at: string;
  text: string;
}

export interface UseMqttResult {
  connected: boolean;
  snapshot: TelemetrySnapshot | null;
  error: string | null;
  commandLog: CommandLogEntry[];
  publishCommand: (cmd: string, options?: { skipLog?: boolean }) => boolean;
}

export function useMqtt(): UseMqttResult {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const clientRef = useRef<MqttClient | null>(null);

  const pushCommandLog = useCallback((text: string) => {
    setCommandLog((prev) => [
      ...prev.slice(-(COMMAND_LOG_MAX - 1)),
      { id: Date.now(), at: localTimestamp(), text },
    ]);
  }, []);

  useEffect(() => {
    const client = mqtt.connect(MQTT_WS_URL, {
      clean: true,
      reconnectPeriod: 4000,
      connectTimeout: 12_000,
      protocolVersion: 4,
    });

    clientRef.current = client;

    const onConnect = () => {
      setConnected(true);
      setError(null);
      client.subscribe([MQTT_TOPIC_TELEMETRY, MQTT_TOPIC_LOGS], (err) => {
        if (err) setError(`Suscripción fallida: ${err.message}`);
      });
    };

    const onMessage = (topic: string, payload: Buffer) => {
      const raw = payload.toString();

      if (topic === MQTT_TOPIC_TELEMETRY) {
        const parsed = parseTelemetryPayload(raw);
        if (parsed) setSnapshot(parsed);
        return;
      }

      if (topic === MQTT_TOPIC_LOGS) {
        const trimmed = raw.trim();
        if (trimmed.length > 0) {
          pushCommandLog(`ESP32: ${trimmed}`);
        }
      }
    };

    client.on("connect", onConnect);
    client.on("message", onMessage);
    client.on("error", (err) => setError(err.message));
    client.on("offline", () => setConnected(false));
    client.on("close", () => setConnected(false));
    client.on("reconnect", () => setError(null));

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [pushCommandLog]);

  const publishCommand = useCallback(
    (cmd: string, options?: { skipLog?: boolean }) => {
      const client = clientRef.current;
      if (!client?.connected) {
        setError("MQTT no conectado — no se pudo enviar el comando");
        return false;
      }
      client.publish(MQTT_TOPIC_COMMANDS, cmd, { qos: 0 }, (err) => {
        if (err) setError(`Publicación fallida: ${err.message}`);
      });
      if (!options?.skipLog) {
        pushCommandLog(`→ ${cmd}`);
      }
      return true;
    },
    [pushCommandLog],
  );

  return { connected, snapshot, error, commandLog, publishCommand };
}
