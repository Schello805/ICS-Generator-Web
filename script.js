var scriptRevision = 15;
var events = 1;

window.onload = function () {
    // Prüfen, ob wir auf der Generator-Seite sind (generator.html)
    if (window.location.pathname.includes('generator.html')) {
        initializePlaceholderTexts();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate1').value = today;
        
        const now = new Date();
        const currentHour = `${String(now.getHours()).padStart(2, '0')}:00`;
        document.getElementById('startTime1').value = currentHour;
        
        updateEndDate(1);
        
        document.getElementById('startDate1').addEventListener('change', function() {
            updateEndDate(1);
        });
        document.getElementById('startTime1').addEventListener('change', function() {
            updateEndDate(1);
        });
        
        // Prüfen ob eine importierte Datei vorliegt
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('import') === 'true') {
            const importedContent = localStorage.getItem('importedICS');
            if (importedContent) {
                importICSFile({ 
                    files: [new Blob([importedContent], {type: 'text/calendar'})],
                    value: '' // Reset file input
                });
                localStorage.removeItem('importedICS');
            }
        }
    }
};

function initializePlaceholderTexts() {
    // Platzhaltertexte müssen nicht gesetzt werden, da sie standardmäßig im Browser dargestellt werden
}

function foldLine(line) {
    if (line.length <= 75) return line;
    
    let result = '';
    while (line.length > 75) {
        result += line.slice(0, 75) + '\r\n ';
        line = line.slice(75);
    }
    return result + line;
}

