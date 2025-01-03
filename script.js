let events = 1;

// Initialisierung beim Laden
window.onload = function() {
    if (window.location.pathname.includes('generator.html')) {
        initializeFirstEvent();
        checkForImport();
    }
};

function initializeFirstEvent() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate1').value = today;
    
    const now = new Date();
    const currentHour = `${String(now.getHours()).padStart(2, '0')}:00`;
    document.getElementById('startTime1').value = currentHour;
    
    updateEndDate(1);
    
    // Event-Listener
    document.getElementById('startDate1').addEventListener('change', () => updateEndDate(1));
    document.getElementById('startTime1').addEventListener('change', () => updateEndDate(1));
}

function generateEventFormHTML(eventNumber) {
    const template = document.querySelector('#eventTemplate');
    const clone = template.content.cloneNode(true);
    updateIdsAndLabels(clone, eventNumber);
    return clone;
}

function updateIdsAndLabels(clone, eventNumber) {
    const title = clone.querySelector('.card-title');
    title.textContent = `Termin ${eventNumber}`;
    
    const elements = clone.querySelectorAll('input, select, textarea, label');
    elements.forEach(element => {
        // Basis-Felder
        if (element.classList.contains('summary')) element.id = `summary${eventNumber}`;
        if (element.classList.contains('allDayCheckbox')) {
            element.id = `allDay${eventNumber}`;
            element.onchange = () => toggleDateTimeFields(eventNumber);
        }
        if (element.classList.contains('startDate')) {
            element.id = `startDate${eventNumber}`;
            element.onchange = () => updateEndDate(eventNumber);
        }
        if (element.classList.contains('startTime')) {
            element.id = `startTime${eventNumber}`;
            element.onchange = () => updateEndDate(eventNumber);
        }
        if (element.classList.contains('endDate')) element.id = `endDate${eventNumber}`;
        if (element.classList.contains('endTime')) element.id = `endTime${eventNumber}`;
        if (element.classList.contains('location')) element.id = `location${eventNumber}`;
        if (element.classList.contains('description')) element.id = `description${eventNumber}`;
        
        // Wiederholungs-Felder
        if (element.classList.contains('repeatType')) {
            element.id = `repeatType${eventNumber}`;
            element.onchange = () => toggleRepeatOptions(eventNumber);
        }
        if (element.classList.contains('repeatInterval')) element.id = `repeatInterval${eventNumber}`;
        if (element.classList.contains('repeatEnd')) {
            element.id = `repeatEnd${eventNumber}`;
            element.onchange = () => toggleEndDate(eventNumber);
        }
        if (element.classList.contains('repeatCount')) element.id = `repeatCount${eventNumber}`;
        if (element.classList.contains('repeatUntil')) element.id = `repeatUntil${eventNumber}`;
        
        // Wochentage
        ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'].forEach(day => {
            if (element.classList.contains(`weekday_${day}`)) {
                element.id = `weekday_${day}_${eventNumber}`;
            }
        });
        
        // Monate
        for (let i = 1; i <= 12; i++) {
            if (element.classList.contains(`month_${i}`)) {
                element.id = `month_${i}_${eventNumber}`;
            }
        }
        
        if (element.classList.contains('weekInMonth')) element.id = `weekInMonth${eventNumber}`;
    });
    
    return clone;
}

function duplicateEvent(eventNumber) {
    try {
        events++;
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card mb-4';
        
        const template = generateEventFormHTML(events);
        cardDiv.appendChild(template);
        
        document.getElementById('eventsContainer').appendChild(cardDiv);
        
        // Status initialisieren
        toggleRepeatOptions(events);
        toggleEndDate(events);
        toggleDateTimeFields(events);
        
        return true;
    } catch (error) {
        console.error('Fehler beim Duplizieren des Events:', error);
        return false;
    }
}

function checkForImport() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('import') === 'true') {
        const importedContent = localStorage.getItem('importedICS');
        if (importedContent) {
            importICSFile({ 
                files: [new Blob([importedContent], {type: 'text/calendar'})],
                value: ''
            });
            localStorage.removeItem('importedICS');
        }
    }
}

function toggleRepeatOptions(eventNumber) {
    const repeatType = document.getElementById(`repeatType${eventNumber}`).value;
    const form = document.getElementById(`repeatType${eventNumber}`).closest('.eventForm');
    
    const repeatDetails = form.querySelector('.repeatDetails');
    const weekdaySelector = form.querySelector('.weekdaySelector');
    const monthSelector = form.querySelector('.monthSelector');
    const repeatEndOptions = form.querySelector('.repeatEndOptions');
    
    // Alles ausblenden
    [repeatDetails, weekdaySelector, monthSelector, repeatEndOptions].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    if (repeatType !== 'none') {
        if (repeatDetails) repeatDetails.style.display = 'block';
        if (repeatEndOptions) repeatEndOptions.style.display = 'block';
        
        if (repeatType === 'monthly') {
            if (weekdaySelector) weekdaySelector.style.display = 'block';
            if (monthSelector) monthSelector.style.display = 'block';
        } else if (repeatType === 'weekly' && weekdaySelector) {
            weekdaySelector.style.display = 'block';
        }
    }
}

