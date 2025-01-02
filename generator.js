var scriptRevision = 15; // Fortlaufende Revisionsnummer
var events = 1; // Zählvariable für Termine

window.onload = function () {
    initializePlaceholderTexts();
    setupValidation(1); // Initialisiere das erste Event
    
    // Initialisiere die Zeitfelder für das erste Event
    const checkbox = document.getElementById('allDay1');
    if (checkbox) {
        // Setze Standardzeiten
        const now = new Date();
        const roundedHour = Math.ceil(now.getHours());
        
        document.getElementById('startTime1').value = 
            `${roundedHour.toString().padStart(2, '0')}:00`;
        document.getElementById('endTime1').value = 
            `${(roundedHour + 1).toString().padStart(2, '0')}:00`;
            
        // Setze heutiges Datum
        const today = now.toISOString().split('T')[0];
        document.getElementById('startDate1').value = today;
        document.getElementById('endDate1').value = today;
        
        toggleDateTimeFields(1);
    }
};

function initializePlaceholderTexts() {
    // Platzhaltertexte müssen nicht gesetzt werden, da sie standardmäßig im Browser dargestellt werden
}

function toggleDateTimeFields(eventIndex) {
    var allDay = document.getElementById("allDay" + eventIndex).checked;
    var timeLabels = document.querySelectorAll(`#event${eventIndex} .time-label`);
    var startTime = document.getElementById("startTime" + eventIndex);
    var endTime = document.getElementById("endTime" + eventIndex);
    var timeContainers = document.querySelectorAll(`#event${eventIndex} .time-field-container`);
    
    // Zeitfelder ein-/ausblenden und aktivieren/deaktivieren
    startTime.disabled = allDay;
    endTime.disabled = allDay;
    
    // Visuelle Anpassungen
    timeLabels.forEach(function (label) {
        if (allDay) {
            label.classList.add('disabled');
        } else {
            label.classList.remove('disabled');
        }
    });
    
    timeContainers.forEach(function(container) {
        if (allDay) {
            container.classList.add('disabled');
        } else {
            container.classList.remove('disabled');
        }
    });
    
    // Zeiten automatisch setzen
    if (allDay) {
        startTime.value = "00:00";
        endTime.value = "23:59";
    } else {
        const now = new Date();
        const roundedHour = Math.ceil(now.getHours());
        startTime.value = `${roundedHour.toString().padStart(2, '0')}:00`;
        endTime.value = `${(roundedHour + 1).toString().padStart(2, '0')}:00`;
    }
    
    // Validierung der Felder durchführen
    validateField(startTime);
    validateField(endTime);
}

function generateUID() {
    return Date.now() + Math.random().toString(36).substring(2, 15);
}

