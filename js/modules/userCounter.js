// User Counter Module

// Konfiguration für den WebSocket-Server
const config = {
    // Verwende die aktuelle URL des Webservers für Entwicklung
    // oder die feste Produktions-URL
    serverUrl: window.location.hostname === 'ics-generator.com' 
        ? 'https://ics-generator.com' 
        : 'http://localhost:5500'
};

/**
 * Initialisiert die WebSocket-Verbindung und den Besucher-Zähler
 */
export const initializeUserCounter = () => {
    console.log('Initializing user counter...');
    
    // Warte auf das DOM-Element
    const waitForElement = () => {
        const userCountElement = document.getElementById('userCount');
        if (!userCountElement) {
            console.log('User count element not found, waiting...');
            setTimeout(waitForElement, 100);
            return;
        }

        // Prüfe ob wir in Produktion sind
        const isProduction = window.location.hostname === 'ics-generator.com';
        console.log('Environment:', isProduction ? 'Production' : 'Development');
        
        if (!isProduction) {
            console.log('Development mode: hiding counter');
            userCountElement.style.display = 'none';
            return;
        }

        // Setze initiale Anzeige
        userCountElement.textContent = '-';
        userCountElement.style.color = '#6c757d'; // Grau

        try {
            console.log('Connecting to WebSocket server at:', config.serverUrl);
            
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
                console.log('Received user count:', count);
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

    waitForElement();
};
