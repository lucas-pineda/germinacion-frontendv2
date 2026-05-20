// src/config/env.js
// Configuración de URLs (REST + WebSocket)

const API_BASE = import.meta.env.VITE_API_URL || 'https://autogerminador-production.up.railway.app';
const WS_BASE  = (import.meta.env.VITE_WS_URL || API_BASE).replace(/^http/, 'ws');

export const config = {
  apiBase: `${API_BASE}/api/v1`,
  wsAll:    `${WS_BASE}/ws`,
  wsDevice: (deviceId) => `${WS_BASE}/ws/${deviceId}`,
  defaultPage: 1,
  defaultSize: 50,
};