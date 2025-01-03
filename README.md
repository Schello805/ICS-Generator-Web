# ICS Tools

Ein webbasiertes Tool zur Erstellung und Validierung von iCalendar-Dateien.

## Features

### ICS Generator
- Erstellung einzelner oder mehrerer Termine
- Unterstützung für ganztägige Termine
- Flexible Wiederholungsoptionen:
  - Täglich, wöchentlich, monatlich, jährlich
  - Auswahl spezifischer Wochentage
  - Auswahl spezifischer Monate
  - Verschiedene Endbedingungen (nach X Wiederholungen, bis Datum)
- Erinnerungsfunktionen (10 Min. bis 1 Woche vorher)
- Export als standardkonforme ICS-Datei

## Struktur

- `components/` - Wiederverwendbare HTML-Komponenten
  - `footer.html` - Footer
- `js/` - JavaScript-Dateien
  - `components.js` - Komponenten-System
- `favicon/` - Favicon für die Website
- `script.js` - Hauptlogik für ICS-Generierung
- `styles.css` - Styling
- `index.html` - Startseite
- `generator.html` - Termin-Generator

## Setup

1. Repository klonen
```bash
git clone https://github.com/Schello805/ICS-Generator-Web.git
cd ICS-Generator-Web
```

2. Über Webserver bereitstellen
```bash
# Mit Python (Python 3)
python -m http.server 8000

# Oder mit PHP
php -S localhost:8000
```

3. http://localhost:8000 im Browser öffnen

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

### Browser-Kompatibilität
- Chrome (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Edge (letzte 2 Versionen)

## Datenschutz
Alle Daten werden ausschließlich lokal im Browser verarbeitet. Es erfolgt keine Übertragung an externe Server.

## Lizenz

MIT-Lizenz

Copyright (c) 2024 Michael Schellenberger

## Kontakt

Bei Fragen oder Problemen können Sie mich erreichen unter:
- E-Mail: info@schellenberger.biz
- Website: https://michael.schellenberger.biz 
