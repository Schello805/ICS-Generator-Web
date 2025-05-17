// ICS Generator Module

import { formatDate, formatDateTime, generateUID, escapeText, generateDTStamp } from './icsFormatter.js';
import { validateICS } from './icsValidator.js';

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
            throw new Error('Es wurde kein Termin gefunden.');
        }
        
        // Validiere und sammle alle Events
        const usedUIDs = new Set();
        for (const event of eventList) {
            // Pflichtfelder prüfen
            const summary = event.querySelector('.summary')?.value?.trim();
            const startDate = event.querySelector('.startDate')?.value;
            const endDate = event.querySelector('.endDate')?.value;
            const allDay = event.querySelector('.allDay')?.checked;
            const startTime = event.querySelector('.startTime')?.value;
            const endTime = event.querySelector('.endTime')?.value;
            const location = event.querySelector('.location')?.value?.trim();
            const description = event.querySelector('.description')?.value?.trim();
            const url = event.querySelector('.url')?.value?.trim();
            const repeatType = event.querySelector('.repeatType')?.value;
            const repeatInterval = event.querySelector('.repeatInterval')?.value;
            const repeatUntil = event.querySelector('.repeatUntil')?.value;
            const reminderTime = event.querySelector('.reminderTime')?.value;
            
            // UID prüfen/erzeugen
            let uid = event.getAttribute('data-uid');
            if (!uid) {
                uid = generateUID();
                event.setAttribute('data-uid', uid);
            }
            if (usedUIDs.has(uid)) {
                throw new Error('Doppelter Termin erkannt! Bitte ändern Sie einen der Termine.');
            }
            usedUIDs.add(uid);
            
            // Pflichtfeld-Validierung
            if (!summary) {
                throw new Error('Bitte geben Sie einen Titel ein!');
            }
            
            if (!startDate) {
                throw new Error('Bitte wählen Sie ein Startdatum!');
            }
            
            if (!endDate) {
                throw new Error('Bitte wählen Sie ein Enddatum!');
            }
            
            if (!allDay && (!startTime || !endTime)) {
                throw new Error('Bitte wählen Sie Start- und Endzeit!');
            }
            
            // ICS-Event-Block aufbauen
            icsContent += 'BEGIN:VEVENT\r\n';
            icsContent += `UID:${uid}\r\n`;
            icsContent += `DTSTAMP:${generateDTStamp()}\r\n`;
            
            // Ganztägig: DTEND auf Folgetag setzen (RFC 5545)
            if (allDay) {
                icsContent += `DTSTART;VALUE=DATE:${startDate.replace(/-/g, '')}\r\n`;
                // Folgetag berechnen
                const start = new Date(startDate);
                const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                const yyyy = nextDay.getFullYear();
                const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
                const dd = String(nextDay.getDate()).padStart(2, '0');
                icsContent += `DTEND;VALUE=DATE:${yyyy}${mm}${dd}\r\n`;
            } else {
                icsContent += `DTSTART:${startDate.replace(/-/g, '')}T${startTime.replace(':', '')}00\r\n`;
                icsContent += `DTEND:${endDate.replace(/-/g, '')}T${endTime.replace(':', '')}00\r\n`;
            }
            
            icsContent += `SUMMARY:${escapeText(summary)}\r\n`;
            if (description) icsContent += `DESCRIPTION:${escapeText(description)}\r\n`;
            if (location) icsContent += `LOCATION:${escapeText(location)}\r\n`;
            if (url) {
                // Ergänze Protokoll, falls es fehlt
                let urlOut = url;
                if (!/^https?:\/\//i.test(urlOut)) {
                    urlOut = 'https://' + urlOut;
                }
                icsContent += `URL:${urlOut}\r\n`;
            }
            
            // Wiederholung
            if (repeatType && repeatType !== 'none') {
                // --- Wöchentliche Wiederholung ---
                let weekdays = [];
                if (repeatType === 'WEEKLY') {
                    // Sammle alle aktivierten Wochentage (Checkboxen)
                    weekdays = Array.from(event.querySelectorAll('.weekday:checked')).map(cb => cb.value);
                    if (weekdays.length === 0) {
                        throw new Error('Bitte wählen Sie mindestens einen Wochentag für die wöchentliche Wiederholung aus.');
                    }
                } else {
                    weekdays = Array.from(event.querySelectorAll('.weekday:checked')).map(cb => cb.value);
                }
                const monthType = event.querySelector('.monthlyType')?.value;
                const weekNumber = event.querySelector('.monthlyType')?.value === 'BYDAY' ? event.querySelector('.monthlyWeekNumber')?.value : undefined;
                const weekDay = event.querySelector('.monthlyType')?.value === 'BYDAY' ? event.querySelector('.monthlyWeekDay')?.value : undefined;
                const monthDay = event.querySelector('.monthlyType')?.value === 'BYMONTHDAY' ? event.querySelector('.monthlyMonthDay')?.value : undefined;
                const rrule = generateRRule(repeatType, repeatInterval, repeatUntil, weekdays, monthType, monthDay, weekNumber, weekDay);
                if (rrule) icsContent += `${rrule}\r\n`;
            }
            
            // Reminder
            if (reminderTime && parseInt(reminderTime) > 0) {
                icsContent += 'BEGIN:VALARM\r\n';
                icsContent += 'ACTION:DISPLAY\r\n';
                icsContent += `TRIGGER:-PT${parseInt(reminderTime)}M\r\n`;
                icsContent += 'DESCRIPTION:Reminder\r\n';
                icsContent += 'END:VALARM\r\n';
            }
            
            // Anhang
            const attachmentInput = event.querySelector('.attachment');
            const attachmentFile = attachmentInput?.files?.[0];
            if (attachmentFile) {
                const attachment = await processAttachment(attachmentFile);
                if (attachment) {
                    icsContent += `ATTACH;FMTTYPE=${attachment.mime}:data:${attachment.mime};base64,${attachment.data}\r\n`;
                }
            } else if (attachmentInput && attachmentInput.value) {
                // Wenn eine URL eingegeben wurde, als ATTACH exportieren
                let url = attachmentInput.value.trim();
                if (!/^https?:\/\//i.test(url)) {
                    url = 'https://' + url;
                }
                icsContent += `ATTACH:${url}\r\n`;
            }
            
            icsContent += 'END:VEVENT\r\n';
            hasValidEvents = true;
        }
        
        if (!hasValidEvents) {
            throw new Error('Kein gültiger Termin gefunden!');
        }
        
        // ICS-Header/Footer
        icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ICS Generator//NONSGML ICS Generator//DE\r\n' + icsContent + 'END:VCALENDAR\r\n';
        
        // Nach dem Erstellen: ICS-Datei validieren
        const validation = validateICS(icsContent.replace(/\r\n/g, '\n'));
        if (validation.errors && validation.errors.length > 0) {
            throw new Error('ICS-Fehler: ' + validation.errors.join('<br>'));
        }
        if (validation.warnings && validation.warnings.length > 0) {
            // Optional: Warnungen können im aufrufenden Modul behandelt werden
        }
        return icsContent;
    } catch (error) {
        throw error;
    }
}

// --- Usability-Verbesserungen: Fokus und Scrollen ---
document.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('is-invalid')) {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