function getCurrentDateTimeUTC() {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function addAnotherEvent() {
    events++;
    var eventHTML = `
        <div class="card mb-4" id="event${events}">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Termin ${events}</h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-outline-primary btn-sm mr-2" onclick="duplicateEvent(${events})">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteEvent(${events})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <form class="eventForm" data-event-number="${events}">
                    <div class="card bg-light mb-3">
                        <div class="card-body">
                            <div class="form-group">
                                <label for="summary${events}" class="required">Titel</label>
                                <input type="text" class="form-control" id="summary${events}">
                            </div>
                        </div>
                    </div>
                    <div class="custom-control custom-checkbox mb-3">
                        <input type="checkbox" class="custom-control-input" id="allDay${events}" onchange="toggleDateTimeFields(${events})">
                        <label class="custom-control-label" for="allDay${events}">Ganztägig</label>
                    </div>
                    <div class="card bg-light mb-3">
                        <div class="card-body">
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="startDate${events}" class="required">Startdatum</label>
                                    <input type="date" class="form-control startDate" id="startDate${events}">
                                </div>
                                <div class="form-group col-md-6 time-field-container">
                                    <label for="startTime${events}" class="time-label">Startzeit</label>
                                    <input type="time" class="form-control startTime" id="startTime${events}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="endDate${events}" class="required">Enddatum</label>
                                    <input type="date" class="form-control endDate" id="endDate${events}">
                                </div>
                                <div class="form-group col-md-6 time-field-container">
                                    <label for="endTime${events}" class="time-label">Endzeit</label>
                                    <input type="time" class="form-control endTime" id="endTime${events}">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card bg-light mb-3">
                        <div class="card-body">
                            <div class="form-group">
                                <label for="location${events}">Ort</label>
                                <input type="text" class="form-control location" id="location${events}">
                            </div>
                            <div class="form-group mb-0">
                                <label for="description${events}">Beschreibung</label>
                                <textarea class="form-control description" id="description${events}" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="card bg-light">
                        <div class="card-body">
                            <div class="form-group">
                                <label for="attachment${events}">Anhang (URL)</label>
                                <input type="text" class="form-control attachment" id="attachment${events}">
                            </div>
                            <div class="form-group mb-0">
                                <label for="url${events}">Link</label>
                                <input type="text" class="form-control url" id="url${events}">
                            </div>
                        </div>
                    </div>
                    <hr class="my-3">
                    <div class="form-group mb-0">
                        <label for="recurrence${events}">Wiederholung</label>
                        <select class="form-control" id="recurrence${events}" onchange="toggleRecurrenceOptions(${events})">
                            <option value="none">Keine Wiederholung</option>
                            <option value="daily">Täglich</option>
                            <option value="weekly">Wöchentlich</option>
                            <option value="monthly">Monatlich</option>
                            <option value="yearly">Jährlich</option>
                            <option value="custom">Benutzerdefiniert</option>
                        </select>
                    </div>
                    <div id="recurrenceOptions${events}" class="mt-3" style="display: none;">
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="recurrenceInterval${events}">Alle</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="recurrenceInterval${events}" value="1" min="1">
                                    <div class="input-group-append">
                                        <span class="input-group-text" id="intervalUnit${events}">Tage</span>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="recurrenceCount${events}">Anzahl</label>
                                <input type="number" class="form-control" id="recurrenceCount${events}" value="1" min="1">
                            </div>
                        </div>
                        <div id="customOptions${events}" class="mt-3" style="display: none;">
                            <div class="form-group">
                                <label>Benutzerdefiniertes Intervall (in Tagen)</label>
                                <input type="number" class="form-control" id="customInterval${events}" value="1" min="1">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>`;
    document.getElementById("eventsContainer").insertAdjacentHTML('beforeend', eventHTML);
    
    // Initialisiere das neue Event
    setupValidation(events);
    
    // Setze Standardwerte für das neue Event
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const roundedHour = Math.ceil(now.getHours());
    
    // Setze Start- und Enddatum auf heute
    document.getElementById(`startDate${events}`).value = today;
    document.getElementById(`endDate${events}`).value = today;
    
    // Setze Start- und Endzeit
    document.getElementById(`startTime${events}`).value = 
        `${roundedHour.toString().padStart(2, '0')}:00`;
    document.getElementById(`endTime${events}`).value = 
        `${(roundedHour + 1).toString().padStart(2, '0')}:00`;
}

function escapeICSValue(str) {
    if (!str) return '';
    return str
        .replace(/[\\;,]/g, '\\$&')  // Escape \, ; und ,
        .replace(/\n/g, '\\n')       // Zeilenumbrüche
        .replace(/[^\x20-\x7E]/g, function(char) {  // Non-ASCII Zeichen
            return encodeURIComponent(char)
                .replace(/%/g, '')
                .toUpperCase();
        });
}

function foldLine(line) {
    if (line.length <= 75) return line;
    const parts = line.match(/.{1,74}/g);
    return parts.join('\r\n ');  // Fortsetzungszeilen mit Leerzeichen
}

function createICSCalendar() {
    if (events === 0) {
        alert("Bitte fügen Sie mindestens einen Termin hinzu.");
        return;
    }

    var icsContent =
        "BEGIN:VCALENDAR\r\n" +
        "VERSION:2.0\r\n" +
        "PRODID:-//Schellenberger - Digitalcoach//NONSGML Event//DE\r\n" +
        "METHOD:PUBLISH\r\n" +
        "CALSCALE:GREGORIAN\r\n" +
        "BEGIN:VTIMEZONE\r\n" +
        "TZID:Europe/Berlin\r\n" +
        "BEGIN:DAYLIGHT\r\n" +
        "TZOFFSETFROM:+0100\r\n" +
        "TZOFFSETTO:+0200\r\n" +
        "TZNAME:CEST\r\n" +
        "DTSTART:19700329T020000\r\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\r\n" +
        "END:DAYLIGHT\r\n" +
        "BEGIN:STANDARD\r\n" +
        "TZOFFSETFROM:+0200\r\n" +
        "TZOFFSETTO:+0100\r\n" +
        "TZNAME:CET\r\n" +
        "DTSTART:19701025T030000\r\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\r\n" +
        "END:STANDARD\r\n" +
        "END:VTIMEZONE\r\n";

    for (var i = 1; i <= events; i++) {
        var summary = escapeICSValue(document.getElementById("summary" + i).value);
        var allDay = document.getElementById("allDay" + i).checked;
        var startDate = document.getElementById("startDate" + i).value;
        var startTime = document.getElementById("startTime" + i).value;
        var endDate = document.getElementById("endDate" + i).value;
        var endTime = document.getElementById("endTime" + i).value;
        var location = document.getElementById("location" + i).value;
        var description = document.getElementById("description" + i).value;
        var attachment = document.getElementById("attachment" + i).value;
        var url = document.getElementById("url" + i).value;

        // Validierung der Pflichtfelder
        if (!summary || !startDate || !endDate) {
            alert(`Bitte füllen Sie alle Pflichtfelder für Termin ${i} aus.`);
            return;
        }

        if (!allDay && (!startTime || !endTime)) {
            alert(`Bitte geben Sie Start- und Endzeit für Termin ${i} an.`);
            return;
        }

        var startDateTime, endDateTime;
        
        if (allDay) {
            // Für ganztägige Events: nur Datum ohne Zeit
            startDateTime = startDate.replace(/-/g, '');
            
            // Für ganztägige Events: Enddatum + 1 Tag (ICS-Standard)
            var endDateObj = new Date(endDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            endDateTime = endDateObj.toISOString().split('T')[0].replace(/-/g, '');
        } else {
            // Für Events mit Uhrzeit: lokale Zeit mit TZID
            startDateTime = startDate.replace(/-/g, '') + "T" + startTime.replace(/:/g, "") + "00";
            endDateTime = endDate.replace(/-/g, '') + "T" + endTime.replace(/:/g, "") + "00";
        }

        var eventContent = 
            "BEGIN:VEVENT\r\n" +
            (allDay 
                ? "DTSTART;VALUE=DATE:" + startDateTime + "\r\n" + 
                  "DTEND;VALUE=DATE:" + endDateTime + "\r\n"
                : "DTSTART;TZID=Europe/Berlin:" + startDateTime + "\r\n" + 
                  "DTEND;TZID=Europe/Berlin:" + endDateTime + "\r\n"
            ) +
            "UID:" + generateUID() + "\r\n" +
            foldLine("SUMMARY:" + summary) + "\r\n" +
            "DTSTAMP:" + getCurrentDateTimeUTC() + "\r\n" +
            (location ? foldLine("LOCATION:" + escapeICSValue(location)) + "\r\n" : "") +
            (description ? foldLine("DESCRIPTION:" + escapeICSValue(description)) + "\r\n" : "") +
            (attachment ? foldLine("ATTACH:" + escapeICSValue(attachment)) + "\r\n" : "") +
            (url ? foldLine("URL:" + escapeICSValue(url)) + "\r\n" : "") +
            getRecurrenceRule(i) +
            "END:VEVENT\r\n";

        icsContent += eventContent;
    }

    icsContent += "END:VCALENDAR";

    var firstSummary = document.getElementById("summary1").value || "Termine";
    var fileName = firstSummary.replace(/\s+/g, '_') + '.ics';
    var blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function validateDates(startDate, endDate, startTime, endTime) {
    const start = new Date(startDate + 'T' + (startTime || '00:00'));
    const end = new Date(endDate + 'T' + (endTime || '00:00'));
    
    if (end < start) {
        return {
            valid: false,
            message: "Das Enddatum muss nach dem Startdatum liegen."
        };
    }
    return { valid: true };
}

function validateURL(url) {
    if (!url) return true; // Optional field
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function setupValidation(eventNumber) {
    const form = document.querySelector(`#event${eventNumber} .eventForm`);
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
        });
        
        input.addEventListener('blur', function() {
            validateField(this, true);
        });
    });

    const startDate = document.getElementById(`startDate${eventNumber}`);
    startDate.addEventListener('change', function() {
        const endDate = document.getElementById(`endDate${eventNumber}`);
        if (!endDate.value || new Date(endDate.value) < new Date(this.value)) {
            endDate.value = this.value;
            validateField(endDate);
        }
    });
}

