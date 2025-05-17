// ICS Formatter Module - Implements RFC 5545 specifications

/**
 * Formatiert ein Datum gemäß RFC 5545 (iCalendar)
 * Format: YYYYMMDD für ganztägige Events
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}${month}${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        throw error;
    }
};

/**
 * Formatiert Datum und Zeit gemäß RFC 5545 (iCalendar)
 * Format: YYYYMMDDTHHmmssZ für Zeitstempel
 */
export const formatDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return '';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        
        // Setze die Zeit
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        date.setSeconds(0);
        
        // Formatiere als UTC
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    } catch (error) {
        console.error('Error formatting datetime:', error);
        throw error;
    }
};

/**
 * Generiert eine eindeutige UID gemäß RFC 5545
 * Format: timestamp-random@domain
 */
export const generateUID = () => {
    try {
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 9);
        return `${timestamp}-${random}?@ics-generator.de`;
    } catch (error) {
        console.error('Error generating UID:', error);
        throw error;
    }
};

/**
 * Escaped Sonderzeichen gemäß RFC 5545
 * Escaped: Komma (,), Semikolon (;), Backslash (\) und Newline (\n)
 */
export const escapeText = (text) => {
    if (!text) return '';
    try {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    } catch (error) {
        console.error('Error escaping text:', error);
        throw error;
    }
};

/**
 * Generiert den aktuellen Zeitstempel gemäß RFC 5545
 * Format: YYYYMMDDTHHmmssZ
 */
export const generateDTStamp = () => {
    try {
        const now = new Date();
        
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hour = String(now.getUTCHours()).padStart(2, '0');
        const minute = String(now.getUTCMinutes()).padStart(2, '0');
        const second = String(now.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    } catch (error) {
        console.error('Error generating timestamp:', error);
        throw error;
    }
};
