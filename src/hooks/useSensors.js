// ──────────────────────────────────────────────────────────────────────────────
// src/hooks/useSensors.js
// Hook para listar lecturas REST con paginación y filtros.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { getSensors, normalizeReading } from '../services/sensorService';
import { config } from '../config/env';

/**
 * @param {{ device_id?, from_dt?, to_dt?, size?, pollMs? }} options
 */
export function useSensors({
  device_id,
  from_dt,
  to_dt,
  size    = config.defaultSize,
  pollMs  = 0, // 0 = sin polling automático
} = {}) {
  const [readings, setReadings]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const [page,     setPage]       = useState(1);
  const [total,    setTotal]      = useState(0);

  const fetch = useCallback(async (pg = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, size, device_id, from_dt, to_dt };
      // Limpia parámetros undefined para no contaminar la query string
      Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
      const data = await getSensors(params);
      // FastAPI pagination: { items, total, page, size } o array directo
      const items = Array.isArray(data) ? data : (data.items ?? []);
      setReadings(items.map(normalizeReading));
      setTotal(data.total ?? items.length);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, size, device_id, from_dt, to_dt]);

  // Carga inicial y cuando cambian filtros
  useEffect(() => { fetch(page); }, [fetch]);

  // Polling opcional
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => fetch(page), pollMs);
    return () => clearInterval(id);
  }, [fetch, pollMs, page]);

  const goToPage = (p) => setPage(p);
  const refresh  = ()  => fetch(page);

  return { readings, loading, error, page, total, size, goToPage, refresh };
}