function validateField(field, showError = false) {
    let isValid = true;
    let errorMessage = '';
    
    const eventNumber = field.closest('.eventForm').dataset.eventNumber;
    
    switch(field.id) {
        case `summary${eventNumber}`:
            isValid = field.value.trim() !== '';
            errorMessage = 'Titel ist erforderlich';
            break;
            
        case `startDate${eventNumber}`:
            isValid = field.value !== '';
            errorMessage = 'Startdatum ist erforderlich';
            if (isValid) {
                const endDate = document.getElementById(`endDate${eventNumber}`);
                const startTime = document.getElementById(`startTime${eventNumber}`);
                const endTime = document.getElementById(`endTime${eventNumber}`);
                const dateValidation = validateDates(field.value, endDate.value, startTime.value, endTime.value);
                isValid = dateValidation.valid;
                errorMessage = dateValidation.message;
            }
            break;
            
        case `endDate${eventNumber}`:
            isValid = field.value !== '';
            errorMessage = 'Enddatum ist erforderlich';
            if (isValid) {
                const startDate = document.getElementById(`startDate${eventNumber}`);
                const startTime = document.getElementById(`startTime${eventNumber}`);
                const endTime = document.getElementById(`endTime${eventNumber}`);
                const dateValidation = validateDates(startDate.value, field.value, startTime.value, endTime.value);
                isValid = dateValidation.valid;
                errorMessage = dateValidation.message;
            }
            break;
            
        case `attachment${eventNumber}`:
        case `url${eventNumber}`:
            if (field.value) {
                isValid = validateURL(field.value);
                errorMessage = 'Bitte geben Sie eine gültige URL ein';
            }
            break;
    }
    
    if (!isValid && showError) {
        showFieldError(field, errorMessage);
    } else {
        field.classList.remove('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback?.classList.contains('invalid-feedback')) {
            feedback.remove();
        }
    }
    
    return isValid;
}

