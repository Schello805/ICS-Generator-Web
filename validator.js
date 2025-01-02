document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('icsFile');
    const icsContent = document.getElementById('icsContent');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                icsContent.value = e.target.result;
                debouncedValidation();
            };
            reader.readAsText(file);
            
            // Update des Dateinamens im Label
            const fileName = file.name || 'Datei auswählen...';
            const label = document.querySelector('.custom-file-label');
            label.textContent = fileName;
        }
    });
});

document.querySelector('.custom-file-input').addEventListener('change', function(e) {
    var fileName = e.target.files[0]?.name || 'Datei auswählen...';
    var next = e.target.nextElementSibling;
    next.innerText = fileName;
});

document.getElementById('validatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('icsFile');
    const resultsDiv = document.getElementById('validationResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!fileInput.files[0]) {
        resultsDiv.innerHTML = '<div class="error-item">Bitte wählen Sie eine ICS-Datei aus.</div>';
        return;
    }

    const file = fileInput.files[0];
    
    // Maximale Dateigröße prüfen
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
        resultsDiv.innerHTML = '<div class="error-item">Die Datei ist zu groß. Maximale Größe: 5MB</div>';
        return;
    }

    // Loading Spinner anzeigen
    loadingSpinner.style.display = 'block';
    resultsDiv.innerHTML = '';

    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        validateICSFile(content);
        loadingSpinner.style.display = 'none';
    };

    reader.onerror = function() {
        loadingSpinner.style.display = 'none';
        resultsDiv.innerHTML = '<div class="error-item">Fehler beim Lesen der Datei.</div>';
    };

    reader.readAsText(file);
});

