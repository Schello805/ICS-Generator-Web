// ICS Formatter Module - Implements RFC 5545 specifications

/**
 * Formatiert ein Datum gemäß RFC 5545 (iCalendar)
 * Format: YYYYMMDD
 */
export const formatDate = (dateString) => {
    return dateString.replace(/-/g, '');
};

/**
 * Formatiert Datum und Zeit gemäß RFC 5545 (iCalendar)
 * Format: YYYYMMDDTHHmmssZ
 */
export const formatDateTime = (dateString, timeString) => {
    const date = formatDate(dateString);
    const time = timeString.replace(/:/g, '') + '00';
    return `${date}T${time}Z`;
};

/**
 * Generiert eine eindeutige UID gemäß RFC 5545
 * Format: timestamp-random@domain
 */
export const generateUID = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}@icsgenerator.local`;
};

/**
 * Escaped Sonderzeichen gemäß RFC 5545
 * Escaped: Komma (,), Semikolon (;), Backslash (\) und Newline (\n)
 */
export const escapeText = (text) => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
};

/**
 * Generiert den aktuellen Zeitstempel gemäß RFC 5545
 * Format: YYYYMMDDTHHmmssZ
 */
export const generateDTStamp = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0,5);
    return formatDateTime(date, time);
};
