import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
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
