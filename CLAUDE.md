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
TrackdayManager.html      ← App-Shell, lädt alle Scripts
css/app.css               ← Gesamtes Design-System (dark theme, cards, modals, filter)
js/data.js                ← Datenschicht: localStorage, CRUD, Migration, Export/Import
js/screen-fahrzeuge.js    ← Motorrad-Verwaltung (CRUD mit Inline-Edit)
js/screen-wizard.js       ← 3-Step Wizard: Motorrad → Bedingungen → Strecke
js/screen-setup.js        ← Setup-Erfassung (Fahrwerk, Reifen, Elektronik) + Edit-Modus
js/screen-zeiten.js       ← Zeiten-Übersicht, Chart, Filter, Session löschen/bearbeiten
js/export-import.js       ← JSON Export/Import mit Merge/Replace
js/app.js                 ← Router (App.navigate), Bottom-Nav
```

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
- `_attachCardEvents()` in screen-fahrzeuge.js nur in `render()` aufrufen, NICHT in `_renderList()` (sonst doppelte Listener → Toggle funktioniert nicht)
- Chart-Sort: String-Vergleich `YYYY-MM-DDTHH:MM` statt `new Date()` (robuster)
- `updateSession` macht shallow merge — verschachtelte Objekte (gabel, federbein etc.) werden komplett übergeben

## Strecken (STRECKEN in data.js)
Assen IDM Kurs, Oschersleben, Mettet, Rijeka, Most, Brünn, Lausitzring, Spa, Zolder, Wuppertal, Hagen, RacelandKart, Vledderveen

## Label-Konventionen
- Druckstufe → "Druckstufe (Klicks Offen)"
- Zugstufe → "Zugstufe (Klicks Offen)"
- Federvorspannung → "Federvorspannung (Umdr. Zu)"
