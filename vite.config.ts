import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // This defines global constants that are replaced at build time.
    define: {
      // Ensure API_KEY is always a string, even if empty, to prevent 'undefined' issues
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});