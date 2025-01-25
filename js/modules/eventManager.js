// Event Manager Module
import { initializeDateTimeFields } from './dateTimeManager.js';

let eventCounter = 1;

/**
 * WICHTIGER HINWEIS: Diese Funktion dient zum KOPIEREN eines BESTEHENDEN Termins.
 * Sie ist NICHT für das Hinzufügen eines neuen, leeren Termins gedacht.
 * Für das Hinzufügen eines neuen, leeren Termins wird stattdessen der "Weiterer Termin hinzufügen" Button verwendet.
 * 
 * Die Funktion wird durch den "Kopieren" Button (Symbol: Kopieren-Icon) neben jedem Termin ausgelöst.
 * Sie erstellt eine exakte Kopie des ausgewählten Termins mit allen Eingaben und fügt diese direkt
 * nach dem Original-Termin ein.
 * 
 * Funktionsweise:
 * 1. Kopiert alle Formularwerte vom Original-Termin (Titel, Beschreibung, Datum, Zeit, etc.)
 * 2. Erstellt einen neuen Termin direkt nach dem Original
 * 3. Fügt alle kopierten Werte in den neuen Termin ein
 * 4. Aktualisiert die Nummerierung aller Termine
 * 
 * @param {HTMLElement} event - Das Event-Element, das den Kopier-Button enthält
 * @throws {Error} Wenn das Template nicht gefunden wird oder beim Kopieren ein Fehler auftritt
 */
export const duplicateEvent = (event) => {
    try {
        const template = document.getElementById('eventTemplate');
        if (!template) {
            console.error('Event template not found');
            return;
        }

        // Finde das Event-Formular und den Container
        const eventContainer = event.closest('.card');
        const originalForm = eventContainer.querySelector('.eventForm');
        if (!eventContainer || !originalForm) {
            console.error('Event container or form not found');
            return;
        }

        // Erstelle neuen Event-Container
        const newEvent = template.content.cloneNode(true);
        const newCard = newEvent.querySelector('.card');
        
        // Füge den neuen Event nach dem aktuellen ein
        eventContainer.parentNode.insertBefore(newEvent, eventContainer.nextSibling);
        
        // Finde das neue Formular
        const newForm = eventContainer.nextElementSibling.querySelector('.eventForm');
        if (!newForm) {
            console.error('New form not found');
            return;
        }

        // Kopiere alle Eingabefelder
        const inputs = originalForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const newInput = newForm.querySelector(`[name="${input.name}"], [class="${input.className}"]`);
            if (newInput) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    newInput.checked = input.checked;
                } else {
                    newInput.value = input.value;
                }
            }
        });

        // Aktualisiere den Titel
        const events = document.querySelectorAll('.card');
        const eventNumber = events.length;
        const title = eventContainer.nextElementSibling.querySelector('.card-title');
        if (title) {
            title.textContent = `Termin ${eventNumber}`;
        }

        // Initialisiere Event-Handler für den neuen Termin
        initializeEventHandlers();

        // Zeige Erfolgsmeldung
        showSuccess('Termin wurde erfolgreich kopiert');

    } catch (error) {
        console.error('Error duplicating event:', error);
        showError('Fehler beim Kopieren des Termins');
    }
};

/**
 * Entfernt einen Termin
 */
export const removeEvent = (event) => {
    try {
        const card = event.closest('.card');
        if (!card) return;

        // Wenn es der letzte Termin ist, nicht löschen
        const remainingEvents = document.querySelectorAll('.eventForm');
        if (remainingEvents.length <= 1) {
            showError('Es muss mindestens ein Termin vorhanden sein');
            return;
        }

        card.remove();
        
        // Aktualisiere die Nummerierung der verbleibenden Termine
        const events = document.querySelectorAll('.card');
        events.forEach((event, index) => {
            const title = event.querySelector('.card-title');
            if (title) {
                title.textContent = `Termin ${index + 1}`;
            }
        });

        showSuccess('Termin wurde erfolgreich gelöscht');

    } catch (error) {
        console.error('Error removing event:', error);
        showError('Fehler beim Löschen des Termins');
    }
};

// Hilfsfunktionen für Benachrichtigungen
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>Erfolg:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    `;
    document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>Fehler:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    `;
    document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Initialisiere die Datums- und Zeitfelder für den neuen Event
function initializeEventHandlers() {
    initializeDateTimeFields();
}
