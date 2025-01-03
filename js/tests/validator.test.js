const {
    validateICSFile,
    isValidICSDate,
    displayValidationResults,
    displayFileContent
} = require('../validator.js');

describe('ICS Validator Tests', () => {
    beforeEach(() => {
        // DOM Setup
        document.body.innerHTML = `
            <div id="validationResults"></div>
            <div id="fileContent"></div>
        `;
    });

    describe('ICS Datei Validierung', () => {
        test('Erkennt gültige ICS Datei', () => {
            const validICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//DE
BEGIN:VEVENT
UID:test-123
DTSTAMP:20240101T120000Z
DTSTART:20240101T140000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;
            
            const result = validateICSFile(validICS);
            expect(result.errors).toHaveLength(0);
        });

        test('Erkennt fehlende Pflichtfelder', () => {
            const invalidICS = `BEGIN:VCALENDAR
END:VCALENDAR`;
            
            const result = validateICSFile(invalidICS);
            expect(result.errors).toContain('Fehlende VERSION Property');
        });
    });

    describe('Datumsvalidierung', () => {
        test('Validiert ganztägige Events', () => {
            expect(isValidICSDate('VALUE=DATE:20240101')).toBe(true);
            expect(isValidICSDate('VALUE=DATE:invalid')).toBe(false);
        });

        test('Validiert Datum-Zeit-Werte', () => {
            expect(isValidICSDate('20240101T120000Z')).toBe(true);
            expect(isValidICSDate('20240101T120000')).toBe(true);
            expect(isValidICSDate('invalid')).toBe(false);
        });
    });

    describe('UI Anzeige', () => {
        test('Zeigt Validierungsergebnisse an', () => {
            const results = [];
            const errors = ['Fehler 1'];
            const warnings = ['Warnung 1'];
            
            displayValidationResults(results, errors, warnings);
            
            const container = document.getElementById('validationResults');
            expect(container.innerHTML).toContain('alert-danger');
            expect(container.innerHTML).toContain('Fehler 1');
            expect(container.innerHTML).toContain('Warnung 1');
        });

        test('Zeigt Erfolgsmeldung bei keinen Fehlern', () => {
            displayValidationResults([], [], []);
            
            const container = document.getElementById('validationResults');
            expect(container.innerHTML).toContain('alert-success');
        });

        test('Zeigt Dateiinhalt mit Syntax-Highlighting', () => {
            const content = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
            displayFileContent(content);
            
            const container = document.getElementById('fileContent');
            expect(container.innerHTML).toContain('text-primary');
        });
    });
}); 