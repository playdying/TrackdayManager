# Trackday Manager — Projektübersicht für Claude

## Was ist das?
Mobile-first Web-App zur Verwaltung von Motorrad-Trackday-Daten.
Pure HTML/CSS/JS, kein Framework, kein Server.
Datenspeicherung via localStorage. Zielgeräte: iPhone, iPad, Desktop.
Sprache: Deutsch. Design: Dark Theme.

## Hosting & Aufruf
**Live:** https://playdying.github.io/TrackdayManager/TrackdayManager.html
**Lokal:** `TrackdayManager.html` direkt im Browser öffnen (Doppelklick) — nur für Entwicklung/Testing.
**PWA:** Als Homescreen-App installierbar (iOS Safari: Teilen → Zum Home-Bildschirm).

## Projektstruktur
```
TrackdayManager.html      ← App-Shell: nur HTML-Gerüst, lädt CSS + JS extern
css/
  app.css                 ← Komplettes Dark-Theme Design-System
js/
  data.js                 ← Datenschicht: localStorage, CRUD, Migration, Export/Import
  screen-fahrzeuge.js     ← Motorrad-Verwaltung (CRUD mit Inline-Edit)
  screen-wizard.js        ← 3-Step Wizard: Motorrad → Bedingungen → Strecke
  screen-setup.js         ← Setup-Erfassung (Fahrwerk, Reifen, Elektronik) + Edit-Modus
  screen-zeiten.js        ← Sessions-Übersicht, Charts, Filter, Session löschen/bearbeiten
  export-import.js        ← JSON Export/Import mit Merge/Replace + Dateinamen-Modal
  app.js                  ← Router (App.navigate), Bottom-Nav, DOMContentLoaded-Boot
manifest.json             ← PWA Manifest
sw.js                     ← Service Worker (Offline-Cache, Version: trackday-v2)
icon.svg                  ← App-Icon (Motorrad, dark bg #0a0c10, accent #d4f53c)
CLAUDE.md                 ← Diese Datei
README.md                 ← GitHub Projektbeschreibung
```

## Script-Ladereihenfolge in TrackdayManager.html
1. `js/data.js`             — muss zuerst geladen sein (definiert DB, STRECKEN, CRUD-Funktionen)
2. `js/screen-fahrzeuge.js`
3. `js/screen-wizard.js`
4. `js/screen-setup.js`
5. `js/screen-zeiten.js`
6. `js/export-import.js`
7. `js/app.js`              — muss zuletzt geladen sein (referenziert alle anderen Screens)

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
               gasgriff_rolle,
               bestzeit, notiz
