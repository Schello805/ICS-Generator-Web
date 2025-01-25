// User Counter Module

// Konfiguration für den WebSocket-Server
const config = {
    serverUrl: window.location.hostname === 'ics-generator.com' 
        ? 'https://ics-generator.com' 
        : 'http://localhost:3000'
};

/**
 * Initialisiert die WebSocket-Verbindung und den Besucher-Zähler
 */
export const initializeUserCounter = () => {
    console.log('Initializing user counter...');
    
    const userCountElement = document.getElementById('userCount');
    if (!userCountElement) {
        console.error('User count element not found!');
        return;
    }

    // Setze initiale Anzeige
    userCountElement.textContent = '1';

    try {
        console.log('Connecting to WebSocket server at:', config.serverUrl);
        
        // Socket.IO Konfiguration
        const socket = io(config.serverUrl, {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 5000,
            transports: ['websocket', 'polling']
        });

        // Verbindungsaufbau
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            userCountElement.style.color = '#198754'; // Bootstrap success color
        });

        // Empfange Benutzeranzahl
        socket.on('userCount', (count) => {
            console.log('Received user count:', count);
            // Stelle sicher, dass count eine Zahl ist und mindestens 1
            const safeCount = Math.max(1, parseInt(count) || 1);
            userCountElement.textContent = safeCount;
        });

        // Verbindung getrennt
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            userCountElement.textContent = '1';
            userCountElement.style.color = '#6c757d'; // Bootstrap secondary color
        });

        // Verbindungsfehler
        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            userCountElement.textContent = '1';
            userCountElement.style.color = '#6c757d'; // Bootstrap secondary color
        });

        // Cleanup bei Seitenverlassen
        window.addEventListener('beforeunload', () => {
            if (socket.connected) {
                socket.disconnect();
            }
        });

    } catch (error) {
        console.error('Error initializing user counter:', error);
        userCountElement.textContent = '1';
        userCountElement.style.color = '#6c757d';
    }
};
