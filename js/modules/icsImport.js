// ICS Import Module für Modal in generator.html
import { validateICS } from './icsValidator.js';
import { duplicateEvent } from './eventManager.js';
import { toggleDateTimeFields } from './dateTimeManager.js';

let parsedEvents = [];

function unescapeICSText(value) {
    if (value === undefined || value === null) return value;
    const str = String(value);
    return str
        .replace(/\\\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\');
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

function parseICSEvents(icsContent) {
    const events = [];
    const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    let match;
    while ((match = veventRegex.exec(icsContent)) !== null) {
        const eventBlock = match[1];
        const event = {};
        let inAlarm = false;
        eventBlock.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed === 'BEGIN:VALARM') { inAlarm = true; return; }
            if (trimmed === 'END:VALARM') { inAlarm = false; return; }
            if (inAlarm) {
                // Reminder aus VALARM
                if (trimmed.startsWith('TRIGGER:')) {
                    const val = trimmed.substring('TRIGGER:'.length).trim();
                    const minutes = parseTriggerDurationMinutes(val);
                    if (minutes !== null) {
                        event['REMINDER'] = minutes;
                    }
                }
                return;
            }
            if (!trimmed.includes(':')) return;
            const idx = trimmed.indexOf(':');
            let key = trimmed.substring(0, idx).trim().toUpperCase();
            let value = trimmed.substring(idx + 1).trim();
            // Entferne Value-Parameter (z.B. DTSTART;VALUE=DATE → DTSTART)
            if (key.includes(';')) key = key.split(';')[0];
            event[key] = value;
        });
        events.push(event);
    }
    return events;
}

function parseICSDateTime(dt) {
    // Unterstützt Formate wie 20250503T110000Z (UTC), 20250503T110000 (lokal) oder 20250504 (reines Datum)
    let isUTC = false;
    let datePart = dt;
    // Value-Parameter entfernen (z.B. DTSTART;VALUE=DATE:20250504 → 20250504)
    if (datePart.includes(':')) {
        datePart = datePart.substring(datePart.indexOf(':') + 1);
    }
    if (datePart.endsWith('Z')) {
        isUTC = true;
        datePart = datePart.slice(0, -1);
    }
    // Split in Datum und Zeit
    const date = datePart.substring(0, 8); // JJJJMMTT
    let time = '';
    if (datePart.length >= 15) {
        let hour = parseInt(datePart.substring(9, 11), 10);
        let minute = parseInt(datePart.substring(11, 13), 10);
        // Wenn UTC, in lokale Zeit umrechnen
        if (isUTC) {
            const d = new Date(Date.UTC(
                parseInt(date.substring(0, 4)),
                parseInt(date.substring(4, 6)) - 1,
                parseInt(date.substring(6, 8)),
                hour, minute
            ));
            hour = d.getHours();
            minute = d.getMinutes();
        }
        time = (hour < 10 ? '0' : '') + hour + ':' + (minute < 10 ? '0' : '') + minute;
    }
    return { date, time };
}

function computeCustom9amDayBeforeMinutes(eventObj) {
    if (!eventObj || !eventObj['DTSTART']) return null;

    const dt = parseICSDateTime(eventObj['DTSTART']);
    if (!dt?.date) return null;

    // Startzeit: bei Ganztag 00:00, sonst die geparste lokale Uhrzeit
    const isoDate = dt.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const startIso = dt.time ? `${isoDate}T${dt.time}:00` : `${isoDate}T00:00:00`;
    const startDt = new Date(startIso);
    if (Number.isNaN(startDt.getTime())) return null;

    // Ziel: 09:00 am Vortag
    const targetDt = new Date(startDt.getTime());
    targetDt.setHours(9, 0, 0, 0);
    targetDt.setDate(targetDt.getDate() - 1);

    const diffMs = startDt - targetDt;
    const minutes = Math.floor(diffMs / (1000 * 60));
    return minutes > 0 ? minutes : null;
}

