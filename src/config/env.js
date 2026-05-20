// src/config/env.js
// Configuración de URLs (REST + WebSocket)

// Normalize a URL so it always uses HTTPS (never plain HTTP).
// This prevents Mixed Content errors when the app is served over HTTPS.
function forceHttps(url) {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://autogerminador-production.up.railway.app';
const API_BASE    = forceHttps(RAW_API_URL);

const RAW_WS_URL  = import.meta.env.VITE_WS_URL || API_BASE;
const WS_BASE     = forceHttps(RAW_WS_URL).replace(/^https/, 'wss').replace(/^http/, 'ws');

console.log('[env] API_BASE:', API_BASE);
console.log('[env] WS_BASE:', WS_BASE);

export const config = {
  apiBase: `${API_BASE}/api/v1`,
  wsAll:    `${WS_BASE}/ws`,
  wsDevice: (deviceId) => `${WS_BASE}/ws/${deviceId}`,
  defaultPage: 1,
  defaultSize: 50,
};