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
        validateICSFile(content);
        displayFileContent(content);
    };
    reader.onerror = function() {
        displayValidationResults(
            [], 
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

function validateICSFile(content) {
    try {
        const results = [];
        const errors = [];
        const warnings = [];

        // Grundlegende Validierung der Datei
        if (!content || typeof content !== 'string') {
            throw new Error('Ungültiger Dateiinhalt');
        }

        // Kodierung prüfen
        if (/[^\x00-\x7F]/g.test(content)) {
            warnings.push('Die Datei enthält nicht-ASCII Zeichen, die Probleme verursachen könnten');
        }

        // Zeilenenden normalisieren
        content = content.replace(/\r\n|\n|\r/g, '\r\n');

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
    } catch (error) {
        console.error('Validierungsfehler:', error);
        displayValidationResults(
            [], 
            [`Ein Fehler ist aufgetreten: ${error.message}`],
            []
        );
        return false;
    }
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
        html += `
            <div class="alert alert-success" role="status">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                <span>Die ICS-Datei ist valide!</span>
            </div>`;
    }

    if (errors.length > 0) {
        html += `
            <div class="alert alert-danger">
                <h6 class="alert-heading">
                    <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                    Fehler:
                </h6>
                <ul class="mb-0">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>`;
    }

    if (warnings.length > 0) {
        html += `
            <div class="alert alert-warning">
                <h6 class="alert-heading">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    Warnungen:
                </h6>
                <ul class="mb-0">
                    ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>`;
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