import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import removeConsole from 'vite-plugin-remove-console'

export default defineConfig(({ mode }) => {
    // eslint-disable-next-line no-undef
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            vue(),
            vueDevTools(),
            ...(mode === 'production' ? [removeConsole()] : [])
        ],

        resolve: {
            alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },

        base: mode === 'production' ? env.VITE_BASE_URL || '/' : '/',

        server: {
            host: true,
            port: parseInt(env.VITE_FRONTEND_PORT || '5173'),
            cors: true
        },

        preview: {
            host: true,
            port: parseInt(env.VITE_PREVIEW_PORT || '4173')
        },

        build: {
            outDir: 'dist',
            sourcemap: mode === 'development',
            minify: 'esbuild',
            rollupOptions: {
                    output: {
                    manualChunks: {
                        vue: ['vue']
                    }
                }
            }
        }
    }
});