function escapeText(text) {
    if (!text) return '';
    return text
        .replace(/[\\;,]/g, "\\$&")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

function formatDateTime(date, time, isAllDay) {
    if (isAllDay) {
        return `VALUE=DATE:${date.replace(/-/g, '')}`;
    }

    const dateObj = new Date(date + 'T' + (time || '00:00'));
    // In UTC konvertieren
    return dateObj.toISOString()
        .replace(/[-:]/g, '')  // Entferne - und :
        .replace(/\.\d{3}Z$/, 'Z');  // Entferne Millisekunden, behalte Z
}

function sanitizeInput(input) {
    return input.replace(/[<>{}]/g, '');
}

function generateEventBlock(summary, startDateTime, endDateTime, location, description, attachment, url, allDay, eventNumber) {
    summary = sanitizeInput(summary);
    location = sanitizeInput(location);
    description = sanitizeInput(description);
    attachment = sanitizeInput(attachment);
    url = sanitizeInput(url);

    let event = [
        'BEGIN:VEVENT',
        `UID:${generateUID()}`,
        `DTSTAMP:${getCurrentDateTimeUTC()}`,
        allDay ? 
            `DTSTART;${formatDateTime(startDateTime.split('T')[0], null, true)}` :
            `DTSTART:${formatDateTime(startDateTime.split('T')[0], startDateTime.split('T')[1], false)}`,
        allDay ? 
            `DTEND;${formatDateTime(endDateTime.split('T')[0], null, true)}` :
            `DTEND:${formatDateTime(endDateTime.split('T')[0], endDateTime.split('T')[1], false)}`,
        `SUMMARY:${escapeText(summary)}`,
    ];

    if (location) event.push(`LOCATION:${escapeText(location)}`);
    if (description) event.push(`DESCRIPTION:${escapeText(description)}`);
    if (attachment) event.push(`ATTACH:${escapeText(attachment)}`);
    if (url) event.push(`URL:${escapeText(url)}`);

    const noReminder = document.getElementById('noReminder' + eventNumber);
    if (!noReminder.checked) {
        const reminderTime = document.getElementById('reminderTime' + eventNumber).value;
        event.push(
            'BEGIN:VALARM',
            `TRIGGER:-PT${reminderTime}M`,
            'ACTION:DISPLAY',
            'DESCRIPTION:Erinnerung',
            'END:VALARM'
        );
    }

    event.push('END:VEVENT');
    return event.map(line => foldLine(line)).join('\r\n') + '\r\n';
}

function isValidURL(url) {
    try {
        const parsedUrl = new URL(url);
        // Erlaubte Protokolle
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            return false;
        }
        // Keine IP-Adressen erlauben
        const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        if (ipRegex.test(parsedUrl.hostname)) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function createICSCalendar() {
    if (events === 0) {
        alert("Bitte fügen Sie mindestens einen Termin hinzu.");
        return;
    }

    const now = new Date();
    const calendarHeader = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Schellenberger - Digitalcoach//ICS Generator//DE',
        'CALSCALE:GREGORIAN',
        `X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';

    let icsContent = calendarHeader;

    for (var i = 1; i <= events; i++) {
        var summary = document.getElementById("summary" + i).value;
        var allDay = document.getElementById("allDay" + i).checked;
        var startDate = document.getElementById("startDate" + i).value;
        var startTime = document.getElementById("startTime" + i).value;
        var endDate = document.getElementById("endDate" + i).value;
        var endTime = document.getElementById("endTime" + i).value;
        var location = document.getElementById("location" + i).value;
        var description = document.getElementById("description" + i).value;
        var attachment = document.getElementById("attachment" + i).value;
        var url = document.getElementById("url" + i).value;

        if (!summary || !startDate || !endDate) {
            alert("Bitte füllen Sie Titel, Startdatum und Enddatum für Termin " + i + " aus.");
            return;
        }

        if (attachment && !isValidURL(attachment)) {
            alert(`Termin ${i}: Die Anhang-URL "${attachment}" ist keine gültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)`);
            return;
        }

        if (url && !isValidURL(url)) {
            alert(`Termin ${i}: Die Link-URL "${url}" ist keine gültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)`);
            return;
        }

        var startDateTime, endDateTime;
        if (allDay) {
            startDateTime = startDate;
            endDateTime = endDate;
        } else {
            if (!startTime || !endTime) {
                alert("Bitte füllen Sie die Zeitfelder für Termin " + i + " aus.");
                return;
            }
            startDateTime = startDate + "T" + startTime + ":00";
            endDateTime = endDate + "T" + endTime + ":00";
        }

        icsContent += generateEventBlock(summary, startDateTime, endDateTime, location, description, attachment, url, allDay, i);
    }

    icsContent += 'END:VCALENDAR\r\n';
    downloadICSFile(icsContent);
}

function downloadICSFile(icsContent) {
    var blob = new Blob([icsContent], { type: 'text/calendar' });
    var fileName = 'Termine.ics';
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, fileName);
    } else {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function addAnotherEvent() {
    events++;
    var eventForm = document.createElement('div');
    eventForm.classList.add('card', 'mb-4');
    eventForm.innerHTML = generateEventFormHTML(events);
    document.getElementById('eventsContainer').appendChild(eventForm);
}

function generateEventFormHTML(eventNumber) {
    return `
        <div class="card-body">
            <h5 class="card-title">Termin ${eventNumber}</h5>
            <form class="eventForm">
                <div class="form-group">
                    <label for="summary${eventNumber}">Titel:*</label>
                    <input type="text" class="form-control summary" id="summary${eventNumber}"
                        placeholder="Titel eingeben" required>
                </div>
                <div class="custom-control custom-checkbox mb-3">
                    <input type="checkbox" class="custom-control-input allDayCheckbox" id="allDay${eventNumber}"
                        onchange="toggleDateTimeFields(${eventNumber})">
                    <label class="custom-control-label" for="allDay${eventNumber}">Ganztägiger Termin</label>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="startDate${eventNumber}">Startdatum:*</label>
                        <input type="date" class="form-control startDate" id="startDate${eventNumber}" 
                            onchange="updateEndDate(${eventNumber})">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="startTime${eventNumber}" class="time-label">Startzeit:</label>
                        <input type="time" class="form-control startTime" id="startTime${eventNumber}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="endDate${eventNumber}">Enddatum:*</label>
                        <input type="date" class="form-control endDate" id="endDate${eventNumber}">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="endTime${eventNumber}" class="time-label">Endzeit:</label>
                        <input type="time" class="form-control endTime" id="endTime${eventNumber}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="location${eventNumber}">Ort:</label>
                    <input type="text" class="form-control location" id="location${eventNumber}"
                        placeholder="Ort eingeben">
                </div>
                <div class="form-group">
                    <label for="description${eventNumber}">Beschreibung:</label>
                    <textarea class="form-control description" id="description${eventNumber}" rows="3"
                        placeholder="Beschreibung eingeben"></textarea>
                </div>
                <div class="form-group">
                    <label for="attachment${eventNumber}">Anhang (URL):</label>
                    <input type="url" class="form-control attachment" id="attachment${eventNumber}"
                        placeholder="https://example.com/dokument.pdf" 
                        onchange="validateURL(this, 'Anhang')">
                </div>
                <div class="form-group">
                    <label for="url${eventNumber}">Link:</label>
                    <input type="url" class="form-control url" id="url${eventNumber}"
                        placeholder="https://example.com" 
                        onchange="validateURL(this, 'Link')">
                </div>
                <div class="form-group">
                    <label for="reminder${eventNumber}">Erinnerung:</label>
                    <div class="row">
                        <div class="col-md-6">
                            <select class="form-control" id="reminderTime${eventNumber}">
                                <option value="10">10 Minuten vorher</option>
                                <option value="15">15 Minuten vorher</option>
                                <option value="30">30 Minuten vorher</option>
                                <option value="60">1 Stunde vorher</option>
                                <option value="120">2 Stunden vorher</option>
                                <option value="1440">1 Tag vorher</option>
                                <option value="2880">2 Tage vorher</option>
                                <option value="10080">1 Woche vorher</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <div class="custom-control custom-checkbox mt-2">
                                <input type="checkbox" class="custom-control-input" id="noReminder${eventNumber}" 
                                       onchange="toggleReminderField(${eventNumber})">
                                <label class="custom-control-label" for="noReminder${eventNumber}">Keine Erinnerung</label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

function toggleDateTimeFields(eventNumber) {
    var allDayCheckbox = document.getElementById('allDay' + eventNumber);
    var startTime = document.getElementById('startTime' + eventNumber);
    var endTime = document.getElementById('endTime' + eventNumber);
    
    if (allDayCheckbox.checked) {
        // Zeitfelder deaktivieren und Werte setzen
        startTime.disabled = true;
        endTime.disabled = true;
        startTime.value = '00:00';
        endTime.value = '23:59';
    } else {
        // Zeitfelder aktivieren und Werte zurücksetzen
        startTime.disabled = false;
        endTime.disabled = false;
        startTime.value = '';
        endTime.value = '';
    }
}

function generateUID() {
    return 'uid-' + Math.random().toString(36).substr(2, 9);
}

function getCurrentDateTimeUTC() {
    const now = new Date();
    return now.toISOString()
        .replace(/[-:]/g, '')  // Entferne - und :
        .replace(/\.\d{3}Z$/, 'Z'); // Entferne nur Millisekunden, behalte Z
}

function updateEndDate(eventNumber) {
    const startDate = document.getElementById('startDate' + eventNumber).value;
    const startTime = document.getElementById('startTime' + eventNumber).value;
    const endDate = document.getElementById('endDate' + eventNumber);
    const endTime = document.getElementById('endTime' + eventNumber);
    
    if (startDate) {
        // Setze das Enddatum auf das Startdatum
        endDate.value = startDate;
        
        // Wenn eine Startzeit gesetzt ist, setze die Endzeit auf eine Stunde später
        if (startTime) {
            const [hours, minutes] = startTime.split(':');
            const endDateTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endDateTime.setHours(endDateTime.getHours() + 1);
            
            endTime.value = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
        }
    }
}

function validateURL(input, fieldName) {
    if (input.value && !isValidURL(input.value)) {
        input.setCustomValidity(`Bitte geben Sie eine gültige URL ein (z.B. https://example.com)`);
        input.reportValidity();
    } else {
        input.setCustomValidity('');
    }
}

function toggleReminderField(eventNumber) {
    const reminderSelect = document.getElementById('reminderTime' + eventNumber);
    const noReminder = document.getElementById('noReminder' + eventNumber);
    reminderSelect.disabled = noReminder.checked;
}

function duplicateEvent(eventNumber) {
    events++;
    const originalForm = document.querySelector(`#eventsContainer .card:nth-child(${eventNumber})`);
    const newForm = originalForm.cloneNode(true);
    
    // IDs und Referenzen aktualisieren
    updateFormIds(newForm, events);
    
    // Event-Listener neu binden
    bindEventListeners(newForm, events);
    
    // Erinnerungseinstellungen kopieren
    const originalReminder = document.getElementById('noReminder' + eventNumber);
    const originalReminderTime = document.getElementById('reminderTime' + eventNumber);
    const newReminder = newForm.querySelector(`#noReminder${events}`);
    const newReminderTime = newForm.querySelector(`#reminderTime${events}`);
    
    newReminder.checked = originalReminder.checked;
    newReminderTime.value = originalReminderTime.value;
    newReminderTime.disabled = originalReminder.checked;
    
    // Am Ende der Liste einfügen
    document.getElementById('eventsContainer').appendChild(newForm);
}

function deleteEvent(eventNumber) {
    if (events === 1) {
        alert('Mindestens ein Termin muss bestehen bleiben.');
        return;
    }
    
    if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
        const eventToDelete = document.querySelector(`#eventsContainer .card:nth-child(${eventNumber})`);
        eventToDelete.remove();
        events--;
        
        // Verbleibende Termine neu nummerieren
        renumberEvents();
    }
}

