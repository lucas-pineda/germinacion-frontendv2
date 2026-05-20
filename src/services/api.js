// ──────────────────────────────────────────────────────────────────────────────
// src/services/api.js
// Cliente HTTP base con manejo de errores
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((cfg) => {
  // TODO: cuando tengas JWT
  // const token = localStorage.getItem('verdex_token');
  // if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status;
    const message = err.response?.data?.detail || err.message;
    console.error(`[API] ${status ?? 'Network'} — ${message}`);
    return Promise.reject(err);
  }
);

export default api;