// src/pages/PaginaDashboard.jsx
import { useGreenhouse } from '../context/GreenhouseContext';
import { Gauge, Sparkline, PuntoDB, SinDatos } from '../components/ui';
import { Ico } from '../components/icons/Ico';

export function PaginaDashboard() {
  const { datos, historial, alertas, wsStatus, restLoading } = useGreenhouse();

  const sinDatos = !datos;

  const metricas = [
    { etiqueta: 'Temperatura', valor: datos?.temp    ?? 0, unidad: '°C',   max: 50,   color: 'var(--amber)', icono: Ico.temp    },
    { etiqueta: 'Humedad',     valor: datos?.humedad ?? 0, unidad: '%',    max: 100,  color: 'var(--teal)',  icono: Ico.humedad },
  ];

  const wsColor = wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'error' ? 'var(--red)' : 'var(--amber)';
  const wsLabel = wsStatus === 'connected' ? 'En vivo (WS)' : wsStatus === 'error' ? 'WS error' : 'Reconectando…';

  return (
    <div className="aparecer">
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Centro de Monitoreo</h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="mono">{new Date().toLocaleString('es-CO')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <PuntoDB color={sinDatos ? 'var(--red)' : 'var(--green)'} tam={5} pulso />
              {sinDatos ? 'Sin conexión al servidor' : 'Sistema operativo'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {restLoading && (
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>actualizando…</span>
          )}
          <div className="badge" style={{ background: `${sinDatos ? 'var(--red)' : 'var(--green)'}12`, color: sinDatos ? 'var(--red)' : wsColor, border: `1px solid ${sinDatos ? 'var(--red)' : 'var(--green)'}33` }}>
            <PuntoDB color={wsColor} tam={5} pulso />
            {sinDatos ? 'Sin datos' : wsLabel}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        {metricas.map(m => (
          <div key={m.etiqueta} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Gauge valor={m.valor} max={m.max} tam={70} color={m.color} unidad={m.unidad} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ width: 14, height: 14, color: m.color, flexShrink: 0 }}>{m.icono}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.5px' }}>{m.etiqueta}</span>
              </div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: m.color }}>
                {m.valor}{m.unidad}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Máx: {m.max}{m.unidad}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>
        {/* Sparklines */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Temperatura y humedad — historial reciente</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--amber)' }}>
                <span style={{ width: 16, height: 2, background: 'var(--amber)', display: 'inline-block', borderRadius: 1 }} /> Temperatura
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--teal)' }}>
                <span style={{ width: 16, height: 2, background: 'var(--teal)', display: 'inline-block', borderRadius: 1 }} /> Humedad
              </span>
            </div>
          </div>
          {historial.length < 2
            ? <SinDatos mensaje="Acumulando datos para graficar…" />
            : <>
                <div style={{ marginBottom: 10 }}>
                  <Sparkline datos={historial.map(h => h.temp)}    color="var(--amber)" alto={56} />
                </div>
                <Sparkline datos={historial.map(h => h.humedad)} color="var(--teal)"  alto={56} />
              </>
          }
        </div>

        {/* Alertas */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, color: 'var(--amber)' }}>{Ico.alerta}</span>
            Alertas del sistema
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 180, overflowY: 'auto' }}>
            {alertas.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sin alertas activas.</div>
              : alertas.map((a, i) => (
                <div key={i} style={{
                  padding: '9px 11px', borderRadius: 6, fontSize: 11, lineHeight: 1.55,
                  background: a.tipo === 'alerta' ? 'var(--amber)0f' : 'var(--red)0f',
                  border: `1px solid ${a.tipo === 'alerta' ? 'var(--amber)' : 'var(--red)'}44`,
                }}>
                  <div style={{ fontWeight: 600, color: a.tipo === 'alerta' ? 'var(--amber)' : 'var(--red)', marginBottom: 2 }}>{a.titulo}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{a.msg}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Historial tabla */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14 }}>{Ico.reloj}</span>
          Historial de lecturas recientes
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Hora', 'Temp °C', 'Humedad %', 'CO₂ ppm', 'Luz μmol', 'pH'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 10px', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historial.slice(-10).reverse().map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)22' }}>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>{r.hora}</td>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--amber)' }}>{r.temp}</td>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--teal)'  }}>{r.humedad}</td>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--green)' }}>{r.co2}</td>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--amber)' }}>{r.luz}</td>
                  <td className="mono" style={{ padding: '6px 10px', color: 'var(--blue)'  }}>{r.ph}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
