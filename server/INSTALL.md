# Installation des WebSocket-Servers

## 1. Node.js installieren (falls noch nicht vorhanden)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Projektdateien kopieren
```bash
# Erstelle Verzeichnis
sudo mkdir -p /var/www/ICS-Generator-Web
sudo chown www-data:www-data /var/www/ICS-Generator-Web

# Kopiere Dateien (passe den Pfad an)
sudo cp -r /path/to/ICS-Generator-Web/* /var/www/ICS-Generator-Web/
```

## 3. Abhängigkeiten installieren
```bash
cd /var/www/ICS-Generator-Web/server
sudo -u www-data npm install
```

## 4. systemd Service einrichten
```bash
# Kopiere Service-Datei
sudo cp ics-counter.service /etc/systemd/system/

# Aktiviere und starte den Service
sudo systemctl daemon-reload
sudo systemctl enable ics-counter
sudo systemctl start ics-counter

# Überprüfe den Status
sudo systemctl status ics-counter
```

## 5. Nginx konfigurieren
```bash
# Füge die WebSocket-Konfiguration in deine Nginx-Site ein
sudo nano /etc/nginx/sites-available/ics-generator.com

# Füge den Inhalt von nginx-websocket.conf in den server {} Block ein

# Teste die Konfiguration
sudo nginx -t

# Starte Nginx neu
sudo systemctl restart nginx
```

## 6. Überprüfen
```bash
# Prüfe den Service-Status
sudo systemctl status ics-counter

# Prüfe die Logs
sudo journalctl -u ics-counter -f

# Teste den Health-Check
curl http://localhost:3000/health
```

## Debugging

Falls der Counter nicht funktioniert:

1. Prüfe die Server-Logs:
```bash
sudo journalctl -u ics-counter -f
```

2. Prüfe die Nginx-Logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Prüfe die Firewall:
```bash
sudo ufw status
# Falls nötig, Port 3000 öffnen (nur für localhost)
sudo ufw allow from 127.0.0.1 to any port 3000 proto tcp
```

4. Prüfe die Browser-Konsole auf der Website für WebSocket-Fehler
