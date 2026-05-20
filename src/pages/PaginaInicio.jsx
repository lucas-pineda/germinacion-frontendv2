import React from 'react';
import { PuntoDB } from '../components/ui';
import { FondoRejilla, LineaEscaneo } from '../components/layout/Backgrounds';
import { Ico } from '../components/icons/Ico';

export function PaginaInicio({ navegar, datos }) {
  const d = datos || { temp: '--', humedad: '--', co2: '--', luz: '--' };

  const resumenes = [
    { etiqueta: 'Temperatura', valor: d.temp    !== '--' ? `${d.temp}°C`     : '--', color: 'var(--amber)', icono: Ico.temp    },
    { etiqueta: 'Humedad',     valor: d.humedad !== '--' ? `${d.humedad}%`   : '--', color: 'var(--teal)',  icono: Ico.humedad },
    { etiqueta: 'CO₂',        valor: d.co2     !== '--' ? `${d.co2} ppm`    : '--', color: 'var(--green)', icono: Ico.co2     },
    { etiqueta: 'Luz PAR',    valor: d.luz     !== '--' ? `${d.luz} μmol`   : '--', color: 'var(--amber)', icono: Ico.luz     },
  ];

  const caracteristicas = [
    { icono: Ico.sensores,   titulo: 'Monitoreo IoT',         desc: 'Sensores distribuidos capturan variables ambientales con actualización continua vía WebSocket.' },
    { icono: Ico.asistente,  titulo: 'Asistente Inteligente', desc: 'FLORA analiza condiciones en tiempo real y genera recomendaciones personalizadas con IA Groq.' },
    { icono: Ico.crecimiento,titulo: 'Métricas de Crecimiento',desc: 'Seguimiento de evolución y salud de cultivos con visualizaciones interactivas.' },
    { icono: Ico.red,        titulo: 'Red de Dispositivos',   desc: 'Gestión de estado, batería y conectividad de todos los nodos IoT activos.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <FondoRejilla />
      <LineaEscaneo />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg)e0', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 58,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PuntoDB color="var(--green)" tam={9} pulso />
          <span className="mono" style={{ fontSize: 15, color: 'var(--green)', fontWeight: 700, letterSpacing: 1 }}>VERDEX</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => navegar('dashboard')}>Panel de control</button>
          <button className="btn btn-primary" onClick={() => navegar('dashboard')}>
            Ingresar al sistema
            <span style={{ width: 14, height: 14 }}>{Ico.flecha}</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 28px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="badge" style={{ background: 'var(--green)14', color: 'var(--green)', border: '1px solid var(--green)33', marginBottom: 26 }}>
          <PuntoDB color="var(--green)" tam={6} pulso />
          Sistema activo · Monitoreo en tiempo real
        </div>

        <h1 style={{ fontSize: 'clamp(34px, 5.5vw, 66px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 18, color: '#fff' }}>
          Invernadero<br />
          <span style={{ color: 'var(--green)' }}>Inteligente</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.85 }}>
          Plataforma de computación ubicua para monitoreo ambiental, control
          automatizado de cultivos y análisis predictivo del entorno agrícola.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <button className="btn btn-primary" style={{ fontSize: 15, padding: '12px 30px' }} onClick={() => navegar('dashboard')}>
            Entrar al panel de control
            <span style={{ width: 16, height: 16 }}>{Ico.flecha}</span>
          </button>
          <button className="btn" style={{ fontSize: 15, padding: '12px 30px' }} onClick={() => navegar('asistente_flora')}>
            Asistente FLORA
          </button>
        </div>

        {/* Ilustración */}
        <div className="flotando" style={{ maxWidth: 680, margin: '0 auto 64px' }}>
          <svg viewBox="0 0 680 300" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', filter: 'drop-shadow(0 0 32px var(--green)28)' }}>
            <rect x="0" y="268" width="680" height="32" fill="var(--bg3)" rx="3" />
            <rect x="70" y="140" width="540" height="128" fill="var(--bg2)" stroke="var(--border)" strokeWidth="1.2" />
            <polygon points="40,140 340,50 640,140" fill="var(--bg3)" stroke="var(--border-glow)" strokeWidth="1.2" />
            {[0,1,2,3,4].map(i => (
              <line key={i} x1={40+i*120} y1={140} x2={340+(i<2?i*-20:i*20-40)} y2={50}
                stroke="var(--green)" strokeWidth=".5" strokeOpacity=".22" />
            ))}
            {[130,230,340,450,550].map((x,i) => (
              <g key={i}>
                <rect x={x-13} y={242} width={26} height={26} fill="var(--bg3)" rx={2} />
                <rect x={x-2.5} y={220} width={5} height={24} fill="var(--green-dim)" />
                <ellipse cx={x} cy={210} rx={19} ry={15} fill="var(--green)" opacity={.48+i*.05} />
                <ellipse cx={x-8} cy={219} rx={10} ry={9} fill="var(--green)" opacity={.38} />
                <ellipse cx={x+8} cy={219} rx={10} ry={9} fill="var(--green-bright)" opacity={.22} />
              </g>
            ))}
            {[140,340,540].map((x,i) => (
              <g key={i}>
                <circle cx={x} cy={165} r={5} fill="var(--green)" opacity={.7}>
                  <animate attributeName="opacity" values=".7;.2;.7" dur={`${1.4+i*.4}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={165} r={10} fill="none" stroke="var(--green)" strokeWidth="1" opacity={.22} />
              </g>
            ))}
            <path d="M 140 165 Q 240 132 340 165 Q 440 195 540 165"
              stroke="var(--green)" strokeWidth="1" fill="none" strokeDasharray="4 3" opacity=".18">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.5s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>

        {/* Estadísticas rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 64 }}>
          {resumenes.map(s => (
            <div key={s.etiqueta} className="card" style={{ padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, margin: '0 auto 10px', color: s.color }}>{s.icono}</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.valor}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '.4px' }}>{s.etiqueta}</div>
            </div>
          ))}
        </div>

        {/* Características */}
        <h2 style={{ fontSize: 26, fontWeight: 600, color: '#fff', marginBottom: 28 }}>Capacidades del sistema</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {caracteristicas.map(f => (
            <div key={f.titulo} className="card" style={{ textAlign: 'left', padding: '22px 18px' }}>
              <div style={{ width: 24, height: 24, color: 'var(--green)', marginBottom: 12 }}>{f.icono}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{f.titulo}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.75 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
