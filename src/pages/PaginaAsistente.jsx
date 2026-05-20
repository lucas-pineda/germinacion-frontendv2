// src/pages/PaginaAsistente.jsx
// Conecta con POST /api/v1/ai/analyze via useAIAnalysis.

import { useState, useEffect, useRef } from 'react';
import { useGreenhouse } from '../context/GreenhouseContext';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { PuntoDB } from '../components/ui';
import { Ico } from '../components/icons/Ico';

const SUGERENCIAS = [
  'Estado general del sistema',
  '¿Necesitan riego los cultivos?',
  'Analizar temperatura actual',
  'Optimizar niveles de CO₂',
  'Revisión de nutrientes',
];

export function PaginaAsistente() {
  const { datos } = useGreenhouse();
  const { analyze, loading } = useAIAnalysis();

  const [mensajes, setMensajes] = useState([{
    rol: 'sistema',
    texto: 'Hola, soy FLORA, el asistente inteligente del invernadero. Analizo las condiciones ambientales en tiempo real. ¿En qué puedo ayudarte?',
  }]);
  const [entrada, setEntrada] = useState('');
  const finalRef = useRef(null);

  // Desplazar al último mensaje
  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  const enviar = async (texto) => {
    const msg = (texto || entrada).trim();
    if (!msg || loading) return;

    setEntrada('');
    const nuevosMensajes = [...mensajes, { rol: 'usuario', texto: msg }];
    setMensajes(nuevosMensajes);

    // Construye historial para contexto (excluye el mensaje de bienvenida inicial)
    const history = nuevosMensajes
      .slice(1)
      .map(m => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto }));

    const respuesta = await analyze(msg, datos ?? {}, history);
    setMensajes(prev => [...prev, { rol: 'sistema', texto: respuesta }]);
  };

  const d = datos || {};

  return (
    <div className="aparecer">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Asistente Inteligente FLORA</h1>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, display: 'flex', gap: 10, alignItems: 'center' }}>
          <PuntoDB color={datos ? 'var(--green)' : 'var(--red)'} tam={5} pulso />
          {datos ? 'Análisis ambiental activo' : 'Esperando datos del servidor…'}
        </div>
      </div>

                 {/* Snapshot de sensores */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 22, flexWrap: 'wrap', padding: '14px 18px' }}>
        {[
          { e: 'Temperatura', v: d.temp     != null ? `${d.temp}°C`     : '--', c: 'var(--amber)' },
          { e: 'Humedad',     v: d.humedad  != null ? `${d.humedad}%`   : '--', c: 'var(--teal)'  },
        ].map(s => (
          <div key={s.e}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.7px', marginBottom: 2 }}>{s.e}</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="card" style={{ height: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12, padding: 16 }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
            background: m.rol === 'usuario' ? 'var(--green)16' : 'var(--bg3)',
            border: `1px solid ${m.rol === 'usuario' ? 'var(--green)44' : 'var(--border)'}`,
            borderRadius: m.rol === 'usuario' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
            padding: '10px 14px', maxWidth: '82%', fontSize: 12, lineHeight: 1.75, color: 'var(--text)',
            whiteSpace: 'pre-wrap',
          }}>
            {m.rol === 'sistema' && (
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', letterSpacing: 1, marginBottom: 4 }}>FLORA</div>
            )}
            {m.texto}
          </div>
        ))}

        {/* Indicador de carga */}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '10px 10px 10px 2px', padding: '10px 14px',
            display: 'flex', gap: 5, alignItems: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: `pulso 1.3s ease ${i * .2}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={finalRef} />
      </div>

      {/* Sugerencias */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
        {SUGERENCIAS.map(s => (
          <button key={s} onClick={() => enviar(s)} style={{
            padding: '5px 13px', border: '1px solid var(--border-glow)', borderRadius: 5,
            background: 'transparent', color: 'var(--text-muted)', fontSize: 11,
            fontFamily: "'Sora', sans-serif", cursor: 'pointer', transition: 'all .15s',
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 9 }}>
        <input
          className="chat-input"
          placeholder="Escribe tu consulta sobre el invernadero…"
          value={entrada}
          onChange={e => setEntrada(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
        />
        <button
          className="btn btn-primary"
          onClick={() => enviar()}
          disabled={loading}
          style={{ padding: '10px 16px', gap: 8 }}
        >
          Enviar
          <span style={{ width: 15, height: 15 }}>{Ico.enviar}</span>
        </button>
      </div>
    </div>
  );
}
