# Responsive UI Design Blueprint

 This is a code bundle for Responsive UI Design Blueprint. The original project is available at [https://www.figma.com/design/TumThLL475rqKT9dF2SChx/Responsive-UI-Design-Blueprint](https://www.figma.com/design/TumThLL475rqKT9dF2SChx/Responsive-UI-Design-Blueprint).

## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## MQTT (dashboard en vivo)

El front se conecta por **WebSocket** a `ws://192.168.1.58:9001` (no usa el puerto TCP 1883 en el navegador).

- **Telemetría:** `germinador/telemetria` (JSON cada ~10 s)
- **Comandos:** `germinador/comandos` (texto plano: `PUMP ON`, `PUMP OFF`, `STATUS`, `REVIEW TEMP ON`, `TEST ON`, etc.)
- **Alertas / respuestas:** `germinador/alertas` (JSON `{ "tipo", "mensaje" }`)

**Test Mode:** en el header (ícono matraz), activa con `TEST ON` / `TEST OFF`. Bomba y REVIEW solo se envían con Test Mode activo.

En Mosquitto, habilita WebSocket en `mosquitto.conf` si aún no está:

```
listener 1883
allow_anonymous true

listener 9001
protocol websockets
```

Reinicia Mosquitto y asegúrate de que el PC donde corres `npm run dev` alcance `192.168.1.58` en la red local.
# Solo en caso de q se pruebe en mi casa obvio, tu arregltelas como puedas samuel xd
# mlp viviana 