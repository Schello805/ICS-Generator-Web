/**
 * Erstellt und triggert den Download einer ICS-Datei
 * @param {string} content - Der Inhalt der ICS-Datei
 */
export const downloadICSFile = (content) => {
    try {
        // Erstelle einen Blob mit dem ICS-Inhalt
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        
        // Erstelle eine URL für den Blob
        const url = window.URL.createObjectURL(blob);
        
        // Erstelle ein unsichtbares Download-Element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'calendar.ics';
        
        // Füge das Element zum DOM hinzu
        document.body.appendChild(link);
        
        // Trigger den Download
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        console.log('ICS-Datei wurde erfolgreich erstellt und der Download wurde gestartet');
    } catch (error) {
        console.error('Fehler beim Erstellen der ICS-Datei:', error);
        alert('Fehler beim Erstellen der ICS-Datei. Bitte versuchen Sie es erneut.');
    }
};
