/**
 * Exportiert eine ICS-Datei.
 * - Bevorzugt "Teilen" (Web Share API) auf Mobile, wenn möglich.
 * - Fällt sonst auf klassischen Download via <a download> zurück.
 *
 * Hintergrund: iOS/Safari (insb. PWA/Standalone) behandelt "Download" teils anders.
 *
 * @param {string} content - Der Inhalt der ICS-Datei
 * @param {object} [options]
 * @param {string} [options.filename] - Dateiname
 * @param {boolean} [options.preferShare] - "Teilen" bevorzugen, wenn verfügbar
 */
export const exportICSFile = async (content, options = {}) => {
    const { filename = 'termine.ics', preferShare = true } = options;

    try {
        const mimeType = 'text/calendar;charset=utf-8';
        const blob = new Blob([content], { type: mimeType });

        // 1) Mobile-friendly Share (wenn verfügbar)
        if (preferShare && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
            try {
                const file = new File([blob], filename, { type: mimeType });
                const shareData = {
                    files: [file],
                    title: 'ICS Datei',
                    text: 'Kalenderdatei (.ics)'
                };
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    console.log('ICS-Datei wurde über Teilen exportiert');
                    return;
                }
            } catch (e) {
                // Nutzer-Abbruch (z.B. iOS) nicht als Fehler behandeln
                if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) {
                    console.log('ICS-Teilen abgebrochen');
                    return;
                }
                console.warn('Teilen nicht möglich, fallback auf Download:', e);
            }
        }

        // 2) Klassischer Download-Fallback
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';

        // iOS: häufig besser, wenn der Link in einem neuen Tab geöffnet werden darf
        if (isIOS()) {
            link.target = '_blank';
        }

        document.body.appendChild(link);
        link.click();

        // Cleanup nicht zu aggressiv, sonst bricht es auf Mobile sporadisch ab
        setTimeout(() => {
            try {
                window.URL.revokeObjectURL(url);
            } catch (e) {
                // ignore
            }
            link.remove();
        }, 30000);

        console.log('ICS-Datei wurde erfolgreich erstellt und exportiert (Download-Fallback)');
    } catch (error) {
        console.error('Fehler beim Erstellen der ICS-Datei:', error);
        alert('Fehler beim Erstellen der ICS-Datei. Bitte versuchen Sie es erneut.');
    }
};

function isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isAppleDevice = /iP(ad|hone|od)/i.test(ua);
    const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isAppleDevice || isIpadOS;
}
