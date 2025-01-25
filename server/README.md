# ICS Generator WebSocket Server

Dieser Server ist für den Live-Besucher-Zähler auf ics-generator.com zuständig.
Er wird nur in der Produktionsumgebung benötigt.

## Installation auf Ubuntu Server

1. Node.js und npm installieren (falls noch nicht vorhanden):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Repository klonen und in den Server-Ordner wechseln:
   ```bash
   cd /path/to/ICS-Generator-Web/server
   ```

3. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

4. Server als systemd Service einrichten:
   ```bash
   sudo nano /etc/systemd/system/ics-counter.service
   ```
   
   Folgendes in die Datei einfügen:
   ```ini
   [Unit]
   Description=ICS Generator User Counter
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/ICS-Generator-Web/server
   ExecStart=/usr/bin/node server.js
   Restart=always
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

5. Service aktivieren und starten:
   ```bash
   sudo systemctl enable ics-counter
   sudo systemctl start ics-counter
   ```

6. Status überprüfen:
   ```bash
   sudo systemctl status ics-counter
   ```

## Nginx Konfiguration

Der WebSocket-Server muss in der Nginx-Konfiguration weitergeleitet werden:

```nginx
# In der Server-Block Konfiguration für ics-generator.com
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Monitoring

Der Server bietet einen Health-Check Endpoint unter `/health`, der den Status und die aktuelle Anzahl der Verbindungen zurückgibt:

```bash
curl http://localhost:3000/health
```

## Logs

Die Logs können über systemd eingesehen werden:

```bash
sudo journalctl -u ics-counter -f
```