events[]    → nicht mehr aktiv genutzt (Feature entfernt, Daten bleiben in localStorage)
```

## Screen: Sessions (screen-zeiten.js)
- Umbenennung: früher "Zeiten", jetzt "Sessions" (Nav-Label + Screen-Titel)
- **Chart-Gruppen** (`chartGroups` in `_renderContent`):
  - Motorrad + Strecke gefiltert → genau eine Gruppe (nur diese Strecke, ohne Überschrift)
  - Nur Motorrad gefiltert → automatisch eine Gruppe pro Strecke mit ≥ 2 Sessions,
    jeweils mit Streckenname als Überschrift (alphabetisch sortiert)
  - Kein Motorrad gefiltert → keine Charts (Zeiten verschiedener Motorräder nicht vergleichbar)
- Rundenzeit-Chart pro Gruppe: mind. 2 Sessions mit gültiger Bestzeit
- **Setup-Vergleich-Karussell** pro Gruppe: direkt unter dem Rundenzeit-Chart, gleiche Größe
  - Wischen (Touch) oder Pfeile zum Blättern zwischen Parametern
  - Nur Parameter mit mind. 2 Datenpunkten werden angezeigt
  - Karussell-Position wird pro Strecke gemerkt (`_setupChartIdxByTrack`), Reset bei Filterwechsel
  - SETUP_PARAMS-Typen:
    - Standard (float): 4 gleichmäßige Gridlinien, 2 Nachkommastellen
    - `integer: true`: Gridlinien nur auf ganzen Zahlen
    - `categorical: true` + `categories: [...]`: Text auf Y-Achse, feste Reihenfolge
      (erstes Element oben; Motor Modus: A/B/C, Gasgriff Rolle: 50/RR/45/40/35)

## Eingabe-Validierung (screen-setup.js)
| Feld | step | Typ |
|------|------|-----|
| Druckstufe, Zugstufe (Gabel + Federbein) | 1 | integer |
| Ritzel, Kettenrad, Kettenlänge | 1 | integer |
| TC Stufe | 1 | integer |
| Federvorspannung (Gabel + Federbein) | 0.5 | halbe Umdrehungen |
| Reifen Druck | 0.01 | float |
| Negativfederweg, Durchstreckung, Höhe, Öllevel (mm) | 0.01 | float |
| Temperaturen (Luft, Asphalt) | 0.01 | float |
| Motor Modus (tc_modus) | — | Text (A, B, C, Sport…) |
| Gasgriff Rolle (gasgriff_rolle) | — | Dropdown: 35, 40, 45, RR, 50 (RR liegt zwischen 45 und 50) |
| Bestzeit | — | `inputmode="numeric"` + Auto-Formatierung in `_formatBestzeit()`: nur Ziffern tippen, von rechts interpretiert (3 = ms, 2 = s, Rest = min), z.B. 204381 → 2:04.381; blur füllt auf volles M:SS.mmm auf |

## Export (plattformübergreifend)
`getExportPayload()` liefert das JSON-Objekt. Die Speicherlogik in `ScreenEinstellungen._doExport()`:
1. **`showSaveFilePicker`** — Desktop Chrome/Edge: echter Speichern-Dialog mit Ordnerauswahl
2. **`navigator.share` mit File** — iOS Safari: Share-Sheet → „In Dateien sichern"
3. **Fallback Download-Link** — alle anderen Browser

Vor dem Export erscheint ein Modal zur Eingabe des Dateinamens (Default: `TrackManager`).

## Service Worker
- Cache-Name: `trackday-v2` (bei Dateiänderungen erhöhen, damit alter Cache invalidiert wird)
- Cacht: HTML, CSS, alle JS-Dateien, manifest.json, icon.svg
- Strategie: Cache-first, Fallback auf HTML bei Netzwerkfehler

## Wichtige Designentscheidungen
- Alle Felder optional (leerer String = nicht gesetzt)
- Setup-Screen: Felder werden aus letzter Session pro Motorrad vorausgefüllt
- Edit-Modus: `ScreenSetup.startWithSession(session)` lädt bestehende Session zum Bearbeiten
- Filter-Bar: eigener `<div>` außerhalb scroll-content (verhindert overflow-clipping)
- Drag-to-scroll auf Filter-Bar für Desktop-Maus
- Custom Bottom-Sheet Dropdowns statt native `<select>` für Filter
- `toY`: langsamere Zeiten oben, schnellere unten (Linie geht runter = Verbesserung)
- Motor Modus heißt intern `elektronik.tc_modus` (Datenfeld unverändert, nur Label geändert)

## Bekannte Eigenheiten
- `_attachCardEvents()` nur in `render()` aufrufen, NICHT in `_renderList()` (sonst doppelte Listener → Toggle funktioniert nicht)
- Chart-Sort: String-Vergleich `YYYY-MM-DDTHH:MM` statt `new Date()` (robuster)
- `updateSession` macht shallow merge — verschachtelte Objekte (gabel, federbein etc.) werden komplett übergeben
- Google Fonts wird extern geladen — App funktioniert offline, aber mit Fallback-Schrift

## Strecken (STRECKEN-Array in js/data.js)
Assen IDM Kurs, Oschersleben, Mettet, Rijeka, Most, Brünn, Lausitzring, Spa, Zolder, Wuppertal, Hagen, RacelandKart, Vledderveen

## Label-Konventionen
- Druckstufe → "Druckstufe (Klicks Offen)"
- Zugstufe → "Zugstufe (Klicks Offen)"
- Federvorspannung → "Federvorspannung (Umdr. Zu)"
- TC Modus → "Motor Modus" (Label, Datenfeld bleibt `elektronik.tc_modus`)
