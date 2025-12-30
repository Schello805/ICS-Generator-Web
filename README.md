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
- URLs für Online-Meetings (z.B. Zoom, Teams)
- Dateianhänge (PDF, DOC, DOCX, TXT, PNG, JPG)

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

## Views und Komponenten

### Hauptseite (index.html)
Die Startseite bietet eine Übersicht der verfügbaren Tools und deren Hauptfunktionen.

### Generator (generator.html)
Der Generator ermöglicht die Erstellung von Kalenderterminen im iCalendar-Format. Die Seite ist in mehrere Bereiche aufgeteilt:

#### Seitenstruktur
- Header mit Seitentitel "Termine erstellen"
- Container für Termine (`#eventsContainer`)
- Footer mit Copyright und Links
- Vorschau- und Export-Buttons am Ende der Seite

#### Termin-Karte
Jeder Termin wird in einer Bootstrap-Card dargestellt mit:
- Titel-Zeile mit Termin-Nummer und Aktions-Buttons
- Formular für Termindaten
- Kopieren- und Löschen-Buttons für jeden Termin

#### Formularfelder
1. **Titel** (`summary`)
   - Pflichtfeld
   - Klasse: `form-control form-control-sm summary`
   - ID-Format: `summary1` (Nummer entspricht Termin)
   - Bootstrap-Klassen: `col-12`

2. **Datum und Zeit**
   - Startdatum (`startDate`)
     - Pflichtfeld
     - Typ: `date`
     - Bootstrap-Klassen: `col-md-6`
   - Enddatum (`endDate`)
     - Pflichtfeld
     - Typ: `date`
     - Bootstrap-Klassen: `col-md-6`
   - Ganztägig-Checkbox (`allDay`)
     - Beeinflusst Zeitfelder
     - Bootstrap-Klassen: `form-check`
   - Startzeit (`startTime`)
     - Optional wenn ganztägig
     - Typ: `time`
     - Bootstrap-Klassen: `col-md-6 time-field`
   - Endzeit (`endTime`)
     - Optional wenn ganztägig
     - Typ: `time`
     - Bootstrap-Klassen: `col-md-6 time-field`

3. **Beschreibung und Ort**
   - Beschreibung (`description`)
     - Textarea mit 2 Zeilen
     - Bootstrap-Klassen: `col-md-6`
   - Ort (`location`)
     - Textfeld
     - Bootstrap-Klassen: `col-md-6`

4. **Wiederholung** (`repeatType`)
   - Select-Feld mit Optionen
   - Zusätzliche Felder erscheinen je nach Auswahl:
     - Intervall (`repeatInterval`)
     - Wochentage bei wöchentlicher Wiederholung
     - Ende der Wiederholung
   - Bootstrap-Klassen: `col-12`

5. **Erinnerung** (`reminderTime`)
   - Select-Feld
   - Bootstrap-Klassen: `col-md-4`

6. **URL und Anhänge**
   - URL (`url`)
     - Optional
     - Typ: `url`
     - Bootstrap-Klassen: `col-12`
   - Anhänge (`attachments`)
     - Optional
     - Typ: `file`
     - Bootstrap-Klassen: `col-12`

#### Template
- `#eventTemplate` enthält die Vorlage für neue Termine
- Wird für "Termin kopieren" verwendet
- Identische Struktur wie Hauptformular, aber ohne IDs

#### Aktions-Buttons
- "Vorschau" (`#previewEvents`)
- "ICS herunterladen" (`#downloadICS`)
- "Termin hinzufügen" (`#addEvent`)

#### JavaScript-Einbindung
- Bootstrap 5.3.2

- Font Awesome 5.15.4
- Eigene Module:
  - `components.js`
  - `eventManager.js`
  - `icsGenerator.js`
  - `dateTimeManager.js`
  - `eventHandlers.js`

#### CSS und Styling
- Bootstrap 5.3.2 Basis-Klassen
- Eigene Styles in `styles.css`
- Responsive Layout mit Bootstrap-Grid
- Kompakte Darstellung durch `form-control-sm`

#### Sicherheit
- Content Security Policy (CSP) definiert
- Sichere Ressourcen-Einbindung

#### Meta-Informationen
- Deutsch als Sprache
- Responsive Viewport
- SEO-Beschreibung

### Validator (validator.html)
Tool zur Überprüfung bestehender ICS-Dateien auf Konformität mit dem iCalendar-Standard.

#### Funktionen
- Datei-Upload
- Syntax-Prüfung
- Validierung der Pflichtfelder
- Überprüfung der Datumsformate
- Anzeige von Fehlern und Warnungen

### Gemeinsame Komponenten

#### Header (components/header.html)
- Navigation zu allen Tools
- Responsive Design
- Enthält Logo und Hauptmenü

