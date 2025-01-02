# ICS Tools

Ein webbasiertes Tool zur Erstellung und Validierung von iCalendar-Dateien.

## Features

### ICS Generator
- Erstellung einzelner oder mehrerer Termine
- Unterstützung für ganztägige Termine
- Flexible Erinnerungsfunktionen (10 Min. bis 1 Woche vorher)
- Anhänge und URLs zu Terminen hinzufügen
- Termine duplizieren und löschen
- Export als standardkonforme ICS-Datei

### ICS Validator
- Prüfung auf RFC 5545 Konformität
- Validierung von Pflichtfeldern
- Syntax- und Formatprüfung
- Detaillierte Fehler- und Warnmeldungen

## Struktur

- `components/` - Wiederverwendbare HTML-Komponenten
  - `header.html` - Navigation
  - `footer.html` - Footer
- `js/` - JavaScript-Dateien
  - `components.js` - Komponenten-System
  - `script.js` - ICS-Generierung
- HTML-Dateien für jede Seite

## Setup

1. Repository klonen
2. Keine Build-Tools nötig
3. Über Webserver bereitstellen

## Technische Details
- Rein clientseitige Verarbeitung
- Keine Serveranbindung erforderlich
- Kompatibel mit allen modernen Browsern
- Responsive Design

## Datenschutz
Alle Daten werden ausschließlich lokal im Browser verarbeitet. Es erfolgt keine Übertragung an externe Server.

## Lizenz

MIT-Lizenz 