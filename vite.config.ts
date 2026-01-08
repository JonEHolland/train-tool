import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    watch: {
      // Force watching the schedule data file
      ignored: ['!**/schedule-data.json'],
    },
  },
  optimizeDeps: {
    // Don't pre-bundle the schedule data so changes are picked up
    exclude: ['./src/schedule-data.json'],
  },
})