#### Footer (components/footer.html)
- Copyright-Informationen
- Links zu Impressum und Datenschutz

## Changelog

### Version 1.1.0 (2025-01-01)
- **Validator-Update:**
  - Verbesserte Unterstützung für RFC 5545 (iCalendar) Standards.
  - Hinzugefügt: "Unfolding" Support für mehrzeilige Properties.
  - Hinzugefügt: Unterstützung für `X-` Erweiterungs-Properties (z.B. Outlook).
  - Verbessert: Toleranz bei Datumsformaten und Parameter-Handling.
  - Neu: Explizite Prüfung auf `BEGIN:VCALENDAR` und `END:VCALENDAR`.

## Changelog

### Version 1.1.0 (2025-01-01)
- **Validator-Update:**
  - Verbesserte Unterstützung für RFC 5545 (iCalendar) Standards.
  - Hinzugefügt: "Unfolding" Support für mehrzeilige Properties.
  - Hinzugefügt: Unterstützung für `X-` Erweiterungs-Properties (z.B. Outlook).
  - Verbessert: Toleranz bei Datumsformaten und Parameter-Handling.
  - Neu: Explizite Prüfung auf `BEGIN:VCALENDAR` und `END:VCALENDAR`.

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
- CSS3 mit Bootstrap 5.3.2
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

## Technische Hinweise für KI-Assistenten

### Wichtige JavaScript-Module
- `eventManager.js`: Verwaltet das Kopieren, Löschen und Aktualisieren von Terminen
- `icsGenerator.js`: Erstellt die ICS-Datei nach RFC 5545 Standard
- `dateTimeManager.js`: Handhabt Datums- und Zeitlogik
- `eventHandlers.js`: Event-Handler für Formularinteraktionen

### Datenverarbeitung
- Alle Formulardaten werden client-seitig verarbeitet
- ICS-Generierung erfolgt im Browser
- Keine Server-Speicherung von Termindaten

### Formularvalidierung
- Client-seitige Validierung in `eventHandlers.js`
- Prüfung auf Pflichtfelder
- Validierung der Datums- und Zeitlogik
- Spezielle Validierung für Wiederholungsoptionen

### CSS-Klassen
- Bootstrap 5.3.2 als Basis-Framework
- Eigene Styles in `styles.css`
- Responsive Design mit col-* Klassen
- Formular-Styling mit form-control-sm für kompakte Darstellung

### Event-Handling
- Dynamisches Hinzufügen/Entfernen von Terminen
- Live-Validierung der Eingaben
- Automatische Aktualisierung der Vorschau
- Behandlung von Wiederholungsoptionen

### Best Practices
1. Verwende bestehende Klassen und IDs für DOM-Manipulation
2. Beachte die Abhängigkeiten zwischen Feldern (z.B. ganztägig → Zeitfelder)
3. Validiere Benutzereingaben vor der ICS-Generierung
4. Berücksichtige die Mehrsprachigkeit (aktuell nur Deutsch)
5. Beachte die Content Security Policy in den HTML-Dateien

## Entwicklungs-Roadmap

### Kurzfristige Ziele
- **Fehlerbehandlung verbessern**
  - Implementierung einer einheitlichen Error-Klasse
  - Zentrales Error-Handling-System
  - Verbesserte Validierung von Benutzereingaben

- **Code-Konsistenz**
  - Vereinheitlichung der Sprache im Code (Deutsch oder Englisch)
  - Verbesserung der Code-Dokumentation
  - Optimierung der DOM-Operationen durch Caching

### Mittelfristige Ziele
- **TypeScript Migration**
  - Schrittweise Einführung von TypeScript
  - Definition von Interfaces und Types
  - Strikte Typisierung für bessere Code-Qualität

- **Test-Infrastruktur**
  - Einführung von Unit Tests
  - Integration von Jest oder ähnlichem Test-Framework
  - Aufbau einer CI/CD-Pipeline

### Langfristige Ziele
- **Architektur-Optimierung**
  - Refactoring zu einer strikteren Komponenten-Architektur
  - Implementierung von E2E-Tests
  - Verbesserte Dependency-Injection

- **Internationalisierung**
  - Mehrsprachige Unterstützung
  - Lokalisierung von Datums- und Zeitformaten
  - WCAG-Richtlinien vollständig umsetzen

### Technische Schulden
- Vereinheitlichung der Codebase-Sprache
- Verbesserung der Entwicklerdokumentation
- Einführung von Code-Coverage-Metriken
- Implementation von Performance-Monitoring

## Geplante Features

- **ICS-Import**
  - Möglichkeit, bestehende ICS-Dateien zu importieren
  - Automatische Übernahme von Terminen und Serien
