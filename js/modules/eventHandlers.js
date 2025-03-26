// Event Handlers Module
import { createICSCalendar } from './icsGenerator.js';
import { toggleDateTimeFields, initializeDateTimeFields } from './dateTimeManager.js';
import { duplicateEvent, removeEvent } from './eventManager.js';
import { escapeText } from './icsFormatter.js';

// Funktion zur Validierung der Formulardaten
function validateEventForm(event) {
    const form = event.target.closest('.eventForm');
    if (!form) return false;

    const startDate = form.querySelector('.startDate').value;
    const endDate = form.querySelector('.endDate').value;
    const allDay = form.querySelector('.allDay').checked;
    const title = form.querySelector('.summary').value.trim();

    if (!title) {
        showErrorMessage('Bitte geben Sie einen Titel ein');
        return false;
    }

    if (!startDate || !endDate) {
        showErrorMessage('Bitte Start- und Enddatum auswählen');
        return false;
    }

    if (!allDay) {
        const startTime = form.querySelector('.startTime').value;
        const endTime = form.querySelector('.endTime').value;
        if (!startTime || !endTime) {
            showErrorMessage('Bitte Start- und Endzeit auswählen');
            return false;
        }
    }

    return true;
}

// Funktion zum Anzeigen einer Erfolgsmeldung
function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('main') || document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        // Automatisch nach 3 Sekunden ausblenden
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
}

// Funktion zum Anzeigen einer Fehlermeldung
function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('main') || document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        // Automatisch nach 5 Sekunden ausblenden
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
}

// Funktion zum Formatieren des Datums
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        // Entferne mögliche Zeitzonenangaben und Value-Type-Parameter
        dateStr = dateStr.replace(/;VALUE=DATE[^:]*:/, '').replace('Z', '');
        
        // Wenn das Datum im ICS-Format ist (YYYYMMDD oder YYYYMMDDTHHMMSS)
        if (dateStr.match(/^\d{8}(T\d{6})?$/)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return `${year}-${month}-${day}`;
        }

        // Versuche das Datum zu parsen
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateStr);
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', dateStr, error);
        return '';
    }
}

// Funktion zum Formatieren des Datums für die Vorschau
function formatPreviewDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Funktion zum Extrahieren der Zeit aus einem ICS-Datum
function extractTimeFromDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        // Wenn das Datum eine Zeit enthält (YYYYMMDDTHHMMSS)
        if (dateStr.includes('T')) {
            const timeStr = dateStr.split('T')[1];
            if (timeStr.length >= 4) {
                const hours = timeStr.substring(0, 2);
                const minutes = timeStr.substring(2, 4);
                return `${hours}:${minutes}`;
            }
        }
        return '';
    } catch (error) {
        console.error('Error extracting time:', dateStr, error);
        return '';
    }
}

// Funktion zum Erstellen der Vorschau
function createEventPreview(event) {
    const summary = event.querySelector('.summary').value.trim();
    const location = event.querySelector('.location').value.trim();
    const description = event.querySelector('.description').value.trim();
    const startDate = event.querySelector('.startDate').value;
    const endDate = event.querySelector('.endDate').value;
    const allDay = event.querySelector('.allDay').checked;
    const startTime = event.querySelector('.startTime').value;
    const endTime = event.querySelector('.endTime').value;
    const repeatType = event.querySelector('.repeatType').value;

    let previewHtml = `
        <div class="preview-item">
            <h5>${summary || 'Ohne Titel'}</h5>
            ${location ? `<p><strong>Ort:</strong> ${location}</p>` : ''}
            <p><strong>Datum:</strong> ${formatPreviewDate(startDate)}${!allDay ? ` ${startTime}` : ''} bis ${formatPreviewDate(endDate)}${!allDay ? ` ${endTime}` : ''}</p>
            ${description ? `<p><strong>Beschreibung:</strong> ${description}</p>` : ''}
            ${repeatType !== 'none' ? `<p><strong>Wiederholung:</strong> ${getRepeatTypeText(repeatType)}</p>` : ''}
        </div>
    `;

    return previewHtml;
}

