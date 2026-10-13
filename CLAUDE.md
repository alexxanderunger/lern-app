# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sprache

Immer auf Deutsch kommunizieren – Fragen, Antworten, Erklärungen und Rückfragen. Auch Texte in der App (Oberfläche, Aufgaben, Rückmeldungen) sind deutsch.

## Zweck des Projekts

Dies ist ein Lern- und Experimentierprojekt: Der Nutzer möchte sich mit Claude Code vertraut machen und ausloten, was damit möglich ist. Deshalb:

- Schritte kurz erklären (was wird gemacht und warum), statt nur das Ergebnis zu liefern.
- Bei passender Gelegenheit auf Claude-Code-Funktionen hinweisen, die gerade nützlich wären.
- Keine Programmierkenntnisse voraussetzen; Fachbegriffe beim ersten Auftreten kurz erläutern.

## Die App

Eine Lern-App für die Kinder des Nutzers (1. Schulklasse) zum Thema **Deutsch schreiben lernen**. Bisher gibt es eine Übung: Buchstaben nachspuren (A–Z, groß und klein). Weitere Übungen sind angedacht, aber nicht entschieden – vor dem Bauen mit dem Nutzer abstimmen.

Zielgruppe sind Leseanfänger: wenig Text, große Bedienelemente, Anweisungen möglichst über Bilder oder Ton, freundliche Rückmeldungen ohne Zeitdruck. Die Bedienung muss mit Finger, Stift und Maus funktionieren (Pointer Events).

## Starten

Reine Web-App aus HTML, CSS und JavaScript – ohne Build-Schritt, ohne Abhängigkeiten, ohne Tests. Auf dem Rechner sind weder Node.js noch Python installiert; deshalb gibt es `serve.ps1` als lokalen Webserver.

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1   # http://localhost:8123/
```

In Claude Code startet die Vorschau über die Konfiguration `lern-app` in `.claude/launch.json`. Ein Doppelklick auf `index.html` funktioniert für die Nutzung ebenfalls; die Vorschau in Claude Code braucht aber den Server.

Git ist installiert (`C:\Program Files\Git`), der Projektordner ist ein Repository mit dem Zweig `main`. Geplant ist die Veröffentlichung über GitHub Pages als installierbare Web-App (PWA) für das Tablet.

## Aufbau

`index.html` (Gerüst), `style.css` (Aussehen), `app.js` (gesamte Logik). Bezeichner und Kommentare im Code sind deutsch.

Zwei Canvas-Flächen liegen übereinander: `#vorlage` zeigt den grauen Buchstaben, auf `#zeichnung` malt das Kind. Die Prüfung in `pruefe()` ist ein Pixelvergleich: Aus der Vorlage entsteht eine Maske; gemessen wird, welcher Anteil der Maske übermalt ist (`ZIEL_ABDECKUNG`) und welcher Anteil der Farbe danebenliegt (`MAX_DANEBEN`). Strichreihenfolge und -richtung werden nicht geprüft.

`STIFTBREITE`, `ZIEL_ABDECKUNG` und `MAX_DANEBEN` hängen zusammen und sind durch Ausprobieren abgestimmt: Der Stift muss ungefähr so breit sein wie die Buchstabenlinie, sonst ist das Ziel auch bei sauberem Nachspuren nicht erreichbar. Nach Änderungen an einem der Werte oder an der Schrift im Browser nachspuren und prüfen.

Die Buchstabenform kommt aus einer Systemschrift (`SCHRIFT`, unter Windows greift Comic Sans MS). Geschaffte Buchstaben stehen im `localStorage` unter `buchstaben-geschafft`. Vorgelesen wird über die Sprachausgabe des Browsers (`speechSynthesis`, `de-DE`).
