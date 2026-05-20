import { useEffect, useContext } from 'react';
import { GreenhouseContext } from '../context/GreenhouseContext';
import deviceService from '../services/deviceService';
import websocketService from '../services/websocketService';

export const useDeviceData = (deviceId) => {
  const { setReadings, addReading, addAlert, setError, setLoading } = useContext(GreenhouseContext);

  useEffect(() => {
    if (!deviceId) return;

    // Cargar datos iniciales
    const loadData = async () => {
      try {
        setLoading(true);
        const readings = await deviceService.getDeviceReadings(deviceId);
        setReadings(readings.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Conectar WebSocket
    websocketService.connectDevice(deviceId, (data) => {
      if (data.event === 'new_reading') {
        addReading(data.data);
      } else if (data.event === 'alert') {
        addAlert(data);
      }
    });

    return () => websocketService.disconnect();
  }, [deviceId]);
};

export default useDeviceData;