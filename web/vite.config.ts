import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { fileURLToPath } from 'node:url'

const page = (file: string) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  plugins: [solid()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        index: page('./index.html'),
        slots: page('./slots.html'),
      },
    },
  },
  server: {
    port: 5174,
    fs: { allow: ['..'] },
  },
})
