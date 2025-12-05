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
