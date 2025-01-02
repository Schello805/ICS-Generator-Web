var scriptRevision = 15;
var events = 1;

window.onload = function () {
    initializePlaceholderTexts();
    document.getElementById('startDate1').addEventListener('change', function() {
        updateEndDate(1);
    });
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
    const tzOffset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(tzOffset / 60));
    const offsetMinutes = Math.abs(tzOffset % 60);
    const tzString = (tzOffset > 0 ? '-' : '+') + 
                    String(offsetHours).padStart(2, '0') + 
                    String(offsetMinutes).padStart(2, '0');

    if (isAllDay) {
        return `;VALUE=DATE:${date.replace(/-/g, '')}`;
    }
    
    return `:${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00${tzString}`;
}

function generateEventBlock(summary, startDateTime, endDateTime, location, description, attachment, url, allDay) {
    let event = [
        'BEGIN:VEVENT',
        `UID:${generateUID()}`,
        `DTSTAMP:${getCurrentDateTimeUTC()}`,
        `DTSTART${formatDateTime(startDateTime.split('T')[0], startDateTime.split('T')[1] || '000000', allDay)}`,
        `DTEND${formatDateTime(endDateTime.split('T')[0], endDateTime.split('T')[1] || '000000', allDay)}`,
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
        new URL(url);
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

        icsContent += generateEventBlock(summary, startDateTime, endDateTime, location, description, attachment, url, allDay);
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
    var now = new Date();
    return now.getUTCFullYear() +
        ('0' + (now.getUTCMonth() + 1)).slice(-2) +
        ('0' + now.getUTCDate()).slice(-2) + 'T' +
        ('0' + now.getUTCHours()).slice(-2) +
        ('0' + now.getUTCMinutes()).slice(-2) +
        ('0' + now.getUTCSeconds()).slice(-2) + 'Z';
}

function updateEndDate(eventNumber) {
    var startDate = document.getElementById('startDate' + eventNumber);
    var endDate = document.getElementById('endDate' + eventNumber);
    
    if (startDate.value) {
        endDate.value = startDate.value;
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