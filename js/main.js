import { initializeEventHandlers } from './modules/eventHandlers.js';
import { initializeDateTimeFields } from './modules/dateTimeManager.js';
import { initializeValidator } from './modules/icsValidator.js';
import { initializeICSImportModal } from './modules/icsImport.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialisiere die Event-Handler basierend auf der aktuellen Seite
        const currentPage = window.location.pathname;
        
        // Generator-spezifische Initialisierung
        if (currentPage.includes('generator.html')) {
            initializeEventHandlers();
            initializeDateTimeFields();
            initializeICSImportModal();
        }
        
        // Validator-spezifische Initialisierung
        if (currentPage.includes('validator.html')) {
            initializeValidator();
        }
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
});
