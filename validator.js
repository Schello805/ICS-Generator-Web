document.getElementById('icsFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        validateICSFile(content);
        displayFileContent(content);
    };
    reader.readAsText(file);

    // Update file input label
    const fileName = file.name;
    const label = document.querySelector('.custom-file-label');
    label.textContent = fileName;
});

function validateICSFile(content) {
    const results = [];
    const errors = [];
    const warnings = [];

    // Grundlegende Struktur prüfen
    if (!content.includes('BEGIN:VCALENDAR')) {
        errors.push('Fehlender BEGIN:VCALENDAR Tag');
    }
    if (!content.includes('END:VCALENDAR')) {
        errors.push('Fehlender END:VCALENDAR Tag');
    }

    // Version prüfen
    const versionMatch = content.match(/VERSION:(.+)/);
    if (!versionMatch) {
        errors.push('Fehlende VERSION Property');
    } else if (versionMatch[1].trim() !== '2.0') {
        errors.push('Ungültige VERSION: Muss 2.0 sein');
    }

    // PRODID prüfen
    if (!content.includes('PRODID:')) {
        errors.push('Fehlende PRODID Property');
    }

    // Events prüfen
    const events = content.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];
    results.push(`Gefundene Events: ${events.length}`);

    events.forEach((event, index) => {
        // Pflichtfelder prüfen
        if (!event.includes('UID:')) {
            errors.push(`Event ${index + 1}: Fehlende UID`);
        }
        if (!event.includes('DTSTAMP:')) {
            errors.push(`Event ${index + 1}: Fehlendes DTSTAMP`);
        }
        if (!event.includes('DTSTART:') && !event.includes('DTSTART;')) {
            errors.push(`Event ${index + 1}: Fehlendes DTSTART`);
        }

        // Datumsformate prüfen
        const dates = event.match(/(?:DTSTART|DTEND)(?:;[^:]*)?:([\w:Z+-]+)/g) || [];
        dates.forEach(date => {
            if (!isValidICSDate(date)) {
                errors.push(`Event ${index + 1}: Ungültiges Datumsformat in ${date}`);
            }
        });

        // Zeilenlänge prüfen
        const lines = event.split('\r\n');
        lines.forEach((line, lineIndex) => {
            if (line.length > 75) {
                warnings.push(`Event ${index + 1}: Zeile ${lineIndex + 1} überschreitet 75 Zeichen`);
            }
        });
    });

    // Property-Syntax prüfen
    const lines = content.split(/\r\n|\n|\r/);
    lines.forEach((line, index) => {
        // Leere Zeilen und Komponenten-Tags überspringen
        if (!line || line.startsWith('BEGIN:') || line.startsWith('END:')) {
            return;
        }

        // Prüfen ob die Property-Syntax korrekt ist (NAME:Wert oder NAME;PARAM=Wert:Wert)
        const propertyRegex = /^([A-Z-]+)(?:;[^:]+)?:(.+)$/;
        if (!propertyRegex.test(line)) {
            errors.push(`Zeile ${index + 1}: Ungültige Property-Syntax in "${line}"`);
            return;
        }

        // Bekannte Properties und ihre Syntax prüfen
        const knownProperties = {
            // Event Properties
            'SUMMARY': true,
            'LOCATION': true,
            'DESCRIPTION': true,
            'DTSTART': true,
            'DTEND': true,
            'UID': true,
            'DTSTAMP': true,
            'STATUS': true,
            'SEQUENCE': true,
            'URL': true,
            'ATTACH': true,
            
            // Calendar Properties
            'VERSION': true,
            'PRODID': true,
            'CALSCALE': true,
            'METHOD': true,
            'X-WR-TIMEZONE': true,  // Apple/iCal Erweiterung
            
            // Alarm Properties
            'TRIGGER': true,
            'ACTION': true,
            
            // Andere häufig verwendete Properties
            'CATEGORIES': true,
            'CLASS': true,
            'CREATED': true,
            'LAST-MODIFIED': true,
            'ORGANIZER': true,
            'PRIORITY': true,
            'TRANSP': true,
            'ATTENDEE': true
        };

        const propertyName = line.split(/[;:]/)[0];
        if (!knownProperties[propertyName]) {
            warnings.push(`Zeile ${index + 1}: Unbekannte Property "${propertyName}"`);
        }
    });

    displayValidationResults(results, errors, warnings);
}

function isValidICSDate(dateString) {
    // Prüft ganztägige Termine
    if (dateString.includes('VALUE=DATE:')) {
        const date = dateString.split(':')[1];
        return /^\d{8}$/.test(date);
    }
    
    // Prüft Datum-Zeit-Werte
    const datetime = dateString.split(':')[1];
    return /^\d{8}T\d{6}(?:Z)?$/.test(datetime) || 
           /^\d{8}T\d{6}(?:[+-]\d{4})?$/.test(datetime);
}

function displayValidationResults(results, errors, warnings) {
    const resultsDiv = document.getElementById('validationResults');
    let html = '';

    if (errors.length === 0 && warnings.length === 0) {
        html += '<div class="alert alert-success">Die ICS-Datei ist valide!</div>';
    }

    if (results.length > 0) {
        html += '<div class="alert alert-info">';
        results.forEach(result => html += `<p class="mb-1">${result}</p>`);
        html += '</div>';
    }

    if (errors.length > 0) {
        html += '<div class="alert alert-danger"><strong>Fehler:</strong><ul class="mb-0">';
        errors.forEach(error => html += `<li>${error}</li>`);
        html += '</ul></div>';
    }

    if (warnings.length > 0) {
        html += '<div class="alert alert-warning"><strong>Warnungen:</strong><ul class="mb-0">';
        warnings.forEach(warning => html += `<li>${warning}</li>`);
        html += '</ul></div>';
    }

    resultsDiv.innerHTML = html;
}

function displayFileContent(content) {
    const pre = document.getElementById('fileContent');
    pre.textContent = content;
} 