function showFieldError(field, message) {
    // Entferne alte Fehlermeldungen
    const oldFeedback = field.nextElementSibling;
    if (oldFeedback?.classList.contains('invalid-feedback')) {
        oldFeedback.remove();
    }
    
    // Füge Fehlerklasse hinzu
    field.classList.add('is-invalid');
    
    // Erstelle neue Fehlermeldung
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    field.parentNode.insertBefore(feedback, field.nextSibling);
}

function saveToLocalStorage() {
    const events = [];
    for (let i = 1; i <= window.events; i++) {
        const eventForm = document.querySelector(`#event${i} .eventForm`);
        if (eventForm) {
            events.push({
                summary: document.getElementById(`summary${i}`).value,
                allDay: document.getElementById(`allDay${i}`).checked,
                startDate: document.getElementById(`startDate${i}`).value,
                startTime: document.getElementById(`startTime${i}`).value,
                endDate: document.getElementById(`endDate${i}`).value,
                endTime: document.getElementById(`endTime${i}`).value,
                location: document.getElementById(`location${i}`).value,
                description: document.getElementById(`description${i}`).value,
                attachment: document.getElementById(`attachment${i}`).value,
                url: document.getElementById(`url${i}`).value
            });
        }
    }
    localStorage.setItem('icsEvents', JSON.stringify(events));
}

