// User Counter Module

// Konfiguration für den WebSocket-Server
const config = {
    // Verwende die aktuelle URL des Webservers für Entwicklung
    // oder die feste Produktions-URL
    serverUrl: window.location.hostname === 'ics-generator.com' 
        ? 'https://ics-generator.com' 
        : window.location.origin
};

/**
 * Initialisiert die WebSocket-Verbindung und den Besucher-Zähler
 */
export const initializeUserCounter = () => {
    const userCountElement = document.getElementById('userCount');
    if (!userCountElement) return;

    // Prüfe ob wir in Produktion sind
    const isProduction = window.location.hostname === 'ics-generator.com';
    
    if (!isProduction) {
        // In der Testumgebung: verstecke den Counter
        userCountElement.style.display = 'none';
        return;
    }

    // Setze initiale Anzeige
    userCountElement.textContent = '-';
    userCountElement.style.color = '#6c757d'; // Grau

    try {
        // Socket.IO Konfiguration
        const socket = io(config.serverUrl, {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 5000,
            transports: ['websocket', 'polling'],
            path: '/socket.io/',
            autoConnect: true,
            forceNew: true
        });

        // Verbindungsaufbau
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            userCountElement.style.color = '#28a745'; // Grün wenn verbunden
        });

        // Empfange Benutzeranzahl
        socket.on('userCount', (count) => {
            userCountElement.textContent = count;
        });

        // Verbindung getrennt
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            userCountElement.textContent = '-';
            userCountElement.style.color = '#6c757d'; // Grau wenn getrennt
        });

        // Verbindungsfehler
        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            userCountElement.textContent = '-';
            userCountElement.style.color = '#6c757d'; // Grau bei Fehler
        });

        // Cleanup bei Seitenverlassen
        window.addEventListener('beforeunload', () => {
            if (socket.connected) {
                socket.disconnect();
            }
        });

    } catch (error) {
        console.error('Error initializing user counter:', error);
        if (userCountElement) {
            userCountElement.textContent = '-';
            userCountElement.style.color = '#6c757d';
        }
    }
};
