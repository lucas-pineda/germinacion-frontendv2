// src/pages/PaginaSensores.jsx
// Estado de sensores agrupados por device_id desde GET /api/v1/sensors/

import { useMemo } from 'react';
import { useSensors }  from '../hooks/useSensors';
import { useGreenhouse } from '../context/GreenhouseContext';
import { PuntoDB, SinDatos } from '../components/ui';
import { Ico } from '../components/icons/Ico';
import { latestPerDevice } from '../services/sensorService';

const colorEstado = (s) => {
  if (s === 'offline') return 'var(--red)';
  if (s === 'alerta')  return 'var(--amber)';
  return 'var(--green)';
};
const textoEstado = { activo: 'Activo', alerta: 'Alerta', offline: 'Sin conexión' };
const colorBateria = v => v > 50 ? 'var(--green)' : v > 20 ? 'var(--amber)' : 'var(--red)';

// Deriva "estado" de una lectura — ajusta según tu modelo real
function deriveStatus(reading) {
  if (!reading) return 'offline';
  const ahora = Date.now();
  const ts    = new Date(reading.timestamp).getTime();
  const mins  = (ahora - ts) / 60_000;
  if (mins > 10) return 'offline';
  if (reading.temp > 35) return 'alerta';
  return 'activo';
}

export function PaginaSensores() {
  const { historial, wsStatus } = useGreenhouse();

  // También hace polling REST para mantener frescura
  const { readings, loading, refresh } = useSensors({ size: 200, pollMs: 10_000 });

  const base = readings.length ? readings : historial;

  // Una entrada por device_id con su lectura más reciente
  const dispositivos = useMemo(() => {
    const latest = latestPerDevice(base);
    return latest.map(r => ({
      id:          r.deviceId,
      nombre:      `Nodo ${r.deviceId}`,
      tipo:        'IoT multisensor',
      zona:        'Zona principal',
      estado:      deriveStatus(r),
      bateria:     r.bateria  ?? 85,
      senal:       r.senal    ?? 90,
      actualizado: r.hora,
      raw:         r,
    }));
  }, [base]);

  const conteos = useMemo(() => ({
    activo:  dispositivos.filter(s => s.estado === 'activo').length,
    alerta:  dispositivos.filter(s => s.estado === 'alerta').length,
    offline: dispositivos.filter(s => s.estado === 'offline').length,
  }), [dispositivos]);

  return (
    <div className="aparecer">
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Estado de Sensores</h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            Red de dispositivos IoT distribuidos
          </div>
        </div>
        <button className="btn" style={{ fontSize: 11, padding: '6px 14px' }} onClick={refresh}>
          <span style={{ width: 14, height: 14 }}>{Ico.refresh}</span>
          Actualizar
        </button>
      </div>

      {loading && dispositivos.length === 0
        ? <SinDatos mensaje="Cargando red de dispositivos…" />
        : <>
          {/* Resumen de estado */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 13, marginBottom: 20 }}>
            {[
              { e: 'Activos',       v: conteos.activo,  c: 'var(--green)', i: Ico.check  },
              { e: 'Con alertas',   v: conteos.alerta,  c: 'var(--amber)', i: Ico.alerta },
              { e: 'Sin conexión',  v: conteos.offline, c: 'var(--red)',   i: Ico.sensores },
            ].map(s => (
              <div key={s.e} className="card" style={{ textAlign: 'center' }}>
                <div style={{ width: 20, height: 20, color: s.c, margin: '0 auto 8px' }}>{s.i}</div>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.e}</div>
              </div>
            ))}
          </div>

          {/* Tarjetas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 13, marginBottom: 18 }}>
            {dispositivos.map(s => (
              <div key={s.id} className="card" style={{
                borderColor: s.estado === 'offline' ? 'var(--red)44' : s.estado === 'alerta' ? 'var(--amber)44' : 'var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{s.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{s.tipo} · {s.zona}</div>
                  </div>
                  <div className="badge" style={{
                    background: `${colorEstado(s.estado)}12`,
                    color: colorEstado(s.estado),
                    border: `1px solid ${colorEstado(s.estado)}44`,
                  }}>
                    <PuntoDB color={colorEstado(s.estado)} tam={5} pulso={s.estado === 'activo'} />
                    {textoEstado[s.estado] ?? s.estado}
                  </div>
                </div>

                {/* Lecturas compactas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, fontSize: 10 }}>
                  {[
                    { e: 'Temp',  v: `${s.raw.temp}°C`,    c: 'var(--amber)' },
                    { e: 'Hum.',  v: `${s.raw.humedad}%`,  c: 'var(--teal)'  },
                  ].map(k => (
                    <div key={k.e} style={{ background: 'var(--bg3)', borderRadius: 5, padding: '4px 6px' }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 1 }}>{k.e}</div>
                      <div className="mono" style={{ color: k.c, fontWeight: 700 }}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Batería */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ width: 13, height: 13, color: colorBateria(s.bateria), flexShrink: 0 }}>{Ico.bateria}</span>
                  <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.bateria}%`, background: colorBateria(s.bateria), borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: colorBateria(s.bateria), width: 34, textAlign: 'right' }}>{s.bateria}%</span>
                </div>

                {/* Señal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 13, height: 13, color: 'var(--blue)', flexShrink: 0 }}>{Ico.senal}</span>
                  <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.senal}%`, background: 'var(--blue)', borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--blue)', width: 34, textAlign: 'right' }}>{s.senal}%</span>
                </div>

                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono">{s.id}</span>
                  <span>Actualizado {s.actualizado}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla resumen */}
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Tabla de dispositivos</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['ID', 'Dispositivo', 'Zona', 'Estado', 'Temp', 'Humedad', 'Última act.'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 10px', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispositivos.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)22' }}>
                      <td className="mono" style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{s.id}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text)' }}>{s.nombre}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{s.zona}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <PuntoDB color={colorEstado(s.estado)} tam={5} pulso={s.estado === 'activo'} />
                          <span style={{ color: colorEstado(s.estado), fontWeight: 600 }}>{textoEstado[s.estado] ?? s.estado}</span>
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '7px 10px', color: 'var(--amber)' }}>{s.raw.temp}°C</td>
                      <td className="mono" style={{ padding: '7px 10px', color: 'var(--teal)' }}>{s.raw.humedad}%</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{s.actualizado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      }
    </div>
  );
}