const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 10000,
    pingInterval: 5000,
    transports: ['websocket', 'polling']
});

// In-Memory Speicher für aktive Benutzer
const activeUsers = new Set();

// Cleanup-Intervall für abgelaufene Sitzungen (alle 5 Minuten)
setInterval(() => {
    const connectedSockets = io.sockets.sockets;
    activeUsers.clear();
    for (const [id, socket] of connectedSockets) {
        activeUsers.add(id);
    }
    io.emit('userCount', activeUsers.size);
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected from ${socket.handshake.address}`);
    
    // Füge neue Verbindung hinzu
    activeUsers.add(socket.id);
    io.emit('userCount', activeUsers.size);

    socket.on('disconnect', (reason) => {
        console.log(`User ${socket.id} disconnected: ${reason}`);
        activeUsers.delete(socket.id);
        io.emit('userCount', activeUsers.size);
    });

    socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
        activeUsers.delete(socket.id);
        io.emit('userCount', activeUsers.size);
    });
});

// Healthcheck-Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        connections: activeUsers.size,
        uptime: process.uptime()
    });
});

// Statische Dateien ausliefern
app.use(express.static('../'));

const PORT = process.env.PORT || 5500;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
