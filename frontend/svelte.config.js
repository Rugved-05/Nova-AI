import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Enables preprocessing like SCSS, PostCSS etc.
  preprocess: preprocess(),

  kit: {
    // Use Vercel adapter
    adapter: adapter(),

    // Vite config
    vite: {
      server: {
        // Local dev proxy (optional, works only locally)
        proxy: {
          '/api': 'http://localhost:3001', // only for local testing
          '/socket.io': {
            target: 'http://localhost:3001',
            ws: true
          }
        }
      }
    }
  }
};

export default config;