function validateICSFile(content, file) {
    const resultsDiv = document.getElementById('validationResults');
    const checksDiv = document.getElementById('checksPerformed');
    const eventsDiv = document.getElementById('eventsFound');
    const checksList = document.getElementById('checksList');
    const eventsTable = document.getElementById('eventsTable');
    const errors = [];
    const checks = [];
    
    // Prüfungen nach RFC 5545
    checks.push({
        name: 'Grundlegende Struktur',
        details: 'BEGIN:VCALENDAR und END:VCALENDAR müssen vorhanden sein',
        status: content.includes('BEGIN:VCALENDAR') && content.includes('END:VCALENDAR')
    });

    checks.push({
        name: 'iCalendar Version',
        details: 'VERSION Property muss 2.0 sein',
        status: content.includes('VERSION:2.0')
    });

    checks.push({
        name: 'PRODID Property',
        details: 'PRODID muss vorhanden sein',
        status: content.includes('PRODID:')
    });

    checks.push({
        name: 'Ereignisse vorhanden',
        details: 'Mindestens ein VEVENT muss definiert sein',
        status: content.includes('BEGIN:VEVENT')
    });

    checks.push({
        name: 'Zeilenenden',
        details: 'Zeilenenden müssen CRLF (\\r\\n) sein',
        status: content.includes('\r\n')
    });

    checks.push({
        name: 'Zeichenkodierung',
        details: 'Nur ASCII-Zeichen oder UTF-8 erlaubt',
        status: isValidUTF8(content)
    });

    checks.push({
        name: 'Zeilenlänge',
        details: 'Zeilen dürfen nicht länger als 75 Zeichen sein',
        status: !content.split(/\r\n/).some(line => line.length > 75)
    });

    checks.push({
        name: 'DTSTAMP Format',
        details: 'DTSTAMP muss UTC-Zeit im Format "yyyyMMddTHHmmssZ" sein',
        status: /DTSTAMP:[0-9]{8}T[0-9]{6}Z/.test(content)
    });

    checks.push({
        name: 'DTSTART Format',
        details: 'DTSTART muss gültiges Datum/Zeit-Format haben',
        status: /DTSTART(;[^:]*)?:[0-9]{8}(T[0-9]{6}(Z)?)?/.test(content)
    });

    checks.push({
        name: 'Zeitzonen',
        details: 'Prüfung auf gültige VTIMEZONE Definitionen',
        status: !content.includes('BEGIN:VTIMEZONE') || 
                (content.includes('BEGIN:VTIMEZONE') && content.includes('END:VTIMEZONE')),
        optional: true
    });

    checks.push({
        name: 'METHOD Property',
        details: 'Optional: Definiert den Kalender-Methoden-Typ (z.B. REQUEST, PUBLISH)',
        status: content.includes('METHOD:'),
        optional: true
    });

    checks.push({
        name: 'RRULE Format',
        details: 'Prüfung auf korrekte Syntax bei wiederkehrenden Terminen',
        status: !content.includes('RRULE:') || /RRULE:FREQ=[A-Z]+/.test(content),
        optional: true
    });

    // Events extrahieren und prüfen
    const eventBlocks = content.split('BEGIN:VEVENT')
        .filter((block, index) => index > 0)
        .map(block => block.split('END:VEVENT')[0]);

    const events = [];
    eventBlocks.forEach((event, index) => {
        const eventObj = {
            index: index + 1,
            errors: []
        };

        // Pflichtfelder prüfen
        if (!event.includes('UID:')) eventObj.errors.push('Fehlende UID');
        if (!event.includes('DTSTAMP:')) eventObj.errors.push('Fehlendes DTSTAMP');
        if (!event.includes('DTSTART:')) eventObj.errors.push('Fehlendes DTSTART');

        // Event-Daten extrahieren
        const summary = event.match(/SUMMARY:(.*?)(?:\r\n|\r|\n)/);
        const dtstart = event.match(/DTSTART(?:;[^:]*)?:(.*?)(?:\r\n|\r|\n)/);
        const location = event.match(/LOCATION:(.*?)(?:\r\n|\r|\n)/);

        eventObj.summary = summary ? summary[1] : 'Kein Titel';
        eventObj.dtstart = dtstart ? dtstart[1] : '';
        eventObj.location = location ? location[1] : '';

        events.push(eventObj);

        if (eventObj.errors.length > 0) {
            errors.push(`Event ${index + 1}: ${eventObj.errors.join(', ')}`);
        }
    });

    // Ergebnisse anzeigen
    if (errors.length === 0) {
        resultsDiv.innerHTML = '<div class="success-message">Die ICS-Datei ist gültig! ' + 
            `${events.length} Ereignis${events.length !== 1 ? 'se' : ''} gefunden.</div>`;
    } else {
        resultsDiv.innerHTML = '<h5 class="mt-3">Gefundene Fehler:</h5>' +
            errors.map(error => `<div class="error-item">${error}</div>`).join('');
    }

    // Detaillierte Ergebnisse anzeigen
    checksDiv.style.display = 'block';
    checksList.innerHTML = checks.map(check => `
        <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${check.name}</strong>
                    <br>
                    <small class="text-muted">${check.details}</small>
                </div>
                <span class="badge badge-${check.status ? 'success' : 'danger'} badge-pill">
                    ${check.status ? '✓' : '✗'}
                </span>
            </div>
        </li>
    `).join('');

    if (events.length > 0) {
        eventsDiv.style.display = 'block';
        eventsTable.innerHTML = events.map(event => {
            const date = event.dtstart ? formatICSDate(event.dtstart) : { date: 'Nicht angegeben', time: '' };
            return `
                <tr>
                    <td>${event.summary}</td>
                    <td>${date.date}</td>
                    <td>${date.time || '-'}</td>
                    <td>${event.location || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    // Export-Button anzeigen und Event-Handler hinzufügen
    document.getElementById('exportResults').style.display = 'block';
    document.getElementById('exportResults').addEventListener('click', function() {
        const results = {
            timestamp: new Date().toISOString(),
            filename: file.name,
            filesize: file.size,
            checks: checks.map(check => ({
                name: check.name,
                status: check.status,
                details: check.details,
                optional: check.optional || false
            })),
            events: events.map(event => ({
                summary: event.summary,
                dtstart: event.dtstart,
                location: event.location,
                errors: event.errors
            })),
            errors: errors
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation-${file.name.replace('.ics', '')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function formatICSDate(icsDate) {
    const year = icsDate.substr(0, 4);
    const month = icsDate.substr(4, 2);
    const day = icsDate.substr(6, 2);
    const hasTime = icsDate.length > 8;
    
    const date = `${day}.${month}.${year}`;
    
    if (hasTime) {
        const hour = icsDate.substr(9, 2);
        const minute = icsDate.substr(11, 2);
        return {
            date: date,
            time: `${hour}:${minute}`
        };
    }
    
    return {
        date: date,
        time: ''
    };
}

function isValidUTF8(str) {
    try {
        const decoder = new TextDecoder('utf-8', {fatal: true});
        const encoder = new TextEncoder();
        decoder.decode(encoder.encode(str));
        return true;
    } catch (e) {
        return /^[\x00-\x7F]*$/.test(str);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedValidation = debounce(validateICSFile, 300); 

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

    // DTEND oder DURATION prüfen
    if (!event.match(/^DTEND(;[^:]+)?:/m) && !event.match(/^DURATION:/m)) {
        warnings.push("Optional: DTEND oder DURATION empfohlen");
    }

    // METHOD Property
    if (!event.match(/^METHOD:/m)) {
        warnings.push("Optional: Definiert den Kalender-Methoden-Typ (z.B. REQUEST, PUBLISH)");
    }

    return { errors, warnings };
} 

function validateICSFile() {
    const icsContent = document.getElementById('icsContent').value;
    const resultDiv = document.getElementById('validationResults');
    resultDiv.innerHTML = '';

    if (!icsContent) {
        showError("Bitte fügen Sie ICS-Inhalt ein.");
        return;
    }

    // Ergebnisliste erstellen
    const resultList = document.createElement('div');
    resultList.className = 'validation-results-list';

    // DIN 5008 / RFC 5545 Prüfungen
    const checks = [
        {
            name: 'Grundstruktur',
            checks: [
                { 
                    test: icsContent.startsWith('BEGIN:VCALENDAR'), 
                    message: 'BEGIN:VCALENDAR vorhanden',
                    description: 'Markiert den Beginn der Kalenderdatei'
                },
                { 
                    test: icsContent.endsWith('END:VCALENDAR'), 
                    message: 'END:VCALENDAR vorhanden',
                    description: 'Markiert das Ende der Kalenderdatei'
                },
                { 
                    test: icsContent.match(/^VERSION:/m), 
                    message: 'VERSION Property vorhanden',
                    description: 'Gibt die verwendete iCalendar-Version an (meist 2.0)'
                },
                { 
                    test: icsContent.match(/^PRODID:/m), 
                    message: 'PRODID Property vorhanden',
                    description: 'Identifiziert den Ersteller der Kalenderdatei'
                }
            ]
        },
        {
            name: 'Pflichtfelder (pro Event)',
            checks: [
                { 
                    test: /^DTSTART(;[^:]+)?:/m, 
                    message: 'DTSTART Property',
                    description: 'Definiert Start-Datum und -Zeit des Termins'
                },
                { 
                    test: /^UID:/m, 
                    message: 'UID Property',
                    description: 'Eindeutige ID zur Identifizierung des Termins'
                },
                { 
                    test: /^SUMMARY:/m, 
                    message: 'SUMMARY Property',
                    description: 'Titel oder Zusammenfassung des Termins'
                }
            ]
        },
        {
            name: 'Datumsformate',
            checks: [
                { 
                    test: /^DTSTART(;[^:]+)?:\d{8}(T\d{6}Z?)?$/m, 
                    message: 'DTSTART Format korrekt',
                    description: 'Format: YYYYMMDD[THHMMSS[Z]] (Z für UTC)'
                },
                { 
                    test: /^DTEND(;[^:]+)?:\d{8}(T\d{6}Z?)?$/m, 
                    message: 'DTEND Format korrekt',
                    description: 'Format: YYYYMMDD[THHMMSS[Z]] (Z für UTC)'
                }
            ]
        },
        {
            name: 'Optionale Felder',
            checks: [
                { 
                    test: /^METHOD:/m, 
                    message: 'METHOD Property',
                    description: 'Definiert den Kalender-Methoden-Typ (z.B. REQUEST, PUBLISH)'
                }
            ]
        }
    ];

    // Prüfungen durchführen
    checks.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'check-category';
        categoryDiv.innerHTML = `<h4>${category.name}</h4>`;
        
        const checkList = document.createElement('ul');
        category.checks.forEach(check => {
            const result = check.test.test ? check.test.test(icsContent) : check.test;
            const li = document.createElement('li');
            li.className = `check-item ${result ? 'success' : 'error'}`;
            li.innerHTML = `
                <div class="header">
                    <i class="fas ${result ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
                    ${check.message}
                </div>
                <div class="description">
                    ${check.description}
                </div>
            `;
            checkList.appendChild(li);
        });
        
        categoryDiv.appendChild(checkList);
        resultList.appendChild(categoryDiv);
    });

    resultDiv.appendChild(resultList);
}

function showError(message) {
    const resultDiv = document.getElementById('validationResults');
    resultDiv.innerHTML = `<div class="error-item">${message}</div>`;
} 