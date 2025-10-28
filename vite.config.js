import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Use loadEnv so .env.local is picked up in dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const DEV_API_TARGET = env.VITE_DEV_API_TARGET || 'https://api-retrobus-essonne.up.railway.app';
  const isHttps = DEV_API_TARGET.startsWith('https://');
  // Helpful banner on startup
  console.log(`[vite] Mode=${mode} | Proxy target=${DEV_API_TARGET}`);

  return {
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
        return {
          '/api': { ...common },
          // Some clients call versioned paths directly
          '/v1': { ...common },
          '/auth': { ...common },
          '/retromail': { ...common },
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
    build: { outDir: 'dist' },
    preview: { port: 5173, cors: true }
  };
});
