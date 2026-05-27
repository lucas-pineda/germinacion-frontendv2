import type { TelemetrySnapshot } from "../types/telemetry";

/** Valor inválido o sensor en fallo (p. ej. -1) */
export function isSensorInvalid(value: number | null | undefined): boolean {
  return value == null || value < 0;
}

export function formatSensorValue(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (isSensorInvalid(value)) return "--";
  return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
}

export function parseSensorNumber(value: number | null | undefined): number | null {
  if (isSensorInvalid(value)) return null;
  return value;
}

export function focoSugeridoOn(foco: string | undefined): boolean {
  if (!foco) return false;
  return foco.trim().toUpperCase() !== "OFF";
}

export interface SensorDisplay {
  tempAir: string;
  humidityAir: string;
  soilMoisture: string;
  tempAirNum: number | null;
  humidityAirNum: number | null;
  soilMoistureNum: number | null;
  pumpActive: boolean;
  lightRecommended: boolean;
}

export function snapshotToSensorDisplay(
  snapshot: TelemetrySnapshot | null,
): SensorDisplay {
  if (!snapshot) {
    return {
      tempAir: "--",
      humidityAir: "--",
      soilMoisture: "--",
      tempAirNum: null,
      humidityAirNum: null,
      soilMoistureNum: null,
      pumpActive: false,
      lightRecommended: false,
    };
  }

  const { sensores, actuadores } = snapshot;
  return {
    tempAir: formatSensorValue(sensores.temp_aire, 1),
    humidityAir: formatSensorValue(sensores.hum_aire, 0),
    soilMoisture: formatSensorValue(sensores.hum_suelo, 0),
    tempAirNum: parseSensorNumber(sensores.temp_aire),
    humidityAirNum: parseSensorNumber(sensores.hum_aire),
    soilMoistureNum: parseSensorNumber(sensores.hum_suelo),
    pumpActive: actuadores.bomba,
    lightRecommended: focoSugeridoOn(actuadores.foco_sugerido),
  };
}

export function cooldownRemainingMinutes(snapshot: TelemetrySnapshot | null): number {
  if (!snapshot) return 0;
  return Math.ceil(snapshot.sistema.cooldown_restante_s / 60);
}