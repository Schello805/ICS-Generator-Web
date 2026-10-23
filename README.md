# ICS Tools

Ein webbasiertes Tool zur Erstellung und Validierung von iCalendar-Dateien.

Live-Version: https://ics-generator.de

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

### Alternative Start-Methoden
**Node.js (npx):**
```bash
npx http-server -p 8000
```
**Java (JDK 18+):**
```bash
java -m jdk.httpserver.SimpleFileServer
```

### Installation auf Linux Server (Apache/Nginx)
1. Repository in das Web-Verzeichnis klonen:
   ```bash
   cd /var/www/html
   git clone https://github.com/Schello805/ICS-Generator-Web.git
   cd ICS-Generator-Web
   chmod +x deploy.sh
   ```

Hinweis: Für SEO ist die kanonische Startseite `/` (nicht `/index.html`). Für Apache liegt dafür eine `.htaccess` bei, die `/index.html` per 301 auf `/` umleitet.

### Updates einspielen
Nutzen Sie das `deploy.sh` Script, um die Installation zu aktualisieren (resettet auf Main-Branch Stand):
```bash
./deploy.sh
```

## Technologien
- HTML5, CSS3 (Bootstrap 5)
- Vanilla JavaScript (ES6+)
- PHP (nur für Feedback-Formular Mailer)
- Keine Datenbank nötig (Privacy by Design)

## Server Voraussetzungen (für Feedback-Funktion)
Damit das Feedback-Formular Emails versenden kann, werden auf dem Server benötigt:
- PHP
- Ein Mail Transfer Agent (z.B. Postfix)
`apt install php libapache2-mod-php postfix`

### Sicherheit
- ICS-Dateien werden bis maximal 2 MiB verarbeitet; importierte Texte werden für HTML-Ausgaben escaped.
- Feedback benötigt PHP ab 7.3, akzeptiert ausschließlich JSON (maximal 64 KiB), Nachrichten bis 10000 Bytes und geprüfte E-Mail-Adressen. Der feste Absender ist `noreply@ics-generator.de` und muss vom Mailserver unterstützt werden.
- Ein Dateilimit mit exklusiver Sperre erlaubt fünf Feedback-Versuche je IP und insgesamt 100 je Stunde. Die Quoten liegen außerhalb des Webverzeichnisses im PHP-Temp-Verzeichnis; dieses muss beschreibbar sein. Bei Speicherfehlern wird nicht versendet. Bei mehreren Servern ist ein gemeinsamer Rate-Limiter nötig; hinter einem Proxy zählt standardmäßig dessen `REMOTE_ADDR` (keine ungeprüften Forwarded-Header übernehmen).
- Apache setzt über `.htaccess` `nosniff`, einen Einbettungsschutz und eine Referrer-Policy; bei Nginx diese Header entsprechend konfigurieren.
- Inline-JavaScript ist durch die CSP gesperrt. Bei Änderungen an JSON-LD den zugehörigen SHA-256-Hash in der CSP aktualisieren. CDN-Skripte besitzen SRI-Hashes; lokale Matomo-Konfigurationen müssen ohne Inline-Skripte und `eval` auskommen.
- Tests: `npm test` und mit installiertem PHP `php test/feedback.test.php`. GitHub Actions führt beide Prüfungen aus. Automatische Tests versenden keine E-Mails.

## Changelog

### Sicherheitsupdate (2026-10-23)
- Sicherheitskorrekturen für ICS-Import, Vorschau und Validierung (XSS), Feedback-Header, Versandlimits, Dateigrößen und Skript-Richtlinien; Regressionstests ergänzt.

### Version 2.15 (2026-10-17)
- **PWA/Offline:** Vollwertige Offline-Nutzung über modernen Service Worker (`sw.js`). Die Web-App funktioniert nun auch ohne Internetverbindung komplett lokal.
- **Zeitzonen (`VTIMEZONE`):** Volle Unterstützung für Zeitzonen nach RFC 5545 mit Standard-`VTIMEZONE`-Definitionen (Europe/Berlin, UTC, US, UK, Japan etc.).
- **Import & Vorschau:** Importierte Zeitzonen werden erkannt und übernommen; Terminvorschau zeigt die Zeitzone an.

### Version 2.14 (2026-07-21)
- **Export:** Erweiterte Export-Optionen (Teilen, E-Mail-Entwurf, ICS-Inhalt kopieren).
- **Tests & CI:** Automatische Unit-Tests und GitHub Actions CI hinzugefügt.

### Version 2.11 (2026-02-27)
- **UI:** Fix für mobile Ansicht der Haupt-Buttons (Action-Buttons brechen nun auf kleinen Bildschirmen korrekt um).

### Version 2.10 (2026-01-20)
- **Feature:** Feedback-Button hinzugefügt (unten rechts).
- **Feature:** Feedback senden per Email (PHP-Backend) oder Mailto-Fallback.
- **Fix:** Wochentage-Auswahl bei Termin-Duplizierung korrigiert.

### Version 2.9 (2026-01-14)
- **UI:** Optionale Felder in "Weitere Optionen" verschoben (Cleaner Interface).
- **Docs:** Alternative Start-Optionen (npx, Java) hinzugefügt.

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
