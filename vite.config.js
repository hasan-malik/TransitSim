import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Force Vite to pre-bundle all deck.gl + mapbox packages.
    // deck.gl uses deep `export *` chains that break if left un-bundled.
    include: [
      'mapbox-gl',
      'react-map-gl',
      '@deck.gl/react',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/aggregation-layers',
      '@deck.gl/geo-layers',
      'framer-motion',
      'recharts',
      'lucide-react',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl', 'react-map-gl'],
          deckgl:  ['@deck.gl/react', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/aggregation-layers', '@deck.gl/geo-layers'],
          charts:  ['recharts'],
          motion:  ['framer-motion'],
        },
      },
    },
  },
});
