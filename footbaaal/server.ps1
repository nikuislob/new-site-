$ErrorActionPreference = "Stop"
$port = 3000
$root = $PSScriptRoot

Add-Type -AssemblyName System.Net.HttpListener
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "Could not start on port $port. Trying port 5500..."
  $port = 5500
  $listener = New-Object System.Net.HttpListener
  $prefix = "http://localhost:$port/"
  $listener.Prefixes.Add($prefix)
  $listener.Start()
}

Start-Process $prefix
Write-Host "Server running at $prefix"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
  ".json" = "application/json"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    $path = [Uri]::UnescapeDataString($request.Url.LocalPath)
    if ($path -eq "/" -or [string]::IsNullOrWhiteSpace($path)) { $path = "/index.html" }
    $path = $path -replace "/", [IO.Path]::DirectorySeparatorChar
    $file = Join-Path $root $path.TrimStart([IO.Path]::DirectorySeparatorChar)

    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes("File not found: $path")
      $response.ContentType = "text/plain; charset=utf-8"
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      $bytes = [IO.File]::ReadAllBytes($file)
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $response.StatusCode = 500
    $bytes = [Text.Encoding]::UTF8.GetBytes("Server error")
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } finally {
    $response.OutputStream.Close()
  }
}
