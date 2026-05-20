// src/pages/PaginaCrecimiento.jsx
// Métricas de crecimiento construidas desde los datos de /api/v1/sensors/

import { useMemo } from 'react';
import { useGreenhouse } from '../context/GreenhouseContext';
import { useSensors }    from '../hooks/useSensors';
import { Sparkline, SinDatos, PuntoDB } from '../components/ui';
import { Ico } from '../components/icons/Ico';

// Agrupa lecturas por día y calcula promedios
function agruparPorDia(readings) {
  const map = {};
  readings.forEach(r => {
    const dia = new Date(r.timestamp).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' });
    if (!map[dia]) map[dia] = { dias: [], temp: [], humedad: [], co2: [], luz: [] };
    map[dia].temp.push(r.temp);
    map[dia].humedad.push(r.humedad);
    map[dia].co2.push(r.co2);
    map[dia].luz.push(r.luz);
  });
  return Object.entries(map).map(([dia, v]) => ({
    dia,
    temp:    promedio(v.temp),
    humedad: promedio(v.humedad),
    co2:     promedio(v.co2),
    luz:     promedio(v.luz),
  }));
}

const promedio = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;
const colorSalud = v => v >= 90 ? 'var(--green)' : v >= 75 ? 'var(--amber)' : 'var(--red)';

export function PaginaCrecimiento() {
  const { historial } = useGreenhouse();

  // Trae lecturas de los últimos 7 días para construir tendencias
  const { readings: lecturas7d, loading } = useSensors({
    size: 500,
    from_dt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  });

  const base = lecturas7d.length ? lecturas7d : historial;
  const porDia = useMemo(() => agruparPorDia(base), [base]);

  const resumen = [
    { e: 'Temp. promedio',   v: `${promedio(base.map(r => r.temp))}°C`,      c: 'var(--amber)', icono: 'temp'    },
    { e: 'Humedad media',    v: `${promedio(base.map(r => r.humedad))}%`,     c: 'var(--teal)',  icono: 'humedad' },
    { e: 'CO₂ promedio',    v: `${promedio(base.map(r => r.co2))} ppm`,      c: 'var(--green)', icono: 'co2'     },
    { e: 'Luz media',       v: `${promedio(base.map(r => r.luz))} μmol`,     c: 'var(--amber)', icono: 'luz'     },
    { e: 'Lecturas totales', v: base.length,                                   c: 'var(--blue)',  icono: 'sensores'},
  ];

  const variables = [
    { nombre: 'Temperatura',  datos: porDia.map(d => d.temp),    color: 'var(--amber)', unidad: '°C'   },
    { nombre: 'Humedad',      datos: porDia.map(d => d.humedad), color: 'var(--teal)',  unidad: '%'    },
    { nombre: 'CO₂',          datos: porDia.map(d => d.co2),     color: 'var(--green)', unidad: ' ppm' },
    { nombre: 'Luz PAR',      datos: porDia.map(d => d.luz),     color: '#f5a623',      unidad: ' μmol'},
  ];

  return (
    <div className="aparecer">
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Métricas de Crecimiento</h1>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
          Evolución de variables ambientales — últimos 7 días
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 13, marginBottom: 20 }}>
        {resumen.map(s => (
          <div key={s.e} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ width: 22, height: 22, color: s.c, margin: '0 auto 8px' }}>{Ico[s.icono]}</div>
            <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.e}</div>
          </div>
        ))}
      </div>

      {/* Gráficas por variable */}
      {loading && base.length === 0
        ? <SinDatos mensaje="Cargando historial de 7 días…" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            {variables.map(v => (
              <div key={v.nombre} className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: v.color, fontWeight: 600 }}>{v.nombre}</span>
                  {v.datos.length > 0 && (
                    <span className="mono" style={{ fontSize: 12, color: v.color }}>
                      {v.datos[v.datos.length - 1]}{v.unidad}
                    </span>
                  )}
                </div>
                {v.datos.length < 2
                  ? <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Insuficientes datos</div>
                  : <Sparkline datos={v.datos} color={v.color} alto={70} />
                }
                {/* Etiquetas de días */}
                {porDia.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    {porDia.map((d, i) => (
                      <span key={i} style={{ fontSize: 9, color: 'var(--text-dim)' }}>{d.dia}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* Gráfico de barras — comparativo por día */}
      {porDia.length > 1 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Temperatura promedio por día (°C)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 130 }}>
            {porDia.map((d, i) => {
              const maxTemp = Math.max(...porDia.map(x => x.temp));
              const h = maxTemp ? (d.temp / maxTemp) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--amber)', className: 'mono' }}>{d.temp}°</div>
                  <div style={{
                    width: '100%', height: `${Math.max(h, 3)}%`, background: 'var(--amber)',
                    borderRadius: '3px 3px 0 0', opacity: .82,
                    boxShadow: '0 0 5px var(--amber)44', transition: 'height .5s ease',
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>{d.dia}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
