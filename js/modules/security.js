export const MAX_ICS_FILE_BYTES = 2 * 1024 * 1024;

export function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

export function assertICSFileSize(file) {
    if (file.size > MAX_ICS_FILE_BYTES) {
        throw new Error('Die ICS-Datei darf maximal 2 MiB groß sein.');
    }
}
