# Build and deploy to docs folder for GitHub Pages
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Building web..." -ForegroundColor Cyan
npx expo export --platform web --output-dir docs

# Restore .nojekyll (wiped by expo export)
Write-Host "Creating .nojekyll..." -ForegroundColor Cyan
New-Item -ItemType File -Path "docs\.nojekyll" -Force | Out-Null

# Fix viewport meta tag and CSS reset
Write-Host "Fixing viewport..." -ForegroundColor Cyan
$html = [System.IO.File]::ReadAllText("$PWD\docs\index.html")
$html = $html -replace 'content="width=device-width, initial-scale=1[^"]*"', 'content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"'
$cssReset = "      html, body { height: 100dvh; margin: 0; padding: 0; background-color: #FFF8E7; }`n      body { overflow: auto; }`n      #root { display: flex; height: 100dvh; flex: 1; }"
$html = $html -replace '(?s)<style id="expo-reset">.*?</style>', "<style id=`"expo-reset`">`n$cssReset`n    </style>"
[System.IO.File]::WriteAllText("$PWD\docs\index.html", $html)

# Fix script path in index.html for GitHub Pages /fruitBox/ subpath
Write-Host "Fixing index.html script path..." -ForegroundColor Cyan
$html = [System.IO.File]::ReadAllText("$PWD\docs\index.html")
$fixed = $html -replace 'src="/_expo/', 'src="/fruitBox/_expo/'
$fixed = $fixed -replace 'src="_expo/', 'src="/fruitBox/_expo/'
[System.IO.File]::WriteAllText("$PWD\docs\index.html", $fixed)

# Fix asset paths in JS bundle (images referenced as /assets/...)
Write-Host "Fixing asset paths in JS bundle..." -ForegroundColor Cyan
$jsFile = Get-ChildItem -Path "docs\_expo\static\js\web" -Filter "AppEntry-*.js" | Select-Object -First 1
if ($jsFile) {
    $js = [System.IO.File]::ReadAllText($jsFile.FullName)
    $js = $js -replace '"/assets/', '"/fruitBox/assets/'
    $js = $js -replace '"assets/', '"/fruitBox/assets/'
    # Replace 100vh with 100dvh for better mobile viewport handling
    $js = $js -replace '100vh', '100dvh'
    [System.IO.File]::WriteAllText($jsFile.FullName, $js)
    Write-Host "Fixed: $($jsFile.Name)" -ForegroundColor Yellow
}

# Copy font files referenced by the bundle (with hashed filename)
Write-Host "Copying font files..." -ForegroundColor Cyan
$jsFile2 = Get-ChildItem -Path "docs\_expo\static\js\web" -Filter "AppEntry-*.js" | Select-Object -First 1
if ($jsFile2) {
    $jsContent = [System.IO.File]::ReadAllText($jsFile2.FullName)
    $fontMatches = [regex]::Matches($jsContent, 'node_modules/@expo-google-fonts/fredoka/([^/]+)/([^"]+\.ttf)')
    foreach ($m in $fontMatches) {
        $subdir = $m.Groups[1].Value
        $hashedName = $m.Groups[2].Value
        $srcTtf = Get-ChildItem -Path "node_modules\@expo-google-fonts\fredoka\$subdir" -Filter "*.ttf" | Select-Object -First 1
        if ($srcTtf) {
            $dstDir = "docs\assets\node_modules\@expo-google-fonts\fredoka\$subdir"
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
            Copy-Item $srcTtf.FullName -Destination "$dstDir\$hashedName" -Force
            Write-Host "Font copied: $hashedName" -ForegroundColor Yellow
        }
    }
}


# Copy icon
Write-Host "Copying icon..." -ForegroundColor Cyan
Copy-Item "src\assets\img\icon.png" -Destination "docs\icon.png" -Force

# Generate PWA manifest.json
Write-Host "Generating manifest.json..." -ForegroundColor Cyan
$manifest = @{
  name = "Fruit Box"
  short_name = "FruitBox"
  description = "Collect & Stack fruits!"
  start_url = "/fruitBox/"
  scope = "/fruitBox/"
  display = "standalone"
  orientation = "portrait"
  background_color = "#FFF8E7"
  theme_color = "#FF4444"
  icons = @(
    @{ src = "/fruitBox/icon.png"; sizes = "192x192"; type = "image/png"; purpose = "any maskable" },
    @{ src = "/fruitBox/icon.png"; sizes = "512x512"; type = "image/png"; purpose = "any maskable" }
  )
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$PWD\docs\manifest.json", $manifest)

# Generate sw.js
Write-Host "Generating sw.js..." -ForegroundColor Cyan
$cacheVersion = Get-Date -Format "yyyyMMddHHmmss"
$sw = @"
// Service Worker Version: $cacheVersion
const CACHE_NAME = 'fruitbox-$cacheVersion';
const STATIC_ASSETS = ['/fruitBox/', '/fruitBox/index.html', '/fruitBox/manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then((cached) => cached || caches.match('/fruitBox/index.html')))); });
"@
[System.IO.File]::WriteAllText("$PWD\docs\sw.js", $sw)

# Patch index.html for PWA meta tags and service worker
Write-Host "Patching index.html for PWA..." -ForegroundColor Cyan
$html = [System.IO.File]::ReadAllText("$PWD\docs\index.html")
if ($html -notmatch 'rel="manifest"') {
  $heightFixScript = '<script>(function(){function fixHeight(){var h=window.visualViewport?window.visualViewport.height:window.innerHeight;document.documentElement.style.height=h+''px'';document.body.style.height=h+''px'';var root=document.getElementById(''root'');if(root)root.style.height=h+''px'';}window.addEventListener(''load'',function(){setTimeout(fixHeight,100);setTimeout(fixHeight,500);});window.addEventListener(''resize'',fixHeight);window.addEventListener(''scroll'',fixHeight);if(window.visualViewport)window.visualViewport.addEventListener(''resize'',fixHeight);})();</script>'
  $pwaHead = $heightFixScript + '<link rel="manifest" href="/fruitBox/manifest.json" /><link rel="apple-touch-icon" href="/fruitBox/icon.png" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-title" content="FruitBox" /><meta name="mobile-web-app-capable" content="yes" />'
  $swScript = '<script>if(''serviceWorker''in navigator){window.addEventListener(''load'',()=>{navigator.serviceWorker.register(''/fruitBox/sw.js?v=$cacheVersion'');});}</script>'
  $html = $html -replace '</head>', "$pwaHead</head>"
  $html = $html -replace '</body>', "$swScript</body>"
  $html = $html -replace 'href="/favicon.ico"', 'href="/fruitBox/favicon.ico"'
  [System.IO.File]::WriteAllText("$PWD\docs\index.html", $html)
}

Write-Host "Done! docs/ is ready for GitHub Pages." -ForegroundColor Green