function buildUnknownReminderModal(unknownReminders, reminderOptions) {
    const existing = document.getElementById('unknownReminderModal');
    if (existing) existing.remove();

    const modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = 'unknownReminderModal';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-labelledby', 'unknownReminderModalLabel');
    modalEl.setAttribute('aria-hidden', 'true');

    const optionsHtml = reminderOptions
        .map(o => `<option value="${String(o.value).replace(/"/g, '&quot;')}">${String(o.text).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</option>`)
        .join('');

    const rowsHtml = unknownReminders.map((u) => {
        const title = (u.summary || `Event ${u.index + 1}`).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
            <div class="row align-items-center mb-2" data-unknown-reminder-row="1">
                <div class="col-12 col-md-6">
                    <div><b>${title}</b></div>
                    <div class="text-muted small">Importierter Reminder: ${u.minutes} Minuten vorher</div>
                </div>
                <div class="col-12 col-md-6 mt-2 mt-md-0">
                    <select class="form-select unknown-reminder-select" data-event-index="${u.index}">
                        ${optionsHtml}
                    </select>
                </div>
            </div>
        `;
    }).join('');

    modalEl.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="unknownReminderModalLabel">Erinnerungen beim Import anpassen</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-2">Einige importierte Erinnerungen konnten nicht 1:1 zugeordnet werden. Bitte wählen Sie pro Termin eine Alternative:</div>
                    <div class="row align-items-end mb-3">
                        <div class="col-12 col-md-6">
                            <label class="form-label">Für alle</label>
                            <select class="form-select" id="unknownReminderBulkSelect">
                                ${optionsHtml}
                            </select>
                        </div>
                        <div class="col-12 col-md-6 mt-2 mt-md-0">
                            <button type="button" class="btn btn-outline-primary w-100" id="unknownReminderApplyAllBtn">Für alle setzen</button>
                        </div>
                    </div>
                    ${rowsHtml}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="unknownReminderCancelBtn">Abbrechen</button>
                    <button type="button" class="btn btn-primary" id="unknownReminderApplyBtn">Übernehmen</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalEl);
    return modalEl;
}

function openUnknownReminderModal(unknownReminders, formsInDOM) {
    if (!unknownReminders || unknownReminders.length === 0) return;

    const firstForm = formsInDOM?.[0];
    const reminderSelect = firstForm ? firstForm.querySelector('.reminderTime') : null;
    if (!reminderSelect) return;

    const reminderOptions = Array.from(reminderSelect.options).map(o => ({ value: o.value, text: o.text }));
    const modalEl = buildUnknownReminderModal(unknownReminders, reminderOptions);

    const applyAllBtn = modalEl.querySelector('#unknownReminderApplyAllBtn');
    const bulkSelect = modalEl.querySelector('#unknownReminderBulkSelect');
    if (applyAllBtn && bulkSelect) {
        applyAllBtn.addEventListener('click', () => {
            const v = bulkSelect.value;
            const selects = modalEl.querySelectorAll('.unknown-reminder-select');
            selects.forEach(sel => {
                sel.value = v;
            });
        });
    }

    const applyBtn = modalEl.querySelector('#unknownReminderApplyBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const selects = modalEl.querySelectorAll('.unknown-reminder-select');
            selects.forEach(sel => {
                const idx = parseInt(sel.getAttribute('data-event-index') || '', 10);
                const form = formsInDOM?.[idx];
                const reminder = form ? form.querySelector('.reminderTime') : null;
                if (reminder) reminder.value = sel.value;
            });

            if (window.bootstrap && bootstrap.Modal) {
                const instance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                instance.hide();
            } else if (window.$ && typeof $(modalEl).modal === 'function') {
                $(modalEl).modal('hide');
            }
        });
    }

    modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
    });

    if (window.bootstrap && bootstrap.Modal) {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.show();
    } else if (window.$ && typeof $(modalEl).modal === 'function') {
        $(modalEl).modal('show');
    }
}

function showValidationResult(resultHtml, isSuccess) {
    const resultDiv = document.getElementById('icsValidationResult');
    resultDiv.className = isSuccess ? 'alert alert-success' : 'alert alert-danger';
    resultDiv.innerHTML = resultHtml;
}

function handleICSFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const content = ev.target.result;
        // Automatisch validieren
        const validation = validateICS(content);
        if (validation.errors && validation.errors.length > 0) {
            showValidationResult('Fehler:<br>' + validation.errors.join('<br>'), false);
            document.getElementById('confirmICSImportBtn').disabled = true;
            parsedEvents = [];
            return;
        }
        // Events parsen
        parsedEvents = parseICSEvents(content);
        if (!parsedEvents.length) {
            showValidationResult('Keine Termine gefunden.', false);
            document.getElementById('confirmICSImportBtn').disabled = true;
            return;
        }
        showValidationResult('Datei ist gültig.<br>Gefundene Termine: ' + parsedEvents.length, true);
        document.getElementById('confirmICSImportBtn').disabled = false;
    };
    reader.readAsText(file);
}

function importEventsToUI() {
    if (!parsedEvents.length) return;
    const unknownReminders = [];

    // KORREKTUR: Alle bestehenden Formulare entfernen
    document.querySelectorAll('.eventForm').forEach(form => {
        const card = form.closest('.card');
        if (card) card.remove();
    });

    const eventsContainer = document.getElementById('eventsContainer');

    // KORREKTUR: Schleife durch alle geparsten Events
    parsedEvents.forEach((eventObj, idx) => {

        // KORREKTUR: Erstelle eine neue Karte. 'newEventCard' ist jetzt das HTML-Element
        let newEventCard = duplicateEvent();

        if (!newEventCard) {
            console.error(`Konnte Karte für Termin ${idx + 1} nicht erstellen.`);
            return; // Gehe zum nächsten Termin in der Schleife
        }

        const form = newEventCard.querySelector('.eventForm');
        if (!form) return;

        // --- Ab hier deine bestehende Mapping-Logik ---

        // Standard-Felder
        if (eventObj['SUMMARY'] && form.querySelector('.summary')) form.querySelector('.summary').value = eventObj['SUMMARY'];
        if (eventObj['DESCRIPTION'] && form.querySelector('.description')) form.querySelector('.description').value = unescapeICSText(eventObj['DESCRIPTION']);
        if (eventObj['LOCATION'] && form.querySelector('.location')) form.querySelector('.location').value = eventObj['LOCATION'];

        // DTSTART und DTEND aufteilen in Datum und Uhrzeit, Zeitzone berücksichtigen
        if (eventObj['DTSTART']) {
            const dt = parseICSDateTime(eventObj['DTSTART']);
            if (form.querySelector('.startDate')) form.querySelector('.startDate').value = dt.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            if (form.querySelector('.startTime')) form.querySelector('.startTime').value = dt.time || '';
            // Ganztägig-Checkbox setzen, wenn keine Zeit vorhanden
            if (form.querySelector('.allDay')) {
                form.querySelector('.allDay').checked = !dt.time;
            }
            // Zeitfelder nach Checkbox-Status für dieses Formular immer aktualisieren
            toggleDateTimeFields(form);
        }
        if (eventObj['DTEND']) {
            const dt = parseICSDateTime(eventObj['DTEND']);
            if (form.querySelector('.endDate')) form.querySelector('.endDate').value = dt.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            if (form.querySelector('.endTime')) form.querySelector('.endTime').value = dt.time || '';
        }
        // Erweiterte Felder
        if (eventObj['URL'] && form.querySelector('.url')) form.querySelector('.url').value = eventObj['URL'];
        if (eventObj['ATTACH'] && form.querySelector('.attachment')) {
            form.querySelector('.attachment').value = eventObj['ATTACH'];
        }
        // Nach dem Setzen aller Felder: Zeitfelder je nach Ganztägig-Status aus-/einblenden
        if (typeof toggleDateTimeFields === 'function') toggleDateTimeFields(form);

        // RRULE: Wiederholung korrekt auf Formularfelder mappen
        if (eventObj['RRULE']) {
            const rrule = eventObj['RRULE'];
            // Typ (FREQ)
            const freq = (rrule.match(/FREQ=([^;]+)/) || [])[1] || 'none';
            if (form.querySelector('.repeatType')) form.querySelector('.repeatType').value = freq.toUpperCase();
            // Intervall
            const interval = (rrule.match(/INTERVAL=([^;]+)/) || [])[1];
            if (interval && form.querySelector('.repeatInterval')) form.querySelector('.repeatInterval').value = interval;
            // Wochentage (BYDAY)
            const byday = (rrule.match(/BYDAY=([^;]+)/) || [])[1];
            if (byday && form.querySelector('.repeatType') && form.querySelector('.repeatType').value === 'WEEKLY') {
                byday.split(',').forEach(day => {
                    const cb = form.querySelector('.weekday[value="' + day + '"]');
                    if (cb) cb.checked = true;
                });
            }
            // Monatsoptionen (BYMONTHDAY/BYDAY)
            const bymonthday = (rrule.match(/BYMONTHDAY=([^;]+)/) || [])[1];
            if (bymonthday && form.querySelector('.monthlyType')) form.querySelector('.monthlyType').value = 'BYMONTHDAY';
            const bydayMonth = (rrule.match(/BYDAY=([^;]+)/) || [])[1];
            if (bydayMonth && form.querySelector('.monthlyType')) form.querySelector('.monthlyType').value = 'BYDAY';
            // Wiederholungsende (UNTIL)
            const until = (rrule.match(/UNTIL=([^;]+)/) || [])[1];
            if (until && form.querySelector('.repeatEndType')) {
                // Setze auf "Bis zum" und Datum
                form.querySelectorAll('.repeatEndType').forEach(radio => {
                    if (radio.value === 'until') radio.checked = true;
                });
                if (form.querySelector('.repeatUntil')) {
                    // UNTIL: JJJJMMTTHHMMSSZ oder JJJJMMTT
                    const untilDate = until.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                    form.querySelector('.repeatUntil').value = untilDate;
                }
            }
        }
        if (form.querySelector('.reminderTime')) {
            const reminderSelect = form.querySelector('.reminderTime');

            if (eventObj['REMINDER'] !== undefined && eventObj['REMINDER'] !== null && eventObj['REMINDER'] !== '') {
                const reminderMinutes = String(eventObj['REMINDER']);

                // Spezialfall: "9 Uhr am Vortag" als Minutenwert in TRIGGER gespeichert
                const custom9amMinutes = computeCustom9amDayBeforeMinutes(eventObj);
                if (custom9amMinutes !== null && String(custom9amMinutes) === reminderMinutes) {
                    reminderSelect.value = 'custom_9am_day_before';
                } else {
                    // Normale Fälle: Wert setzen, wenn im Select vorhanden
                    const hasOption = Array.from(reminderSelect.options).some(o => o.value === reminderMinutes);
                    if (hasOption) {
                        reminderSelect.value = reminderMinutes;
                    } else {
                        // Unbekannter Minutenwert aus Import: kein unerwartetes UI-Verhalten erzeugen
                        reminderSelect.value = '0';
                        unknownReminders.push({
                            index: idx,
                            minutes: reminderMinutes,
                            summary: eventObj['SUMMARY'] || ''
                        });
                    }
                }
            } else {
                reminderSelect.value = '0';
            }
        }
    });

    // Nach dem Import ggf. Auswahl für nicht erkannte Reminder anbieten
    if (unknownReminders.length > 0) {
        const formsInDOM = document.querySelectorAll('.eventForm');
        openUnknownReminderModal(unknownReminders, formsInDOM);
    }
    // --- Ab hier deine Logik zur Erfolgsmeldung und Mapping-Anzeige ---

    const importSuccessDiv = document.getElementById('importSuccess');
    if (importSuccessDiv) {
        importSuccessDiv.textContent = 'Import erfolgreich! Die Termine wurden übernommen.';
        importSuccessDiv.classList.remove('d-none');
    }
    // OK-Button schließt Modal (Bootstrap 4 & 5 kompatibel)
    setTimeout(() => {
        const okBtn = document.getElementById('okICSImportBtn');
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                const modalEl = document.getElementById('icsImportModal');
                if (window.$ && typeof $(modalEl).modal === 'function') {
                    $(modalEl).modal('hide');
                } else if (window.bootstrap && bootstrap.Modal) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.hide();
                }
                // Footer-Buttons wieder einblenden, wenn Modal geschlossen wird
                const modalFooter = document.querySelector('.modal-footer');
                if (modalFooter) setTimeout(() => modalFooter.classList.remove('d-none'), 400);
            });
        }
    }, 100);
    // Mapping-Feedback ins Modal schreiben
    // Nach erfolgreichem Import: Zeige nur noch OK-Button in Modal-Footer
    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `<button type="button" class="btn btn-success ms-auto" data-bs-dismiss="modal" id="okICSImportBtn">OK</button>`;
    }
    const mappingDiv = document.getElementById('icsMappingResult');
    if (mappingDiv) {
        let html = `<div class='mapping-explanation mb-2'>Hier sehen Sie, welche Felder aus der ICS-Datei ins Formular übernommen wurden:</div>`;
        html += '<ul class="list-group">';
        // Akkordeon einblenden
        const acc = document.getElementById('mappingAccordion');
        if (acc) acc.classList.remove('d-none');

        // KORREKTUR: Verwende die neu erstellten Formulare im DOM für die Überprüfung
        const formsInDOM = document.querySelectorAll('.eventForm');

        parsedEvents.forEach((eventObj, idx) => {
            // Finde das zugehörige Formular
            const form = formsInDOM[idx]; // Greife auf das Formular im DOM zu
            if (!form) return; // Sicherheitshalber

            html += `<li class="list-group-item">
                <b>Event ${idx + 1}</b>:
                <ul class="mb-1">`;
            // Prüfe relevante Felder
            html += checkFieldMapping(form, '.summary', eventObj['SUMMARY'], 'SUMMARY');
            html += checkFieldMapping(form, '.description', unescapeICSText(eventObj['DESCRIPTION']), 'DESCRIPTION');
            html += checkFieldMapping(form, '.location', eventObj['LOCATION'], 'LOCATION');
            html += checkFieldMapping(form, '.startDate', eventObj['DTSTART'] ? parseICSDateTime(eventObj['DTSTART']).date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', 'DTSTART (Datum)');
            html += checkFieldMapping(form, '.startTime', eventObj['DTSTART'] ? parseICSDateTime(eventObj['DTSTART']).time : '', 'DTSTART (Zeit)');
            html += checkFieldMapping(form, '.endDate', eventObj['DTEND'] ? parseICSDateTime(eventObj['DTEND']).date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '', 'DTEND (Datum)');
            html += checkFieldMapping(form, '.endTime', eventObj['DTEND'] ? parseICSDateTime(eventObj['DTEND']).time : '', 'DTEND (Zeit)');
            html += checkFieldMapping(form, '.url', eventObj['URL'], 'URL');
            html += checkFieldMapping(form, '.attachment', eventObj['ATTACH'], 'ATTACH');
            html += checkFieldMapping(form, '.reminderTime', eventObj['REMINDER'], 'REMINDER');
            // Ganztägig-Feld prüfen
            let allDayExpected = '';
            if (eventObj['DTSTART']) {
                const dt = parseICSDateTime(eventObj['DTSTART']);
                allDayExpected = dt.time ? false : true;
            }
            const allDayInput = form ? form.querySelector('.allDay') : null;
            let allDayActual = allDayInput ? allDayInput.checked : false;
            html += `<li>${(allDayActual === allDayExpected) ? "<span class='text-success'><i class='bi bi-check-circle-fill'></i></span>" : "<span class='text-danger'><i class='bi bi-x-circle-fill'></i></span>"} <code>Ganztägiger Termin</code>: <b>${allDayExpected ? 'Ja' : 'Nein'}</b></li>`;
            html += '</ul></li>';
        });
        html += '</ul>';
        mappingDiv.innerHTML = html;
        mappingDiv.classList.remove('d-none');
    }
    // Kein zusätzliches Timeout oder manuelles Entfernen von Klassen/Backdrops nötig, da Bootstrap 4 dies übernimmt
}


function checkFieldMapping(form, selector, expected, icsKey) {
    const input = form.querySelector(selector);
    let val = input ? input.value : '';
    // Für Checkboxen wie .allDay: checked statt value
    if (input && input.type === 'checkbox') val = input.checked;
    const match = (val == expected);
    return `<li>${match ? "<span class='text-success'><i class='bi bi-check-circle-fill'></i></span>" : "<span class='text-danger'><i class='bi bi-x-circle-fill'></i></span>"} <code>${icsKey}</code> → <code>${selector}</code>: <b>${expected !== undefined && expected !== null && expected !== '' ? expected : '(leer)'}</b></li>`;
}

// Optional: Mapping-Erklärung als Hilfetext einfügen, z.B. beim Anzeigen des Mapping-Resultats:
// document.getElementById('icsMappingResult').innerHTML = `<div class='mapping-explanation'>Hier sehen Sie, wie die Felder aus Ihrer ICS-Datei auf das Formular gemappt wurden.</div>` + mappingHtml;

export function initializeICSImportModal() {
    const openBtn = document.getElementById('importICSBtn');
    const navBtn = document.getElementById('nav-import-ics');
    const fileInput = document.getElementById('icsFileInputModal');
    const importBtn = document.getElementById('confirmICSImportBtn');
    const modalEl = document.getElementById('icsImportModal');
    function openModal(e) {
        if (e) e.preventDefault();
        modalEl.querySelector('#icsValidationResult').innerHTML = '';
        modalEl.querySelector('#importSuccess').classList.add('d-none');
        modalEl.querySelector('#confirmICSImportBtn').disabled = true;
        // Footer-Buttons wieder einblenden, falls sie ausgeblendet waren
        const modalFooter = modalEl.querySelector('.modal-footer');
        if (modalFooter) modalFooter.classList.remove('d-none');
        fileInput.value = '';
        // Bootstrap 4-kompatibles Öffnen des Modals
        if (window.$ && typeof $(modalEl).modal === 'function') {
            $(modalEl).modal('show');
        } else {
            // Fallback für Bootstrap 5 (falls mal migriert):
            if (window.bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        }
    }
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (navBtn) navBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (modalEl) {
            openModal();
        } else {
            window.location.href = 'generator.html#icsImport';
        }
    });
    if (fileInput) {
        fileInput.addEventListener('change', handleICSFile);
    }
    importBtn.addEventListener('click', importEventsToUI);

    // Fix: Entferne Modal-Backdrop beim Schließen
    modalEl.addEventListener('hidden.bs.modal', function () {
        document.body.classList.remove('modal-open');
        // Entferne alle übrig gebliebenen Backdrops
        document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
    });

    // Öffne Modal automatisch, wenn #icsImport in der URL steht
    if (window.location.hash === '#icsImport') {
        setTimeout(() => openModal(), 300);
    }
}
