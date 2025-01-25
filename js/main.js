import { initializeEventHandlers } from './modules/eventHandlers.js';
import { initializeDateTimeFields } from './modules/dateTimeManager.js';
import { initializeUserCounter } from './modules/userCounter.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialisiere die Event-Handler basierend auf der aktuellen Seite
        const currentPage = window.location.pathname;
        
        // Immer den User Counter initialisieren
        initializeUserCounter();
        
        // Generator-spezifische Initialisierung
        if (currentPage.includes('generator.html')) {
            initializeEventHandlers();
            initializeDateTimeFields();
        }
        
        // Validator-spezifische Initialisierung
        if (currentPage.includes('validator.html')) {
            // Hier können validator-spezifische Initialisierungen hinzugefügt werden
        }
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
});
