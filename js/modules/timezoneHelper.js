// Timezone Helper Module for ICS Tools (RFC 5545 compliant)

/**
 * Standard VTIMEZONE Definitionen für häufig genutzte Zeitzonen.
 * Alle Definitionen folgen RFC 5545 Section 3.6.5 mit exakten Sommer-/Winterzeit-Regeln.
 */
export const TIMEZONE_DEFINITIONS = {
    'Europe/Berlin': [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Berlin',
        'X-LIC-LOCATION:Europe/Berlin',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'TZNAME:CEST',
        'DTSTART:19700329T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'TZNAME:CET',
        'DTSTART:19701025T030000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'Europe/Vienna': [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Vienna',
        'X-LIC-LOCATION:Europe/Vienna',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'TZNAME:CEST',
        'DTSTART:19700329T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'TZNAME:CET',
        'DTSTART:19701025T030000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'Europe/Zurich': [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Zurich',
        'X-LIC-LOCATION:Europe/Zurich',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'TZNAME:CEST',
        'DTSTART:19700329T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'TZNAME:CET',
        'DTSTART:19701025T030000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'Europe/Paris': [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Paris',
        'X-LIC-LOCATION:Europe/Paris',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'TZNAME:CEST',
        'DTSTART:19700329T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'TZNAME:CET',
        'DTSTART:19701025T030000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'Europe/London': [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/London',
        'X-LIC-LOCATION:Europe/London',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0000',
        'TZOFFSETTO:+0100',
        'TZNAME:BST',
        'DTSTART:19700329T010000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0000',
        'TZNAME:GMT',
        'DTSTART:19701025T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'America/New_York': [
        'BEGIN:VTIMEZONE',
        'TZID:America/New_York',
        'X-LIC-LOCATION:America/New_York',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0400',
        'TZNAME:EDT',
        'DTSTART:19700308T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0500',
        'TZNAME:EST',
        'DTSTART:19701101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'America/Chicago': [
        'BEGIN:VTIMEZONE',
        'TZID:America/Chicago',
        'X-LIC-LOCATION:America/Chicago',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:-0600',
        'TZOFFSETTO:-0500',
        'TZNAME:CDT',
        'DTSTART:19700308T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0600',
        'TZNAME:CST',
        'DTSTART:19701101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'America/Denver': [
        'BEGIN:VTIMEZONE',
        'TZID:America/Denver',
        'X-LIC-LOCATION:America/Denver',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:-0700',
        'TZOFFSETTO:-0600',
        'TZNAME:MDT',
        'DTSTART:19700308T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:-0600',
        'TZOFFSETTO:-0700',
        'TZNAME:MST',
        'DTSTART:19701101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'America/Los_Angeles': [
        'BEGIN:VTIMEZONE',
        'TZID:America/Los_Angeles',
        'X-LIC-LOCATION:America/Los_Angeles',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:-0800',
        'TZOFFSETTO:-0700',
        'TZNAME:PDT',
        'DTSTART:19700308T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:-0700',
        'TZOFFSETTO:-0800',
        'TZNAME:PST',
        'DTSTART:19701101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n'),

    'Asia/Tokyo': [
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Tokyo',
        'X-LIC-LOCATION:Asia/Tokyo',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0900',
        'TZOFFSETTO:+0900',
        'TZNAME:JST',
        'DTSTART:19700101T000000',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n')
};

/**
 * Gibt den VTIMEZONE-Block für eine gegebene Zeitzone zurück.
 * Für 'UTC' oder 'floating' wird ein leerer String zurückgegeben.
 * Für andere europäische Zeitzonen (z.B. Europe/Rome, Europe/Madrid) wird die Standard-EU-Regelung adaptiert.
 */
export function getTimezoneBlock(tzid) {
    if (!tzid || tzid === 'floating' || tzid === 'UTC') {
        return '';
    }

    if (TIMEZONE_DEFINITIONS[tzid]) {
        return TIMEZONE_DEFINITIONS[tzid];
    }

    // Falls eine andere mitteleuropäische Zeitzone übergeben wird:
    if (typeof tzid === 'string' && tzid.startsWith('Europe/')) {
        return [
            'BEGIN:VTIMEZONE',
            `TZID:${tzid}`,
            `X-LIC-LOCATION:${tzid}`,
            'BEGIN:DAYLIGHT',
            'TZOFFSETFROM:+0100',
            'TZOFFSETTO:+0200',
            'TZNAME:CEST',
            'DTSTART:19700329T020000',
            'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
            'END:DAYLIGHT',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0200',
            'TZOFFSETTO:+0100',
            'TZNAME:CET',
            'DTSTART:19701025T030000',
            'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
            'END:STANDARD',
            'END:VTIMEZONE'
        ].join('\r\n');
    }

    return '';
}

/**
 * Ermittelt die bevorzugte Standard-Zeitzone des Nutzers/Browsers.
 */
export function getDefaultTimezone() {
    try {
        if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
            const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (resolved && (TIMEZONE_DEFINITIONS[resolved] || resolved === 'UTC')) {
                return resolved;
            }
        }
    } catch (e) {
        // Fallback
    }
    return 'Europe/Berlin';
}
