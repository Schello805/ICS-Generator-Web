function validateICS(icsContent) {
    const lines = icsContent.split(/\r\n|\n|\r/);
    const errors = [];
    const warnings = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const validation = validateICSLine(line);
        
        if (validation === false) {
            errors.push(`Zeile ${lineNumber}: Ungültige Property-Syntax in "${line}"`);
        } else if (typeof validation === 'object' && validation.isValid && !validation.isKnown) {
            warnings.push(`Zeile ${lineNumber}: Unbekannte Property "${line.split(/[;:]/)[0]}"`);
        }
    });
    
    return { errors, warnings };
}

function validateICSLine(line) {
    // Ignoriere Google-spezifische Zeilen
    if (line.includes('hangouts.google.com') || 
        line.includes('~:~:~:~:~:~') ||
        line.includes('calendar/') ||
        /[a-zA-Z0-9]{20,}/.test(line)) {
        return true;
    }
    
    // Liste der Kern-Properties nach RFC 5545
    const coreProperties = [
        'BEGIN', 'END', 'SUMMARY', 'DTSTART', 'DTEND', 'DTSTAMP',
        'UID', 'VERSION', 'PRODID'
    ];
    
    // Liste der erweiterten Properties
    const extendedProperties = [
        'CREATED', 'DESCRIPTION', 'LAST-MODIFIED', 'LOCATION',
        'SEQUENCE', 'STATUS', 'RRULE', 'CATEGORIES', 'CLASS',
        'COMMENT', 'GEO', 'PRIORITY', 'RESOURCES', 'TRANSP',
        'URL', 'ATTACH', 'ATTENDEE', 'ORGANIZER', 'RELATED-TO',
        'EXDATE', 'RDATE', 'RECURRENCE-ID', 'VCALENDAR', 'VEVENT'
    ];
    
    // Prüfe ob die Zeile mit einer gültigen Property beginnt
    const property = line.split(/[;:]/, 1)[0].toUpperCase();
    
    // Wenn es eine Kern-Property ist, direkt true zurückgeben
    if (coreProperties.includes(property)) {
        return true;
    }
    
    // Wenn es eine erweiterte Property ist, als "bekannt" markieren
    if (extendedProperties.includes(property)) {
        return { isValid: true, isKnown: true };
    }
    
    // Unbekannte Property
    return false;
} 