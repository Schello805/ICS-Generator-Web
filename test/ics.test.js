import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

function createDocumentStub() {
    return {
        addEventListener() {},
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        getElementById() {
            return null;
        }
    };
}

globalThis.document = createDocumentStub();

const formatter = await import('../js/modules/icsFormatter.js');
const validator = await import('../js/modules/icsValidator.js');
const generator = await import('../js/modules/icsGenerator.js');

beforeEach(() => {
    globalThis.document = createDocumentStub();
});

test('escapeText escapes RFC 5545 special characters', () => {
    assert.equal(
        formatter.escapeText('Ort, Raum 1; Zeile\\A\nNeue Zeile'),
        'Ort\\, Raum 1\\; Zeile\\\\A\\nNeue Zeile'
    );
});

test('validateICS accepts a minimal valid calendar', () => {
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ICS Generator//Tests//DE',
        'BEGIN:VEVENT',
        'UID:test-1@ics-generator.de',
        'DTSTAMP:20260721T100000Z',
        'DTSTART:20260722T080000Z',
        'DTEND:20260722T090000Z',
        'SUMMARY:Testtermin',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const result = validator.validateICS(ics);
    assert.deepEqual(result.errors, []);
});

test('validateICS rejects calendars without END:VCALENDAR', () => {
    const result = validator.validateICS('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n');

    assert.ok(
        result.errors.some(error => error.includes('END:VCALENDAR')),
        'missing END:VCALENDAR should be reported'
    );
});

test('createICSCalendar builds and validates an all-day event', async () => {
    const event = createEventForm({
        '.summary': { value: 'Sommerfest' },
        '.startDate': { value: '2026-07-22' },
        '.endDate': { value: '2026-07-22' },
        '.allDay': { checked: true },
        '.startTime': { value: '' },
        '.endTime': { value: '' },
        '.location': { value: 'Schule' },
        '.description': { value: 'Bitte Becher mitbringen.' },
        '.url': { value: 'https://example.com/meeting' },
        '.repeatType': { value: 'none' },
        '.repeatInterval': { value: '' },
        '.repeatUntil': { value: '' },
        '.reminderTime': { value: '60' },
        '.attachment': { files: [], value: '' }
    });

    const ics = await generator.createICSCalendar([event]);

    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /SUMMARY:Sommerfest/);
    assert.match(ics, /DTSTART;VALUE=DATE:20260722/);
    assert.match(ics, /END:VCALENDAR/);
});

test('createICSCalendar builds timed event with Europe/Berlin VTIMEZONE', async () => {
    const event = createEventForm({
        '.summary': { value: 'Projekt-Kickoff' },
        '.startDate': { value: '2026-07-22' },
        '.endDate': { value: '2026-07-22' },
        '.allDay': { checked: false },
        '.startTime': { value: '10:00' },
        '.endTime': { value: '11:30' },
        '.timeZone': { value: 'Europe/Berlin' },
        '.location': { value: 'Raum A' },
        '.description': { value: '' },
        '.url': { value: '' },
        '.repeatType': { value: 'none' },
        '.repeatInterval': { value: '' },
        '.repeatUntil': { value: '' },
        '.reminderTime': { value: '0' },
        '.attachment': { files: [], value: '' }
    });

    const ics = await generator.createICSCalendar([event]);

    assert.match(ics, /BEGIN:VTIMEZONE/);
    assert.match(ics, /TZID:Europe\/Berlin/);
    assert.match(ics, /DTSTART;TZID=Europe\/Berlin:20260722T100000/);
    assert.match(ics, /DTEND;TZID=Europe\/Berlin:20260722T113000/);
    assert.match(ics, /END:VTIMEZONE/);
    assert.match(ics, /END:VCALENDAR/);

    const validation = validator.validateICS(ics.replace(/\r\n/g, '\n'));
    assert.deepEqual(validation.errors, []);
});

test('createICSCalendar builds timed event with UTC and floating time', async () => {
    const utcEvent = createEventForm({
        '.summary': { value: 'UTC Event' },
        '.startDate': { value: '2026-07-22' },
        '.endDate': { value: '2026-07-22' },
        '.allDay': { checked: false },
        '.startTime': { value: '14:00' },
        '.endTime': { value: '15:00' },
        '.timeZone': { value: 'UTC' },
        '.reminderTime': { value: '0' }
    });

    const floatingEvent = createEventForm({
        '.summary': { value: 'Floating Event' },
        '.startDate': { value: '2026-07-23' },
        '.endDate': { value: '2026-07-23' },
        '.allDay': { checked: false },
        '.startTime': { value: '09:00' },
        '.endTime': { value: '10:00' },
        '.timeZone': { value: 'floating' },
        '.reminderTime': { value: '0' }
    });

    const ics = await generator.createICSCalendar([utcEvent, floatingEvent]);

    assert.doesNotMatch(ics, /BEGIN:VTIMEZONE/);
    assert.match(ics, /DTSTART:20260722T140000Z/);
    assert.match(ics, /DTEND:20260722T150000Z/);
    assert.match(ics, /DTSTART:20260723T090000/);
    assert.match(ics, /DTEND:20260723T100000/);

    const validation = validator.validateICS(ics.replace(/\r\n/g, '\n'));
    assert.deepEqual(validation.errors, []);
});


test('exportICSFile forceDownload skips share API and triggers download', async () => {
    const clickedLinks = [];
    const createdUrls = [];
    const removedUrls = [];

    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
            share() {
                throw new Error('share should not be called');
            },
            canShare() {
                return true;
            },
            userAgent: 'Macintosh',
            platform: 'MacIntel',
            maxTouchPoints: 0
        }
    });

    globalThis.window = {
        URL: {
            createObjectURL(blob) {
                createdUrls.push(blob);
                return 'blob:test';
            },
            revokeObjectURL(url) {
                removedUrls.push(url);
            }
        }
    };

    globalThis.document = {
        body: {
            appendChild(link) {
                clickedLinks.push(link);
            }
        },
        createElement(tagName) {
            assert.equal(tagName, 'a');
            return {
                click() {
                    this.clicked = true;
                },
                remove() {
                    this.removed = true;
                },
                style: {}
            };
        }
    };

    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (callback) => {
        callback();
        return 1;
    };

    try {
        const { exportICSFile } = await import('../js/modules/fileDownloader.js');
        await exportICSFile('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n', {
            filename: 'termine.ics',
            preferShare: true,
            forceDownload: true
        });
    } finally {
        globalThis.setTimeout = originalSetTimeout;
    }

    assert.equal(clickedLinks.length, 1);
    assert.equal(clickedLinks[0].download, 'termine.ics');
    assert.equal(clickedLinks[0].clicked, true);
    assert.equal(createdUrls.length, 1);
    assert.deepEqual(removedUrls, ['blob:test']);
});

function createEventForm(fields) {
    const attributes = new Map();

    return {
        querySelector(selector) {
            return fields[selector] ?? null;
        },
        getAttribute(name) {
            return attributes.get(name) ?? null;
        },
        setAttribute(name, value) {
            attributes.set(name, value);
        }
    };
}
