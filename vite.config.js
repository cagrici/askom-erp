import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-bootstrap',
            '@inertiajs/react',
            'react-redux',
            '@reduxjs/toolkit'
        ],
        exclude: ['fsevents'],
        force: false,
    },
    server: {
        hmr: {
            host: 'localhost',
            overlay: false, // Hata overlay'ini kapat
        },
        host: 'localhost',
        cors: {
            origin: ['http://askom-erp.test', 'https://askom-erp.test', 'http://localhost:5174'],
            credentials: true,
        },
        // Performans optimizasyonları
        middlewareMode: false,
        fs: {
            strict: false,
            allow: ['..'],
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    bootstrap: ['react-bootstrap'],
                    inertia: ['@inertiajs/react'],
                },
            },
        },
        sourcemap: false, // Production'da sourcemap kapalı
        minify: 'esbuild', // esbuild daha hızlı
    },
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
});
