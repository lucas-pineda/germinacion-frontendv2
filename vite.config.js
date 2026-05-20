import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env files for the current mode (development / production).
  // The third argument '' makes loadEnv expose ALL variables, not just VITE_-prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  const apiUrl =
    env.VITE_API_URL || 'https://autogerminador-production.up.railway.app';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // Explicitly define env vars so they are always embedded in the bundle,
    // even when the Railway build runner doesn't forward them via import.meta.env.
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
});