function updateFormIds(form, newNumber) {
    // Alle IDs und for-Attribute aktualisieren
    form.querySelectorAll('[id]').forEach(element => {
        element.id = element.id.replace(/\d+$/, newNumber);
    });
    form.querySelectorAll('[for]').forEach(element => {
        element.setAttribute('for', element.getAttribute('for').replace(/\d+$/, newNumber));
    });
    
    // Titel aktualisieren
    form.querySelector('.card-title').textContent = `Termin ${newNumber}`;
    
    // Button onclick-Handler aktualisieren
    form.querySelector('.btn-outline-primary').setAttribute('onclick', `duplicateEvent(${newNumber})`);
    form.querySelector('.btn-outline-danger').setAttribute('onclick', `deleteEvent(${newNumber})`);
}

function bindEventListeners(form, eventNumber) {
    // Startdatum Event-Listener
    form.querySelector(`#startDate${eventNumber}`).addEventListener('change', function() {
        updateEndDate(eventNumber);
    });
    
    // URL-Validierung
    form.querySelector(`#attachment${eventNumber}`).addEventListener('change', function() {
        validateURL(this, 'Anhang');
    });
    form.querySelector(`#url${eventNumber}`).addEventListener('change', function() {
        validateURL(this, 'Link');
    });
    
    // Reminder-Checkbox
    form.querySelector(`#noReminder${eventNumber}`).addEventListener('change', function() {
        toggleReminderField(eventNumber);
    });
}

