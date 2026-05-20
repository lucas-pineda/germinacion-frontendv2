// ──────────────────────────────────────────────────────────────────────────────
// src/hooks/useAIAnalysis.js
// Hook para enviar consultas a POST /api/v1/ai/analyze (Groq).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { analyzeWithAI } from '../services/aiService';

export function useAIAnalysis() {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [response, setResponse] = useState(null);

  /**
   * Envía una pregunta al asistente FLORA.
   * @param {string} question
   * @param {object} sensorData  - Snapshot actual de sensores
   * @param {object[]} history   - Historial de mensajes para contexto
   * @returns {Promise<string>}  - Respuesta del asistente
   */
  const analyze = useCallback(async (question, sensorData = {}, history = []) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeWithAI({ question, sensorData, history });
      // Ajusta la key según lo que devuelva tu backend (response, answer, text…)
      const text = data.response ?? data.answer ?? data.text ?? JSON.stringify(data);
      setResponse(text);
      return text;
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo conectar al asistente.';
      setError(msg);
      return msg;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error, response };
}
