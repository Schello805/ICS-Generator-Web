import { initializeEventHandlers } from './eventHandlers.js';
import { initializeDateTimeFields } from './dateTimeManager.js';

/**
 * Initialisiert alle Event-Handler und UI-Elemente für den Generator
 */
export function initializeGenerator() {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialisiere Event-Handler
        initializeEventHandlers();
        
        // Initialisiere DateTime-Handler
        initializeDateTimeFields();

        // Initialisiere Tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    });
}
