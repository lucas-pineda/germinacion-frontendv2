// ──────────────────────────────────────────────────────────────────────────────
// src/services/sensorService.js
// CRUD completo para /api/v1/sensors/
// ──────────────────────────────────────────────────────────────────────────────

import api from './api';

/**
 * Lista lecturas con paginación y filtros opcionales.
 * @param {{ page?, size?, device_id?, from_dt?, to_dt? }} params
 */
export const getSensors = (params = {}) =>
  api.get('/sensors/', { params }).then((r) => r.data);

/**
 * Obtiene una lectura por su ID.
 * @param {string|number} readingId
 */
export const getSensorById = (readingId) =>
  api.get(`/sensors/${readingId}`).then((r) => r.data);

/**
 * Crea una nueva lectura de sensor.
 * @param {object} payload - Datos de la lectura
 */
export const createSensor = (payload) =>
  api.post('/sensors/', payload).then((r) => r.data);

/**
 * Actualiza una lectura existente.
 * @param {string|number} readingId
 * @param {object} payload
 */
export const updateSensor = (readingId, payload) =>
  api.put(`/sensors/${readingId}`, payload).then((r) => r.data);

/**
 * Elimina una lectura.
 * @param {string|number} readingId
 */
export const deleteSensor = (readingId) =>
  api.delete(`/sensors/${readingId}`).then((r) => r.data);

// ── Helpers de dominio ────────────────────────────────────────────────────────

/**
 * Devuelve la lectura más reciente de cada device_id.
 * Útil para construir la vista "estado actual" del dashboard.
 * @param {object[]} readings - Array de lecturas del backend
 */
export const latestPerDevice = (readings = []) => {
  const map = new Map();
  readings.forEach((r) => {
    const prev = map.get(r.device_id);
    if (!prev || new Date(r.timestamp) > new Date(prev.timestamp)) {
      map.set(r.device_id, r);
    }
  });
  return [...map.values()];
};

/**
 * Normaliza una lectura del backend al formato que usa el frontend.
 * Ajusta este mapeo a los campos reales de tu modelo Pydantic.
 * @param {object} r - Lectura cruda del backend
 */
export const normalizeReading = (r) => {
  // Mapea los nombres de Supabase a los del frontend
  const timestamp = r.timestamp ?? r.time_medition;
  
  return {
    id:       r.id,
    deviceId: r.device_id,
    hora:     new Date(timestamp).toLocaleTimeString('es-CO'),
    temp:     r.temperature   ?? r.temperatura    ?? 0,
    humedad:  r.humidity      ?? r.humedad        ?? 0,
    co2:      r.co2           ?? 0,
    luz:      r.light         ?? r.luz            ?? 0,
    ph:       r.ph            ?? 0,
    ec:       r.ec            ?? 0,
    bateria:  r.battery       ?? r.bateria        ?? 0,
    senal:    r.signal_strength ?? r.senal        ?? 0,
    timestamp: timestamp,
  };
};