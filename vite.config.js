import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow overriding API proxy target in dev with VITE_DEV_API_TARGET
const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET || 'https://api-retrobus-essonne.up.railway.app';
const isHttps = DEV_API_TARGET.startsWith('https://');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: (() => {
      const common = {
        target: DEV_API_TARGET,
        changeOrigin: true,
        secure: isHttps,
        configure: (proxy, _options) => {
          console.log(`[vite] API proxy -> ${DEV_API_TARGET}`);
          proxy.on('error', (err, _req, _res) => console.log('proxy error', err));
          proxy.on('proxyReq', (proxyReq, req, _res) => console.log('Sending Request to the Target:', req.method, req.url));
          proxy.on('proxyRes', (proxyRes, req, _res) => console.log('Received Response from the Target:', proxyRes.statusCode, req.url));
        }
      };
      // Proxy both legacy and new paths so we don't need '/api' prefixes
      return {
        '/api': { ...common },
        '/events': { ...common },
        '/vehicles': { ...common },
        '/newsletter': { ...common },
        '/finance': { ...common },
        '/documents': { ...common },
        '/members': { ...common },
        '/site-users': { ...common },
        '/changelog': { ...common },
        '/flashes': { ...common },
        '/stocks': { ...common },
        '/public': { ...common },
      };
    })()
  },
  build: {
    outDir: 'dist'
  },
  preview: {
    port: 5173,
    cors: true
  }
})
