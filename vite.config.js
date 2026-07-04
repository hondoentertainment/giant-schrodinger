import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeManifest } from './scripts/generate-manifest.mjs'

const basePath = process.env.VERCEL ? '/' : '/giant-schrodinger/'

function manifestPlugin() {
    return {
        name: 'vwf-manifest',
        closeBundle() {
            writeManifest('dist', basePath)
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), manifestPlugin()],
    base: basePath,
    build: {
        sourcemap: 'hidden',
    },
    define: {
        __SENTRY_RELEASE__: JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
})