// Funktion zum Anzeigen des Vorschau-Modals
function showPreview() {
    const events = document.querySelectorAll('.eventForm');
    let previewContent = '';
    
    events.forEach((event, index) => {
        previewContent += `<h4>Termin ${index + 1}</h4>`;
        previewContent += createEventPreview(event);
    });

    document.getElementById('previewContent').innerHTML = previewContent;
    new bootstrap.Modal(document.getElementById('previewModal')).show();
}

// Funktion zum Konvertieren des Wiederholungstyps in lesbaren Text
function getRepeatTypeText(repeatType) {
    const repeatTypes = {
        'none': 'Keine Wiederholung',
        'DAILY': 'Täglich',
        'WEEKLY': 'Wöchentlich',
        'MONTHLY': 'Monatlich',
        'YEARLY': 'Jährlich'
    };
    return repeatTypes[repeatType] || repeatType;
}

// Funktion zum Behandeln von Änderungen im Wiederholungstyp
function handleRepeatTypeChange(event) {
    try {
        const form = event.target.closest('.eventForm');
        if (!form) {
            console.error('Formular nicht gefunden');
            return;
        }

        const repeatType = event.target.value;
        const repeatDetails = form.querySelector('.repeatDetails');
        const weeklySelector = form.querySelector('.weeklySelector');
        const monthlySelector = form.querySelector('.monthlySelector');
        
        // Zeige/Verstecke den Wiederholungs-Details-Bereich
        if (repeatDetails) {
            repeatDetails.style.display = repeatType === 'none' ? 'none' : 'block';
        }

        // Aktualisiere den Intervall-Label-Text
        const intervalLabel = form.querySelector('.repeatIntervalLabel');
        if (intervalLabel) {
            switch (repeatType) {
                case 'DAILY':
                    intervalLabel.textContent = 'Tage';
                    break;
                case 'WEEKLY':
                    intervalLabel.textContent = 'Wochen';
                    break;
                case 'MONTHLY':
                    intervalLabel.textContent = 'Monate';
                    break;
                case 'YEARLY':
                    intervalLabel.textContent = 'Jahre';
                    break;
                default:
                    intervalLabel.textContent = 'Intervall';
            }
        }

        // Zeige/Verstecke die wöchentliche Auswahl
        if (weeklySelector) {
            weeklySelector.style.display = repeatType === 'WEEKLY' ? 'block' : 'none';
        }

        // Zeige/Verstecke die monatliche Auswahl
        if (monthlySelector) {
            monthlySelector.style.display = repeatType === 'MONTHLY' ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Wiederholungsoptionen:', error);
    }
}

// Funktion zur Validierung des Formulars
function validateForm(form) {
    const errors = [];
    
    // Pflichtfelder prüfen
    const summary = form.querySelector('.summary')?.value?.trim();
    if (!summary) {
        errors.push('Bitte geben Sie einen Titel ein');
        form.querySelector('.summary').classList.add('is-invalid');
    }

    const startDate = form.querySelector('.startDate')?.value;
    if (!startDate) {
        errors.push('Bitte wählen Sie ein Startdatum');
        form.querySelector('.startDate').classList.add('is-invalid');
    }

    const endDate = form.querySelector('.endDate')?.value;
    if (!endDate) {
        errors.push('Bitte wählen Sie ein Enddatum');
        form.querySelector('.endDate').classList.add('is-invalid');
    }

    // Prüfe ob Enddatum nach Startdatum liegt
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        errors.push('Das Enddatum muss nach dem Startdatum liegen');
        form.querySelector('.endDate').classList.add('is-invalid');
    }

    // Prüfe Zeitfelder nur wenn nicht ganztägig
    const allDay = form.querySelector('.allDay')?.checked;
    if (!allDay) {
        const startTime = form.querySelector('.startTime')?.value;
        const endTime = form.querySelector('.endTime')?.value;

        if (!startTime) {
            errors.push('Bitte wählen Sie eine Startzeit');
            form.querySelector('.startTime').classList.add('is-invalid');
        }

        if (!endTime) {
            errors.push('Bitte wählen Sie eine Endzeit');
            form.querySelector('.endTime').classList.add('is-invalid');
        }

        // Prüfe ob Endzeit nach Startzeit liegt am selben Tag
        if (startTime && endTime && startDate === endDate) {
            const start = new Date(`${startDate}T${startTime}`);
            const end = new Date(`${endDate}T${endTime}`);
            if (end <= start) {
                errors.push('Die Endzeit muss nach der Startzeit liegen');
                form.querySelector('.endTime').classList.add('is-invalid');
            }
        }
    }

    // Entferne is-invalid Klasse bei Änderungen
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            const errorDiv = input.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
        });
    });

    return errors;
}

