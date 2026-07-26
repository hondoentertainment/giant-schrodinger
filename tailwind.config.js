/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Text"',
                    '"SF Pro Display"',
                    'system-ui',
                    'Segoe UI',
                    'sans-serif',
                ],
                display: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Display"',
                    '"SF Pro Rounded"',
                    'system-ui',
                    'sans-serif',
                ],
            },
            colors: {
                game: {
                    bg: '#07070a',
                    surface: 'rgba(255,255,255,0.06)',
                    border: 'rgba(255,255,255,0.12)',
                    accent: '#0A84FF',
                    'accent-hover': '#409CFF',
                    success: '#30D158',
                    warning: '#FFD60A',
                    orange: '#FF9F0A',
                    pink: '#BF5AF2',
                },
            },
            borderRadius: {
                game: '1.375rem',
                'game-lg': '1.75rem',
            },
            boxShadow: {
                'game-glow': '0 0 40px -8px rgba(10, 132, 255, 0.45)',
                'game-card': '0 24px 48px -24px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                'game-cta': '0 12px 32px -8px rgba(10, 132, 255, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            },
            animation: {
                'spring-in': 'springIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                'ambient-drift': 'ambientDrift 18s ease-in-out infinite alternate',
            },
            keyframes: {
                springIn: {
                    '0%': { opacity: '0', transform: 'scale(0.92) translateY(12px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                ambientDrift: {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '100%': { transform: 'translate(4%, -3%) scale(1.08)' },
                },
            },
        },
    },
    plugins: [],
}
