# ICS Tools

Ein webbasiertes Tool zur Erstellung und Validierung von iCalendar-Dateien.

## Features

### ICS Generator
- Erstellung einzelner oder mehrerer Termine (inkl. Serientermine)
- Export als standardkonforme ICS-Datei
- Unterstützung für Online-Meetings und Dateianhänge
- Datenschutzfreundlich: Alle Daten bleiben im Browser

### ICS Validator
- Überprüfung von ICS-Dateien auf RFC 5545 Konformität
- Detaillierte Fehleranalyse und Warnungen
- Unterstützung für Outlook/Google Kalender Besonderheiten

## Setup & Deployment

### Lokale Entwicklung
1. Repository klonen:
   ```bash
   git clone https://github.com/Schello805/ICS-Generator-Web.git
   cd ICS-Generator-Web
   ```
2. Webserver starten (z.B. Python):
   ```bash
   python -m http.server 8000
   ```
3. Browser öffnen: `http://localhost:8000`

### Installation auf Linux Server (Apache/Nginx)
1. Repository in das Web-Verzeichnis klonen:
   ```bash
   cd /var/www/html
   git clone https://github.com/Schello805/ICS-Generator-Web.git
   cd ICS-Generator-Web
   chmod +x deploy.sh
   ```

### Updates einspielen
Nutzen Sie das `deploy.sh` Script, um die Installation zu aktualisieren (resettet auf Main-Branch Stand):
```bash
./deploy.sh
```

## Technologien
- HTML5, CSS3 (Bootstrap 5)
- Vanilla JavaScript (ES6+)
- Keine serverseitige Verarbeitung (Privacy by Design)

## Changelog

### Version 2.8.3 (2026-01-03)
- **Import:** Verbesserte Erinnerungs-Erkennung aus ICS (VALARM/TRIGGER), inkl. RFC5545 Duration Support.
- **Import:** "9 Uhr am Vortag" wird beim Import wieder korrekt als Option erkannt.
- **Import/UI:** Bei nicht zuordenbaren Erinnerungen kann der Nutzer eine Alternative auswählen (inkl. "Für alle setzen").
- **Import:** DESCRIPTION wird beim Import korrekt ent-escaped (z.B. `\\n` → Zeilenumbruch).

### Version 2.8.2 (2025-01-01)
- **Generator:** Neue Erinnerungs-Option: "9 Uhr am Vortag" (Speziell für Wandergruppen/Tourenplanung).

### Version 2.8.1 (2025-01-01)
- **UI:** Fix für Lesbarkeitsprobleme im Dark Mode.

### Version 2.8 (2025-01-01)
- **Generator:** QR-Code Generierung für Termine (direkter Transfer aufs Smartphone).
- **Validator:** 
  - Drag & Drop Upload für ICS-Dateien.
  - "Auto-Fix" Funktion: Repariert häufige Fehler (fehlende Tags, Syntax) automatisch.
- **System:** Cache-Busting für zuverlässige Updates.

### Version 2.7 (2025-01-01)
- **Validator:** Verbesserter RFC 5545 Support (Outlook/Google).
- **System:** Deployment-Script (`deploy.sh`) hinzugefügt.
### Version 2.6
- UI Modernisierung, Fixes für Scroll-Probleme.

## Lizenz
MIT-Lizenz - Copyright (c) 2024 Michael Schellenberger

## Kontakt
- Website: https://michael.schellenberger.biz
