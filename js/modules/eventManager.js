// Event Manager Module
import { initializeDateTimeFields } from './dateTimeManager.js';

let eventCounter = 1;

// Event-Handler für das Löschen von Anhängen
document.addEventListener('click', (e) => {
    if (e.target.closest('.clearAttachment')) {
        const btn = e.target.closest('.clearAttachment');
        const fileInput = btn.closest('.input-group').querySelector('.attachment');
        fileInput.value = ''; // Lösche den ausgewählten Dateinamen
    }
});

/**
 * Diese Funktion kann sowohl zum Kopieren eines bestehenden Termins als auch zum Erstellen eines neuen Termins verwendet werden.
 * 
 * Wenn ein Event-Element übergeben wird:
 * - Kopiert alle Formularwerte vom Original-Termin
 * - Fügt den neuen Termin direkt nach dem Original ein
 * 
 * Wenn kein Event-Element übergeben wird:
 * - Erstellt einen neuen, leeren Termin
 * - Fügt ihn am Ende der Liste hinzu
 * 
 * @param {HTMLElement} [event] - Optional: Das Event-Element, das kopiert werden soll
 * @throws {Error} Wenn das Template nicht gefunden wird oder beim Kopieren ein Fehler auftritt
 */
export const duplicateEvent = (event = null) => {
    try {
        const template = document.getElementById('eventTemplate');
        if (!template) {
            console.error('Event template not found');
            return;
        }

        // Erstelle neuen Event-Container
        const newEvent = template.content.cloneNode(true);

        if (event) {
            // Kopiere einen bestehenden Termin
            const eventContainer = event.closest('.card');
            const originalForm = eventContainer.querySelector('.eventForm');
            if (!eventContainer || !originalForm) {
                console.error('Event container or form not found');
                return;
            }

            // Füge den neuen Event nach dem aktuellen ein
            eventContainer.parentNode.insertBefore(newEvent, eventContainer.nextSibling);

            // Kopiere die Werte vom Original-Formular
            const newForm = eventContainer.nextElementSibling.querySelector('.eventForm');
            if (!newForm) {
                console.error('New form not found');
                return;
            }

            // Kopiere alle Input-, Select- und Textarea-Werte
            copyFormFields(originalForm, newForm);

            // Kopiere die Wiederholungseinstellungen
            copyRepeatSettings(originalForm, newForm);

        } else {
            // Füge einen neuen, leeren Termin am Ende hinzu
            const eventsContainer = document.querySelector('#eventsContainer');
            if (!eventsContainer) {
                console.error('Events container not found');
                return;
            }
            eventsContainer.appendChild(newEvent);
        }

        // Initialisiere die Datums- und Zeitfelder für den neuen Event
        initializeDateTimeFields();

        // Aktualisiere die Event-Nummerierung
        updateEventNumbers();

    } catch (error) {
        console.error('Error duplicating event:', error);
        throw error;
    }
};

/**
 * Kopiert alle Formularfelder von einem Formular zum anderen
 * @param {HTMLFormElement} sourceForm - Das Quellformular
 * @param {HTMLFormElement} targetForm - Das Zielformular
 */
function copyFormFields(sourceForm, targetForm) {
    // Kopiere alle Eingabefelder
    sourceForm.querySelectorAll('input, select, textarea').forEach(sourceInput => {
        // Versuche das entsprechende Feld im Zielformular zu finden
        // Suche nach verschiedenen Attributen in dieser Reihenfolge
        const selectors = [
            `[name="${sourceInput.name}"]`,
            `[id="${sourceInput.id}"]`,
            `[data-field="${sourceInput.getAttribute('data-field')}"]`,
            `[class="${sourceInput.className}"]`
        ].join(', ');

        const targetInput = targetForm.querySelector(selectors);
        
        if (targetInput) {
            // Kopiere den Wert basierend auf dem Feldtyp
            if (sourceInput.type === 'checkbox' || sourceInput.type === 'radio') {
                targetInput.checked = sourceInput.checked;
            } else if (sourceInput.type === 'select-multiple') {
                // Für Multi-Select Felder
                Array.from(sourceInput.options).forEach((option, index) => {
                    targetInput.options[index].selected = option.selected;
                });
            } else {
                targetInput.value = sourceInput.value;
            }

            // Kopiere alle data-* Attribute
            Array.from(sourceInput.attributes)
                .filter(attr => attr.name.startsWith('data-'))
                .forEach(attr => {
                    targetInput.setAttribute(attr.name, attr.value);
                });

            // Kopiere den disabled Status
            targetInput.disabled = sourceInput.disabled;
        }
    });
}

