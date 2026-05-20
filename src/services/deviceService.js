// ──────────────────────────────────────────────────────────────────────────────
// src/services/deviceService.js
// Servicios para control de dispositivos y lectura de datos
// ──────────────────────────────────────────────────────────────────────────────

import api from './api';

/**
 * Obtiene lista de todos los dispositivos con su último estado
 */
export const getAllDevices = async () => {
  const { data } = await api.get('/devices');
  return data;
};

/**
 * Obtiene estado actual de un dispositivo específico
 */
export const getDeviceStatus = async (deviceId) => {
  const { data } = await api.get(`/devices/${deviceId}/status`);
  return data;
};

/**
 * Obtiene últimas lecturas de un dispositivo
 */
export const getDeviceReadings = async (deviceId, limit = 50) => {
  const { data } = await api.get(`/sensors/`, {
    params: {
      device_id: deviceId,
      limit,
    },
  });
  return data;
};

/**
 * Envía comando a un dispositivo
 */
export const sendCommand = async (deviceId, action, value) => {
  const { data } = await api.post(`/devices/${deviceId}/command`, {
    action,
    value,
  });
  return data;
};

/**
 * Cambia el perfil de cultivo del dispositivo
 */
export const updateDeviceProfile = async (deviceId, profile) => {
  const { data } = await api.put(`/devices/${deviceId}/profile`, profile);
  return data;
};

/**
 * Obtiene alertas de un dispositivo
 */
export const getDeviceAlerts = async (deviceId, limit = 20) => {
  const { data } = await api.get(`/devices/${deviceId}/alerts`, {
    params: { limit },
  });
  return data;
};

/**
 * Obtiene análisis IA de los datos
 */
export const analyzeWithAI = async (deviceId, question) => {
  const { data } = await api.post('/ai/analyze', {
    device_id: deviceId,
    question,
    limit: 50,
  });
  return data;
};

// ← Exportar como default
export default {
  getAllDevices,
  getDeviceStatus,
  getDeviceReadings,
  sendCommand,
  updateDeviceProfile,
  getDeviceAlerts,
  analyzeWithAI,
};