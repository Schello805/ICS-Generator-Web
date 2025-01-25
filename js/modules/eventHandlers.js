// Event Handler Module
import { toggleDateTimeFields, updateEndDate } from './dateTimeManager.js';
import { duplicateEvent, toggleRepeatOptions } from './eventManager.js';
import { createICSCalendar } from './icsGenerator.js';

// Funktion zur Validierung der Formulardaten
function validateEventForm(event) {
    const errors = [];
    // Suche nach dem Titel-Input mit der ID, die mit 'summary' beginnt
    const summary = event.querySelector('input[id^="summary"]')?.value;
    const startDate = event.querySelector('.startDate')?.value;
    const isAllDay = event.querySelector('.allDay')?.checked;
    const startTime = event.querySelector('.startTime')?.value;
    
    console.log('Validiere Event:', {
        summary,
        startDate,
        isAllDay,
        startTime
    });
    
    if (!summary?.trim()) {
        errors.push('Bitte geben Sie einen Titel ein');
    }
    
    if (!startDate) {
        errors.push('Bitte wählen Sie ein Startdatum');
    }
    
    if (!isAllDay && !startTime) {
        errors.push('Bitte wählen Sie eine Startzeit');
    }
    
    console.log('Validierungsfehler:', errors);
    return errors;
}

// Funktion zum Anzeigen der Fehlermeldungen
function showValidationErrors(errors, eventNumber) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.setAttribute('role', 'alert');
    
    let errorHtml = `<strong>Fehler in Termin ${eventNumber}:</strong><ul class="mb-0">`;
    errors.forEach(error => {
        errorHtml += `<li>${error}</li>`;
    });
    errorHtml += '</ul>';
    errorHtml += '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>';
    
    alertDiv.innerHTML = errorHtml;
    
    const eventForm = document.querySelector(`#eventForm${eventNumber}`);
    if (eventForm) {
        eventForm.insertAdjacentElement('beforebegin', alertDiv);
    }
    
    // Automatisch nach 5 Sekunden ausblenden
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

export const initializeEventHandlers = () => {
    console.log('Initializing event handlers...'); // Debug-Log

    // Event Listeners für Ganztägige Events
    const allDayCheckboxes = document.querySelectorAll('.allDay');
    console.log('Found allDay checkboxes:', allDayCheckboxes.length); // Debug-Log

    allDayCheckboxes.forEach((checkbox, index) => {
        const eventNumber = index + 1;
        console.log('Setting up checkbox for event:', eventNumber); // Debug-Log
        
        checkbox.addEventListener('change', () => {
            console.log('Checkbox changed for event:', eventNumber); // Debug-Log
            toggleDateTimeFields(eventNumber);
        });
    });

    // Event Listeners für Startdatum
    const startDates = document.querySelectorAll('.startDate');
    console.log('Found startDate inputs:', startDates.length); // Debug-Log
    
    startDates.forEach((input, index) => {
        const eventNumber = index + 1;
        console.log('Setting up startDate for event:', eventNumber); // Debug-Log
        
        input.addEventListener('change', () => {
            console.log('StartDate changed for event:', eventNumber); // Debug-Log
            updateEndDate(eventNumber);
        });
    });

    // Event Listeners für Wiederholungstypen
    const repeatTypes = document.querySelectorAll('.repeatType');
    console.log('Found repeat types:', repeatTypes.length); // Debug-Log
    
    repeatTypes.forEach((select, index) => {
        const eventNumber = index + 1;
        console.log('Setting up repeat type for event:', eventNumber); // Debug-Log
        
        select.addEventListener('change', () => {
            console.log('Repeat type changed for event:', eventNumber); // Debug-Log
            toggleRepeatOptions(eventNumber);
        });
    });

    // Event Listeners für Wiederholungsende
    const repeatEnds = document.querySelectorAll('.repeatEnd');
    console.log('Found repeat ends:', repeatEnds.length); // Debug-Log
    
    repeatEnds.forEach((select, index) => {
        const eventNumber = index + 1;
        console.log('Setting up repeat end for event:', eventNumber); // Debug-Log
        
        select.addEventListener('change', () => {
            console.log('Repeat end changed for event:', eventNumber); // Debug-Log
            toggleRepeatOptions(eventNumber);
        });
    });

    // Event Listener für "Weiterer Termin" Button
    const addEventButton = document.getElementById('addEvent');
    if (addEventButton) {
        console.log('Setting up add event button'); // Debug-Log
        addEventButton.addEventListener('click', () => {
            console.log('Add event button clicked'); // Debug-Log
            duplicateEvent(1);
        });
    }

    // Event Listener für "ICS erstellen" Button
    const generateButton = document.getElementById('generateICS');
    if (generateButton) {
        console.log('Setting up generate button'); // Debug-Log
        generateButton.addEventListener('click', () => {
            try {
                const events = document.querySelectorAll('.eventForm');
                console.log('Gefundene Events:', events.length);
                
                if (!events || events.length === 0) {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
                    alertDiv.innerHTML = `
                        <strong>Hinweis:</strong> Bitte fügen Sie mindestens einen Termin hinzu.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
                    `;
                    document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);
                    return;
                }

                // Validiere alle Events vor der ICS-Erstellung
                let hasErrors = false;
                events.forEach((event, index) => {
                    const eventNumber = index + 1;
                    console.log(`Validiere Event ${eventNumber}:`, event);
                    const errors = validateEventForm(event);
                    if (errors.length > 0) {
                        showValidationErrors(errors, eventNumber);
                        hasErrors = true;
                    }
                });

                if (!hasErrors) {
                    console.log('Keine Fehler gefunden, erstelle ICS-Datei');
                    createICSCalendar(events);
                } else {
                    console.log('Fehler gefunden, ICS-Datei wird nicht erstellt');
                }
            } catch (error) {
                console.error('Fehler beim Erstellen der ICS-Datei:', error);
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <strong>Fehler beim Erstellen der ICS-Datei:</strong><br>
                    ${error.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
                `;
                document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);
            }
        });
    }

    // Initial alle Zeitfelder korrekt anzeigen/verstecken
    allDayCheckboxes.forEach((_, index) => {
        toggleDateTimeFields(index + 1);
    });

    // Initial alle Wiederholungsoptionen korrekt anzeigen/verstecken
    repeatTypes.forEach((_, index) => {
        toggleRepeatOptions(index + 1);
    });
};