function loadFromLocalStorage() {
    const savedEvents = localStorage.getItem('icsEvents');
    if (savedEvents) {
        const events = JSON.parse(savedEvents);
        // Erste Event aktualisieren
        if (events[0]) {
            fillEventForm(1, events[0]);
        }
        // Weitere Events hinzufügen
        for (let i = 1; i < events.length; i++) {
            addAnotherEvent();
            fillEventForm(i + 1, events[i]);
        }
    }
}

function fillEventForm(eventNumber, data) {
    document.getElementById(`summary${eventNumber}`).value = data.summary || '';
    document.getElementById(`allDay${eventNumber}`).checked = data.allDay;
    document.getElementById(`startDate${eventNumber}`).value = data.startDate || '';
    document.getElementById(`startTime${eventNumber}`).value = data.startTime || '';
    document.getElementById(`endDate${eventNumber}`).value = data.endDate || '';
    document.getElementById(`endTime${eventNumber}`).value = data.endTime || '';
    document.getElementById(`location${eventNumber}`).value = data.location || '';
    document.getElementById(`description${eventNumber}`).value = data.description || '';
    document.getElementById(`attachment${eventNumber}`).value = data.attachment || '';
    document.getElementById(`url${eventNumber}`).value = data.url || '';
    
    if (data.allDay) {
        toggleDateTimeFields(eventNumber);
    }
}

function toggleRecurrenceOptions(eventNumber) {
    const select = document.getElementById(`recurrence${eventNumber}`);
    const options = document.getElementById(`recurrenceOptions${eventNumber}`);
    const customOptions = document.getElementById(`customOptions${eventNumber}`);
    const intervalUnit = document.getElementById(`intervalUnit${eventNumber}`);
    
    options.style.display = select.value === 'none' ? 'none' : 'block';
    customOptions.style.display = select.value === 'custom' ? 'block' : 'none';
    
    // Aktualisiere die Einheit basierend auf der Auswahl
    switch(select.value) {
        case 'daily': intervalUnit.textContent = 'Tage'; break;
        case 'weekly': intervalUnit.textContent = 'Wochen'; break;
        case 'monthly': intervalUnit.textContent = 'Monate'; break;
        case 'yearly': intervalUnit.textContent = 'Jahre'; break;
        case 'custom': intervalUnit.textContent = 'Tage'; break;
    }
}

function getRecurrenceRule(eventNumber) {
    const recurrence = document.getElementById(`recurrence${eventNumber}`).value;
    if (recurrence === 'none') return '';
    
    const interval = document.getElementById(`recurrenceInterval${eventNumber}`).value;
    const count = document.getElementById(`recurrenceCount${eventNumber}`).value;
    
    let freq;
    if (recurrence === 'custom') {
        const customInterval = document.getElementById(`customInterval${eventNumber}`).value;
        return `RRULE:FREQ=DAILY;INTERVAL=${customInterval};COUNT=${count}\r\n`;
    }
    
    switch(recurrence) {
        case 'daily': freq = 'DAILY'; break;
        case 'weekly': freq = 'WEEKLY'; break;
        case 'monthly': freq = 'MONTHLY'; break;
        case 'yearly': freq = 'YEARLY'; break;
    }
    
    return `RRULE:FREQ=${freq};INTERVAL=${interval};COUNT=${count}\r\n`;
}

// Event-Listener für automatisches Speichern
document.addEventListener('input', debounce(saveToLocalStorage, 500)); 

function deleteEvent(eventNumber) {
    if (events === 1) {
        alert("Der letzte Termin kann nicht gelöscht werden.");
        return;
    }
    
    if (confirm(`Möchten Sie Termin ${eventNumber} wirklich löschen?`)) {
        // Event-Element entfernen
        const eventElement = document.getElementById(`event${eventNumber}`);
        eventElement.remove();
        
        // Nachfolgende Events neu nummerieren
        for (let i = eventNumber + 1; i <= events; i++) {
            const event = document.getElementById(`event${i}`);
            if (event) {
                // Update Event-ID
                event.id = `event${i-1}`;
                
                // Update Titel
                event.querySelector('.card-title').textContent = `Termin ${i-1}`;
                
                // Update alle IDs und for-Attribute
                const elements = event.querySelectorAll('[id]');
                elements.forEach(element => {
                    element.id = element.id.replace(i, i-1);
                });
                
                const labels = event.querySelectorAll('label[for]');
                labels.forEach(label => {
                    label.setAttribute('for', label.getAttribute('for').replace(i, i-1));
                });
                
                // Update onclick Handler für den Löschen-Button
                const deleteButton = event.querySelector('.btn-outline-danger');
                deleteButton.setAttribute('onclick', `deleteEvent(${i-1})`);
                
                // Update data-event-number
                const form = event.querySelector('.eventForm');
                form.dataset.eventNumber = i-1;
            }
        }
        
        // Zähler reduzieren
        events--;
        
        // Lokalen Speicher aktualisieren
        saveToLocalStorage();
    }
} 

function importICSFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Validierung vor dem Import durchführen
        const validationResult = validateICSContent(content);
        
        if (validationResult.hasErrors) {
            // Fehler-Modal anzeigen
            showImportErrorModal(validationResult.errors);
        } else {
            // Datei ist valide, fortfahren mit Import
            parseICSContent(content);
            
            // Erfolgs-Nachricht anzeigen
            showSuccessMessage(`${validationResult.eventCount} Termine erfolgreich importiert`);
        }
    };
    reader.readAsText(file);
}

function validateICSContent(content) {
    const result = {
        hasErrors: false,
        errors: [],
        warnings: [],
        eventCount: 0
    };

    // Grundlegende Formatprüfung
    if (!content.startsWith('BEGIN:VCALENDAR')) {
        result.errors.push("Datei muss mit BEGIN:VCALENDAR beginnen");
        result.hasErrors = true;
        return result;
    }

    if (!content.endsWith('END:VCALENDAR')) {
        result.errors.push("Datei muss mit END:VCALENDAR enden");
        result.hasErrors = true;
        return result;
    }

    // Events extrahieren und validieren
    const events = content.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    result.eventCount = events.length;

    if (events.length === 0) {
        result.errors.push("Keine Events in der ICS-Datei gefunden");
        result.hasErrors = true;
        return result;
    }

    // Jedes Event validieren
    events.forEach((event, index) => {
        const eventValidation = validateEvent(event);
        if (eventValidation.errors.length > 0) {
            result.hasErrors = true;
            result.errors.push(`Termin ${index + 1}: ${eventValidation.errors.join(', ')}`);
        }
        if (eventValidation.warnings.length > 0) {
            result.warnings.push(`Termin ${index + 1}: ${eventValidation.warnings.join(', ')}`);
        }
    });

    return result;
}