function renumberEvents() {
    const forms = document.querySelectorAll('#eventsContainer .card');
    forms.forEach((form, index) => {
        const number = index + 1;
        updateFormIds(form, number);
    });
}

function importICSFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // Grundlegende ICS-Validierung
            if (!content.includes('BEGIN:VCALENDAR') || !content.includes('END:VCALENDAR')) {
                throw new Error('Die Datei scheint keine gültige ICS-Datei zu sein.');
            }

            // Prüfen auf mindestens ein Event
            if (!content.includes('BEGIN:VEVENT')) {
                throw new Error('Die Datei enthält keine Termine.');
            }

            parseICSContent(content);
            
            // Erfolgsmeldung
            showImportMessage('success', 'Termine wurden erfolgreich importiert!');
            
        } catch (error) {
            console.error('Import error:', error);
            showImportMessage('danger', `Fehler beim Import: ${error.message}`);
            
            // Formular zurücksetzen
            input.value = '';
        }
    };

    reader.onerror = function() {
        showImportMessage('danger', 'Fehler beim Lesen der Datei.');
        input.value = '';
    };

    reader.readAsText(file);
}

function showImportMessage(type, message) {
    // Bestehende Meldungen entfernen
    const existingAlert = document.getElementById('importAlert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Neue Meldung erstellen
    const alert = document.createElement('div');
    alert.id = 'importAlert';
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;

    // Meldung einfügen
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', alert);

    // Meldung nach 5 Sekunden automatisch ausblenden
    if (type === 'success') {
        setTimeout(() => {
            const alert = document.getElementById('importAlert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

function parseICSContent(content) {
    try {
        // Events aus der ICS-Datei extrahieren
        const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
        const events = [...content.matchAll(eventRegex)];
        
        if (events.length === 0) {
            throw new Error('Keine Termine in der ICS-Datei gefunden.');
        }

        // Bestehende Events löschen
        document.getElementById('eventsContainer').innerHTML = '';
        window.events = 0;

        // Jeden Event parsen und ins Formular einfügen
        events.forEach((event) => {
            try {
                const eventContent = event[1];
                addEventFromICS(parseEventProperties(eventContent));
            } catch (error) {
                console.warn('Fehler beim Parsen eines Events:', error);
                // Weiter mit nächstem Event
            }
        });
    } catch (error) {
        throw new Error('Fehler beim Verarbeiten der ICS-Datei: ' + error.message);
    }
}

function parseEventProperties(eventContent) {
    const properties = {};
    const lines = eventContent.split('\r\n').map(line => line.trim());

    lines.forEach(line => {
        if (line.includes(':')) {
            const [key, ...values] = line.split(':');
            const value = values.join(':')
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';');
            
            switch (key) {
                case 'SUMMARY':
                    properties.summary = value;
                    break;
                case 'LOCATION':
                    properties.location = value;
                    break;
                case 'DESCRIPTION':
                    properties.description = value;
                    break;
                case 'DTSTART':
                    properties.start = parseICSDate(value);
                    break;
                case 'DTEND':
                    properties.end = parseICSDate(value);
                    break;
                case 'URL':
                    properties.url = value;
                    break;
                case 'ATTACH':
                    properties.attachment = value;
                    break;
            }
        }
    });

    // Prüfen auf Erinnerung
    const hasAlarm = eventContent.includes('BEGIN:VALARM');
    if (hasAlarm) {
        const triggerMatch = eventContent.match(/TRIGGER:-PT(\d+)M/);
        if (triggerMatch) {
            properties.reminderTime = triggerMatch[1];
            properties.noReminder = false;
        }
    } else {
        properties.noReminder = true;
    }

    return properties;
}

function parseICSDate(dateStr) {
    // Entferne mögliche Zeitzonenparameter
    dateStr = dateStr.split(';').pop();
    
    // Prüfen ob ganztägiges Event (nur Datum)
    const isAllDay = !dateStr.includes('T');
    
    if (isAllDay) {
        return {
            date: `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`,
            time: null,
            allDay: true
        };
    }

    // Datum mit Uhrzeit
    const hasTimezone = dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-');
    let time;
    
    if (hasTimezone) {
        // Konvertiere UTC zu lokaler Zeit
        const date = new Date(
            parseInt(dateStr.substr(0,4)),
            parseInt(dateStr.substr(4,2)) - 1,
            parseInt(dateStr.substr(6,2)),
            parseInt(dateStr.substr(9,2)),
            parseInt(dateStr.substr(11,2))
        );
        time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    } else {
        time = `${dateStr.substr(9,2)}:${dateStr.substr(11,2)}`;
    }

    return {
        date: `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`,
        time: time,
        allDay: false
    };
}

function addEventFromICS(properties) {
    addAnotherEvent();
    const eventNumber = window.events;

    // Formularfelder befüllen
    document.getElementById(`summary${eventNumber}`).value = properties.summary || '';
    document.getElementById(`location${eventNumber}`).value = properties.location || '';
    document.getElementById(`description${eventNumber}`).value = properties.description || '';
    document.getElementById(`url${eventNumber}`).value = properties.url || '';
    document.getElementById(`attachment${eventNumber}`).value = properties.attachment || '';

    // Datum und Zeit setzen
    if (properties.start) {
        document.getElementById(`startDate${eventNumber}`).value = properties.start.date;
        if (properties.start.time) {
            document.getElementById(`startTime${eventNumber}`).value = properties.start.time;
        }
    }
    if (properties.end) {
        document.getElementById(`endDate${eventNumber}`).value = properties.end.date;
        if (properties.end.time) {
            document.getElementById(`endTime${eventNumber}`).value = properties.end.time;
        }
    }

    // Ganztägig-Checkbox
    const allDayCheckbox = document.getElementById(`allDay${eventNumber}`);
    if (properties.start && properties.start.allDay) {
        allDayCheckbox.checked = true;
        toggleDateTimeFields(eventNumber);
    }

    // Erinnerung setzen
    const noReminderCheckbox = document.getElementById(`noReminder${eventNumber}`);
    const reminderSelect = document.getElementById(`reminderTime${eventNumber}`);
    
    noReminderCheckbox.checked = properties.noReminder;
    if (!properties.noReminder && properties.reminderTime) {
        reminderSelect.value = properties.reminderTime;
    }
    toggleReminderField(eventNumber);
}

function importAndRedirect(input) {
    const file = input.files[0];
    if (!file) return;

    // Speichern Sie die Datei temporär im localStorage
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('importedICS', e.target.result);
        window.location.href = 'generator.html?import=true';
    };
    reader.readAsText(file);
} 