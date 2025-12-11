import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Ensure _redirects file is copied to dist
        try {
          copyFileSync(
            join(__dirname, 'public', '_redirects'),
            join(__dirname, 'dist', '_redirects')
          )
          console.log('✅ _redirects file copied to dist')
        } catch (error) {
          console.warn('⚠️ Could not copy _redirects file:', error.message)
        }
      }
    }
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
})