// Funktion zum Anzeigen des Fehler-Modals
function showImportErrorModal(errors) {
    // Modal erstellen falls noch nicht vorhanden
    let modal = document.getElementById('importErrorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'importErrorModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Fehler beim Import</h5>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <ul class="mb-0" id="importErrorList"></ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Fehlerliste füllen
    const errorList = document.getElementById('importErrorList');
    errorList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');

    // Modal anzeigen
    $(modal).modal('show');
}

// Funktion zum Anzeigen von Erfolgsmeldungen
function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">&times;</button>
    `;
    
    // Alert vor dem ersten Event einfügen
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.insertBefore(alertDiv, eventsContainer.firstChild);
    
    // Alert nach 5 Sekunden automatisch ausblenden
    setTimeout(() => {
        $(alertDiv).alert('close');
    }, 5000);
}

function parseICSContent(content) {
    // Events aus der ICS-Datei extrahieren
    const foundEvents = content.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    
    // Bestehende Events löschen
    document.querySelectorAll('.card[id^="event"]').forEach(card => {
        if (card.id !== 'event1') card.remove();
    });
    
    // Events-Zähler zurücksetzen
    window.events = 1;

    // Für jedes gefundene Event
    foundEvents.forEach((eventContent, index) => {
        if (index > 0) {
            addAnotherEvent();
        }

        // Daten extrahieren und escapen
        const summary = eventContent.match(/SUMMARY:([^\r\n]+)/)?.[1]?.replace(/\\,/g, ',') || '';
        const location = eventContent.match(/LOCATION:([^\r\n]+)/)?.[1]?.replace(/\\,/g, ',') || '';
        const description = eventContent.match(/DESCRIPTION:([^\r\n]+)/)?.[1]?.replace(/\\n/g, '\n').replace(/\\,/g, ',') || '';
        const url = eventContent.match(/URL:([^\r\n]+)/)?.[1] || '';
        
        // Start- und Endzeit extrahieren
        const dtstart = eventContent.match(/DTSTART(?:;[^:]+)?:([^\r\n]+)/)?.[1] || '';
        const dtend = eventContent.match(/DTEND(?:;[^:]+)?:([^\r\n]+)/)?.[1] || '';
        
        // Prüfen ob ganztägig
        const isAllDay = !dtstart.includes('T');
        
        // Datum und Zeit formatieren
        const startDate = `${dtstart.substr(0,4)}-${dtstart.substr(4,2)}-${dtstart.substr(6,2)}`;
        const endDate = `${dtend.substr(0,4)}-${dtend.substr(4,2)}-${dtend.substr(6,2)}`;
        
        let startTime = '', endTime = '';
        if (!isAllDay) {
            startTime = `${dtstart.substr(9,2)}:${dtstart.substr(11,2)}`;
            endTime = `${dtend.substr(9,2)}:${dtend.substr(11,2)}`;
        }

        // Felder füllen
        const eventNum = index + 1;
        document.getElementById(`summary${eventNum}`).value = summary;
        document.getElementById(`location${eventNum}`).value = location;
        document.getElementById(`description${eventNum}`).value = description;
        document.getElementById(`url${eventNum}`).value = url;
        document.getElementById(`startDate${eventNum}`).value = startDate;
        document.getElementById(`endDate${eventNum}`).value = endDate;
        document.getElementById(`allDay${eventNum}`).checked = isAllDay;
        
        if (!isAllDay) {
            document.getElementById(`startTime${eventNum}`).value = startTime;
            document.getElementById(`endTime${eventNum}`).value = endTime;
        }
        
        // UI aktualisieren
        toggleDateTimeFields(eventNum);
    });

    // Lokalen Speicher aktualisieren
    saveToLocalStorage();
}

function validateEvent(event) {
    let errors = [];
    let warnings = [];
    
    // Pflichtfelder prüfen
    if (!event.match(/^DTSTART(;[^:]+)?:/m)) {
        errors.push("Fehlendes DTSTART");
    }
    if (!event.match(/^SUMMARY:/m)) {
        errors.push("Fehlendes SUMMARY");
    }
    if (!event.match(/^UID:/m)) {
        errors.push("Fehlendes UID");
    }

    // DTSTART Format prüfen
    const dtstartMatch = event.match(/^DTSTART(?:;[^:]+)?:([^\r\n]+)/m);
    if (dtstartMatch) {
        const dtstart = dtstartMatch[1];
        if (!dtstart.match(/^\d{8}(T\d{6}Z?)?$/)) {
            errors.push("DTSTART muss gültiges Datum/Zeit-Format haben");
        }
    }

    // DTEND Format prüfen
    const dtendMatch = event.match(/^DTEND(?:;[^:]+)?:([^\r\n]+)/m);
    if (dtendMatch) {
        const dtend = dtendMatch[1];
        if (!dtend.match(/^\d{8}(T\d{6}Z?)?$/)) {
            errors.push("DTEND muss gültiges Datum/Zeit-Format haben");
        }
    }

    // Zusätzliche Validierungen
    if (!event.match(/^DTSTAMP:/m)) {
        warnings.push("DTSTAMP fehlt (wird automatisch ergänzt)");
    }

    return { errors, warnings };
}

function previewICSEvent(eventNumber) {
    const event = createPreviewEvent(eventNumber);
    
    // Preview-Modal erstellen/aktualisieren
    showPreviewModal(event);
}

function createPreviewEvent(eventNumber) {
    const summary = document.getElementById(`summary${eventNumber}`).value;
    const startDate = formatDateForPreview(document.getElementById(`startDate${eventNumber}`).value);
    const endDate = formatDateForPreview(document.getElementById(`endDate${eventNumber}`).value);
    const location = document.getElementById(`location${eventNumber}`).value;
    
    return `
        <div class="preview-event">
            <h5>${summary || 'Ohne Titel'}</h5>
            <div class="preview-date">${startDate} - ${endDate}</div>
            ${location ? `<div class="preview-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : ''}
        </div>
    `;
}

const eventTemplates = {
    meeting: {
        name: 'Meeting',
        duration: 60,
        template: {
            summary: 'Meeting',
            description: 'Agenda:\n- \n- \n- ',
            allDay: false
        }
    },
    fullDay: {
        name: 'Ganztägiger Termin',
        template: {
            summary: 'Ganztägiger Termin',
            allDay: true
        }
    },
    // weitere Vorlagen...
};

function addEventFromTemplate(templateName) {
    const template = eventTemplates[templateName];
    addAnotherEvent();
    fillEventForm(events, template.template);
}

function enableEventSorting() {
    new Sortable(document.getElementById('eventsContainer'), {
        animation: 150,
        handle: '.card-header',
        onEnd: function() {
            renumberEvents();
            saveToLocalStorage();
        }
    });
}

function duplicateEvent(eventNumber) {
    const eventData = getEventData(eventNumber);
    addAnotherEvent();
    
    // Daten in das neue Event kopieren
    const newEventNumber = events;
    document.getElementById(`summary${newEventNumber}`).value = eventData.summary;
    document.getElementById(`allDay${newEventNumber}`).checked = eventData.allDay;
    document.getElementById(`startDate${newEventNumber}`).value = eventData.startDate;
    document.getElementById(`startTime${newEventNumber}`).value = eventData.startTime;
    document.getElementById(`endDate${newEventNumber}`).value = eventData.endDate;
    document.getElementById(`endTime${newEventNumber}`).value = eventData.endTime;
    document.getElementById(`location${newEventNumber}`).value = eventData.location;
    document.getElementById(`description${newEventNumber}`).value = eventData.description;
    document.getElementById(`attachment${newEventNumber}`).value = eventData.attachment;
    document.getElementById(`url${newEventNumber}`).value = eventData.url;
    document.getElementById(`recurrence${newEventNumber}`).value = eventData.recurrence;
    
    // UI aktualisieren
    toggleDateTimeFields(newEventNumber);
    toggleRecurrenceOptions(newEventNumber);
    
    // Lokalen Speicher aktualisieren
    saveToLocalStorage();
    
    // Erfolgsmeldung anzeigen
    showSuccessMessage('Termin wurde erfolgreich kopiert');
}

const timeZones = {
    'Europe/Berlin': 'Berlin',
    'Europe/London': 'London',
    'America/New_York': 'New York',
    // weitere Zeitzonen...
};

function addTimeZoneSupport(eventNumber) {
    const timeZoneSelect = document.createElement('select');
    timeZoneSelect.className = 'form-control mt-2';
    timeZoneSelect.id = `timezone${eventNumber}`;
    
    Object.entries(timeZones).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        timeZoneSelect.appendChild(option);
    });
    
    // Zeitzone zur ICS-Datei hinzufügen
} 

function addEventCategories(eventNumber) {
    return `
        <div class="form-group">
            <label for="categories${eventNumber}">Kategorien</label>
            <input type="text" class="form-control" id="categories${eventNumber}" 
                   placeholder="z.B. Arbeit, Privat, Wichtig (durch Komma getrennt)">
        </div>
    `;
} 

function getEventData(eventNumber) {
    return {
        summary: document.getElementById(`summary${eventNumber}`).value,
        allDay: document.getElementById(`allDay${eventNumber}`).checked,
        startDate: document.getElementById(`startDate${eventNumber}`).value,
        startTime: document.getElementById(`startTime${eventNumber}`).value,
        endDate: document.getElementById(`endDate${eventNumber}`).value,
        endTime: document.getElementById(`endTime${eventNumber}`).value,
        location: document.getElementById(`location${eventNumber}`).value,
        description: document.getElementById(`description${eventNumber}`).value,
        attachment: document.getElementById(`attachment${eventNumber}`).value,
        url: document.getElementById(`url${eventNumber}`).value,
        recurrence: document.getElementById(`recurrence${eventNumber}`).value
    };
} 