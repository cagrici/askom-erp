/**
 * CSRF Token utilities
 */

export const refreshCsrfToken = async (): Promise<string | null> => {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const newToken = data.csrf_token;
            
            // Update meta tag
            const metaTag = document.head.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', newToken);
            }
            
            // Update axios defaults
            if (window.axios) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
            }
            
            return newToken;
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
    
    return null;
};

export const getCurrentCsrfToken = (): string | null => {
    const metaTag = document.head.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
};

export const isCsrfError = (error: any): boolean => {
    return error && (
        error.status === 419 ||
        error.code === 419 ||
        (error.message && error.message.includes('419')) ||
        (error.message && error.message.toLowerCase().includes('csrf'))
    );
};

// Auto-refresh CSRF token every 60 minutes
let refreshInterval: NodeJS.Timeout;

export const startCsrfTokenRefresh = () => {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 60 minutes (3600000 ms)
    refreshInterval = setInterval(() => {
        refreshCsrfToken().then(token => {
            if (token) {
                console.log('CSRF token refreshed automatically');
            }
        });
    }, 3600000);
};

export const stopCsrfTokenRefresh = () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
};