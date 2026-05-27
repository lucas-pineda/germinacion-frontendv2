/**
 * API configuration for the autogerminador backend.
 *
 * Set VITE_API_URL in your environment to point at the deployed backend.
 * Example: https://autogerminador-production.up.railway.app:8080
 *
 * Falls back to localhost:8080 for local development.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Derives the MQTT WebSocket URL from the API base URL.
 *
 * The backend host also runs the MQTT broker, which exposes a WebSocket
 * endpoint on port 1887. We extract the hostname from VITE_API_URL and
 * build the ws:// URL accordingly.
 *
 * Examples:
 *   https://autogerminador-production.up.railway.app:8080  →  wss://autogerminador-production.up.railway.app:1887
 *   http://localhost:8080                                   →  ws://localhost:1887
 */
function deriveMqttWsUrl(apiUrl: string): string {
  try {
    const parsed = new URL(apiUrl);
    const isSecure = parsed.protocol === "https:";
    const wsProtocol = isSecure ? "wss" : "ws";
    return `${wsProtocol}://${parsed.hostname}:1887`;
  } catch {
    // Fallback if the URL cannot be parsed
    return "ws://localhost:1887";
  }
}

export const MQTT_WS_URL_FROM_API = deriveMqttWsUrl(API_BASE_URL);
