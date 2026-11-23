import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function attachResilientProxyErrorHandler(proxy) {
  proxy.on('error', (_err, _req, res) => {
    if (res && !res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'Backend server is starting up. Retrying automatically...',
        })
      );
    }
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        configure: attachResilientProxyErrorHandler,
      },
      '/uploads': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        configure: attachResilientProxyErrorHandler,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
