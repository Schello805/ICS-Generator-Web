/**
 * ICS Validator Logic
 * Version: 1.1.0
 * Last Updated: 2025-01-01
 */

function addLoadingIndicator() {
    const resultsDiv = document.getElementById('validationResults');
    resultsDiv.innerHTML = `
        <div class="alert alert-info" role="status">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm mr-2" role="status">
                    <span class="sr-only">Validierung läuft...</span>
                </div>
                <span>Datei wird validiert...</span>
            </div>
        </div>`;
}

document.getElementById('icsFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    addLoadingIndicator();

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const { errors, warnings } = validateICS(content);
        displayValidationResults(errors, warnings);
        displayFileContent(content);
    };
    reader.onerror = function() {
        displayValidationResults(
            ['Fehler beim Lesen der Datei'], 
            []
        );
    };
    reader.readAsText(file);

    // Update file input label
    const fileName = file.name;
    const label = document.querySelector('.custom-file-label');
    label.textContent = fileName;
});

function validateICSFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const icsContent = e.target.result;
            const { errors, warnings } = validateICS(icsContent);
            
            // Ergebnisse anzeigen
            displayValidationResults(errors, warnings);
        };
        reader.readAsText(input.files[0]);
    }
}

function isValidICSDate(dateString) {
    // Extrahiere den Wert nach dem ersten Doppelpunkt
    const parts = dateString.split(':');
    if (parts.length < 2) return false;
    const value = parts.slice(1).join(':'); // Falls Doppelpunkte im Wert sind (z.B. Zeit)
    
    // Prüft ganztägige Termine (VALUE=DATE)
    if (dateString.toUpperCase().includes('VALUE=DATE')) {
        return /^\d{8}$/.test(value.trim());
    }
    
    // Prüft Datum-Zeit-Werte (YYYYMMDDTHHMMSSZ oder YYYYMMDDTHHMMSS)
    // Einfache Prüfung, ignoriert Zeitzonen-Parameter vor dem Doppelpunkt für den Regex
    return /^\d{8}T\d{6}(?:Z)?$/.test(value.trim());
}

