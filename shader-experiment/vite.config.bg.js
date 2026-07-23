import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Builds src/standalone.jsx into a single self-contained IIFE file that any
// plain HTML page can load with one <script> tag. React is bundled in.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: resolve(__dirname, '../assets/shader'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/standalone.jsx'),
      name: 'ShaderBg',
      formats: ['iife'],
      fileName: () => 'shader-bg.js',
    },
  },
})
