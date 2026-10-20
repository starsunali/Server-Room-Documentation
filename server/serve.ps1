# RackFlow local database server — static files + JSON file DB
#   powershell -NoProfile -ExecutionPolicy Bypass -File server\serve.ps1 [-Port 8082]
# Serves the site exactly like `python3 -m http.server`, plus:
#   GET  /api/state  -> data\rackflow-db.json  (404 when no DB file exists yet)
#   POST /api/state  -> validates + atomically writes the JSON DB
#   GET  /api/health -> 200 ok
param([int]$Port = 8082)

$root    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dbPath  = Join-Path $root 'data\rackflow-db.json'
$dbDir   = Split-Path -Parent $dbPath
if (!(Test-Path $dbDir)) { New-Item -ItemType Directory -Path $dbDir | Out-Null }

$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='application/javascript; charset=utf-8'; '.svg'='image/svg+xml'
  '.png'='image/png'; '.md'='text/markdown; charset=utf-8'; '.json'='application/json'
  '.env'='text/plain'; '.sh'='text/plain'; '.ps1'='text/plain'; '.bat'='text/plain'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Output "RackFlow running on http://127.0.0.1:$Port/"
Write-Output "Database file: $dbPath"

function Send-Response($ctx, [int]$code, $bytes, [string]$type) {
  $ctx.Response.StatusCode = $code
  $ctx.Response.ContentType = $type
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
function Send-Json($ctx, [int]$code, [string]$json) {
  Send-Response $ctx $code ([Text.Encoding]::UTF8.GetBytes($json)) 'application/json; charset=utf-8'
}

while ($true) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath
  try {
    if ($path -eq '/api/health') {
      Send-Response $ctx 200 ([Text.Encoding]::UTF8.GetBytes('ok')) 'text/plain'
    }
    elseif ($path -eq '/api/state') {
      if ($ctx.Request.HttpMethod -eq 'GET') {
        if (Test-Path $dbPath) {
          Send-Response $ctx 200 ([IO.File]::ReadAllBytes($dbPath)) 'application/json; charset=utf-8'
        } else {
          Send-Json $ctx 404 '{"error":"no database yet"}'
        }
      }
      elseif ($ctx.Request.HttpMethod -eq 'POST') {
        $reader = New-Object IO.StreamReader($ctx.Request.InputStream, $ctx.Request.ContentEncoding)
        $body = $reader.ReadToEnd()
        $ok = $false
        try {
          $obj = $body | ConvertFrom-Json
          $ok = ($null -ne $obj.racks -and $null -ne $obj.users)
        } catch { $ok = $false }
        if ($ok) {
          $tmp = "$dbPath.tmp"
          [IO.File]::WriteAllText($tmp, $body)
          Move-Item -Force $tmp $dbPath
          Send-Json $ctx 200 '{"ok":true}'
        } else {
          Send-Json $ctx 400 '{"error":"expected JSON with racks[] and users[]"}'
        }
      }
      else { Send-Json $ctx 405 '{"error":"use GET or POST"}' }
    }
    else {
      # ---- static files (SPA fallback to the login page, like docker/nginx.conf) ----
      $rel = $path
      if ($rel -eq '/') { $rel = '/index.html' }
      $file = Join-Path $root ($rel.TrimStart('/').Replace('/', '\'))
      if (!(Test-Path $file -PathType Leaf)) {
        $file = Join-Path $root 'index.html'
        Send-Response $ctx 200 ([IO.File]::ReadAllBytes($file)) 'text/html; charset=utf-8'
      } else {
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $type = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        Send-Response $ctx 200 ([IO.File]::ReadAllBytes($file)) $type
      }
    }
  } catch {
    try { Send-Json $ctx 500 '{"error":"server error"}' } catch {}
  }
}
