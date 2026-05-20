// src/components/ui/index.jsx
// Primitivos de UI reutilizables del sistema VERDEX.
import React from 'react';

/* ── PuntoDB ──────────────────────────────────────────────────────────────────── */
export const PuntoDB = ({ color = 'var(--green)', tam = 8, pulso = false }) => (
  <span style={{
    display: 'inline-block', width: tam, height: tam, borderRadius: '50%',
    background: color, boxShadow: `0 0 ${tam}px ${color}88`,
    animation: pulso ? 'pulso 2s ease-in-out infinite' : 'none',
    flexShrink: 0,
  }} />
);

/* ── Gauge ──────────────────────────────────────────────────────────────────────*/
export const Gauge = ({ valor = 0, max = 100, tam = 76, color = 'var(--green)', unidad = '%' }) => {
  const r    = (tam - 11) / 2;
  const circ = 2 * Math.PI * r;
  const arco = circ * Math.min(valor / max, 1);
  return (
    <div style={{ position: 'relative', width: tam, height: tam, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={tam} height={tam} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${arco} ${circ}`}
          style={{ transition: 'stroke-dasharray .7s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>
          {valor}{unidad}
        </div>
      </div>
    </div>
  );
};

/* ── Sparkline ────────────────────────────────────────────────────────────────── */
export const Sparkline = ({ datos = [], color = 'var(--green)', alto = 52 }) => {
  if (!datos || datos.length < 2) return null;
  const mn = Math.min(...datos), mx = Math.max(...datos), rng = mx - mn || 1;
  const W  = 100;
  const pts = datos.map((v, i) => {
    const x = (i / (datos.length - 1)) * W;
    const y = alto - ((v - mn) / rng) * (alto - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const relleno = `${pts} ${W},${alto} 0,${alto}`;
  const gid = `g${color.replace(/[^0-9a-f]/gi, '')}${Math.random().toString(36).slice(2, 5)}`;
  return (
    <svg viewBox={`0 0 ${W} ${alto}`} preserveAspectRatio="none"
      style={{ width: '100%', height: alto, display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={relleno} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
    </svg>
  );
};

/* ── Notificaciones ───────────────────────────────────────────────────────────── */
export const Notificaciones = ({ lista = [] }) => (
  <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {lista.map(n => (
      <div key={n.id} className="aparecer" style={{
        background: 'var(--card)', borderRadius: 8, padding: '9px 14px',
        border: `1px solid ${n.tipo === 'alerta' ? 'var(--amber)' : n.tipo === 'error' ? 'var(--red)' : 'var(--green)'}`,
        fontSize: 12, display: 'flex', alignItems: 'center', gap: 9, minWidth: 230,
        boxShadow: '0 6px 24px #00000066',
      }}>
        <PuntoDB
          color={n.tipo === 'alerta' ? 'var(--amber)' : n.tipo === 'error' ? 'var(--red)' : 'var(--green)'}
          tam={6}
        />
        {n.msg}
      </div>
    ))}
  </div>
);

/* ── Loading spinner ──────────────────────────────────────────────────────────── */
export const Spinner = ({ color = 'var(--green)', size = 32 }) => (
  <div style={{
    width: size, height: size, border: `2px solid var(--border)`,
    borderTop: `2px solid ${color}`, borderRadius: '50%',
    animation: 'rotarLento .8s linear infinite',
  }} />
);

/* ── Estado vacío / sin datos ─────────────────────────────────────────────────── */
export const SinDatos = ({ mensaje = 'Esperando datos del servidor...', color = 'var(--amber)' }) => (
  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
    <PuntoDB color={color} tam={8} pulso />
    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>{mensaje}</div>
  </div>
);
