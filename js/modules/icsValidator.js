/**
 * ICS Validator Module
 * Version: 2.8.3
 * Last Updated: 2026-01-03
 * 
 * Der Validator überprüft ICS-Dateien auf Konformität mit dem RFC 5545 Standard.
 * Er unterstützt nun auch "Unfolding" (mehrzeilige Properties) und X-Properties.
 */

export function initializeValidator() {
    console.log('Initialisiere Validator...');

    const fileInput = document.getElementById('icsFileInput');
    const validateButton = document.getElementById('validateButton');
    const resultDiv = document.getElementById('validationResult');
    const fileContentPre = document.getElementById('fileContent');
    const dropZone = document.getElementById('dropZone');
    
    // Auto-Reparatur Container (wird dynamisch erzeugt, falls nicht vorhanden)
    let fixContainer = document.getElementById('fixContainer');
    if (!fixContainer) {
        fixContainer = document.createElement('div');
        fixContainer.id = 'fixContainer';
        fixContainer.className = 'mt-3 d-none';
        fixContainer.innerHTML = `
            <div class="alert alert-info">
                <h5><i class="fas fa-tools"></i> Automatische Reparatur möglich</h5>
                <p>Der Validator hat Probleme gefunden, die automatisch behoben werden können.</p>
                <button id="autoFixBtn" class="btn btn-sm btn-success">
                    <i class="fas fa-magic"></i> Jetzt reparieren & herunterladen
                </button>
            </div>
        `;
        // Füge es nach dem ResultDiv ein
        if (resultDiv && resultDiv.parentNode) {
            resultDiv.parentNode.insertBefore(fixContainer, resultDiv.nextSibling);
        }
    }
    const autoFixBtn = document.getElementById('autoFixBtn');

    console.log('Gefundene Elemente:', { fileInput, validateButton, resultDiv, fileContentPre, dropZone });

    if (!fileInput || !validateButton || !resultDiv || !fileContentPre) {
        console.error('Erforderliche Elemente nicht gefunden');
        return;
    }

    // Auto-Fix Event Listener
    if (autoFixBtn) {
        autoFixBtn.addEventListener('click', () => {
            const currentContent = fileContentPre.textContent;
            const fixedContent = fixICSContent(currentContent);
            
            // Download anbieten
            const blob = new Blob([fixedContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fixed_calendar.ics';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Validierung neu starten mit gefixter Version (optional, aber nice UX)
            fileContentPre.textContent = fixedContent;
            const result = validateICS(fixedContent);
            // ... (Hier könnte man die Anzeige aktualisieren, aber Download reicht meist)
        });
    }

    // Drag & Drop Handler
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                fileInput.files = files; // Input updaten
                // Trigger change event manuell oder direkt validieren
                validateFile(files[0]);
            }
        }
    }

    validateButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        validateFile(file);
    });

    function validateFile(file) {
        console.log('Validierungs-Start für:', file ? file.name : 'Keine Datei');

        if (!file) {
            showValidationMessage('Bitte wählen Sie eine ICS-Datei aus.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('Datei gelesen, validiere...');
            const content = e.target.result;
            // Zeige den Dateiinhalt im Validator an
            fileContentPre.textContent = content;
            
            // Schritt-für-Schritt-Validierung mit Normbezug anzeigen
            const rawLines = content.split(/\r\n|\n|\r/);
            // Wir machen hier kein Unfolding für die Anzeige, damit der User die Originalzeilen sieht.
            
            let stepsHtml = '<h5>Prüfschritte nach <a href="https://datatracker.ietf.org/doc/html/rfc5545" target="_blank">RFC 5545</a>:</h5><ol>';
            
            // Für die "Simple Check" Liste in der UI zeigen wir einfach alle Zeilen an
            // Der eigentliche Validator (validateICS) macht dann das Unfolding
            rawLines.forEach((line, idx) => {
                if (line.trim() === '') return;
                const { stepDesc, normUrl } = getNormReference(line);
                // Einfache visuelle Prüfung für die Liste (nicht strikt)
                const isLookOkay = line.length > 0 && !line.startsWith(' '); 
                let stepResult = isLookOkay ? 'ℹ️' : '...'; // Neutraler Status für Rohzeilen
                
                stepsHtml += `<li><code>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100)}${line.length > 100 ? '...' : ''}</code>`;
                if (stepDesc) {
                    stepsHtml += ` <small><a href="${normUrl}" target="_blank">${stepDesc}</a></small>`;
                }
                stepsHtml += '</li>';
            });
            stepsHtml += '</ol>';
            resultDiv.innerHTML = stepsHtml;

            // Normale Validierungsergebnisse anzeigen
            const result = validateICS(content);
            
            // Auto-Fix Check
            const fixContainer = document.getElementById('fixContainer');
            if (fixContainer) {
                const canFix = result.errors.some(e => 
                    e.includes('BEGIN:VCALENDAR') || 
                    e.includes('END:VCALENDAR') || 
                    e.includes('Ungültige Syntax') // Leere Zeilen etc
                );
                
                if (canFix && result.errors.length > 0) {
                    fixContainer.classList.remove('d-none');
                } else {
                    fixContainer.classList.add('d-none');
                }
            }

            if (result.errors.length === 0 && result.warnings.length === 0) {
                showValidationMessage('Die ICS-Datei ist gültig!', 'success');
            } else {
                let message = '';
                if (result.errors.length > 0) {
                    message += '<h5>Fehler:</h5><ul>';
                    result.errors.forEach(error => {
                        message += `<li>${error}</li>`;
                    });
                    message += '</ul>';
                }
                if (result.warnings.length > 0) {
                    message += '<h5>Warnungen:</h5><ul>';
                    result.warnings.forEach(warning => {
                        message += `<li>${warning}</li>`;
                    });
                    message += '</ul>';
                }
                showValidationMessage(message, result.errors.length > 0 ? 'danger' : 'warning');
            }
        };
        reader.readAsText(file);
    }

    console.log('Validator initialisiert');
}

