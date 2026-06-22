Add-Type -AssemblyName System.Net.Http

$port = 8091
$root = "c:\Users\User\Documents\Siscar"

$listener = [System.Net.HttpListener]::new()
try {
    $listener.Prefixes.Add("http://+:$port/")
    $listener.Start()
} catch {
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host "✅ Servidor rodando em http://localhost:$port/" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar." -ForegroundColor Yellow

$mimes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff2"= "font/woff2"
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $reqPath = $ctx.Request.Url.LocalPath
        if ($reqPath -eq "/" -or $reqPath -eq "") { $reqPath = "/index.html" }
        $filePath = Join-Path $root ($reqPath.TrimStart("/").Replace("/", "\"))
        $res = $ctx.Response
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.StatusCode = 200
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.LongLength
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found: $reqPath")
            $res.ContentLength64 = $notFound.Length
            $res.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $res.Close()
    } catch [System.Net.HttpListenerException] {
        break
    } catch {
        try { $ctx.Response.Close() } catch {}
    }
}
$listener.Stop()
