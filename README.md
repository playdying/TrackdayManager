# 🏍 Trackday Manager

Mobile-first Web-App zur Verwaltung von Motorrad-Trackday-Daten.

**Live:** [playdying.github.io/TrackdayManager/TrackdayManager.html](https://playdying.github.io/TrackdayManager/TrackdayManager.html)

---

## Features

- **Motorräder** verwalten mit allen technischen Details (Motor, Fahrwerk, Bremsen, Gewicht, Umbauten)
- **Sessions erfassen** — Fahrwerk-Setup, Reifen, Elektronik, Bestzeit, Notizen
- **Zeiten-Übersicht** mit Bestzeit-Banner, Delta-Anzeige und Zeitverlauf-Chart
- **Filter** nach Motorrad, Strecke und Bedingung (Trocken / Nass)
- **Export / Import** als JSON-Backup (funktioniert auf iOS & Desktop)
- **Offline-fähig** — als PWA zum Homescreen hinzufügen

---

## Strecken

Assen IDM Kurs, Oschersleben, Mettet, Rijeka, Most, Brünn, Lausitzring, Spa, Zolder + eigene Strecken

---

## Technik

- Pure HTML / CSS / JavaScript — kein Framework, kein Server
- Alles in einer einzigen `TrackdayManager.html` Datei
- Datenspeicherung via `localStorage` — Daten bleiben lokal auf dem Gerät
- PWA mit Service Worker für Offline-Nutzung

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
