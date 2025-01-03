# ICS Tools

Ein webbasiertes Tool zur Erstellung und Validierung von iCalendar-Dateien.

## Demo

Eine Live-Demo ist verfügbar unter: [https://ICS-Generator.de)

<img width="1194" alt="Screenshot" src="https://github.com/user-attachments/assets/c7c17264-b442-4d0a-9660-878814e7a523" />


## Features

### ICS Generator
- Erstellung einzelner oder mehrerer Termine
- Unterstützung für ganztägige Termine
- Flexible Erinnerungsfunktionen (10 Min. bis 1 Woche vorher)
- Anhänge und URLs zu Terminen hinzufügen
- Termine duplizieren und löschen
- Export als standardkonforme ICS-Datei
- Wiederholungsmuster für regelmäßige Termine

### ICS Validator
- Prüfung auf RFC 5545 Konformität
- Validierung von Pflichtfeldern
- Syntax- und Formatprüfung
- Detaillierte Fehler- und Warnmeldungen
- Syntax-Highlighting für ICS-Dateien

## Struktur

- `components/` - Wiederverwendbare HTML-Komponenten
  - `header.html` - Navigation
  - `footer.html` - Footer
- `js/` - JavaScript-Dateien
  - `components.js` - Komponenten-System
  - `script.js` - ICS-Generierung
  - `validator.js` - ICS-Validierung
- HTML-Dateien für jede Seite

## Setup

1. Repository klonen
```bash
git clone https://github.com/Schello805/ICS-Generator-Web.git
cd ICS-Generator-Web
```
2. Keine Build-Tools nötig
3. Über Webserver bereitstellen
```bash
# Mit Python (Python 3)
python -m http.server 8000

# Oder mit PHP
php -S localhost:8000
```

Öffnen Sie dann http://localhost:8000 im Browser.

## Technische Details
- Rein clientseitige Verarbeitung
- Keine Serveranbindung erforderlich
- Kompatibel mit allen modernen Browsern
- Responsive Design

### Verwendete Technologien
- HTML5
- CSS3 mit Bootstrap 4.5.2
- JavaScript (ES6+)
- Font Awesome 5.15.4
- jQuery 3.6.0

### Browser-Kompatibilität
- Chrome (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Edge (letzte 2 Versionen)

## Datenschutz
Alle Daten werden ausschließlich lokal im Browser verarbeitet. Es erfolgt keine Übertragung an externe Server.

## Beitragen

Beiträge sind willkommen! Bitte erstellen Sie einen Pull Request oder ein Issue für Verbesserungsvorschläge.

## Lizenz

MIT-Lizenz

Copyright (c) 2024 Michael Schellenberger

## Kontakt

Bei Fragen oder Problemen können Sie mich erreichen unter:
- E-Mail: info@schellenberger.biz
- Website: https://michael.schellenberger.biz 
