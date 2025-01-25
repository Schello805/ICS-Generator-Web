// ICS Generator Module

import { formatDate, formatDateTime, generateUID, escapeText, generateDTStamp } from './icsFormatter.js';

// Funktion zum Anzeigen von Fehlermeldungen
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>Fehler:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    `;
    document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);

    // Automatisch nach 5 Sekunden ausblenden
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Funktion zum Anzeigen von Erfolgsmeldungen
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>Erfolg:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    `;
    document.querySelector('#eventsContainer').insertAdjacentElement('beforebegin', alertDiv);

    // Automatisch nach 3 Sekunden ausblenden
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

// Funktion zum Erstellen der ICS-Datei
export const createICSCalendar = (events) => {
    try {
        const eventList = Array.from(events);
        let hasValidEvents = false;
        let icsContent = '';
        
        // Prüfe ob mindestens ein Event vorhanden ist
        if (eventList.length === 0) {
            showError('Bitte fügen Sie mindestens einen Termin hinzu.');
            throw new Error('Keine Events vorhanden');
        }

        // Validiere zuerst alle Events
        for (const event of eventList) {
            const summary = event.querySelector('input[id^="summary"]')?.value;
            const startDate = event.querySelector('.startDate')?.value;
            
            if (!summary || !startDate) {
                showError('Bitte füllen Sie mindestens Titel und Startdatum für alle Termine aus.');
                throw new Error('Unvollständige Event-Daten');
            }
        }

        // RFC 5545 konforme Header
        icsContent = 'BEGIN:VCALENDAR\r\n';
        icsContent += 'VERSION:2.0\r\n';
        icsContent += 'PRODID:-//ICS Generator//NONSGML ICS Generator//DE\r\n';
        // Entferne optionale Properties, die Probleme verursachen
        // icsContent += 'CALSCALE:GREGORIAN\r\n';
        // icsContent += 'METHOD:PUBLISH\r\n';

        // Verarbeite Events nur wenn die Validierung erfolgreich war
        eventList.forEach(event => {
            try {
                const eventData = {
                    summary: event.querySelector('input[id^="summary"]')?.value || '',
                    description: event.querySelector('textarea[id^="description"]')?.value || '',
                    location: event.querySelector('input[id^="location"]')?.value || '',
                    startDate: event.querySelector('.startDate')?.value || '',
                    endDate: event.querySelector('.endDate')?.value || '',
                    startTime: event.querySelector('.startTime')?.value || '00:00',
                    endTime: event.querySelector('.endTime')?.value || '23:59',
                    allDay: event.querySelector('.allDay')?.checked || false,
                    repeatType: event.querySelector('.repeatType')?.value || 'none',
                    repeatInterval: event.querySelector('.repeatInterval')?.value || '1',
                    repeatEnd: event.querySelector('.repeatEnd')?.value || 'never',
                    repeatCount: event.querySelector('.repeatCount')?.value || '',
                    repeatUntil: event.querySelector('.repeatUntil')?.value || '',
                    customRule: event.querySelector('.customRule')?.value || '',
                    reminderTime: event.querySelector('.reminderTime')?.value || '0'
                };

                icsContent += 'BEGIN:VEVENT\r\n';
                icsContent += `UID:${generateUID()}\r\n`;
                icsContent += `DTSTAMP:${generateDTStamp()}\r\n`;
                icsContent += `SUMMARY:${escapeText(eventData.summary)}\r\n`;

                if (eventData.allDay) {
                    icsContent += `DTSTART;VALUE=DATE:${formatDate(eventData.startDate)}\r\n`;
                    const endDate = new Date(eventData.endDate);
                    endDate.setDate(endDate.getDate() + 1);
                    icsContent += `DTEND;VALUE=DATE:${formatDate(endDate.toISOString().split('T')[0])}\r\n`;
                } else {
                    icsContent += `DTSTART:${formatDateTime(eventData.startDate, eventData.startTime)}\r\n`;
                    icsContent += `DTEND:${formatDateTime(eventData.endDate, eventData.endTime)}\r\n`;
                }

                if (eventData.description) {
                    icsContent += `DESCRIPTION:${escapeText(eventData.description)}\r\n`;
                }

                if (eventData.location) {
                    icsContent += `LOCATION:${escapeText(eventData.location)}\r\n`;
                }

                if (eventData.repeatType !== 'none') {
                    if (eventData.repeatType === 'custom' && eventData.customRule) {
                        const rulePattern = /^FREQ=[A-Z]+;.*$/;
                        if (!rulePattern.test(eventData.customRule)) {
                            throw new Error('Ungültige RRULE');
                        }
                        icsContent += `RRULE:${eventData.customRule}\r\n`;
                    } else {
                        let rrule = `RRULE:FREQ=${eventData.repeatType.toUpperCase()};INTERVAL=${eventData.repeatInterval}`;
                        
                        if (eventData.repeatEnd === 'after' && eventData.repeatCount) {
                            rrule += `;COUNT=${eventData.repeatCount}`;
                        } else if (eventData.repeatEnd === 'until' && eventData.repeatUntil) {
                            if (eventData.allDay) {
                                rrule += `;UNTIL=${formatDate(eventData.repeatUntil)}`;
                            } else {
                                rrule += `;UNTIL=${formatDateTime(eventData.repeatUntil, '23:59')}`;
                            }
                        }
                        
                        icsContent += `${rrule}\r\n`;
                    }
                }

                if (eventData.reminderTime && eventData.reminderTime !== '0') {
                    icsContent += 'BEGIN:VALARM\r\n';
                    icsContent += 'ACTION:DISPLAY\r\n';
                    icsContent += `DESCRIPTION:${escapeText(eventData.summary)}\r\n`;
                    // TRIGGER muss ein Duration-Wert sein, z.B. -PT15M für 15 Minuten vorher
                    icsContent += `TRIGGER:-PT${eventData.reminderTime}M\r\n`;
                    icsContent += 'END:VALARM\r\n';
                }

                icsContent += 'END:VEVENT\r\n';
                hasValidEvents = true;

            } catch (error) {
                console.error('Fehler bei der Verarbeitung eines Events:', error);
                showError(`Fehler bei der Verarbeitung eines Events: ${error.message}`);
                throw error;
            }
        });

        // Nur fortfahren wenn mindestens ein gültiges Event verarbeitet wurde
        if (!hasValidEvents) {
            throw new Error('Keine gültigen Events zum Exportieren');
        }

        icsContent += 'END:VCALENDAR\r\n';
        
        // Erstelle und lade die ICS-Datei herunter
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'calendar.ics';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        showSuccess('ICS-Datei wurde erfolgreich erstellt');
        return icsContent;

    } catch (error) {
        console.error('Fehler bei der ICS-Generierung:', error);
        showError('Fehler bei der ICS-Generierung: ' + error.message);
        throw error;
    }
};

export const generateICSCalendar = () => {
    try {
        const events = document.querySelectorAll('.eventForm');
        if (!events.length) {
            showError('Keine Termine gefunden. Bitte fügen Sie mindestens einen Termin hinzu.');
            return;
        }

        const icsContent = createICSCalendar(events);

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'calendar.ics';
        link.click();

        showSuccess('Termine wurden erfolgreich in die ICS-Datei exportiert.');
    } catch (error) {
        console.error('Fehler beim Erstellen der ICS-Datei:', error);
        showError('Fehler beim Erstellen der ICS-Datei. Bitte überprüfen Sie Ihre Eingaben.');
    }
};
