// ──────────────────────────────────────────────────────────────────────────────
// src/hooks/useWebSocket.js
// Hook que gestiona el ciclo de vida del WebSocket con el componente React.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketService } from '../services/websocketService';
import { normalizeReading } from '../services/sensorService';

/**
 * @param {string|null} deviceId - null para /ws, string para /ws/{device_id}
 * @param {{ maxHistory? }} options
 */
export function useWebSocket(deviceId = null, { maxHistory = 100 } = {}) {
  const serviceRef = useRef(null);
  const [status,   setStatus]   = useState('disconnected'); // connected | disconnected | error
  const [lastMsg,  setLastMsg]  = useState(null);
  const [history,  setHistory]  = useState([]);

  const append = useCallback((reading) => {
    setHistory((prev) => {
      const next = [...prev, reading];
      return next.length > maxHistory ? next.slice(-maxHistory) : next;
    });
    setLastMsg(reading);
  }, [maxHistory]);

  useEffect(() => {
    const svc = new WebSocketService(deviceId);
    serviceRef.current = svc;

    const unsub = svc.subscribe((event) => {
      if (event.type === 'connected')    setStatus('connected');
      if (event.type === 'disconnected') setStatus('disconnected');
      if (event.type === 'error')        setStatus('error');
      if (event.type === 'message') {
        try {
          append(normalizeReading(event.data));
        } catch {
          // El payload no es una lectura de sensor — ignorar
        }
      }
    });

    svc.connect();

    return () => {
      unsub();
      svc.disconnect();
    };
  }, [deviceId, append]);

  const send = useCallback((data) => serviceRef.current?.send(data), []);

  return { status, lastMsg, history, send };
}
