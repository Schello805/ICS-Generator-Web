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

    if (!startDate || !endDate) {
        alert('Bitte Start- und Enddatum auswählen');
        return false;
    }

    if (!allDay) {
        const startTime = form.querySelector('.startTime').value;
        const endTime = form.querySelector('.endTime').value;
        if (!startTime || !endTime) {
            alert('Bitte Start- und Endzeit auswählen');
            return false;
        }
    }

    return true;
}

// Funktion zur Validierung der Formulardaten
function validateEventFormOriginal(event) {
    const errors = [];
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

// Funktion zum Anzeigen einer Erfolgsmeldung
function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('main').insertBefore(alertDiv, document.querySelector('main').firstChild);
}

// Funktion zum Anzeigen einer Fehlermeldung
function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('main').insertBefore(alertDiv, document.querySelector('main').firstChild);
}

// Funktion zum Warten auf ein Element
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        // Starte Beobachtung
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout nach der angegebenen Zeit
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found after timeout`));
        }, timeout);
    });
}

const handleRepeatTypeChange = (event) => {
    const form = event.target.closest('.eventForm');
    const repeatType = event.target.value;
    const repeatDetails = form.querySelector('.repeatDetails');
    const weeklySelector = form.querySelector('.weeklySelector');
    const intervalLabel = form.querySelector('.repeatIntervalLabel');

    // Verstecke/Zeige die Wiederholungsoptionen
    repeatDetails.style.display = repeatType === 'none' ? 'none' : 'block';
    
    // Verstecke alle spezifischen Wiederholungsoptionen
    if (weeklySelector) {
        weeklySelector.style.display = 'none';
    }

    // Zeige die spezifischen Optionen basierend auf dem Typ
    switch (repeatType) {
        case 'DAILY':
            intervalLabel.textContent = 'Tage';
            break;
        case 'WEEKLY':
            intervalLabel.textContent = 'Wochen';
            if (weeklySelector) {
                weeklySelector.style.display = 'block';
            }
            break;
        case 'MONTHLY':
            intervalLabel.textContent = 'Monate';
            break;
        case 'YEARLY':
            intervalLabel.textContent = 'Jahre';
            break;
    }
};

const handleMonthlyTypeChange = (event) => {
    const form = event.target.closest('.eventForm');
    const monthlyType = event.target.value;
    const monthlyByDay = form.querySelector('.monthlyByDay');
    const monthlyByWeekday = form.querySelector('.monthlyByWeekday');

    monthlyByDay.style.display = monthlyType === 'BYMONTHDAY' ? 'block' : 'none';
    monthlyByWeekday.style.display = monthlyType === 'BYDAY' ? 'block' : 'none';
};

// Funktion zum Erstellen der Vorschau
function createEventPreview(event) {
    const summary = event.querySelector('input[id^="summary"]')?.value?.trim() || '';
    const description = event.querySelector('textarea[id^="description"]')?.value?.trim() || '';
    const location = event.querySelector('input[id^="location"]')?.value?.trim() || '';
    const startDate = event.querySelector('.startDate')?.value || '';
    const endDate = event.querySelector('.endDate')?.value || '';
    const startTime = event.querySelector('.startTime')?.value || '';
    const endTime = event.querySelector('.endTime')?.value || '';
    const allDay = event.querySelector('.allDay')?.checked || false;
    const repeatType = event.querySelector('.repeatType')?.value || 'none';

    let previewHtml = `
        <div class="preview-event mb-4">
            <h6 class="preview-title">${escapeText(summary)}</h6>
            <div class="preview-details">
                <p class="mb-2">
                    <i class="fas fa-calendar-alt me-2"></i>
                    ${formatPreviewDate(startDate)}
                    ${!allDay ? `${startTime}` : '(Ganztägig)'}
                    ${endDate !== startDate ? ` - ${formatPreviewDate(endDate)}` : ''}
                    ${!allDay && endTime ? ` ${endTime}` : ''}
                </p>
                ${location ? `
                    <p class="mb-2">
                        <i class="fas fa-map-marker-alt me-2"></i>
                        ${escapeText(location)}
                    </p>
                ` : ''}
                ${description ? `
                    <p class="mb-2">
                        <i class="fas fa-align-left me-2"></i>
                        ${escapeText(description)}
                    </p>
                ` : ''}
                ${repeatType !== 'none' ? `
                    <p class="mb-2">
                        <i class="fas fa-redo me-2"></i>
                        Wiederholung: ${getRepeatTypeText(repeatType)}
                    </p>
                ` : ''}
            </div>
        </div>
    `;

    return previewHtml;
}

// Funktion zum Anzeigen des Vorschau-Modals
function showPreview() {
    const events = document.querySelectorAll('.eventForm');
    let previewHtml = '';
    
    events.forEach((event, index) => {
        previewHtml += createEventPreview(event);
        if (index < events.length - 1) {
            previewHtml += '<hr>';
        }
    });
    
    document.getElementById('previewContent').innerHTML = previewHtml;
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    previewModal.show();
}

// Funktion zum Konvertieren des Wiederholungstyps in lesbaren Text
function getRepeatTypeText(repeatType) {
    const types = {
        'daily': 'Täglich',
        'weekly': 'Wöchentlich',
        'monthly': 'Monatlich',
        'yearly': 'Jährlich'
    };
    return types[repeatType] || repeatType;
}

export const initializeEventHandlers = () => {
    try {
        // Initialisiere Datums- und Zeitfelder
        initializeDateTimeFields();

        // Event-Handler für "Ganztägig" Checkbox
        document.addEventListener('change', (event) => {
            if (event.target.classList.contains('allDay')) {
                const form = event.target.closest('.eventForm');
                toggleDateTimeFields(form);
            }
        });

        // Event-Handler für Wiederholungstyp
        document.addEventListener('change', (event) => {
            if (event.target.classList.contains('repeatType')) {
                handleRepeatTypeChange(event);
            }
        });

        // Event-Handler für monatliche Wiederholungsart
        document.addEventListener('change', (event) => {
            if (event.target.classList.contains('monthlyType')) {
                handleMonthlyTypeChange(event);
            }
        });

        // Event-Handler für "Termin kopieren" Buttons
        document.addEventListener('click', (event) => {
            if (event.target.closest('.copyEvent')) {
                duplicateEvent(event.target);
            }
        });

        // Event-Handler für "Termin hinzufügen" Button
        const addEventButton = document.getElementById('addEvent');
        if (addEventButton) {
            addEventButton.addEventListener('click', () => {
                duplicateEvent(); // Kein Parameter bedeutet: Erstelle einen neuen, leeren Termin
            });
        }

        // Event-Handler für "Termin löschen" Buttons
        document.addEventListener('click', (event) => {
            if (event.target.closest('.removeEvent')) {
                const card = event.target.closest('.card');
                if (card) {
                    card.remove();
                }
            }
        });

        // Event-Handler für ICS-Generierung
        const generateButton = document.getElementById('generateICS');
        if (generateButton) {
            generateButton.addEventListener('click', () => {
                try {
                    const events = document.querySelectorAll('.eventForm');
                    const icsContent = createICSCalendar(events);
                    
                    // Erstelle und lade die ICS-Datei
                    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'calendar.ics';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error('Fehler beim Generieren der ICS-Datei:', error);
                    alert('Fehler beim Generieren der ICS-Datei. Bitte überprüfen Sie Ihre Eingaben.');
                }
            });
        }

        // Event-Listener für Löschen-Buttons
        document.querySelectorAll('.removeEvent').forEach(button => {
            button.addEventListener('click', (e) => {
                removeEvent(e.target);
            });
        });

        // Event-Listener für Kopieren-Buttons
        document.querySelectorAll('.copyEvent').forEach(button => {
            button.addEventListener('click', (e) => {
                duplicateEvent(e.target);
            });
        });

        // Preview Event Handler
        const previewButton = document.getElementById('previewEvents');
        const previewModal = document.getElementById('previewModal');
        
        if (previewButton && previewModal) {  // Nur auf der Generator-Seite
            previewButton.addEventListener('click', () => {
                showPreview();
            });
        }

        // Initialisiere Tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });

    } catch (error) {
        console.error('Fehler beim Initialisieren der Event-Handler:', error);
    }
};

// Event Handler für das Löschen eines Events
export const handleDeleteEvent = (eventNumber) => {
    const form = document.querySelector(`#eventForm${eventNumber}`);
    if (form) {
        const card = form.closest('.card');
        if (card) {
            card.remove();
        }
    }
};
