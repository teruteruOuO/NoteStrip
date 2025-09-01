import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import removeConsole from 'vite-plugin-remove-console'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig(({ mode }) => {
    // root = absolute path to frontend/
    const root = path.dirname(fileURLToPath(import.meta.url))
    const env = loadEnv(mode, root, '')   // ← no process.*

    const certRel = env.VITE_SSL_CERT_PATH
    const keyRel  = env.VITE_SSL_KEY_PATH  
    const certPath = path.resolve(root, certRel)
    const keyPath  = path.resolve(root, keyRel)

    const httpsOpts = { 
        cert: fs.readFileSync(certPath), 
        key: fs.readFileSync(keyPath) 
    }

    return {
        plugins: [vue(), vueDevTools(), ...(mode === 'production' ? [removeConsole()] : [])],
        resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
        base: mode === 'production' ? env.VITE_BASE_URL || '/' : '/',

        server: {
            host: true,
            port: parseInt(env.VITE_FRONTEND_PORT || '5173'),
            https: httpsOpts,   // <-- enable HTTPS in dev                                
            hmr: { host: 'notestrip.local' },   // helps HMR over HTTPS
            cors: true
        },

        preview: {
            host: true, 
            port: parseInt(env.VITE_PREVIEW_PORT || '4173'),
            https: httpsOpts    // <-- enable HTTPS in preview as well
        },

        build: {
            outDir: 'dist',
            sourcemap: mode === 'development',
            minify: 'esbuild',
            rollupOptions: { output: { manualChunks: { vue: ['vue'] } } }
        }
    }
});

