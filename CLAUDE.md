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

Git ist installiert (`C:\Program Files\Git`), der Projektordner ist ein Repository mit dem Zweig `main`. In einer frisch gestarteten Shell fehlt Git unter Umständen im `PATH`; dann den vollen Pfad `C:\Program Files\Git\cmd\git.exe` verwenden.

## Veröffentlichung

Ziel ist GitHub Pages unter `https://alexxanderunger.github.io/lern-app/` (Repository `alexxanderunger/lern-app`, Zweig `main`). Die App liegt dort in einem Unterordner, deshalb im Code nur relative Pfade verwenden.

Die App ist eine installierbare Web-App (PWA): `manifest.webmanifest` beschreibt Name und Symbol, `sw.js` speichert die Dateien für den Offline-Betrieb (Strategie „Netz zuerst"). Neue Dateien, die offline gebraucht werden, in die Liste `DATEIEN` in `sw.js` eintragen.

Commits verwenden die anonyme Adresse `alexxanderunger@users.noreply.github.com`, nicht die private E-Mail des Nutzers.

## Aufbau

`index.html` (Gerüst), `style.css` (Aussehen), `app.js` (gesamte Logik). Bezeichner und Kommentare im Code sind deutsch.

Zwei Canvas-Flächen liegen übereinander: `#vorlage` zeigt den grauen Buchstaben, auf `#zeichnung` malt das Kind. Die Prüfung in `pruefe()` ist ein Pixelvergleich: Aus der Vorlage entstehen zwei Masken: der ganze Buchstabe (`maske`) und seine Mittellinie (`kern`, der Buchstabe abzüglich eines Randes von `KERN_RAND`). Die Mittellinie wird in Felder von `FELD` Pixeln aufgeteilt. Erfolg heißt: In (fast) jedem Feld ist die Mittellinie zu mindestens `FELD_ZIEL` übermalt, und höchstens `MAX_DANEBEN` der Farbe liegt außerhalb des Buchstabens. Strichreihenfolge und -richtung werden nicht geprüft.

Zwei Erfahrungen stecken in diesem Verfahren, beide nicht wieder aufgeben: Eine reine Flächenmessung übersieht kurze Striche (das „A" galt ohne Querstrich als geschafft), deshalb die Felder. Und die Prüfung auf der vollen Buchstabenbreite war dem Nutzer zu streng (man musste den grauen Streifen ganz ausmalen), deshalb zählt nur die Mittellinie.

Nach Änderungen an `STIFTBREITE`, den Schwellen oder der Schrift im Browser nachspuren und beide Fälle prüfen: ungenau, aber vollständig nachgespurt (muss gelingen) und ein Strich ausgelassen (darf nicht gelingen).

Die Buchstabenform kommt aus der mitgelieferten Schulschrift Andika (`fonts/`, SIL Open Font License, nur lateinischer Zeichensatz). Sie lädt nach dem ersten Zeichnen; `app.js` zeichnet die Vorlage dann neu, weil ein Canvas Schriftwechsel nicht selbst bemerkt. Geschaffte Buchstaben stehen im `localStorage` unter `buchstaben-geschafft`. Vorgelesen wird über die Sprachausgabe des Browsers (`speechSynthesis`, `de-DE`).
