$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodePath = Join-Path $PSScriptRoot 'tools\node.exe'
if (-not (Test-Path -LiteralPath $nodePath)) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) { $nodePath = $nodeCommand.Source }
    else {
        New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot 'tools') -Force | Out-Null
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host 'Node.js wird einmalig von nodejs.org heruntergeladen.'
        $nodeBase = 'https://nodejs.org/dist/latest-v24.x/'
        $nodeHashes = (Invoke-WebRequest -Uri ($nodeBase + 'SHASUMS256.txt') -UseBasicParsing -TimeoutSec 60).Content
        $nodeMatch = [regex]::Match($nodeHashes, '(?m)^([a-f0-9]{64})\s+(node-v24\.[^\s]+-win-x64\.zip)\s*$')
        if (-not $nodeMatch.Success) { throw 'Die Node.js-Downloadinformationen konnten nicht gelesen werden.' }
        $nodeArchive = Join-Path $PSScriptRoot 'tools\node.zip'
        Invoke-WebRequest -Uri ($nodeBase + $nodeMatch.Groups[2].Value) -OutFile $nodeArchive -UseBasicParsing -TimeoutSec 180
        if ((Get-FileHash -LiteralPath $nodeArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $nodeMatch.Groups[1].Value) { throw 'Die Node.js-Pruefsumme stimmt nicht ueberein.' }
        Expand-Archive -LiteralPath $nodeArchive -DestinationPath (Join-Path $PSScriptRoot 'tools\node-dist') -Force
        $portableNode = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'tools\node-dist') -Filter node.exe -Recurse | Select-Object -First 1
        if (-not $portableNode) { throw 'Node.js konnte nicht eingerichtet werden.' }
        Copy-Item -LiteralPath $portableNode.FullName -Destination $nodePath
    }
}
$ffmpegPath = Join-Path $PSScriptRoot 'tools\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $ffmpegPath)) {
    New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot 'tools') -Force | Out-Null
    $archive = Join-Path $PSScriptRoot 'tools\ffmpeg.zip'
    Write-Host 'FFmpeg wird einmalig heruntergeladen. Das kann einige Minuten dauern.'
    Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $archive -TimeoutSec 180
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $PSScriptRoot 'tools\unpacked') -Force
    $binary = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'tools\unpacked') -Filter ffmpeg.exe -Recurse | Select-Object -First 1
    if (-not $binary) { throw 'FFmpeg konnte nicht eingerichtet werden.' }
    Copy-Item -LiteralPath $binary.FullName -Destination $ffmpegPath
}
$ffprobePath = Join-Path $PSScriptRoot 'tools\ffprobe.exe'
if (-not (Test-Path -LiteralPath $ffprobePath)) {
    $probeBinary = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'tools\unpacked') -Filter ffprobe.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $probeBinary) { throw 'FFprobe fehlt. Bitte FFmpeg mit FFprobe im tools-Ordner bereitstellen.' }
    Copy-Item -LiteralPath $probeBinary.FullName -Destination $ffprobePath
}
# Use a free port so an older running server cannot serve a newer UI.
$chosenPort = $null
foreach ($candidatePort in 8765..8795) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
    try { $listener.Start(); $chosenPort = $candidatePort; break } catch { } finally { $listener.Stop() }
}
if (-not $chosenPort) { throw 'Kein freier lokaler Port gefunden.' }
$instanceToken = [guid]::NewGuid().ToString()
$previousPort = $env:PORT
$previousInstance = $env:INSTANCE_TOKEN
try {
    $env:PORT = [string]$chosenPort
    $env:INSTANCE_TOKEN = $instanceToken
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList ('"' + (Join-Path $PSScriptRoot 'server.js') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
} finally {
    $env:PORT = $previousPort
    $env:INSTANCE_TOKEN = $previousInstance
}
$serverUrl = 'http://127.0.0.1:' + $chosenPort
try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($serverProcess.HasExited) { throw 'ClipTheFrame konnte nicht gestartet werden.' }
        try { $health = Invoke-RestMethod -Uri ($serverUrl + '/api/health') -TimeoutSec 1; $ready = $health.app -eq 'cliptheframe' -and $health.apiVersion -eq 8 -and $health.instance -eq $instanceToken } catch { }
        if ($ready) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw 'Der aktuelle ClipTheFrame-Server antwortet nicht.' }
    Start-Process $serverUrl
    Write-Host ('ClipTheFrame Studio ist bereit: ' + $serverUrl)
    Write-Host 'Dieses Fenster waehrend der Nutzung offen lassen.'
    Wait-Process -Id $serverProcess.Id
} finally {
    if (-not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue }
}
