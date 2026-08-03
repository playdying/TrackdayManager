# 🏍 Trackday Manager

Mobile-first Web-App zur Verwaltung von Motorrad-Trackday-Daten.

**Live:** [playdying.github.io/TrackdayManager/TrackdayManager.html](https://playdying.github.io/TrackdayManager/TrackdayManager.html)

---

## Features

- **Motorräder** verwalten mit allen technischen Details (Motor, Fahrwerk, Bremsen, Gewicht, Umbauten)
- **Sessions erfassen** — Fahrwerk-Setup, Reifen, Elektronik, Gasgriff-Rolle, Bestzeit, Notizen
- **Schnelle Bestzeit-Eingabe** — nur Ziffern tippen (z.B. `204381` → `2:04.381`), auch mobil
- **Sessions-Übersicht** mit Bestzeit-Banner, Delta-Anzeige und Zeitverlauf-Chart
- **Setup-Vergleich** — alle Setup-Parameter als wischbare Graphen (Gabel, Federbein, Reifen, …)
- **Automatische Strecken-Gruppierung** — nur Motorrad filtern und die Graphen erscheinen pro Strecke
- **Filter** nach Motorrad, Strecke und Bedingung (Trocken / Nass)
- **Export / Import** als JSON-Backup (funktioniert auf iOS & Desktop)
- **Offline-fähig** — als PWA zum Homescreen hinzufügen

---

## Strecken

Assen IDM Kurs, Oschersleben, Mettet, Rijeka, Most, Brünn, Lausitzring, Spa, Zolder + eigene Strecken

---

## Technik

- Pure HTML / CSS / JavaScript — kein Framework, kein Server
- Datenspeicherung via `localStorage` — Daten bleiben lokal auf dem Gerät
- PWA mit Service Worker für Offline-Nutzung

### Projektstruktur

```
TrackdayManager.html    ← App-Shell (HTML-Gerüst)
css/
  app.css               ← Dark Theme Design-System
js/
  data.js               ← Datenschicht, CRUD, Export/Import
  screen-fahrzeuge.js   ← Motorrad-Verwaltung
  screen-wizard.js      ← Neue Session (3-Step Wizard)
  screen-setup.js       ← Setup-Erfassung (Fahrwerk, Reifen, Elektronik)
  screen-zeiten.js      ← Zeiten-Übersicht & Chart
  export-import.js      ← Export/Import Logik
  app.js                ← Router & App-Init
manifest.json           ← PWA Manifest
sw.js                   ← Service Worker (Offline-Cache)
icon.svg                ← App-Icon
```

---

## Installation (iOS / Android)

1. [App öffnen](https://playdying.github.io/TrackdayManager/TrackdayManager.html) in Safari / Chrome
2. Teilen-Button → **„Zum Home-Bildschirm"**
3. Fertig — funktioniert ab sofort offline

---

## Lokale Nutzung

`TrackdayManager.html` direkt im Browser öffnen — keine Installation nötig.

---

## Daten sichern

Unter **Einstellungen → Export** — speichert alle Motorräder und Sessions als `.json` Datei.  
Mit **Import** auf einem anderen Gerät wiederherstellen.

- **Desktop (Chrome/Edge):** Speichern-Dialog mit Ordnerauswahl
- **iOS (Safari):** Share-Sheet → „In Dateien sichern"
