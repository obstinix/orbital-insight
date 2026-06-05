import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), glsl()],
    define: {
      __MOCK_MODE__: JSON.stringify(env.VITE_USE_MOCK === 'true'),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'three-core': ['three'],
            'animation': ['gsap', 'framer-motion'],
          },
        },
      },
    },
    assetsInclude: ['**/*.bin'],
  };
});
