// ICS Import Module für Modal in generator.html
import { validateICS } from './icsValidator.js';
import { duplicateEvent } from './eventManager.js';

let parsedEvents = [];

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
                    // Beispiel: TRIGGER:-PT30M
                    const val = trimmed.split(':')[1];
                    // Wandle typische Reminder in Minuten um
                    if (val.startsWith('-PT')) {
                        let min = 0;
                        if (val.endsWith('M')) min = parseInt(val.match(/-PT(\d+)M/)[1]);
                        if (val.endsWith('H')) min = parseInt(val.match(/-PT(\d+)H/)[1]) * 60;
                        if (val.endsWith('D')) min = parseInt(val.match(/-PT(\d+)D/)[1]) * 1440;
                        event['REMINDER'] = min;
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
    document.querySelectorAll('.eventForm').forEach(form => {
        const card = form.closest('.card');
        if (card) card.remove();
    });
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer.querySelector('.eventForm')) {
        const tpl = document.getElementById('eventTemplate');
        if (tpl && 'content' in tpl) {
            const clone = document.importNode(tpl.content, true);
            eventsContainer.appendChild(clone);
        } else {
            const addBtn = document.getElementById('addEvent');
            if (addBtn) addBtn.click();
        }
    }
    parsedEvents.forEach((eventObj, idx) => {
        let newEvent = duplicateEvent();
        if (idx === 0) {
            const firstForm = eventsContainer.querySelector('.eventForm');
            if (firstForm && firstForm.querySelector('.summary').value === '') {
                newEvent = firstForm.closest('.card');
            }
        }
        if (!newEvent) return;
        const form = newEvent.querySelector('.eventForm');
        if (!form) return;
        // Standard-Felder
        if (eventObj['SUMMARY'] && form.querySelector('.summary')) form.querySelector('.summary').value = eventObj['SUMMARY'];
        if (eventObj['DESCRIPTION'] && form.querySelector('.description')) form.querySelector('.description').value = eventObj['DESCRIPTION'];
        if (eventObj['LOCATION'] && form.querySelector('.location')) form.querySelector('.location').value = eventObj['LOCATION'];
        // DTSTART und DTEND aufteilen in Datum und Uhrzeit, Zeitzone berücksichtigen
        if (eventObj['DTSTART']) {
            const dt = parseICSDateTime(eventObj['DTSTART']);
            if (form.querySelector('.startDate')) form.querySelector('.startDate').value = dt.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            if (form.querySelector('.startTime')) form.querySelector('.startTime').value = dt.time || '';
            // Ganztägig-Checkbox setzen, wenn keine Zeit vorhanden
            if (form.querySelector('.allDay')) form.querySelector('.allDay').checked = !dt.time;
        }
        if (eventObj['DTEND']) {
            const dt = parseICSDateTime(eventObj['DTEND']);
            if (form.querySelector('.endDate')) form.querySelector('.endDate').value = dt.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            if (form.querySelector('.endTime')) form.querySelector('.endTime').value = dt.time || '';
        }
        // Erweiterte Felder
        if (eventObj['URL'] && form.querySelector('.url')) form.querySelector('.url').value = eventObj['URL'];
        if (eventObj['ATTACH'] && form.querySelector('.attachment')) {
            form.querySelector('.attachment').setAttribute('data-imported', eventObj['ATTACH']);
            form.querySelector('.attachment').classList.add('border-warning');
        }
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
                    const cb = form.querySelector('.weekday[value="'+day+'"]');
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
                    const untilDate = until.substring(0,8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                    form.querySelector('.repeatUntil').value = untilDate;
                }
            }
        }
        if (eventObj['REMINDER'] && form.querySelector('.reminderTime')) {
            form.querySelector('.reminderTime').value = eventObj['REMINDER'];
        }
    });
    setTimeout(() => {
        document.getElementById('importSuccess').innerHTML = 'Import erfolgreich! Die Termine wurden übernommen.<br><button id="closeICSImportModal" class="btn btn-success mt-2" data-dismiss="modal">OK</button>';
        document.getElementById('importSuccess').classList.remove('d-none');
        setTimeout(() => {
            const okBtn = document.getElementById('closeICSImportModal');
            if (okBtn) {
                okBtn.addEventListener('click', function() {
                    if (window.jQuery) window.jQuery('#icsImportModal').modal('hide');
                });
            }
        }, 100);
    }, 300);
    // Mapping-Feedback ins Modal schreiben
    const mappingDiv = document.getElementById('icsMappingResult');
    if (mappingDiv) {
        let html = `
        <div class="accordion" id="icsMappingAccordion">
          <div class="card">
            <div class="card-header p-0" id="headingMapping">
              <h2 class="mb-0">
                <button class="btn btn-link btn-block text-left collapsed w-100" type="button" data-toggle="collapse" data-target="#collapseMapping" aria-expanded="false" aria-controls="collapseMapping">
                  Feld-Mapping & Prüfung (Details anzeigen)
                </button>
              </h2>
            </div>
            <div id="collapseMapping" class="collapse" aria-labelledby="headingMapping" data-parent="#icsMappingAccordion">
              <div class="card-body">
                <ul>`;
        parsedEvents.forEach((eventObj, idx) => {
            html += `<li><b>Event ${idx+1}</b>:`;
            html += '<ul>';
            Object.entries(eventObj).forEach(([key, value]) => {
                html += `<li><code>${key}</code>: <span>${value}</span></li>`;
            });
            html += '</ul></li>';
        });
        html += `</ul>
              </div>
            </div>
          </div>
        </div>`;
        mappingDiv.innerHTML = html;
        mappingDiv.classList.remove('d-none');
    }
    // Kein zusätzliches Timeout oder manuelles Entfernen von Klassen/Backdrops nötig, da Bootstrap 4 dies übernimmt
}

function checkFieldMapping(form, selector, expected, icsKey) {
    const input = form.querySelector(selector);
    if (!input) return `<li><code>${icsKey}</code>: Kein passendes Feld gefunden <span style='color:red'>&#10060;</span></li>`;
    const val = input.value;
    const match = val == expected;
    return `<li><code>${icsKey}</code> → <code>${selector}</code>: <b>${expected || '(leer)'}</b> ${match ? "<span style='color:green'>&#10004;</span>" : "<span style='color:red'>&#10060;</span>"}</li>`;
}

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
        fileInput.value = '';
        // Bootstrap 4-kompatibles Öffnen des Modals
        if (window.$ && typeof $(modalEl).modal === 'function') {
            $(modalEl).modal('show');
        } else {
            // Fallback für Bootstrap 5 (falls mal migriert):
            if (window.bootstrap && bootstrap.Modal) {
                new bootstrap.Modal(modalEl).show();
            }
        }
    }
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (navBtn) navBtn.addEventListener('click', function(e) {
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

if (window.location.pathname.endsWith('generator.html')) {
    document.addEventListener('DOMContentLoaded', initializeICSImportModal);
}
