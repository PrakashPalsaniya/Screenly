import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-routing': ['react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux-thunk'],
          'vendor-ui': ['react-hot-toast', 'lucide-react'],
          'vendor-utils': ['axios', 'date-fns', 'dayjs', 'socket.io-client'],
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'lucide-react'],
  },
})
