import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { escapeHTML, assertICSFileSize, MAX_ICS_FILE_BYTES } from '../js/modules/security.js';

function element() {
    return {
        innerHTML: '', textContent: '', children: [], listeners: {},
        classList: { add() {}, remove() {} },
        addEventListener(event, handler) { this.listeners[event] = handler; },
        appendChild(child) { this.children.push(child); },
        setAttribute() {}
    };
}

let elements;
let messages;

beforeEach(() => {
    elements = new Map();
    messages = element();
    globalThis.document = {
        addEventListener() {},
        getElementById: id => elements.get(id) ?? null,
        createElement: element,
        querySelector: selector => selector.includes('.validation-messages') ? messages : null,
        querySelectorAll: () => []
    };
    globalThis.window = { location: { hash: '' } };
    globalThis.FileReader = class {
        readAsText(file) { this.onload({ target: { result: file.content } }); }
    };
});

test('HTML escaping prevents tags, attribute breakouts and entity injection', () => {
    assert.equal(escapeHTML('<img src="x" onerror=\'alert(1)\'>&lt;'),
        '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;lt;');
    assert.equal(escapeHTML(null), '');
});

test('ICS size limit accepts boundary and rejects larger files', () => {
    assert.doesNotThrow(() => assertICSFileSize({ size: MAX_ICS_FILE_BYTES }));
    assert.throws(() => assertICSFileSize({ size: MAX_ICS_FILE_BYTES + 1 }), /2 MiB/);
});

test('validator renders malicious property names as text in section messages and escapes summary', async () => {
    const { initializeValidator } = await import('../js/modules/icsValidator.js');
    for (const id of ['icsFileInput', 'validateButton', 'validationResult', 'fileContent', 'fixContainer']) {
        elements.set(id, element());
    }
    const content = 'BEGIN:VCALENDAR\n<img src=x onerror=alert(1)>:value\nEND:VCALENDAR';
    elements.get('icsFileInput').files = [{ content, size: content.length }];
    initializeValidator();
    elements.get('validateButton').listeners.click();
    assert.equal(elements.get('fileContent').textContent, content);
    assert.match(elements.get('validationResult').innerHTML, /&lt;IMG SRC=X ONERROR=ALERT\(1\)&gt;/);
    assert.doesNotMatch(elements.get('validationResult').innerHTML, /<img/i);
    assert.ok(messages.children.some(child => child.textContent.includes('<IMG SRC=X')));
    assert.ok(messages.children.every(child => child.innerHTML === ''));
});

test('import escapes invalid ICS syntax and rejects oversized files before reading', async () => {
    const { initializeICSImportModal } = await import('../js/modules/icsImport.js');
    for (const id of ['icsFileInputModal', 'confirmICSImportBtn', 'icsImportModal', 'icsValidationResult']) {
        elements.set(id, element());
    }
    initializeICSImportModal();
    const input = elements.get('icsFileInputModal');
    const content = 'BEGIN:VCALENDAR\n<img src=x onerror=alert(1)>\nEND:VCALENDAR';
    input.files = [{ content, size: content.length }];
    input.listeners.change({ target: input });
    assert.doesNotMatch(elements.get('icsValidationResult').innerHTML, /<img/i);
    assert.match(elements.get('icsValidationResult').innerHTML, /&lt;img/);
    assert.equal(elements.get('confirmICSImportBtn').disabled, true);
    globalThis.FileReader = class { constructor() { assert.fail('Oversized file must not be read'); } };
    input.files = [{ size: MAX_ICS_FILE_BYTES + 1 }];
    input.listeners.change({ target: input });
    assert.match(elements.get('icsValidationResult').innerHTML, /2 MiB/);
});

test('validator rejects oversized Unicode content before parsing or rendering', async () => {
    const { validateICS } = await import('../js/modules/icsValidator.js');
    assert.match(validateICS('ü'.repeat(MAX_ICS_FILE_BYTES / 2 + 1)).errors[0], /2 MiB/);
    assert.equal(messages.children.length, 0);
});

test('preview renders imported titles, locations, descriptions and time zones as escaped text', async () => {
    const { initializeEventHandlers } = await import('../js/modules/eventHandlers.js');
    for (const id of ['previewEvents', 'previewModalBody', 'previewModal']) {
        elements.set(id, element());
    }
    globalThis.bootstrap = { Modal: class { show() {} } };
    initializeEventHandlers();
    const payload = '<img src=x onerror=alert(1)>';
    const fields = {
        '.summary': { value: payload }, '.location': { value: payload },
        '.description': { value: payload }, '.timeZone': { value: payload },
        '.startDate': { value: '2026-10-23' }, '.endDate': { value: '2026-10-23' },
        '.startTime': { value: '10:00' }, '.endTime': { value: '11:00' },
        '.allDay': { checked: false }
    };
    const form = { querySelector: selector => fields[selector] ?? null, querySelectorAll: () => [] };
    document.querySelectorAll = selector => selector === '.eventForm' ? [form] : [];
    elements.get('previewEvents').listeners.click();
    const html = elements.get('previewModalBody').innerHTML;
    assert.doesNotMatch(html, /<img/i);
    assert.equal(html.split(escapeHTML(payload)).length - 1, 4);
});

test('pages disallow inline scripts, retain valid structured data hashes and protect CDN scripts', () => {
    for (const page of ['index.html', 'generator.html', 'validator.html', 'impressum.html', 'privacy.html']) {
        const html = readFileSync(new URL('../' + page, import.meta.url), 'utf8');
        const policy = html.match(/script-src ([^;]+);/)[1];
        assert.ok(!policy.includes("'unsafe-inline'"), page);
        for (const script of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
            if (script[1].includes('application/ld+json')) {
                const hash = createHash('sha256').update(script[2]).digest('base64');
                assert.ok(policy.includes("'sha256-" + hash + "'"), page);
            } else {
                assert.match(script[1], /src=/, page);
                if (script[1].includes('https://')) {
                    assert.match(script[1], /integrity="sha384-[^"]+"/, page);
                    assert.match(script[1], /crossorigin="anonymous"/, page);
                }
            }
        }
    }
});
