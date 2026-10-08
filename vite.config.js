import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In dev, /api requests are proxied to the .NET backend so the browser never hits CORS.
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.test.{js,jsx}'],
      setupFiles: ['tests/setup.js'],
    },
  };
});
