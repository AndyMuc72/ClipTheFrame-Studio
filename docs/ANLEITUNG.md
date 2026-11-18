# ClipTheFrame Studio · v1.1.0

## Start

`Starten.cmd` doppelt anklicken. Node.js, FFmpeg und FFprobe liegen lokal im Ordner `tools`. Das Konsolenfenster während der Nutzung offen lassen. Der Starter wählt einen freien lokalen Port und prüft die Version der neu gestarteten Instanz. Nach Programmänderungen Starten.cmd erneut öffnen und das neu geöffnete Browserfenster verwenden. Ein alter Tab kann weiterhin mit einem älteren Server verbunden sein.

## Bedienung

- In die leere Vorschau klicken, oder eine Datei ins Fenster ziehen. Der Klick öffnet die native Windows-Dateiauswahl und merkt sich den Originalordner. Bei geladenem Video schaltet ein Klick in die Vorschau zwischen Play und Pause um. Eingaben: MP4, MOV, MKV, AVI, WebM, M4V, MPEG/MPG, MTS/M2TS, TS, WMV, FLV, 3GP, OGV, VOB und MXF, sofern FFmpeg den enthaltenen Codec lesen kann. Bei Bedarf wird lokal eine Browser-Vorschau konvertiert. Der Export verwendet das Original.
- Den kleinen Griff unter der Videovorschau mit der Maus nach oben/unten ziehen, um ihre Höhe zu verändern. Alternativ den Griff fokussieren und die Pfeiltasten verwenden. Die Höhe wird begrenzt, damit die Timeline erreichbar bleibt.
- Timeline: Linksklick setzt den Anfang; Shift + Linksklick setzt das Ende. Shift + Ziehen markiert einen Bereich, auch rückwärts. Die beiden Schnittgriffe und die Zeitfelder funktionieren weiterhin. Rechtsziehen verschiebt die gezoomte Timeline. Das Kontextmenü ist deaktiviert.
- Mausrad über der Timeline zoomt um die Mausposition, auch mit Strg. Bis 64-fach. Die Vorschaubilder werden für den sichtbaren Zeitbereich neu erzeugt. Prozentknopf setzt auf die Gesamtlänge zurück.
- Der Titeltext wird unabhängig von seiner Einblendung für den Dateinamen verwendet. „Titel im Video anzeigen“ schaltet die Einblendung an/aus; der Schnellschnitt blendet ihn grundsätzlich aus.
- Titel, Startverzögerung und Einblenddauer wählen. Die Startverzögerung bezieht sich auf den Ausschnitt, nicht auf das Original. „Titel platzieren“ springt zur Einblendung und pausiert das Video. In den Titel klicken, um ihn direkt im Bild zu bearbeiten; Enter fügt einen Zeilenumbruch ein. Am ✥-Griff oder am Rahmen verschieben; acht Griffe an Seiten und Ecken ändern die Größe. Die Textfeldbreite bleibt auf die Videobreite begrenzt. Lange Zeilen und lange Wörter werden automatisch umgebrochen. Falls der Text sonst höher als das Bild wäre, wird die Schrift beim Darstellen verkleinert. Die Schriftgröße kann auch als Prozent der Bildhöhe eingegeben werden. Position und Größe werden auf die tatsächliche Bildfläche bezogen, unabhängig von schwarzen Vorschau-Rändern und der gewählten Exportauflösung. „Zentrieren“ setzt die Position zurück. Unter „Schrift, Farbe & Gestaltung“ stehen Arial, Verdana, Georgia, Courier New, Tahoma und Trebuchet MS, Textfarbe, Fett, Kursiv, Konturfarbe und -stärke, Schatten, Hintergrund und Textausrichtung bereit. Die Gestaltung gilt für den gesamten Titel. Beim Export wird eine transparente Titelgrafik mit dem ausgewählten Layout erzeugt, damit Zeilenumbrüche und Gestaltung erhalten bleiben. Schnittvorschau zeigt den zeitversetzten Titel; die exakte Schriftgestaltung erfolgt beim Export.

## Schneller schneiden

Unter „Schnittmodus“ steht zusätzlich „Schnellschnitt · ohne Neukodierung“ bereit. Dieser kopiert die ursprünglichen komprimierten Video- und Audiopakete. Der Titeltext bleibt für den Dateinamen erhalten, wird im Schnellschnitt jedoch nicht eingeblendet. Der Haken „Titel im Video anzeigen“ wird entfernt und ausgegraut; beim Wechsel zum präzisen Modus wird seine vorherige Einstellung wiederhergestellt. Er benötigt Originalgröße, Original-Bildrate und ein zu den Original-Codecs passendes Zielformat. Qualität und Berechnung haben dabei keine Wirkung. Die Schnittpunkte sind an Schlüsselbilder gebunden und können von der Auswahl abweichen. Für genaue Schnittpunkte, Titel oder eine Auflösungsänderung den präzisen Modus verwenden.

„Ultraschnell“ beschleunigt die Neukodierung von MP4/MOV/MKV (H.264) und WebM. Bei gleicher Qualitätsstufe kann die Datei größer werden. AVI verwendet weiterhin seine eigene Kodierung; die Berechnungsauswahl wirkt dort nicht.

## Export

