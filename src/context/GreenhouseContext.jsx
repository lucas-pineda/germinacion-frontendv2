// ──────────────────────────────────────────────────────────────────────────────
// src/context/GreenhouseContext.jsx
// Context global para estado del invernadero
// Integración con Back-end (MQTT + WebSocket + REST API)
// ──────────────────────────────────────────────────────────────────────────────

import React, { createContext, useReducer, useCallback, useContext, useEffect } from 'react';
import deviceService from '../services/deviceService';
import websocketService from '../services/websocketService';

export const GreenhouseContext = createContext();

const initialState = {
  // Datos actuales del dispositivo
  datos: null,
  
  // Historiales
  historial: [],
  alertas: [],
  
  // Estado de conexión
  wsStatus: 'disconnected', // 'connected' | 'disconnected' | 'error'
  restLoading: false,
  
  // Estado general
  devices: [],
  activeDevice: null,
  isConnected: false,
  loading: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATOS':
      return { ...state, datos: action.payload };
    
    case 'SET_HISTORIAL':
      return { ...state, historial: action.payload };
    
    case 'ADD_HISTORIAL':
      return {
        ...state,
        historial: [action.payload, ...state.historial].slice(0, 100),
      };
    
    case 'SET_ALERTAS':
      return { ...state, alertas: action.payload };
    
    case 'ADD_ALERTA':
      return {
        ...state,
        alertas: [action.payload, ...state.alertas].slice(0, 50),
      };
    
    case 'SET_WS_STATUS':
      return { ...state, wsStatus: action.payload };
    
    case 'SET_REST_LOADING':
      return { ...state, restLoading: action.payload };
    
    case 'SET_DEVICES':
      return { ...state, devices: action.payload };
    
    case 'SET_ACTIVE_DEVICE':
      return { ...state, activeDevice: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
};

export const GreenhouseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Métodos para actualizar estado ─────────────────────────────────────────
  const setDatos = useCallback((datos) => {
    dispatch({ type: 'SET_DATOS', payload: datos });
  }, []);

  const setHistorial = useCallback((historial) => {
    dispatch({ type: 'SET_HISTORIAL', payload: historial });
  }, []);

  const addHistorial = useCallback((lectura) => {
    dispatch({ type: 'ADD_HISTORIAL', payload: lectura });
  }, []);

  const setAlertas = useCallback((alertas) => {
    dispatch({ type: 'SET_ALERTAS', payload: alertas });
  }, []);

  const addAlerta = useCallback((alerta) => {
    dispatch({ type: 'ADD_ALERTA', payload: alerta });
  }, []);

  const setWsStatus = useCallback((status) => {
    dispatch({ type: 'SET_WS_STATUS', payload: status });
  }, []);

  const setRestLoading = useCallback((loading) => {
    dispatch({ type: 'SET_REST_LOADING', payload: loading });
  }, []);

  const setDevices = useCallback((devices) => {
    dispatch({ type: 'SET_DEVICES', payload: devices });
  }, []);

  const setActiveDevice = useCallback((device) => {
    dispatch({ type: 'SET_ACTIVE_DEVICE', payload: device });
  }, []);

  const setConnected = useCallback((isConnected) => {
    dispatch({ type: 'SET_CONNECTED', payload: isConnected });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // ── Cargar dispositivos al iniciar ─────────────────────────────────────────
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setRestLoading(true);
        const devices = await deviceService.getAllDevices();
        setDevices(devices);
        
        if (devices.length > 0) {
          setActiveDevice(devices[0]);
        }
      } catch (err) {
        console.error('Error cargando dispositivos:', err);
        setError(err.message);
      } finally {
        setRestLoading(false);
      }
    };

    loadDevices();
  }, []);

  // ── Conectar WebSocket al dispositivo activo ───────────────────────────────
  useEffect(() => {
    if (!state.activeDevice) return;

    const handleMessage = (data) => {
      if (data.event === 'new_reading') {
        // Mapear campos de MQTT a los que espera el frontend
        const reading = {
          timestamp: data.data.time_medition,
          temp: data.data.temperatura,
          humedad: data.data.humedad,
          luz: data.data.luz,
          // Campos adicionales del ESP32
          device_id: data.data.device_id,
        };
        
        // Actualizar último dato y agregar al historial
        setDatos(reading);
        addHistorial(reading);
        setWsStatus('connected');
      } else if (data.event === 'alert') {
        addAlerta(data);
        setWsStatus('connected');
      }
    };

    // Conectar WebSocket
    websocketService.connectDevice(state.activeDevice.device_id, handleMessage);

    // Listener para estado del WS
    websocketService.on('connection', (isConnected) => {
      setWsStatus(isConnected ? 'connected' : 'disconnected');
      setConnected(isConnected);
    });

    return () => {
      websocketService.disconnect();
    };
  }, [state.activeDevice]);

  const value = {
    // Estado
    datos: state.datos,
    historial: state.historial,
    alertas: state.alertas,
    wsStatus: state.wsStatus,
    restLoading: state.restLoading,
    devices: state.devices,
    activeDevice: state.activeDevice,
    isConnected: state.isConnected,
    error: state.error,

    // Métodos
    setDatos,
    setHistorial,
    addHistorial,
    setAlertas,
    addAlerta,
    setWsStatus,
    setRestLoading,
    setDevices,
    setActiveDevice,
    setConnected,
    setError,
  };

  return (
    <GreenhouseContext.Provider value={value}>
      {children}
    </GreenhouseContext.Provider>
  );
};

/**
 * Hook para usar el contexto de Greenhouse
 */
export const useGreenhouse = () => {
  const context = useContext(GreenhouseContext);
  if (!context) {
    throw new Error('useGreenhouse debe ser usado dentro de GreenhouseProvider');
  }
  return context;
};