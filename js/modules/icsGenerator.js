// ICS Generator Module

import { formatDate, formatDateTime, generateUID, escapeText, generateDTStamp } from './icsFormatter.js';

/**
 * Funktion zum Anzeigen von Fehlermeldungen
 */
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

/**
 * Funktion zum Anzeigen von Erfolgsmeldungen
 */
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

/**
 * Generiert die RRULE gemäß RFC 5545
 */
const generateRRule = (repeatType, repeatInterval, repeatUntil, weekdays, monthType, monthDay, weekNumber, weekDay) => {
    if (!repeatType || repeatType === 'none') return '';

    try {
        let rrule = 'RRULE:';
        const freq = repeatType.toUpperCase();
        
        // Validiere FREQ
        if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) {
            throw new Error('Invalid frequency');
        }
        
        rrule += `FREQ=${freq}`;

        // Füge Intervall hinzu
        if (repeatInterval && repeatInterval > 1) {
            rrule += `;INTERVAL=${repeatInterval}`;
        }

        // Füge Enddatum hinzu
        if (repeatUntil) {
            rrule += `;UNTIL=${formatDate(repeatUntil)}`;
        }

        // Füge Wochentage für wöchentliche Wiederholung hinzu
        if (freq === 'WEEKLY' && weekdays && weekdays.length > 0) {
            const days = weekdays.map(day => day.slice(0, 2).toUpperCase()).join(',');
            if (days) {
                rrule += `;BYDAY=${days}`;
            }
        }

        // Füge monatliche Regeln hinzu
        if (freq === 'MONTHLY') {
            if (monthType === 'BYMONTHDAY' && monthDay) {
                rrule += `;BYMONTHDAY=${monthDay}`;
            } else if (monthType === 'BYDAY' && weekNumber && weekDay) {
                const dayAbbr = weekDay.slice(0, 2).toUpperCase();
                rrule += `;BYDAY=${weekNumber}${dayAbbr}`;
            }
        }

        return rrule;
    } catch (error) {
        console.error('Error generating RRULE:', error);
        return '';
    }
};

/**
 * Funktion zum Erstellen der ICS-Datei
 */
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
            const summary = event.querySelector('input[name="summary"]')?.value?.trim();
            const startDate = event.querySelector('.startDate')?.value;
            const endDate = event.querySelector('.endDate')?.value;
            const startTime = event.querySelector('.startTime')?.value;
            const endTime = event.querySelector('.endTime')?.value;
            const allDay = event.querySelector('.allDay')?.checked;
            
            if (!summary) {
                showError('Bitte geben Sie einen Titel für jeden Termin ein.');
                throw new Error('Titel fehlt');
            }
            
            if (!startDate) {
                showError('Bitte geben Sie ein Startdatum für jeden Termin ein.');
                throw new Error('Startdatum fehlt');
            }

            if (!endDate) {
                showError('Bitte geben Sie ein Enddatum für jeden Termin ein.');
                throw new Error('Enddatum fehlt');
            }

            if (!allDay && (!startTime || !endTime)) {
                showError('Bitte geben Sie Start- und Endzeit für nicht-ganztägige Termine ein.');
                throw new Error('Zeitangaben fehlen');
            }

            // Prüfe ob Enddatum nach Startdatum liegt
            const start = new Date(startDate + (allDay ? '' : 'T' + startTime));
            const end = new Date(endDate + (allDay ? '' : 'T' + endTime));
            if (end < start) {
                showError('Das Enddatum muss nach dem Startdatum liegen.');
                throw new Error('Ungültiger Zeitraum');
            }
        }

        // RFC 5545 konforme Header
        icsContent = 'BEGIN:VCALENDAR\r\n';
        icsContent += 'VERSION:2.0\r\n';
        icsContent += 'PRODID:-//ICS Generator//NONSGML ICS Generator//DE\r\n';

        // Verarbeite Events nur wenn die Validierung erfolgreich war
        eventList.forEach(event => {
            try {
                const eventData = {
                    summary: event.querySelector('input[name="summary"]')?.value?.trim() || '',
                    description: event.querySelector('textarea[name="description"]')?.value?.trim() || '',
                    location: event.querySelector('input[name="location"]')?.value?.trim() || '',
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
                    reminderTime: event.querySelector('.reminderTime')?.value || '0',
                    weekdays: event.querySelector('.weekdays')?.value || '',
                    monthType: event.querySelector('.monthType')?.value || '',
                    monthDay: event.querySelector('.monthDay')?.value || '',
                    weekNumber: event.querySelector('.weekNumber')?.value || '',
                    weekDay: event.querySelector('.weekDay')?.value || ''
                };

                icsContent += 'BEGIN:VEVENT\r\n';
                icsContent += `UID:${generateUID()}\r\n`;
                icsContent += `DTSTAMP:${generateDTStamp()}\r\n`;
                icsContent += `SUMMARY:${escapeText(eventData.summary)}\r\n`;

                if (eventData.allDay) {
                    // Für ganztägige Events: VALUE=DATE ohne Zeitangabe
                    icsContent += `DTSTART;VALUE=DATE:${formatDate(eventData.startDate)}\r\n`;
                    // Bei ganztägigen Events muss das Enddatum auf den nächsten Tag gesetzt werden
                    const endDate = new Date(eventData.endDate);
                    endDate.setDate(endDate.getDate() + 1);
                    icsContent += `DTEND;VALUE=DATE:${formatDate(endDate.toISOString().split('T')[0])}\r\n`;
                } else {
                    // Für Termine mit Uhrzeit: Mit Zeitzonenoffset
                    icsContent += `DTSTART:${formatDateTime(eventData.startDate, eventData.startTime)}\r\n`;
                    icsContent += `DTEND:${formatDateTime(eventData.endDate, eventData.endTime)}\r\n`;
                }

                if (eventData.description) {
                    icsContent += `DESCRIPTION:${escapeText(eventData.description)}\r\n`;
                }

                if (eventData.location) {
                    icsContent += `LOCATION:${escapeText(eventData.location)}\r\n`;
                }

                // Wiederholungsregeln
                const rrule = generateRRule(eventData.repeatType, eventData.repeatInterval, eventData.repeatUntil, 
                                             eventData.weekdays, eventData.monthType, eventData.monthDay, eventData.weekNumber, eventData.weekDay);
                if (rrule) icsContent += `${rrule}\r\n`;

                // Erinnerungen
                if (eventData.reminderTime && eventData.reminderTime !== '0') {
                    icsContent += 'BEGIN:VALARM\r\n';
                    icsContent += 'ACTION:DISPLAY\r\n';
                    icsContent += `DESCRIPTION:Erinnerung: ${escapeText(eventData.summary)}\r\n`;
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
        const filename = eventList.length === 1 ? 
            `${eventList[0].querySelector('input[name="summary"]').value}.ics` : 
            'calendar.ics';
        link.download = filename;
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

/**
 * Funktion zum Erstellen der ICS-Datei
 */
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
