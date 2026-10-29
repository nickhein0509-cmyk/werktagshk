import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import deployment from './vercel.json' with { type: 'json' };

// Vite does not execute Vercel rewrites or serverless functions. Reuse only
// exact public document/asset routes; private endpoints stay unavailable locally.
const publicRoutes = new Map(deployment.rewrites
  .filter(({ source, destination }) => !source.includes(':') &&
    (destination.endsWith('.html') || destination.startsWith('/assistance-assets/')))
  .map(({ source, destination }) => [source, destination]));

function installLocalRoutes(server: Pick<ViteDevServer, 'middlewares'>) {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const destination = publicRoutes.get(url.pathname);
    if (destination && (request.method === 'GET' || request.method === 'HEAD')) {
      request.url = destination + url.search;
      next();
      return;
    }
    if (/^\/(?:api|assistenz)(?:\/|$)/.test(url.pathname)) {
      response.statusCode = 503;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify({
        error: 'local_backend_unavailable',
        message: 'Private Cloud-Dienste sind in diesem lokalen Entwicklungsserver nicht eingerichtet.',
      }));
      return;
    }
    next();
  });
}

const localRoutes: Plugin = {
  name: 'werktag-local-routes',
  configureServer: installLocalRoutes,
  configurePreviewServer: installLocalRoutes,
};

export default defineConfig({
  plugins: [localRoutes, react()],
  build: {
    rolldownOptions: {
      input: { main: 'index.html', assistance: 'assistance.html', components: 'components.html' },
      output: {
        codeSplitting: {
          groups: [
            // Keep growing original content independent of interface releases.
            {
              name: 'practice-content',
              test: /[\\/]src[\\/](?:data|practice-expansion)\.ts$|[\\/]src[\\/]content[\\/]/,
            },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
});