function fixICSContent(content) {
    let lines = content.split(/\r\n|\n|\r/);
    
    // 1. Leere Zeilen entfernen
    lines = lines.filter(l => l.trim() !== '');
    
    // 2. BEGIN:VCALENDAR prüfen
    const hasBegin = lines.some(l => l.trim().toUpperCase() === 'BEGIN:VCALENDAR');
    if (!hasBegin) {
        // Versuche es ganz oben einzufügen
        lines.unshift('BEGIN:VCALENDAR');
    }
    
    // 3. END:VCALENDAR prüfen
    const hasEnd = lines.some(l => l.trim().toUpperCase() === 'END:VCALENDAR');
    if (!hasEnd) {
        lines.push('END:VCALENDAR');
    }
    
    // 4. VERSION und PRODID Check (optional, aber gut für Standards)
    if (!lines.some(l => l.startsWith('VERSION:'))) {
        lines.splice(1, 0, 'VERSION:2.0');
    }
    if (!lines.some(l => l.startsWith('PRODID:'))) {
        lines.splice(1, 0, 'PRODID:-//ICS Generator//AutoFix//DE');
    }

    return lines.join('\r\n');
}

function showValidationMessage(message, type) {
    console.log('Zeige Validierungsnachricht:', { message, type });
    const resultDiv = document.getElementById('validationResult');
    resultDiv.className = `alert alert-${type} mt-3`;
    resultDiv.innerHTML = message;
}

function updateValidationStatus(section, status) {
    const statusElement = document.querySelector(`[data-bs-target="#${section}Collapse"] .validation-status`);
    if (statusElement) {
        statusElement.className = 'validation-status ' + status;
    }
}

function resetValidationStatus() {
    document.querySelectorAll('.validation-status').forEach(element => {
        element.className = 'validation-status';
    });
}

