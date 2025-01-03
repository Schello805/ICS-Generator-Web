const {
    createICSCalendar,
    validateURL,
    generateUID,
    formatDateTime,
    escapeText,
    sanitizeInput,
    isValidURL,
    foldLine,
    generateEventBlock
} = require('../script.js');

describe('ICS Generator Tests', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="eventsContainer">
                <input type="text" id="summary1" value="Test Event">
                <input type="date" id="startDate1" value="2024-03-15">
                <input type="time" id="startTime1" value="14:30">
                <input type="date" id="endDate1" value="2024-03-15">
                <input type="time" id="endTime1" value="15:30">
                <input type="text" id="location1" value="Test Location">
                <textarea id="description1">Test Description</textarea>
                <input type="url" id="attachment1" value="">
                <input type="url" id="url1" value="">
                <input type="checkbox" id="allDay1">
                <select id="reminderTime1">
                    <option value="10">10 Minuten vorher</option>
                </select>
                <input type="checkbox" id="noReminder1">
            </div>
        `;
    });

    describe('Event Generierung', () => {
        test('Generiert gültiges Event-Block', () => {
            const eventBlock = generateEventBlock(
                'Test Event',
                '2024-03-15T14:30',
                '2024-03-15T15:30',
                'Test Location',
                'Test Description',
                '',
                '',
                false,
                1
            );
            
            expect(eventBlock).toContain('BEGIN:VEVENT');
            expect(eventBlock).toContain('SUMMARY:Test Event');
            expect(eventBlock).toContain('END:VEVENT');
        });
    });

    describe('Hilfsfunktionen', () => {
        test('Faltet lange Zeilen korrekt', () => {
            const longLine = 'A'.repeat(100);
            const folded = foldLine(longLine);
            expect(folded).toContain('\r\n ');
            expect(folded.split('\r\n ')[0].length).toBeLessThanOrEqual(75);
        });

        test('Escaped Text korrekt', () => {
            expect(escapeText('Test, mit; Sonderzeichen'))
                .toBe('Test\\, mit\\; Sonderzeichen');
        });

        test('Validiert URLs', () => {
            expect(isValidURL('https://example.com')).toBe(true);
            expect(isValidURL('not-a-url')).toBe(false);
        });
    });
}); 