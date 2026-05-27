export const MQTT_BROKER_HOST = "192.168.34.4";
export const MQTT_WS_PORT = 1887;
export const MQTT_WS_URL = `ws://${MQTT_BROKER_HOST}:${MQTT_WS_PORT}`;

export const MQTT_TOPIC_TELEMETRY = "germinador/telemetria";
export const MQTT_TOPIC_COMMANDS = "germinador/comandos";
export const MQTT_TOPIC_LOGS = "germinador/logs";

export const COMMAND_LOG_MAX = 20;