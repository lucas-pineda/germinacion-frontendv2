// src/components/layout/Topbar.jsx
import { PuntoDB } from '../ui';

export function Topbar({ rutaActual, datos, navegar, Ico }) {
  return (
    <header className="topbar">
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 16, height: 16, color: 'var(--text-dim)' }}>
          {Ico[rutaActual?.icono]}
        </span>
        {rutaActual?.etiqueta}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Lecturas rápidas del snapshot actual */}
        {[
          { v: datos ? `${datos.temp}°C`       : '--',      c: 'var(--amber)' },
          { v: datos ? `${datos.humedad}%`     : '--',      c: 'var(--teal)'  },
          { v: datos ? `CO₂ ${datos.co2}`      : 'CO₂ --', c: 'var(--green)', cls: 'ocultar-movil' },
        ].map((s, i) => (
          <span key={i} className={s.cls} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.c }}>
            <PuntoDB color={s.c} tam={4} />
            {s.v}
          </span>
        ))}

        <button className="btn" style={{ fontSize: 11, padding: '5px 13px' }} onClick={() => navegar('home')}>
          Inicio
        </button>
      </div>
    </header>
  );
}
