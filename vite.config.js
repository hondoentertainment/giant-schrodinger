import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.js',
        exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    }
})