function toggleEndDate(eventNumber) {
    const repeatEnd = document.getElementById(`repeatEnd${eventNumber}`);
    const repeatCount = document.getElementById(`repeatCount${eventNumber}`);
    const repeatUntil = document.getElementById(`repeatUntil${eventNumber}`);
    
    if (repeatEnd && repeatCount && repeatUntil) {
        repeatCount.style.display = repeatEnd.value === 'after' ? 'block' : 'none';
        repeatUntil.style.display = repeatEnd.value === 'until' ? 'block' : 'none';
    }
}

function toggleDateTimeFields(eventNumber) {
    const allDayCheckbox = document.getElementById(`allDay${eventNumber}`);
    const startTime = document.getElementById(`startTime${eventNumber}`);
    const endTime = document.getElementById(`endTime${eventNumber}`);
    
    if (allDayCheckbox && startTime && endTime) {
        if (allDayCheckbox.checked) {
            startTime.disabled = true;
            endTime.disabled = true;
            startTime.value = '00:00';
            endTime.value = '23:59';
        } else {
            startTime.disabled = false;
            endTime.disabled = false;
            startTime.value = '';
            endTime.value = '';
        }
    }
}

function updateEndDate(eventNumber) {
    const startDate = document.getElementById(`startDate${eventNumber}`);
    const startTime = document.getElementById(`startTime${eventNumber}`);
    const endDate = document.getElementById(`endDate${eventNumber}`);
    const endTime = document.getElementById(`endTime${eventNumber}`);
    
    if (startDate && startDate.value) {
        // Setze das Enddatum auf das Startdatum
        endDate.value = startDate.value;
        
        // Wenn eine Startzeit gesetzt ist, setze die Endzeit auf eine Stunde später
        if (startTime && startTime.value) {
            const [hours, minutes] = startTime.value.split(':');
            const endDateTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endDateTime.setHours(endDateTime.getHours() + 1);
            
            endTime.value = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
        }
    }
}

function createICSCalendar() {
    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ICS Tools//DE\r\n';
    
    // Für jeden Event
    for (let i = 1; i <= events; i++) {
        const summary = document.getElementById(`summary${i}`).value;
        const startDate = document.getElementById(`startDate${i}`).value;
        const startTime = document.getElementById(`startTime${i}`).value;
        const endDate = document.getElementById(`endDate${i}`).value;
        const endTime = document.getElementById(`endTime${i}`).value;
        const location = document.getElementById(`location${i}`).value;
        const description = document.getElementById(`description${i}`).value;
        const allDay = document.getElementById(`allDay${i}`).checked;
        
        icsContent += generateEventBlock(
            summary,
            `${startDate}T${startTime}`,
            `${endDate}T${endTime}`,
            location,
            description,
            '',  // attachment
            '',  // url
            allDay,
            i
        );
    }
    
    icsContent += 'END:VCALENDAR';
    downloadICSFile(icsContent);
}

function downloadICSFile(content) {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'termine.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function generateUID() {
    return 'uid-' + Math.random().toString(36).substr(2, 9);
}

function getCurrentDateTimeUTC() {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatDateTime(date, time, isAllDay) {
    if (isAllDay) {
        return `VALUE=DATE:${date.replace(/-/g, '')}`;
    }
    const dateTime = `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    return dateTime;
}

function escapeText(text) {
    return text
        .replace(/[\\;,]/g, '\\$&')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function sanitizeInput(input) {
    if (!input) return '';
    return input.replace(/[<>{}]/g, '');
}

function isValidURL(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
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

    // Wiederholungsregeln hinzufügen
    const repeatType = document.getElementById(`repeatType${eventNumber}`).value;
    if (repeatType !== 'none') {
        const interval = document.getElementById(`repeatInterval${eventNumber}`).value;
        const freq = repeatType.toUpperCase();
        let rrule = `RRULE:FREQ=${freq};INTERVAL=${interval}`;
        
        // Wochentage für wöchentliche oder monatliche Wiederholung
        if (repeatType === 'weekly' || repeatType === 'monthly') {
            const weekdays = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']
                .filter(day => document.getElementById(`weekday_${day}_${eventNumber}`).checked)
                .map(day => day.toUpperCase());
            
            if (weekdays.length > 0) {
                if (repeatType === 'monthly') {
                    const weekInMonth = document.getElementById(`weekInMonth${eventNumber}`).value;
                    rrule += `;BYDAY=${weekInMonth}${weekdays.join(',')}`;
                } else {
                    rrule += `;BYDAY=${weekdays.join(',')}`;
                }
            }
        }
        
        // Monate für monatliche Wiederholung
        if (repeatType === 'monthly') {
            const months = Array.from({length: 12}, (_, i) => i + 1)
                .filter(m => document.getElementById(`month_${m}_${eventNumber}`).checked)
                .join(',');
            if (months) {
                rrule += `;BYMONTH=${months}`;
            }
        }
        
        // End-Bedingung
        const repeatEnd = document.getElementById(`repeatEnd${eventNumber}`).value;
        if (repeatEnd === 'after') {
            rrule += `;COUNT=${document.getElementById(`repeatCount${eventNumber}`).value}`;
        } else if (repeatEnd === 'until') {
            const until = document.getElementById(`repeatUntil${eventNumber}`).value;
            const untilDate = new Date(until);
            rrule += `;UNTIL=${untilDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
        }
        
        event.push(rrule);
    }

    event.push('END:VEVENT');
    return event.map(line => foldLine(line)).join('\r\n') + '\r\n';
}