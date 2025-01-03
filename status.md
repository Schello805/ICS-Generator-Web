# Aktueller Status - ICS Generator

## Bereits implementiert/geändert
- CSP-Header angepasst für Inline-Styles und SVG-Icons
- Duplizieren und Löschen-Buttons aus dem HTML entfernt
- Wiederholungsoptionen-Logik korrigiert

## Aktuelles Problem
Wir versuchen die "Ganztägiger Termin" Checkbox zu verschieben:
- Soll direkt über den Datums-/Zeitfeldern sein
- Mit weniger Abstand als aktuell
- Innerhalb der form-row Struktur

## Geplante Änderung
Diese Änderung in generator.html:
```diff
                            <small id="summary1-help" class="form-text text-muted">
                                Bitte geben Sie einen Titel für den Termin ein (max. 255 Zeichen)
                            </small>
                        </div>
-                       <div class="custom-control custom-checkbox mb-3">
-                           <input type="checkbox" class="custom-control-input allDayCheckbox" id="allDay1" onchange="toggleDateTimeFields(1)">
-                           <label class="custom-control-label" for="allDay1">Ganztägiger Termin</label>
-                       </div>
                        <div class="form-row">
+                           <div class="col-12 mb-2">
+                               <div class="custom-control custom-checkbox">
+                                   <input type="checkbox" class="custom-control-input allDayCheckbox" id="allDay1" onchange="toggleDateTimeFields(1)">
+                                   <label class="custom-control-label" for="allDay1">Ganztägiger Termin</label>
+                               </div>
+                           </div>
                            <div class="form-group col-md-6">
```

## Noch ausstehend
1. Checkbox-Position korrigieren
2. Duplizieren-Funktion neu implementieren
3. Löschen-Funktion neu implementieren

## Relevante Dateien
- generator.html (Hauptdatei für Änderungen)
- script.js (für spätere Funktionsimplementierungen)

## Hinweise für die nächste Instanz
- Die Dateiänderungen müssen direkt in der Datei vorgenommen werden
- Die CSP-Header müssen beibehalten werden
- Die Barrierefreiheit (ARIA-Attribute) muss beachtet werden 