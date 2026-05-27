/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the autogerminador backend API, e.g. https://autogerminador-production.up.railway.app:8080 */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
