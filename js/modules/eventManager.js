// Event Manager Module
import { toggleDateTimeFields } from './dateTimeManager.js';

export const duplicateEvent = (eventNumber) => {
    try {
        const eventsContainer = document.getElementById('eventsContainer');
        const originalEvent = document.querySelector(`form[id^="eventForm"]:nth-child(${eventNumber})`);
        
        if (!originalEvent || !eventsContainer) {
            console.error('Original event or container not found');
            return;
        }

        // Zähle existierende Events
        const eventCount = document.querySelectorAll('.eventForm').length;
        const newEventNumber = eventCount + 1;

        // Klone das Event
        const newEvent = originalEvent.cloneNode(true);
        
        // Aktualisiere die ID des neuen Events
        newEvent.id = `eventForm${newEventNumber}`;

        // Aktualisiere den Titel
        const titleElement = newEvent.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = `Termin ${newEventNumber}`;
            titleElement.id = `event-title-${newEventNumber}`;
        }

        // Aktualisiere IDs und leere Werte
        const inputs = newEvent.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Behalte den Wert für bestimmte Felder
            const keepValue = ['allDay', 'repeatType', 'repeatInterval', 'reminderTime'].some(
                className => input.classList.contains(className)
            );

            // Aktualisiere die ID
            if (input.id) {
                input.id = input.id.replace(/\d+$/, newEventNumber);
            }

            // Aktualisiere for-Attribute der zugehörigen Label
            const label = newEvent.querySelector(`label[for="${input.id.replace(/\d+$/, eventNumber)}"]`);
            if (label) {
                label.setAttribute('for', input.id);
            }

            // Leere den Wert, wenn nicht in der keepValue-Liste
            if (!keepValue) {
                input.value = '';
            }

            // Setze Checkbox zurück
            if (input.type === 'checkbox') {
                input.checked = false;
            }
        });

        // Füge das neue Event hinzu
        eventsContainer.appendChild(newEvent);

        // Initialisiere die Zeitfelder
        toggleDateTimeFields(newEventNumber);
        
        // Initialisiere die Wiederholungsoptionen
        const repeatType = newEvent.querySelector('.repeatType');
        if (repeatType) {
            toggleRepeatOptions(newEventNumber);
        }

        console.log(`Event ${newEventNumber} wurde erstellt`);
    } catch (error) {
        console.error('Fehler beim Duplizieren des Events:', error);
    }
};

export const toggleRepeatOptions = (eventNumber) => {
    try {
        const form = document.querySelector(`#eventForm${eventNumber}`);
        if (!form) {
            console.error(`Form #eventForm${eventNumber} nicht gefunden`);
            return;
        }

        const repeatType = form.querySelector('.repeatType');
        const repeatDetails = form.querySelector('.repeatDetails');
        
        if (!repeatType || !repeatDetails) {
            console.error('Wiederholungs-Elemente nicht gefunden');
            return;
        }

        // Zeige/Verstecke Details basierend auf dem ausgewählten Typ
        repeatDetails.style.display = repeatType.value === 'none' ? 'none' : 'block';

        // Verwalte Standard- und benutzerdefinierte Wiederholungen
        const standardRepeat = form.querySelector('.standardRepeat');
        const customRepeat = form.querySelector('.customRepeat');

        if (standardRepeat && customRepeat) {
            if (repeatType.value === 'custom') {
                standardRepeat.style.display = 'none';
                customRepeat.style.display = 'block';
                // Verstecke Ende-Optionen bei benutzerdefinierten Regeln
                const repeatEndSection = form.querySelector('.repeatEndSection');
                if (repeatEndSection) {
                    repeatEndSection.style.display = 'none';
                }
                return; // Keine weiteren Anpassungen nötig
            } else {
                standardRepeat.style.display = 'block';
                customRepeat.style.display = 'none';
                const repeatEndSection = form.querySelector('.repeatEndSection');
                if (repeatEndSection) {
                    repeatEndSection.style.display = 'block';
                }
            }
        }

        // Aktualisiere das Intervall-Label
        const intervalLabel = form.querySelector('.repeatIntervalLabel');
        if (intervalLabel) {
            switch (repeatType.value) {
                case 'daily':
                    intervalLabel.textContent = 'Tag(e)';
                    break;
                case 'weekly':
                    intervalLabel.textContent = 'Woche(n)';
                    break;
                case 'monthly':
                    intervalLabel.textContent = 'Monat(e)';
                    break;
                case 'yearly':
                    intervalLabel.textContent = 'Jahr(e)';
                    break;
                default:
                    intervalLabel.textContent = 'Intervall';
            }
        }

        // Verwalte spezifische Wiederholungsoptionen
        const weekdaySelector = form.querySelector('.weekdaySelector');
        const monthlySelector = form.querySelector('.monthlySelector');

        // Verstecke zunächst alle spezifischen Optionen
        if (weekdaySelector) weekdaySelector.style.display = 'none';
        if (monthlySelector) monthlySelector.style.display = 'none';

        // Zeige relevante Optionen basierend auf dem Typ
        switch (repeatType.value) {
            case 'weekly':
                if (weekdaySelector) {
                    weekdaySelector.style.display = 'block';
                    // Setze den aktuellen Wochentag als Standard, wenn keine Auswahl
                    const weekdays = weekdaySelector.querySelectorAll('.weekday');
                    const today = new Date().getDay();
                    const dayMap = {0: 'su', 1: 'mo', 2: 'tu', 3: 'we', 4: 'th', 5: 'fr', 6: 'sa'};
                    if (!Array.from(weekdays).some(cb => cb.checked)) {
                        const todayCheckbox = weekdaySelector.querySelector(`#weekday_${dayMap[today]}_${eventNumber}`);
                        if (todayCheckbox) todayCheckbox.checked = true;
                    }
                }
                break;
            case 'monthly':
                if (monthlySelector) {
                    monthlySelector.style.display = 'block';
                    // Initialisiere monatliche Optionen
                    const monthlyType = form.querySelector('.monthlyType');
                    if (monthlyType) {
                        const monthlyByDay = form.querySelector('.monthlyByDay');
                        if (monthlyByDay) {
                            monthlyByDay.style.display = monthlyType.value === 'BYDAY' ? 'block' : 'none';
                        }
                    }
                }
                break;
        }

        // Verwalte die Ende-Optionen
        const repeatEndSection = form.querySelector('.repeatEndSection');
        const repeatEndSelect = form.querySelector('.repeatEnd');
        const repeatCount = form.querySelector('.repeatCount');
        const repeatUntil = form.querySelector('.repeatUntil');

        if (repeatEndSection && repeatEndSelect) {
            repeatEndSection.style.display = repeatType.value === 'none' ? 'none' : 'block';

            // Verstecke zunächst alle Optionen
            if (repeatCount) repeatCount.style.display = 'none';
            if (repeatUntil) repeatUntil.style.display = 'none';

            // Zeige die relevante Option basierend auf der Auswahl
            if (repeatEndSelect.value === 'after' && repeatCount) {
                repeatCount.style.display = 'block';
            } else if (repeatEndSelect.value === 'until' && repeatUntil) {
                repeatUntil.style.display = 'block';
            }
        }

        console.log(`Wiederholungsoptionen für Event ${eventNumber} aktualisiert`);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Wiederholungsoptionen:', error);
    }
};
