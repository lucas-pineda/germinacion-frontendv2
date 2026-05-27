/** Payload publicado en `germinador/telemetria` cada ~10s */
export interface TelemetrySnapshot {
  ts: number;
  sensores: {
    temp_aire: number;
    hum_aire: number;
    hum_suelo: number;
  };
  actuadores: {
    bomba: boolean;
    foco_sugerido: string;
  };
  sistema: {
    nivel_sensibilidad: number;
    cooldown_restante_s: number;
    anomalia_humedad: boolean;
    anomalia_termica: boolean;
  };
  metricas: {
    uptime_s: number;
    bomba_on_total_s: number;
    ciclos_riego: number;
    temp_max: number;
    temp_min: number;
  };
}