// ──────────────────────────────────────────────────────────────────────────────
// src/services/aiService.js
// Conecta con el endpoint Groq del backend: POST /api/v1/ai/analyze
// ──────────────────────────────────────────────────────────────────────────────

import api from './api';

/**
 * Envía una consulta al asistente FLORA.
 *
 * @param {object} params
 * @param {string}  params.question  - Pregunta del usuario
 * @param {object}  params.sensorData - Lecturas actuales del invernadero
 * @param {object[]} [params.history] - Historial de mensajes (opcional)
 * @returns {Promise<{ response: string }>}
 */
export const analyzeWithAI = ({ question, sensorData, history = [] }) =>
  api
    .post('/ai/analyze', {
      question,
      sensor_data: sensorData,
      history,
    })
    .then((r) => r.data);
