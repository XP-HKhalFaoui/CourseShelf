import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['adm-zip', 'fast-xml-parser', 'uuid'],
    },
  },
  resolve: {
    // Ensure .ts extensions are resolved
    extensions: ['.ts', '.js', '.json'],
  },
});
