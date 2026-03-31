//import Scss
import '../scss/themes.scss';
import '../css/admin.css';

// Import i18n configuration
import './i18n';

// Setup axios with CSRF token
import axios from 'axios';

const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
  
  // Setup CSRF token for regular axios requests
  window.axios = axios;
  window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
} else {
  console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Provider } from 'react-redux';
import { store } from './store';
import { startCsrfTokenRefresh, isCsrfError, refreshCsrfToken } from './utils/csrf';

const appName = import.meta.env.VITE_APP_NAME || 'Intranet Portal';

// Global error handler for CSRF issues
router.on('error', async (event) => {
    const { errors } = event.detail;
    if (isCsrfError(errors)) {
        console.warn('CSRF token expired, attempting to refresh...');
        
        const newToken = await refreshCsrfToken();
        if (newToken) {
            console.log('CSRF token refreshed, retrying request...');
            // Token başarıyla yenilendi, isteği tekrar dene
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            console.error('Failed to refresh CSRF token, reloading page...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
});

// Start automatic CSRF token refresh
startCsrfTokenRefresh();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.{tsx,jsx,ts,js}')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <Provider store={store}>
                <App {...props} />
            </Provider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});



