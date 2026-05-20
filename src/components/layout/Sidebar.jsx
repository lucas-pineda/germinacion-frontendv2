// src/components/layout/Sidebar.jsx
import { PuntoDB } from '../ui';

const RUTAS = [
  { id: 'home',                 etiqueta: 'Inicio',               icono: 'inicio' },
  { id: 'dashboard',            etiqueta: 'Panel de control',      icono: 'dashboard' },
  { id: 'asistente_flora',      etiqueta: 'Asistente FLORA',       icono: 'asistente' },
  { id: 'metricas_crecimiento', etiqueta: 'Métricas de crecimiento', icono: 'crecimiento' },
  { id: 'sensor_status',        etiqueta: 'Sensores',              icono: 'sensores' },
];

export { RUTAS };

export function Sidebar({ ruta, navegar, Ico, wsStatus }) {
  const wsColor = wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'error' ? 'var(--red)' : 'var(--amber)';

  return (
    <nav className="sidebar">
      {/* Logotipo */}
      <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <PuntoDB color="var(--green)" tam={9} pulso />
        <div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, letterSpacing: 1 }}>
            VERDEX
          </div>
        </div>
      </div>

      {/* Menú */}
      <div style={{ flex: 1, paddingTop: 10 }}>
        {RUTAS.map(r => (
          <div
            key={r.id}
            className={`nav-item ${ruta === r.id ? 'activo' : ''}`}
            onClick={() => navegar(r.id)}
          >
            <span className="nav-icono">{Ico[r.icono]}</span>
            <span>{r.etiqueta}</span>
          </div>
        ))}
      </div>

      {/* Pie — estado WS */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-dim)' }}>
        <div className="mono">Sistema v2.5.0</div>
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
          <PuntoDB color={wsColor} tam={5} pulso />
          <span>
            WS: {wsStatus === 'connected' ? 'en vivo' : wsStatus === 'error' ? 'error' : 'reconectando…'}
          </span>
        </div>
      </div>
    </nav>
  );
}
