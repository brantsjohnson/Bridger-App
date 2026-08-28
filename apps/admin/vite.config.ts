// ============================================
// WHAT THIS FILE DOES (plain English):
// Tells Vite how to build and serve the admin console. Turns on the React
// plugin so JSX works, and points the local server at port 5174 so it does
// not collide with other apps.
// ============================================
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // THIS SECTION DOES: let the browser build read runtime values from our
  // shared CommonJS package after pnpm resolves its workspace link.
  build: {
    commonjsOptions: {
      include: [/node_modules/, /packages\/shared\/dist/]
    }
  },
  server: {
    port: 5174,
    open: false
  },
  preview: {
    port: 5174
  }
});
