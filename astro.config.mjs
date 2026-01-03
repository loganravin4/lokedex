// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  integrations: [react()],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'server', // Server mode required for API routes with query parameters
  site: 'https://loganravinuthala.dev/', // Update this later
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
});