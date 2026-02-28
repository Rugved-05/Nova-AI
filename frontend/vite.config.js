import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_BACKEND_URL || 'http://localhost:3001',
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