function validateICS(icsContent) {
    // 1. Unfolding (Zeilenumbrüche entfernen)
    // ICS Zeilen, die mit Space oder Tab beginnen, gehören zur vorherigen Zeile
    const rawLines = icsContent.split(/\r\n|\n|\r/);
    const lines = [];
    
    rawLines.forEach(line => {
        if (line.length === 0) return;
        
        if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
            // An die letzte Zeile anhängen (ohne das erste Leerzeichen)
            lines[lines.length - 1] += line.substring(1);
        } else {
            lines.push(line);
        }
    });

    const errors = [];
    const warnings = [];

    // Prüfe auf korrekten Start und Ende (RFC 5545)
    // Wir schauen uns die rawLines an (vor Unfolding), aber ignorieren Leerzeilen am Anfang
    const firstValidLine = rawLines.find(l => l.trim().length > 0);
    if (!firstValidLine || !firstValidLine.toUpperCase().includes('BEGIN:VCALENDAR')) {
        errors.push('Datei muss mit "BEGIN:VCALENDAR" beginnen. (Gefunden: "' + (firstValidLine || 'nichts') + '")');
    }
    
    // Prüfe ob END:VCALENDAR existiert (muss nicht zwingend die allerletzte Zeile sein, aber vorhanden)
    const hasEnd = rawLines.some(l => l.trim().toUpperCase() === 'END:VCALENDAR');
    if (!hasEnd) {
        errors.push('Datei muss mit "END:VCALENDAR" enden.');
    }
    
    // Erweiterte Liste der erlaubten Properties nach RFC 5545
    const validProperties = [
        // General
        'BEGIN', 'END', 'VERSION', 'PRODID', 'CALSCALE', 'METHOD',
        // Event / Todo / Journal
        'UID', 'DTSTAMP', 'DTSTART', 'DTEND', 'SUMMARY', 'DESCRIPTION', 
        'LOCATION', 'RRULE', 'ACTION', 'TRIGGER', 'VALARM', 'DURATION',
        'ATTACH', 'ATTENDEE', 'CATEGORIES', 'CLASS', 'COMMENT', 'CONTACT',
        'CREATED', 'EXDATE', 'GEO', 'LAST-MODIFIED', 'ORGANIZER', 'PRIORITY',
        'RDATE', 'RECURRENCE-ID', 'RELATED-TO', 'RESOURCES', 'SEQUENCE',
        'STATUS', 'TRANSP', 'URL',
        // Timezone
        'TZID', 'TZNAME', 'TZOFFSETFROM', 'TZOFFSETTO', 'TZURL'
    ];

    lines.forEach((line, index) => {
        // Da wir Unfolding gemacht haben, stimmt der Index nicht mehr 1:1 mit der Rohdatei überein.
        // Wir nutzen hier logische Zeilennummern.
        const lineContext = `(Logische Zeile ${index + 1})`;
        
        if (line.trim() === '') return;

        // Prüfe die Property-Syntax
        const parts = line.split(':');
        if (parts.length < 2) {
            errors.push(`${lineContext}: Ungültige Syntax (kein Doppelpunkt) in "${line.substring(0, 50)}..."`);
            return;
        }

        // Extrahiere den Property-Namen (vor dem ersten ; oder :)
        const propertyPart = parts[0];
        const propertyName = propertyPart.split(';')[0].toUpperCase().trim();

        // Prüfe ob die Property erlaubt ist
        // 1. Ist es in der validProperties Liste?
        // 2. Fängt es mit X- an? (Extension Properties)
        // 3. Ist es eine IANA Property? (Ignorieren wir hier mal, X- und Standard sollte 99% decken)
        if (!validProperties.includes(propertyName) && !propertyName.startsWith('X-')) {
            warnings.push(`${lineContext}: Unbekannte Property "${propertyName}"`);
        }

        // Spezielle Validierung
        switch (propertyName) {
            case 'DTSTART':
            case 'DTEND':
                if (!isValidICSDate(line)) {
                    // Nur Warnung statt Fehler, da Date-Regex oben sehr strikt ist und komplexe TZIDs scheitern könnten
                    warnings.push(`${lineContext}: Möglicherweise ungültiges Datumsformat in "${propertyName}"`);
                }
                break;
            case 'TRIGGER':
                // Trigger kann komplex sein, wir prüfen nur grob
                const triggerValue = parts.slice(1).join(':');
                if (!triggerValue.match(/^-?P/)) { // Muss mit P (Duration) oder Datum starten, meistens Duration
                     // Sehr lockere Prüfung, da RELATED=START/END parameter möglich sind
                }
                break;
            case 'ACTION':
                const actionValue = parts[1].trim();
                // RFC 5545 Actions
                if (!['DISPLAY', 'AUDIO', 'EMAIL', 'PROCEDURE'].includes(actionValue)) {
                    warnings.push(`${lineContext}: Ungültiger ACTION-Wert "${actionValue}"`);
                }
                break;
        }
    });
    
    return { errors, warnings };
}

function displayValidationResults(errors, warnings) {
    const resultsDiv = document.getElementById('validationResults');
    let html = '';
    
    if (errors.length > 0) {
        html += '<h3>Fehler:</h3><ul class="text-danger">';
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += '</ul>';
    }
    
    if (warnings.length > 0) {
        html += '<h3>Warnungen:</h3><ul class="text-warning">';
        warnings.forEach(warning => {
            html += `<li>${warning}</li>`;
        });
        html += '</ul>';
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        html = '<div class="alert alert-success">Die ICS-Datei ist valide.</div>';
    }
    
    resultsDiv.innerHTML = html;
}

function displayFileContent(content) {
    const pre = document.getElementById('fileContent');
    const maxDisplayLength = 100000; // Zeichen-Limit für Performance
    
    if (content.length > maxDisplayLength) {
        showWarning(`Die Datei ist sehr groß (${content.length} Zeichen). Es werden nur die ersten ${maxDisplayLength} Zeichen angezeigt.`);
        content = content.substring(0, maxDisplayLength) + '\n[...]';
    }
    
    // Escape HTML um XSS zu verhindern
    const escapedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Syntax-Highlighting für bessere Lesbarkeit
    const highlightedContent = escapedContent
        .replace(/(BEGIN:|END:)([^\r\n]+)/g, '<span class="text-primary">$1$2</span>')
        .replace(/([A-Z-]+):/g, '<span class="text-success">$1:</span>');
    
    pre.innerHTML = highlightedContent;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', `ICS-Dateiinhalt mit ${content.length} Zeichen`);
}

function showWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'alert alert-warning alert-dismissible fade show mt-2';
    warningDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Schließen">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    document.getElementById('fileContent').parentNode.insertBefore(warningDiv, document.getElementById('fileContent'));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateICSFile,
        isValidICSDate,
        displayValidationResults,
        displayFileContent
    };
} 