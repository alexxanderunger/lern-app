# Kleiner lokaler Webserver für die Entwicklung – liefert die Dateien dieses Ordners aus.
# Start: powershell -ExecutionPolicy Bypass -File serve.ps1
param([int]$Port = 8123)

$wurzel = $PSScriptRoot
$typen = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.woff2' = 'font/woff2'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.mp3'  = 'audio/mpeg'
}

$server = New-Object System.Net.HttpListener
$server.Prefixes.Add("http://localhost:$Port/")
$server.Start()
Write-Host "Server gestartet: http://localhost:$Port/  (Beenden mit Strg+C)"

try {
  while ($server.IsListening) {
    $kontext = $server.GetContext()
    $pfad = [Uri]::UnescapeDataString($kontext.Request.Url.AbsolutePath).TrimStart('/')
    if ($pfad -eq '') { $pfad = 'index.html' }
    $datei = [IO.Path]::GetFullPath((Join-Path $wurzel $pfad))

    # Eine fehlgeschlagene Anfrage (z. B. abgebrochene Verbindung) soll den Server nicht beenden.
    try {
      # Nur Dateien innerhalb des Projektordners ausliefern.
      if ($datei.StartsWith($wurzel) -and (Test-Path $datei -PathType Leaf)) {
        $inhalt = [IO.File]::ReadAllBytes($datei)
        $typ = $typen[[IO.Path]::GetExtension($datei).ToLower()]
        if (-not $typ) { $typ = 'application/octet-stream' }
        $kontext.Response.ContentType = $typ
        $kontext.Response.Headers.Add('Cache-Control', 'no-store')
        # Bei HEAD-Anfragen darf kein Inhalt gesendet werden.
        if ($kontext.Request.HttpMethod -ne 'HEAD') {
          $kontext.Response.ContentLength64 = $inhalt.Length
          $kontext.Response.OutputStream.Write($inhalt, 0, $inhalt.Length)
        }
      } else {
        $kontext.Response.StatusCode = 404
      }
      $kontext.Response.Close()
    } catch {
      Write-Host "Fehler bei /$pfad : $($_.Exception.Message)"
      try { $kontext.Response.Abort() } catch {}
    }
  }
} finally {
  $server.Stop()
}
