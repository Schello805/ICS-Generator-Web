try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createICSCalendar,
            validateURL,
            generateUID,
            formatDateTime,
            escapeText,
            sanitizeInput,
            isValidURL,
            foldLine,
            generateEventBlock
        };
    }
} catch (e) {
    // Ignorieren im Browser-Kontext
} 