function showSectionMessage(section, message, type) {
    const messagesContainer = document.querySelector(`#${section}Collapse .validation-messages`);
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${type}`;
        messageDiv.innerHTML = message;
        messagesContainer.appendChild(messageDiv);
    }
}

function clearSectionMessages() {
    document.querySelectorAll('.validation-messages').forEach(container => {
        container.innerHTML = '';
    });
}

function isValidICSDate(dateString) {
    // Extrahiere den Wert nach dem ersten Doppelpunkt
    const parts = dateString.split(':');
    if (parts.length < 2) return false;
    const value = parts.slice(1).join(':'); 
    
    if (dateString.toUpperCase().includes('VALUE=DATE')) {
        return /^\d{8}$/.test(value.trim());
    }
    
    // YYYYMMDDTHHMMSSZ oder YYYYMMDDTHHMMSS
    return /^\d{8}T\d{6}(?:Z)?$/.test(value.trim());
}

function parseTriggerDurationMinutes(rawValue) {
    if (!rawValue) return null;
    const value = String(rawValue).trim();
    const m = value.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
    if (!m) return null;

    const sign = m[1] || '+';
    const weeks = parseInt(m[2] || '0', 10);
    const days = parseInt(m[3] || '0', 10);
    const hours = parseInt(m[4] || '0', 10);
    const minutes = parseInt(m[5] || '0', 10);
    const seconds = parseInt(m[6] || '0', 10);

    const totalMinutes = (weeks * 7 * 24 * 60) + (days * 24 * 60) + (hours * 60) + minutes + Math.floor(seconds / 60);
    if (totalMinutes <= 0) return null;
    if (sign !== '-') return null;
    return totalMinutes;
}
export function validateICS(icsContent) {
    // 1. Unfolding (Zeilenumbrüche entfernen)
    const rawLines = icsContent.split(/\r\n|\n|\r/);
    const lines = [];
    
    rawLines.forEach(line => {
        if (line.length === 0) return;
        
        if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
            lines[lines.length - 1] += line.substring(1);
        } else {
            lines.push(line);
        }
    });

    const errors = [];
    const warnings = [];
    const extendedWarnings = [];
    const specialWarnings = [];

    // Reset validation status and messages
    resetValidationStatus();
    clearSectionMessages();

    // Erweiterte Property Liste
    const validProperties = [
        'BEGIN', 'END', 'VERSION', 'PRODID', 'CALSCALE', 'METHOD',
        'UID', 'DTSTAMP', 'DTSTART', 'DTEND', 'SUMMARY', 'DESCRIPTION', 
        'LOCATION', 'RRULE', 'ACTION', 'TRIGGER', 'VALARM', 'DURATION',
        'ATTACH', 'ATTENDEE', 'CATEGORIES', 'CLASS', 'COMMENT', 'CONTACT',
        'CREATED', 'EXDATE', 'GEO', 'LAST-MODIFIED', 'ORGANIZER', 'PRIORITY',
        'RDATE', 'RECURRENCE-ID', 'RELATED-TO', 'RESOURCES', 'SEQUENCE',
        'STATUS', 'TRANSP', 'URL', 'TZID', 'TZNAME', 'TZOFFSETFROM', 
        'TZOFFSETTO', 'TZURL'
    ];

    // Check Start/Ende
    const firstValidLine = rawLines.find(l => l.trim().length > 0);
    if (!firstValidLine || !firstValidLine.toUpperCase().includes('BEGIN:VCALENDAR')) {
        const msg = 'Datei muss mit "BEGIN:VCALENDAR" beginnen.';
        errors.push(msg);
        showSectionMessage('coreProperties', msg, 'error');
    }
    
    if (!rawLines.some(l => l.trim().toUpperCase() === 'END:VCALENDAR')) {
        const msg = 'Datei muss mit "END:VCALENDAR" enden.';
        errors.push(msg);
        showSectionMessage('coreProperties', msg, 'error');
    }
 
    let inAlarm = false;
    lines.forEach((line, index) => {
        const lineContext = `(Zeile ${index + 1})`; // Logische Zeile
        if (line.trim() === '') return;

        const parts = line.split(':');
        if (parts.length < 2) {
             // Ignoriere Zeilen, die vielleicht durch kaputtes Copy-Paste entstanden sind,
             // aber eigentlich valide wären, wenn wir nicht zu strikt sind.
             // Aber Standard sagt: PropertyName:Value
             errors.push(`${lineContext}: Ungültige Syntax in "${line.substring(0, 30)}..."`);
             return;
        }

        const propertyPart = parts[0];
        const propertyName = propertyPart.split(';')[0].toUpperCase().trim();

        if (propertyName === 'BEGIN' && parts.slice(1).join(':').trim().toUpperCase() === 'VALARM') {
            inAlarm = true;
        }
        if (propertyName === 'END' && parts.slice(1).join(':').trim().toUpperCase() === 'VALARM') {
            inAlarm = false;
        }

        // Validierung
        const isKnown = validProperties.includes(propertyName);
        const isXProp = propertyName.startsWith('X-');
        
        if (!isKnown && !isXProp) {
            const msg = `${lineContext}: Unbekannte Property "${propertyName}"`;
            warnings.push(msg);
            extendedWarnings.push(msg);
        }
        
        // Spezielle Checks
        if (['DTSTART', 'DTEND'].includes(propertyName)) {
             if (!isValidICSDate(line)) {
                 warnings.push(`${lineContext}: Mögliches Datumsformat-Problem in "${propertyName}"`);
             }
        }

        if (inAlarm && propertyName === 'TRIGGER') {
            const rawValue = parts.slice(1).join(':').trim();
            const minutes = parseTriggerDurationMinutes(rawValue);
            if (minutes !== null) {
                const knownReminderMinutes = new Set([0, 10, 30, 60, 120, 1440, 10080]);
                if (!knownReminderMinutes.has(minutes)) {
                    const msg = `${lineContext}: TRIGGER entspricht ${minutes} Minuten vorher. Dafür gibt es keine vordefinierte Erinnerungs-Option. Beim Import kann eine Alternative ausgewählt werden.`;
                    warnings.push(msg);
                    specialWarnings.push(msg);
                }
            }
        }
    });

    // Zusammenfassende Status-Updates für die UI-Boxen (vereinfacht)
    if (errors.length === 0) {
        showSectionMessage('coreProperties', 'Struktur OK', 'success');
        updateValidationStatus('coreProperties', 'success');
    } else {
        updateValidationStatus('coreProperties', 'error');
    }

    if (errors.length === 0) {
        if (extendedWarnings.length === 0) {
            showSectionMessage('extendedProperties', 'Keine Auffälligkeiten', 'success');
            updateValidationStatus('extendedProperties', 'success');
        } else {
            extendedWarnings.forEach(w => showSectionMessage('extendedProperties', w, 'warning'));
            updateValidationStatus('extendedProperties', 'warning');
        }

        if (specialWarnings.length === 0) {
            showSectionMessage('specialValidation', 'Keine Auffälligkeiten', 'success');
            updateValidationStatus('specialValidation', 'success');
        } else {
            specialWarnings.forEach(w => showSectionMessage('specialValidation', w, 'warning'));
            updateValidationStatus('specialValidation', 'warning');
        }
    } else {
        updateValidationStatus('extendedProperties', 'error');
        updateValidationStatus('specialValidation', 'error');
    }
    
    if (warnings.length === 0) {
        showSectionMessage('additionalChecks', 'Keine Warnungen', 'success');
        updateValidationStatus('additionalChecks', 'success');
    } else {
         warnings.forEach(w => showSectionMessage('additionalChecks', w, 'warning'));
         updateValidationStatus('additionalChecks', 'warning');
    }

    return { errors, warnings };
}

// --- Hilfsfunktion für Norm-Referenz ---
function getNormReference(line) {
    // Mapping: Property -> Abschnitt im RFC
    const rfcBase = 'https://datatracker.ietf.org/doc/html/rfc5545';
    const property = line.split(':')[0].split(';')[0].toUpperCase();
    switch (property) {
        case 'BEGIN':
        case 'END':
            return { stepDesc: 'Abschnitt 3.6', normUrl: rfcBase + '#section-3.6' };
        case 'VERSION':
            return { stepDesc: 'Abschnitt 3.7.4', normUrl: rfcBase + '#section-3.7.4' };
        case 'PRODID':
            return { stepDesc: 'Abschnitt 3.7.3', normUrl: rfcBase + '#section-3.7.3' };
        case 'UID':
            return { stepDesc: 'Abschnitt 3.8.4.7', normUrl: rfcBase + '#section-3.8.4.7' };
        case 'DTSTAMP':
            return { stepDesc: 'Abschnitt 3.8.7.2', normUrl: rfcBase + '#section-3.8.7.2' };
        case 'DTSTART':
            return { stepDesc: 'Abschnitt 3.8.2.4', normUrl: rfcBase + '#section-3.8.2.4' };
        case 'DTEND':
            return { stepDesc: 'Abschnitt 3.8.2.2', normUrl: rfcBase + '#section-3.8.2.2' };
        case 'SUMMARY':
            return { stepDesc: 'Abschnitt 3.8.1.12', normUrl: rfcBase + '#section-3.8.1.12' };
        case 'DESCRIPTION':
            return { stepDesc: 'Abschnitt 3.8.1.5', normUrl: rfcBase + '#section-3.8.1.5' };
        case 'LOCATION':
            return { stepDesc: 'Abschnitt 3.8.1.7', normUrl: rfcBase + '#section-3.8.1.7' };
        case 'URL':
            return { stepDesc: 'Abschnitt 3.8.4.6', normUrl: rfcBase + '#section-3.8.4.6' };
        case 'RRULE':
            return { stepDesc: 'Abschnitt 3.8.5.3', normUrl: rfcBase + '#section-3.8.5.3' };
        case 'ACTION':
            return { stepDesc: 'Abschnitt 3.8.6.1', normUrl: rfcBase + '#section-3.8.6.1' };
        case 'TRIGGER':
            return { stepDesc: 'Abschnitt 3.8.6.3', normUrl: rfcBase + '#section-3.8.6.3' };
        default:
            return { stepDesc: '', normUrl: '' };
    }
}
