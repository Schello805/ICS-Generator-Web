// ICS Generator Module

import { formatDate, formatDateTime, generateUID, escapeText, generateDTStamp } from './icsFormatter.js';

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

function processAttachment(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];
            resolve({
                filename: file.name,
                mime: file.type || 'application/octet-stream',
                data: base64Data
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Funktion zum Erstellen der ICS-Datei
 */
export async function createICSCalendar(events) {
    try {
        const eventList = Array.from(events);
        let hasValidEvents = false;
        let icsContent = '';
        
        // Prüfe ob mindestens ein Event vorhanden ist
        if (eventList.length === 0) {
            throw new Error('Keine Events vorhanden');
        }

        // Validiere zuerst alle Events
        for (const event of eventList) {
            const summary = event.querySelector('.summary')?.value?.trim();
            const startDate = event.querySelector('.startDate')?.value;
            const endDate = event.querySelector('.endDate')?.value;
            const startTime = event.querySelector('.startTime')?.value;
            const endTime = event.querySelector('.endTime')?.value;
            const allDay = event.querySelector('.allDay')?.checked;
            
            if (!summary) {
                throw new Error('Titel fehlt');
            }
            
            if (!startDate) {
                throw new Error('Startdatum fehlt');
            }

            if (!endDate) {
                throw new Error('Enddatum fehlt');
            }

            if (!allDay && (!startTime || !endTime)) {
                throw new Error('Zeitangaben fehlen');
            }

            // Prüfe ob Enddatum nach Startdatum liegt
            const start = new Date(startDate + (allDay ? '' : 'T' + startTime));
            const end = new Date(endDate + (allDay ? '' : 'T' + endTime));
            if (end < start) {
                throw new Error('Das Enddatum muss nach dem Startdatum liegen');
            }
        }

        // RFC 5545 konforme Header
        icsContent = 'BEGIN:VCALENDAR\r\n';
        icsContent += 'VERSION:2.0\r\n';
        icsContent += 'PRODID:-//ICS Generator//NONSGML ICS Generator//DE\r\n';

        // Verarbeite Events nur wenn die Validierung erfolgreich war
        for (const event of eventList) {
            try {
                const eventData = {
                    summary: event.querySelector('.summary')?.value?.trim() || '',
                    description: event.querySelector('.description')?.value?.trim() || '',
                    location: event.querySelector('.location')?.value?.trim() || '',
                    startDate: event.querySelector('.startDate')?.value || '',
                    endDate: event.querySelector('.endDate')?.value || '',
                    startTime: event.querySelector('.startTime')?.value || '00:00',
                    endTime: event.querySelector('.endTime')?.value || '23:59',
                    allDay: event.querySelector('.allDay')?.checked || false,
                    repeatType: event.querySelector('.repeatType')?.value || 'none',
                    repeatInterval: event.querySelector('.repeatInterval')?.value || '1',
                    repeatUntil: event.querySelector('.repeatUntil')?.value || '',
                    reminderTime: event.querySelector('.reminderTime')?.value || '0'
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

                // URL hinzufügen, wenn vorhanden
                const url = event.querySelector('.url')?.value;
                if (url) icsContent += `URL:${url}\r\n`;

                // Verarbeite den Anhang
                const attachmentFile = event.querySelector('.attachment').files[0];
                const attachment = await processAttachment(attachmentFile);

                // Füge den Anhang hinzu, wenn vorhanden
                if (attachment) {
                    icsContent += `ATTACH;FMTTYPE=${attachment.mime};ENCODING=BASE64;VALUE=BINARY;X-FILENAME=${attachment.filename}:${attachment.data}\r\n`;
                }

                // Füge Wiederholungsregel hinzu
                if (eventData.repeatType !== 'none') {
                    const weekdays = Array.from(event.querySelectorAll('.weekday:checked')).map(cb => cb.value);
                    const monthlyType = event.querySelector('.monthlyType')?.value;
                    const repeatEndType = event.querySelector('.repeatEndType:checked')?.value;
                    let repeatUntil = '';
                    
                    if (repeatEndType === 'until') {
                        repeatUntil = event.querySelector('.repeatUntil')?.value;
                    }

                    const rrule = generateRRule(
                        eventData.repeatType,
                        eventData.repeatInterval,
                        repeatUntil,
                        weekdays,
                        monthlyType,
                        '', // monthDay wird automatisch aus dem Startdatum ermittelt
                        '', // weekNumber wird automatisch aus dem Startdatum ermittelt
                        ''  // weekDay wird automatisch aus dem Startdatum ermittelt
                    );
                    if (rrule) {
                        icsContent += rrule + '\r\n';
                    }
                }

                // Füge Erinnerung hinzu
                if (eventData.reminderTime && eventData.reminderTime !== '0') {
                    icsContent += 'BEGIN:VALARM\r\n';
                    icsContent += 'ACTION:DISPLAY\r\n';
                    icsContent += `TRIGGER:-PT${eventData.reminderTime}M\r\n`;
                    icsContent += 'DESCRIPTION:Reminder\r\n';
                    icsContent += 'END:VALARM\r\n';
                }

                icsContent += 'END:VEVENT\r\n';
                hasValidEvents = true;
            } catch (error) {
                console.error('Error processing event:', error);
            }
        }

        icsContent += 'END:VCALENDAR\r\n';

        if (!hasValidEvents) {
            throw new Error('Keine gültigen Events gefunden');
        }

        // Erstelle und lade die ICS-Datei
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'calendar.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('Error creating ICS calendar:', error);
        throw error;
    }
};