- Formate: MP4, MOV und MKV mit H.264/AAC; AVI mit MPEG-4/MP3; WebM mit VP9/Opus. Der Export konvertiert Bild und Ton.
- Auflösung: Originalgröße oder kleinere Presets E-Mail (360p), Handy (480p), HD (720p), PC (Full HD), Monitor (QHD) und TV (UHD/4K). Nur Presets unterhalb der Originalauflösung werden angeboten; der Server prüft dies nochmals. Hochformat behält seine Orientierung. Gerade Pixelmaße können zu minimalen Rundungsabweichungen führen.
- Dateigröße: Sofortige grobe Schätzung anhand von Auflösung, Bildrate und Qualität. „Größe berechnen & vergleichen“ konvertiert kurze Stichproben und vergleicht das gewählte Format sowie MP4 und WebM. Der kleinste Schätzwert wird vorgeschlagen; die Empfehlung lässt sich übernehmen. Szenenabhängige Abweichungen sind möglich, der angezeigte Richtbereich ist kein garantierter Grenzwert. Nach dem Export wird die tatsächliche Größe angezeigt.
- Qualität: Hoch, Ausgewogen oder Kleine Datei. Die Auswahl steuert auch die Audio-Bitrate. Kleinere Auflösung bedeutet nicht zwangsläufig eine kleinere Datei als das Original; Codec, Dauer und Qualitätsstufe beeinflussen die Dateigröße.
- Bildrate: Original oder eine niedrigere Bildrate. Keine Erhöhung der ursprünglichen Bildrate.
- Berechnung: Schnell, Ausgewogen oder Beste Kompression. Eine langsamere Einstellung kann bei ähnlicher Bildqualität kleinere Dateien erzielen; bei AVI ist diese Einstellung ohne Wirkung.
- Der Dateinamenvorschlag lautet `JJJJ-MM-TT Titel.ext`. Fehlt ein Titel, wird der Originalname verwendet. Das Erstellungsdatum stammt aus den Video-Metadaten (UTC). Fehlt es, wird das Änderungsdatum vorgeschlagen und ausdrücklich gekennzeichnet. Das Windows-Dateierstellungsdatum ist über den Browser nicht zugänglich. Datum und Dateiname sind editierbar.
- Während des Exports zeigt ein Fortschrittsbalken den von FFmpeg gemeldeten Bearbeitungsstand in Prozent sowie eine geschätzte Restzeit an. Zu Beginn wird die Restzeit erst berechnet; sie kann sich bei aufwendigeren Szenen ändern. 100 Prozent wird erst nach erfolgreichem Abschluss angezeigt. Mit „Abbrechen“ wird der zugehörige FFmpeg-Prozess beendet. Danach werden die unvollständige Exportdatei und ihre Titel-Arbeitsdateien entfernt; Original und Schnittauswahl bleiben erhalten. Ein erneuter Export ist direkt möglich. Ein bereits fertiger Export wird durch einen verspäteten Abbruch nicht gelöscht.
- „Schneiden & Speichern“ erstellt den Schnitt und speichert ihn im Originalverzeichnis. Existiert der vorgeschlagene Name bereits, öffnet sich der Speicherdialog: Überschreiben muss bestätigt werden; alternativ einen neuen Namen wählen oder abbrechen.
- Darunter stehen „Schneiden“ und rechts daneben „Speichern“. Schneiden erstellt nur den Export. Speichern schreibt den fertigen Schnitt in den Originalordner; bei einer Namenskollision gilt dieselbe Rückfrage. Der vollständige Zielpfad bleibt sichtbar.
- Bei Drag & Drop kennt der Browser den Originalpfad nicht. Vor dem ersten Speichern muss deshalb einmal dieselbe Originaldatei ausgewählt werden. Die Anwendung vergleicht die Dateiinhalte, bevor sie den Ordner übernimmt. Bei Öffnen per Klick in die leere Vorschau entfällt diese Zuordnung.
- Die Schnittzeiten stehen links unter der Vorschau in einer Zeile. Die bisherigen Knöpfe für Schnittvorschau, Stopp und Video öffnen sind entfernt. Ein Klick auf das geladene Video startet/pausiert den gewählten Ausschnitt.

Die Oberfläche ist bei 1920 × 980 nutzbarer Browserfläche ohne Seitenscrollen geprüft (entspricht beispielsweise Full HD mit Platz für Browserleisten). Schmale Fenster verwenden eine Anordnung untereinander; dort ist Scrollen möglich. Die Windows-Anzeigeskalierung und der Browserzoom beeinflussen den tatsächlich verfügbaren Platz. Bei besonders langen Vergleichsergebnissen kann zusätzlicher Platz nötig sein.

## Lokale Daten

Keine Videos werden ins Internet geladen. Arbeitskopien, Vorschauen und Exporte bleiben im Unterordner `data`; es gibt keine automatische Bereinigung. Der Ordner kann nach Beenden der Anwendung bereinigt werden. FFmpeg wird bei fehlender Installation über gyan.dev heruntergeladen.

## Entwicklung und Tests

Keine npm-Pakete erforderlich. `tools/node.exe server.js` startet den Server. `tools/node.exe test.js` prüft Zoom, Mausaktionen, Dateinamen, Auflösungsgrenzen und MP4-Datumsfelder. `tools/node.exe integration-test.js` prüft vier Eingabeformate, fünf Ausgabeformate, Vorschau, Titel, Ton, Auflösung, Bildrate und die Ablehnung einer Hochskalierung. Der Integrationstest erzeugt bei Bedarf selbst `tools/test-input.mp4` und erzeugt weitere Testdateien unter `tools` und `data`.


Fehlerprüfung: `tools/node.exe regression-test.js` testet Serverversion, JSON-Fehlerantworten, MP4-Auflösung, Metadaten-Fallback, Export und Größenvergleich.

Abbruchtest: `tools/node.exe cancellation-test.js` prüft das Beenden des Prozesses, die Bereinigung, unveränderte Originaldaten und einen erneuten Export.
