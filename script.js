// Import modules
import { initializeEventHandlers } from './js/modules/eventHandlers.js';

// Initialize all event handlers when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document ready, initializing handlers...');
    try {
        initializeEventHandlers();
        console.log('Event handlers initialized successfully');
    } catch (error) {
        console.error('Error initializing event handlers:', error);
    }
});

// iOS App Banner Logik
document.addEventListener('DOMContentLoaded', function() {
    // Prüfe ob Benutzer iOS verwendet
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        const banner = document.getElementById('ios-app-banner');
        if (banner) {
            banner.style.display = 'flex';
            
            // Speichere in localStorage wenn Banner geschlossen wird
            const closeButton = banner.querySelector('.btn-close');
            closeButton.addEventListener('click', function() {
                localStorage.setItem('iosAppBannerClosed', 'true');
            });
            
            // Prüfe ob Banner bereits geschlossen wurde
            if (localStorage.getItem('iosAppBannerClosed') === 'true') {
                banner.style.display = 'none';
            }
        }
    }
});