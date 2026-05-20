// src/components/icons/Ico.jsx
// Repositorio central de íconos SVG del sistema VERDEX.
import React from 'react';
export const Ico = {
  inicio: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M7 18v-6h6v6" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  asistente: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" />
      <path d="M13 5l1.5-1.5M7 5L5.5 3.5M10 4V2" />
    </svg>
  ),
  crecimiento: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <polyline points="2,16 7,10 11,13 17,5" />
      <polyline points="14,5 17,5 17,8" />
    </svg>
  ),
  sensores: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M4.5 4.5a7.5 7.5 0 0110.6 0" />
      <path d="M15.5 15.5a7.5 7.5 0 01-10.6 0" />
      <path d="M6.7 6.7a4.5 4.5 0 016.6 0" />
      <path d="M13.3 13.3a4.5 4.5 0 01-6.6 0" />
    </svg>
  ),
  temp: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 2v8.5" /><circle cx="10" cy="14" r="3" />
      <path d="M7 6h1.5M7 8.5h1.5" />
    </svg>
  ),
  humedad: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 3C10 3 4 9.5 4 13a6 6 0 0012 0c0-3.5-6-10-6-10z" />
    </svg>
  ),
  co2: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M7 10.5a2.5 2.5 0 010-1M10 7v1m0 4v1m3-1.5a2.5 2.5 0 010 1" />
    </svg>
  ),
  luz: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" />
    </svg>
  ),
  ph: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 15V5h3a2.5 2.5 0 010 5H4M12 15V5M12 10h4" />
    </svg>
  ),
  ec: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 10h4l2-6 3 12 2-6h3" />
    </svg>
  ),
  alerta: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 3L2 17h16L10 3z" /><path d="M10 8v4M10 14v.5" />
    </svg>
  ),
  bateria: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="6.5" width="14" height="7" rx="1.5" />
      <path d="M16 8.5v3M4.5 8.5h5v3h-5z" strokeWidth="1.4" />
    </svg>
  ),
  senal: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 16c2-4 6-6 8-6s6 2 8 6M5 13c1.3-2 2.8-3 5-3s3.7 1 5 3M8 16.5a2 2 0 014 0" />
    </svg>
  ),
  reloj: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" />
    </svg>
  ),
  enviar: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 10l14-7-7 14V10H3z" />
    </svg>
  ),
  flecha: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 10h12M12 6l4 4-4 4" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 10l4 4 8-8" />
    </svg>
  ),
  planta: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 18V9" />
      <path d="M10 9C10 9 5 8 4 4c3 0 5 1 6 5z" />
      <path d="M10 12c0 0 5-1 6-5-3 0-5 1-6 5z" />
    </svg>
  ),
  red: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="2" /><circle cx="3" cy="5" r="2" />
      <circle cx="17" cy="5" r="2" /><circle cx="3" cy="15" r="2" />
      <circle cx="17" cy="15" r="2" />
      <path d="M5 5l3 4M12 9l3-4M5 15l3-4M12 11l3 4" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M4 10a6 6 0 1112 0" />
      <polyline points="16,6 16,10 12,10" />
    </svg>
  ),
};
