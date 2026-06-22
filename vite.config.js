import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = process.env.VERCEL ? '/' : '/giant-schrodinger/'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: basePath,
    build: {
        sourcemap: true,
    },
    define: {
        __SENTRY_RELEASE__: JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
})
