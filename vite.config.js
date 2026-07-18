import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeManifest } from './scripts/generate-manifest.mjs'

const require = createRequire(import.meta.url)
const basePath = process.env.VERCEL ? '/' : '/giant-schrodinger/'
const sentryRelease = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev'

function manifestPlugin() {
    return {
        name: 'vwf-manifest',
        closeBundle() {
            writeManifest('dist', basePath)
        },
    }
}

function getSentryPlugin() {
    const authToken = process.env.SENTRY_AUTH_TOKEN
    const org = process.env.SENTRY_ORG
    const project = process.env.SENTRY_PROJECT
    if (!authToken || !org || !project) return null

    try {
        const { sentryVitePlugin } = require('@sentry/vite-plugin')
        return sentryVitePlugin({
            org,
            project,
            authToken,
            release: {
                name: sentryRelease,
            },
            sourcemaps: {
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
            telemetry: false,
        })
    } catch (error) {
        console.warn('[vite] Sentry plugin unavailable; skipping sourcemap upload.', error?.message || error)
        return null
    }
}

const sentryPlugin = getSentryPlugin()

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), manifestPlugin(), ...(sentryPlugin ? [sentryPlugin] : [])],
    base: basePath,
    build: {
        sourcemap: 'hidden',
    },
    define: {
        __SENTRY_RELEASE__: JSON.stringify(sentryRelease),
    },
})