/**
 * Kopiert die Wiederholungseinstellungen von einem Formular zum anderen
 * @param {HTMLFormElement} sourceForm - Das Quellformular
 * @param {HTMLFormElement} targetForm - Das Zielformular
 */
function copyRepeatSettings(sourceForm, targetForm) {
    // Kopiere die Wiederholungsart
    const sourceRepeatType = sourceForm.querySelector('.repeatType');
    const targetRepeatType = targetForm.querySelector('.repeatType');
    if (sourceRepeatType && targetRepeatType) {
        targetRepeatType.value = sourceRepeatType.value;

        // Je nach Wiederholungsart weitere Einstellungen kopieren
        switch (sourceRepeatType.value) {
            case 'weekly':
                // Kopiere die ausgewählten Wochentage
                sourceForm.querySelectorAll('input[name^="weekday"]').forEach(sourceWeekday => {
                    const weekdayNumber = sourceWeekday.name.replace('weekday', '');
                    const targetWeekday = targetForm.querySelector(`input[name="weekday${weekdayNumber}"]`);
                    if (targetWeekday) {
                        targetWeekday.checked = sourceWeekday.checked;
                    }
                });
                break;

            case 'monthly':
                // Kopiere die monatlichen Einstellungen
                const sourceMonthlyType = sourceForm.querySelector('input[name="monthlyType"]:checked');
                if (sourceMonthlyType) {
                    const targetMonthlyType = targetForm.querySelector(`input[name="monthlyType"][value="${sourceMonthlyType.value}"]`);
                    if (targetMonthlyType) {
                        targetMonthlyType.checked = true;
                    }
                }
                break;

            case 'yearly':
                // Kopiere die jährlichen Einstellungen
                const sourceYearlyMonth = sourceForm.querySelector('select[name="yearlyMonth"]');
                const targetYearlyMonth = targetForm.querySelector('select[name="yearlyMonth"]');
                if (sourceYearlyMonth && targetYearlyMonth) {
                    targetYearlyMonth.value = sourceYearlyMonth.value;
                }
                break;
        }

        // Kopiere das Enddatum der Wiederholung
        const sourceEndDate = sourceForm.querySelector('input[name="repeatEndDate"]');
        const targetEndDate = targetForm.querySelector('input[name="repeatEndDate"]');
        if (sourceEndDate && targetEndDate) {
            targetEndDate.value = sourceEndDate.value;
        }
    }
}

/**
 * Aktualisiert die Nummerierung aller Events
 */
function updateEventNumbers() {
    const events = document.querySelectorAll('.card');
    events.forEach((event, index) => {
        // Aktualisiere die Überschrift
        const title = event.querySelector('.card-title');
        if (title) {
            title.textContent = `Termin ${index + 1}`;
        }

        // Aktualisiere die ID des Formulars
        const form = event.querySelector('.eventForm');
        if (form) {
            form.id = `eventForm${index + 1}`;
        }

        // Aktualisiere die IDs und Labels der Formularelemente
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.id) {
                const baseName = input.id.replace(/\d+$/, '');
                const newId = `${baseName}${index + 1}`;
                
                // Aktualisiere die ID
                input.id = newId;
                
                // Aktualisiere das zugehörige Label
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    label.setAttribute('for', newId);
                }
            }
        });
    });
}

/**
 * Entfernt einen Termin
 * @param {HTMLElement} event - Das zu entfernende Event-Element
 */
export const removeEvent = (event) => {
    try {
        const eventContainer = event.closest('.card');
        if (!eventContainer) {
            console.error('Event container not found');
            return;
        }

        // Entferne das Event
        eventContainer.remove();

        // Aktualisiere die Event-Nummerierung
        updateEventNumbers();

    } catch (error) {
        console.error('Error removing event:', error);
        throw error;
    }
};
