# Trackday Manager — Projektübersicht für Claude

## Was ist das?
Mobile-first Web-App zur Verwaltung von Motorrad-Trackday-Daten.
Pure HTML/CSS/JS, kein Framework, kein Server — läuft direkt als `file://`.
Datenspeicherung via localStorage. Zielgeräte: iPhone, iPad, Desktop.
Sprache: Deutsch. Design: Dark Theme.

## Datei öffnen
`TrackdayManager.html` direkt im Browser öffnen (Doppelklick oder `Start-Process`).

## Projektstruktur
```
TrackdayManager.html      ← Einzige Datei — enthält HTML, CSS und alle Scripts inline
CLAUDE.md                 ← Projektdoku für Claude
```

**Single-File Architektur:** Alles ist in `TrackdayManager.html` inline eingebettet.
Keine externen CSS- oder JS-Dateien mehr. Reihenfolge der `<script>`-Blöcke im HTML:
1. `data.js`             — Datenschicht: localStorage, CRUD, Migration, Export/Import
2. `screen-fahrzeuge.js` — Motorrad-Verwaltung (CRUD mit Inline-Edit)
3. `screen-wizard.js`    — 3-Step Wizard: Motorrad → Bedingungen → Strecke
4. `screen-setup.js`     — Setup-Erfassung (Fahrwerk, Reifen, Elektronik) + Edit-Modus
5. `screen-zeiten.js`    — Zeiten-Übersicht, Chart, Filter, Session löschen/bearbeiten
6. `export-import.js`    — JSON Export/Import mit Merge/Replace + Dateinamen-Modal
7. `app.js`              — Router (App.navigate), Bottom-Nav

## Datenmodell (DB_VERSION = 2)
```
vehicles[]  → id, name, year, motor, fahrwerk, bremsen, getriebe, gewicht, umbauten, notizen
sessions[]  → id, vehicleId, datum, uhrzeit, strecke, streckeKm, bedingung,
               temperatur{luft, asphalt},
               gabel{negativfederweg_mm, durchstreckung_mm, federvorspannung, druckstufe_klicks, zugstufe_klicks, oeltyp, oelstand_mm},
               federbein{negativfederweg_mm, hoehe_mm, messpunkt, federvorspannung, druckstufe_klicks, zugstufe_klicks},
               sekundaer{ritzel, kettenrad, kettenlaenge},
               reifen{vorne{hersteller, modell, compound, druck}, hinten{...}},
               elektronik{tc_stufe, tc_modus},
               bestzeit, notiz
events[]    → nicht mehr aktiv genutzt (Feature entfernt, Daten bleiben in localStorage)
```

## Export (plattformübergreifend)
`getExportPayload()` liefert das JSON-Objekt. Die Speicherlogik in `ScreenEinstellungen._doExport()`:
1. **`showSaveFilePicker`** — Desktop Chrome/Edge: echter Speichern-Dialog mit Ordnerauswahl
2. **`navigator.share` mit File** — iOS Safari: Share-Sheet → „In Dateien sichern"
3. **Fallback Download-Link** — alle anderen Browser

Vor dem Export erscheint ein Modal zur Eingabe des Dateinamens (Default: `TrackManager`).

## Wichtige Designentscheidungen
- Alle Felder optional (leerer String = nicht gesetzt)
- Setup-Screen: Felder werden aus letzter Session pro Motorrad vorausgefüllt
- Edit-Modus: `ScreenSetup.startWithSession(session)` lädt bestehende Session zum Bearbeiten
- Filter-Bar: eigener `<div>` außerhalb scroll-content (verhindert overflow-clipping)
- Drag-to-scroll auf Filter-Bar für Desktop-Maus
- Custom Bottom-Sheet Dropdowns statt native `<select>` für Filter
- Chart: nur sichtbar wenn Motorrad UND Strecke gefiltert; älteste links, neueste rechts
- `toY`: langsamere Zeiten oben, schnellere unten (Linie geht runter = Verbesserung)

## Bekannte Eigenheiten
- `_attachCardEvents()` nur in `render()` aufrufen, NICHT in `_renderList()` (sonst doppelte Listener → Toggle funktioniert nicht)
- Chart-Sort: String-Vergleich `YYYY-MM-DDTHH:MM` statt `new Date()` (robuster)
- `updateSession` macht shallow merge — verschachtelte Objekte (gabel, federbein etc.) werden komplett übergeben
- Google Fonts wird extern geladen — App funktioniert offline, aber mit Fallback-Schrift

## Strecken (STRECKEN in data.js Block)
Assen IDM Kurs, Oschersleben, Mettet, Rijeka, Most, Brünn, Lausitzring, Spa, Zolder, Wuppertal, Hagen, RacelandKart, Vledderveen

## Label-Konventionen
- Druckstufe → "Druckstufe (Klicks Offen)"
- Zugstufe → "Zugstufe (Klicks Offen)"
- Federvorspannung → "Federvorspannung (Umdr. Zu)"
