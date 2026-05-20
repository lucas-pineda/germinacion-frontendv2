// src/App.jsx
// Componente raíz. Gestiona navegación y shell de la aplicación.
import React from 'react';
import { useState, useRef, useCallback } from 'react';
import { useGreenhouse } from './context/GreenhouseContext';
import { Notificaciones } from './components/ui';
import { Sidebar, RUTAS } from './components/layout/Sidebar';
import { Topbar }  from './components/layout/Topbar';
import { Ico }     from './components/icons/Ico';
import { PaginaInicio }       from './pages/PaginaInicio';
import { PaginaDashboard }    from './pages/PaginaDashboard';
import { PaginaAsistente }    from './pages/PaginaAsistente';
import { PaginaCrecimiento }  from './pages/PaginaCrecimiento';
import { PaginaSensores }     from './pages/PaginaSensores';

export function AppShell() {
  const { datos, wsStatus } = useGreenhouse();

  const [ruta,   setRuta]   = useState('home');
  const [notifs, setNotifs] = useState([]);
  const notifId = useRef(0);

  const agregarNotif = useCallback((msg, tipo = 'ok') => {
    const id = ++notifId.current;
    setNotifs(n => [...n, { id, msg, tipo }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3800);
  }, []);

  const navegar = useCallback((r) => {
    setRuta(r);
    if (r !== 'home') {
      const nombre = RUTAS.find(x => x.id === r)?.etiqueta;
      agregarNotif(`${nombre} cargado`);
    }
  }, [agregarNotif]);

  const enApp      = ruta !== 'home';
  const rutaActual = RUTAS.find(r => r.id === ruta);

  return (
    <>
      <Notificaciones lista={notifs} />

      {enApp && (
        <Sidebar ruta={ruta} navegar={navegar} Ico={Ico} wsStatus={wsStatus} />
      )}

      {enApp && (
        <Topbar rutaActual={rutaActual} datos={datos} navegar={navegar} Ico={Ico} />
      )}

      <main className={enApp ? 'contenido' : ''} style={{ position: 'relative', zIndex: 1 }}>
        {ruta === 'home'                 && <PaginaInicio      navegar={navegar} datos={datos} />}
        {ruta === 'dashboard'            && <PaginaDashboard   />}
        {ruta === 'asistente_flora'      && <PaginaAsistente   />}
        {ruta === 'metricas_crecimiento' && <PaginaCrecimiento />}
        {ruta === 'sensor_status'        && <PaginaSensores    />}
      </main>
    </>
  );
}

export default AppShell;