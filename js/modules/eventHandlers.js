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

// Funktion zum Anzeigen eines Toasts
function showToast(message, type = 'info') {
    // Toast-Container erstellen, falls noch nicht vorhanden
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Icon basierend auf Typ
    let icon = '';
    let headerClass = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle me-2"></i>';
            headerClass = 'text-success';
            break;
        case 'danger':
            icon = '<i class="fas fa-exclamation-circle me-2"></i>';
            headerClass = 'text-danger';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
            headerClass = 'text-warning';
            break;
        default:
            icon = '<i class="fas fa-info-circle me-2"></i>';
            headerClass = 'text-primary';
    }

    // Toast-Element erstellen
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto ${headerClass}">${icon}Hinweis</strong>
            <small>Gerade eben</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toastEl);

    // Bootstrap Toast initialisieren und anzeigen
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();

    // Nach dem Ausblenden aus dem DOM entfernen
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Wrapper für Kompatibilität
function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'danger');
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

    // URL Validierung (optional, aber wenn ausgefüllt, dann prüfen)
    const urlInput = form.querySelector('.url');
    if (urlInput) {
        const urlValue = urlInput.value.trim();
        if (urlValue.length > 0) {
            // Einfache URL-Validierung mit Regex
            const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-.,@?^=%&:/~+#]*)?$/i;
            if (!urlPattern.test(urlValue)) {
                errors.push('Bitte geben Sie eine gültige URL ein (z. B. https://beispiel.de)');
                urlInput.classList.add('is-invalid');
            }
        }
    }

    // Entferne is-invalid Klasse bei Änderungen
    form.querySelectorAll('input, select, textarea').forEach(input => {
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
            downloadICSBtn.addEventListener('click', async () => {
                const events = document.querySelectorAll('.eventForm');
                let hasError = false;
                for (const form of events) {
                    const errors = validateForm(form);
                    if (errors.length > 0) {
                        hasError = true;
                        showErrorMessage(errors.join('<br>'));
                        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        break;
                    }
                }
                if (hasError) return;
                // Erstelle ICS nur wenn alles valide
                try {
                    const icsContent = await createICSCalendar(events);
                    // Download auslösen
                    const blob = new Blob([icsContent], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'termine.ics';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                } catch (error) {
                    // Fehler werden bereits in createICSCalendar angezeigt
                }
            });
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

        // --- URL Live-Validierung direkt bei Eingabe ---
        document.addEventListener('input', function (event) {
            if (event.target.classList.contains('url')) {
                const urlInput = event.target;
                const urlValue = urlInput.value.trim();
                const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-.,@?^=%&:/~+#]*)?$/i;
                // Entferne alte Fehlermeldung
                urlInput.classList.remove('is-invalid');
                // Suche nach bereits existierender Fehlermeldung NUR im eigenen Parent
                let feedback = Array.from(urlInput.parentNode.querySelectorAll('.invalid-feedback'))[0];
                if (feedback) {
                    feedback.remove();
                }
                if (urlValue.length > 0 && !urlPattern.test(urlValue)) {
                    urlInput.classList.add('is-invalid');
                    // Feedback nur anzeigen, wenn noch keins existiert
                    if (!urlInput.parentNode.querySelector('.invalid-feedback')) {
                        feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback';
                        feedback.textContent = 'Bitte geben Sie eine gültige URL ein (z. B. https://beispiel.de)';
                        urlInput.parentNode.appendChild(feedback);
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error initializing event handlers:', error);
        showErrorMessage('Fehler beim Initialisieren der Event-Handler.');
    }
}


