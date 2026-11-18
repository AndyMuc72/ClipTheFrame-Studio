<p align="center"><img src="logo.svg" width="84" alt="ClipTheFrame Studio Logo"></p>

# ClipTheFrame Studio

**v1.1.0 · mit KI erstellt**

**Einfach öffnen. Ausschnitt wählen. Speichern.**

ClipTheFrame Studio ist eine kleine, lokal laufende Videoschnitt-Anwendung für Windows. Sie ist bewusst auf **Einfachheit** aufgebaut: Videos am Anfang und Ende kürzen, einen einfachen Titel einblenden und bei Bedarf in ein anderes Format konvertieren.

## Funktionen

- **Videos schneiden:** Anfang und Ende direkt in der bebilderten Timeline oder als Zeit eingeben.
- **Vorschau:** Ins Video klicken für Play/Pause. Die Vorschau mit der Maus vergrößern und verkleinern.
- **Einfachen Titel anzeigen:** Text, Startzeit und Dauer einstellen. Direkt im Bild bearbeiten, verschieben und skalieren; mit Zeilenumbrüchen, Schriftarten, Farben und Konturen.
- **Konvertieren:** Als MP4, MOV, MKV, AVI oder WebM speichern.
- **Kleinere Dateien:** Auflösungs-Presets, Qualitätsstufen und eine geschätzte Dateigröße helfen bei der Auswahl.
- **Schnellschnitt:** Optional ohne Neukodierung. Die ursprünglichen Codecs bleiben erhalten; Schnittpunkte können an Schlüsselbildern abweichen. Titel und Auflösungsänderungen benötigen Neukodierung.
- **Speichern im Originalordner:** Dateinamenvorschlag aus Datum und Titel; Überschreiben erst nach Bestätigung.
- **Fortschritt:** Prozentanzeige, geschätzte Restzeit und Abbrechen.

## Videoformate

**Öffnen und schneiden:** MP4, MOV, MKV, AVI, WebM, M4V, MPEG/MPG, MTS/M2TS, TS, WMV, FLV, 3GP, OGV, VOB und MXF – sofern FFmpeg die enthaltenen Video- und Audio-Codecs unterstützt.

**Konvertieren und speichern:**

| Ausgabeformat | Video | Audio |
| --- | --- | --- |
| MP4 | H.264 | AAC |
| MOV | H.264 | AAC |
| MKV | H.264 | AAC |
| AVI | MPEG-4 | MP3 |
| WebM | VP9 | Opus |

Beim Schnellschnitt muss das Zielformat zu den ursprünglichen Codecs passen. Falls der Browser ein Eingabeformat nicht abspielen kann, wird bei Bedarf eine lokale Vorschaukopie erstellt.

## Start unter Windows

1. Über **Code → Download ZIP** herunterladen und entpacken, oder das Repository klonen.
2. **Starten.cmd** doppelt anklicken.
3. Beim ersten Start werden fehlende Werkzeuge eingerichtet: Node.js von [nodejs.org](https://nodejs.org/) sowie FFmpeg/FFprobe aus den [Windows-Builds von gyan.dev](https://www.gyan.dev/ffmpeg/builds/). Dafür ist Internet erforderlich. Die Prüfsumme des Node.js-Archivs wird geprüft.
4. Die Anwendung öffnet sich im Browser. Das Konsolenfenster während der Nutzung offen lassen.
5. Video öffnen, Ausschnitt wählen und **Schneiden & Speichern** drücken.

Vorgesehen für **Windows 10/11 mit x64-Prozessor**. Dateidialoge und Videobearbeitung laufen lokal. Eine vorhandene Node.js-Installation kann verwendet werden. Es werden keine npm-Pakete benötigt.

Die Werkzeuge und Videos sind **nicht** im Repository enthalten. Fehlende Werkzeuge werden im Unterordner `tools` eingerichtet.

## Bedienung in Kürze

| Aktion | Bedienung |
| --- | --- |
| Video öffnen | In die leere Vorschau klicken oder Drag & Drop |
| Play / Pause | Ins geladene Video klicken |
| Anfang setzen | Linksklick in die Timeline |
| Ende setzen | Shift + Linksklick |
| Bereich markieren | Shift + Ziehen |
| Timeline zoomen | Mausrad über der Timeline, auch mit Strg |
| Timeline verschieben | Rechte Maustaste gedrückt halten und ziehen |
| Titel bearbeiten | In den Titel klicken; Enter für einen Zeilenumbruch |

**Schneiden & Speichern** erledigt beide Schritte zusammen. Alternativ zuerst **Schneiden** und danach **Speichern**. Bei Drag & Drop muss das Original vor dem ersten Speichern einmal zugeordnet werden, da der Browser dessen vollständigen Windows-Pfad nicht übermittelt.

Im Schnellschnitt bleibt der Titel für den Dateinamen erhalten und wird nicht ins Video eingeblendet. Für Titel, Auflösungsänderungen und genaue Schnittpunkte den präzisen Modus verwenden.

## Lokal und übersichtlich

Videos werden nicht ins Internet hochgeladen. Arbeitskopien, Vorschauen und Exporte liegen lokal im Ordner `data`. Dieser wird nicht automatisch bereinigt. Exportgröße und Restzeit sind Schätzungen.

ClipTheFrame Studio konzentriert sich auf den einfachen Schnitt eines einzelnen Ausschnitts, eine Titel-Einblendung und die Formatkonvertierung.

Weitere Einstellungen stehen in der [Bedienungsanleitung](docs/ANLEITUNG.md).

## Entwicklung und Tests

Nach Einrichtung der Werkzeuge:

```powershell
.\tools\node.exe test.js
.\tools\node.exe regression-test.js
.\tools\node.exe integration-test.js
.\tools\node.exe cancellation-test.js
```

Die Tests erzeugen bei Bedarf eigene kurze Testvideos. Videos, lokale Werkzeuge und Testausgaben sind von Git ausgeschlossen.

**Technik:** Node.js, HTML/CSS/JavaScript, FFmpeg und FFprobe. Node.js und FFmpeg sind eigenständige Projekte mit eigenen Lizenzbedingungen; ihre Binärdateien werden hier nicht mitgeliefert.
