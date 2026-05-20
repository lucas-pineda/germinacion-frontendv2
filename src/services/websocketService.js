// ──────────────────────────────────────────────────────────────────────────────
// src/services/websocketService.js
// Servicio para WebSocket en tiempo real
// ──────────────────────────────────────────────────────────────────────────────

import { config } from '../config/env';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {
      'new_reading': [],
      'command_sent': [],
      'alert': [],
      'profile_updated': [],
      'connection': [],  // ← Para estado de conexión
    };
    this.pingInterval = null;
  }

  /**
   * Conecta al WebSocket general (todos los dispositivos)
   */
  connectAll(onMessage) {
    this.connect(config.wsAll, onMessage);
  }

  /**
   * Conecta al WebSocket de un dispositivo específico
   */
  connectDevice(deviceId, onMessage) {
    const url = config.wsDevice(deviceId);
    this.connect(url, onMessage);
  }

  /**
   * Conexión interna
   */
  connect(url, onMessage) {
    try {
      console.log(`[WS] Conectando a ${url}...`);
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] ✓ Conectado');
        this.sendPing();
        this.listeners['connection'].forEach(cb => cb(true));
        this.pingInterval = setInterval(() => this.sendPing(), 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Mensaje:', data.event || 'unknown');
          
          if (data.event && this.listeners[data.event]) {
            this.listeners[data.event].forEach(cb => cb(data));
          }
          
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('[WS] Error parseando:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] ✗ Error:', error);
        this.listeners['connection'].forEach(cb => cb(false));
      };

      this.ws.onclose = () => {
        console.log('[WS] Desconectado');
        this.listeners['connection'].forEach(cb => cb(false));
        if (this.pingInterval) clearInterval(this.pingInterval);
        setTimeout(() => this.connect(url, onMessage), 5000);
      };
    } catch (err) {
      console.error('[WS] Error:', err);
      this.listeners['connection'].forEach(cb => cb(false));
    }
  }

  sendPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Registra callback para eventos
   */
  on(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].push(callback);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) clearInterval(this.pingInterval);
  }
}

export default new WebSocketService();