// Event Handler Initialisierung
export function initializeEventHandlers() {
    try {
        // Event-Handler für "Termin hinzufügen" Button
        const addEventBtn = document.getElementById('addEvent');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => duplicateEvent());
        }

        // Event-Handler für "ICS herunterladen" Button
        const downloadICSBtn = document.getElementById('downloadICS');
        if (downloadICSBtn) {
            downloadICSBtn.addEventListener('click', () => {
                const events = document.querySelectorAll('.eventForm');
                if (events.length === 0) {
                    showErrorMessage('Bitte fügen Sie mindestens einen Termin hinzu.');
                    return;
                }

                // Validiere alle Formulare
                let hasErrors = false;
                events.forEach(form => {
                    const errors = validateForm(form);
                    if (errors.length > 0) {
                        hasErrors = true;
                        errors.forEach(error => {
                            showErrorMessage(error);
                        });
                    }
                });

                if (hasErrors) {
                    return;
                }

                try {
                    const success = createICSCalendar(events);
                    if (success) {
                        showSuccessMessage('ICS-Datei wurde erfolgreich erstellt.');
                        // Entferne alle Fehlermarkierungen
                        document.querySelectorAll('.is-invalid').forEach(el => {
                            el.classList.remove('is-invalid');
                        });
                    }
                } catch (error) {
                    console.error('Error creating ICS file:', error);
                    showErrorMessage(error.message || 'Fehler beim Erstellen der ICS-Datei.');
                }
            });
        }

        // Event-Handler für "Vorschau" Button
        const previewBtn = document.getElementById('previewEvents');
        if (previewBtn) {
            previewBtn.addEventListener('click', showPreview);
        }

        // Event-Handler für dynamisch hinzugefügte Events
        document.addEventListener('click', (event) => {
            // Kopieren-Button
            if (event.target.closest('.copyEvent')) {
                event.preventDefault();
                const eventElement = event.target.closest('.card');
                if (eventElement) {
                    duplicateEvent(eventElement);
                }
            }

            // Löschen-Button
            if (event.target.closest('.removeEvent')) {
                event.preventDefault();
                const eventElement = event.target.closest('.card');
                if (eventElement) {
                    removeEvent(eventElement);
                }
            }
        });

        // Event-Handler für Wiederholungstyp
        document.addEventListener('change', (event) => {
            if (event.target.matches('.repeatType')) {
                handleRepeatTypeChange(event);
            }
        });

        // Event-Handler für ganztägige Events
        document.addEventListener('change', (event) => {
            if (event.target.matches('.allDay')) {
                const form = event.target.closest('.eventForm');
                if (form) {
                    toggleDateTimeFields(form);
                }
            }
        });

        // Initialisiere die Datums- und Zeitfelder für alle Events
        initializeDateTimeFields();

    } catch (error) {
        console.error('Error initializing event handlers:', error);
        showErrorMessage('Fehler beim Initialisieren der Event-Handler.');
    }
}

// Event Handler für das Löschen eines Events
function handleDeleteEvent(eventNumber) {
    const event = document.querySelector(`#eventForm${eventNumber}`);
    if (event) {
        const card = event.closest('.card');
        if (card) {
            card.remove();
            showSuccessMessage(`Termin ${eventNumber} wurde gelöscht.`);
        }
    }
}
