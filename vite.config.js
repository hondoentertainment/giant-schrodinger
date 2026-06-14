import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/giant-schrodinger/',
    build: {
        sourcemap: true,
    },
    define: {
        __SENTRY_RELEASE__: JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
})
