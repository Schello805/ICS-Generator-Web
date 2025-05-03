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

        // Importierte ICS-Events übernehmen
        function loadImportedICSEvents() {
            if (window.location.search.includes('imported=1')) {
                try {
                    const imported = localStorage.getItem('importedICSEvents');
                    if (!imported) return;
                    const events = JSON.parse(imported);
                    // Entferne alle bestehenden Events
                    document.querySelectorAll('.eventForm').forEach(form => {
                        form.closest('.card').remove();
                    });
                    // Füge importierte Events hinzu
                    events.forEach(eventObj => {
                        // Erstelle neues Formular
                        const newEvent = window.duplicateEvent(); // global, da nicht als Modul exportiert
                        // Felder befüllen
                        if (!newEvent) return;
                        const form = newEvent.querySelector('.eventForm');
                        if (!form) return;
                        // Mapping: ICS-Properties auf Formularfelder
                        if (eventObj['SUMMARY']) form.querySelector('.summary').value = eventObj['SUMMARY'];
                        if (eventObj['DESCRIPTION']) form.querySelector('.description').value = eventObj['DESCRIPTION'];
                        if (eventObj['LOCATION']) form.querySelector('.location').value = eventObj['LOCATION'];
                        if (eventObj['DTSTART']) form.querySelector('.startDate').value = eventObj['DTSTART'].substring(0, 10).replace(/-/g, '');
                        if (eventObj['DTEND']) form.querySelector('.endDate').value = eventObj['DTEND'].substring(0, 10).replace(/-/g, '');
                        // TODO: Zeit, Wiederholung, Reminder, URL, Anhänge, etc. ergänzen
                    });
                    localStorage.removeItem('importedICSEvents');
                } catch (e) {
                    console.error('Fehler beim Laden importierter ICS-Events:', e);
                }
            }
        }

        loadImportedICSEvents();
    });
}
