param(
    [Parameter(Mandatory=$true)]
    [string]$RepoPath
)

Write-Host "🔍 Scanning repo at: $RepoPath`n"

$results = @{
    DockerfileFound = $false
    ConsoleLoggingFound = $false
    FileOnlyLogging = $false
    IISStdOutEnabled = $false
    OpenTelemetryLogging = $false
    OpenTelemetryTracing = $false
    OpenTelemetryMetrics = $false
}

# 1. Check Dockerfile
$dockerfiles = Get-ChildItem -Path $RepoPath -Recurse -Filter "Dockerfile" -ErrorAction SilentlyContinue
if ($dockerfiles) {
    $results.DockerfileFound = $true
    Write-Host "✅ Dockerfile found at:" $dockerfiles.FullName
} else {
    Write-Host "❌ Dockerfile not found"
}

# 2. Detect Logging Configuration Files
$log4net = Get-ChildItem -Path $RepoPath -Recurse -Filter "*log4net*.config" -ErrorAction SilentlyContinue
$nlog = Get-ChildItem -Path $RepoPath -Recurse -Filter "NLog.config" -ErrorAction SilentlyContinue
$serilog = Get-ChildItem -Path $RepoPath -Recurse -Filter "*appsettings*.json" -ErrorAction SilentlyContinue

# Check log4net Console Appender
if ($log4net) {
    $content = Get-Content $log4net.FullName -Raw
    if ($content -match "ConsoleAppender") {
        $results.ConsoleLoggingFound = $true
        Write-Host "✅ log4net ConsoleAppender found"
    }
    if ($content -match "FileAppender") {
        $results.FileOnlyLogging = $true
        Write-Host "⚠️ log4net FileAppender detected (ensure console logging also enabled)"
    }
}

# Check NLog Console Target
if ($nlog) {
    $content = Get-Content $nlog.FullName -Raw
    if ($content -match "<target[^>]+type=`"Console`"") {
        $results.ConsoleLoggingFound = $true
        Write-Host "✅ NLog Console target found"
    }
    if ($content -match "<target[^>]+type=`"File`"") {
        $results.FileOnlyLogging = $true
        Write-Host "⚠️ NLog File target detected (ensure console logging also enabled)"
    }
}

# Check Serilog Console Sink
if ($serilog) {
    foreach ($file in $serilog) {
        $json = Get-Content $file.FullName -Raw
        if ($json -match "Serilog" -and $json -match "Console") {
            $results.ConsoleLoggingFound = $true
            Write-Host "✅ Serilog Console sink found in $($file.Name)"
        }
        if ($json -match "File" -and $json -match "Serilog") {
            $results.FileOnlyLogging = $true
            Write-Host "⚠️ Serilog File sink found (ensure console sink also enabled)"
        }
    }
}

# 3. Check IIS stdout logging in web.config
$webConfig = Get-ChildItem -Path $RepoPath -Recurse -Filter "web.config" -ErrorAction SilentlyContinue
if ($webConfig) {
    $web = Get-Content $webConfig.FullName -Raw
    if ($web -match "stdoutLogEnabled=""true""") {
        $results.IISStdOutEnabled = $true
        Write-Host "⚠️ IIS stdoutLogEnabled=true found — this creates files, not stdout"
    }
}

# 4. Check for OpenTelemetry
$csFiles = Get-ChildItem -Path $RepoPath -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue

foreach ($file in $csFiles) {
    $code = Get-Content $file.FullName -Raw

    # Logging
    if ($code -match "OpenTelemetry.Extensions.Logging" -or 
        $code -match "AddOpenTelemetry" -and $code -match "WithLogging") {
        $results.OpenTelemetryLogging = $true
    }

    # Tracing
    if ($code -match "WithTracing" -or 
        $code -match "AddOpenTelemetryTracing" -or
        $code -match "OpenTelemetry.Trace") {
        $results.OpenTelemetryTracing = $true
    }

    # Metrics
    if ($code -match "WithMetrics" -or
        $code -match "AddOpenTelemetryMetrics" -or
        $code -match "OpenTelemetry.Metrics") {
        $results.OpenTelemetryMetrics = $true
    }
}

if ($results.OpenTelemetryLogging) { Write-Host "✅ OpenTelemetry logging detected" }
if ($results.OpenTelemetryTracing) { Write-Host "📍 OpenTelemetry tracing detected" }
if ($results.OpenTelemetryMetrics) { Write-Host "📍 OpenTelemetry metrics detected" }

Write-Host "`n======================="
Write-Host "📊 TEST SUMMARY"
Write-Host "======================="

if ($results.DockerfileFound) { Write-Host "✅ Dockerfile exists" } else { Write-Host "❌ No Dockerfile" }

if ($results.ConsoleLoggingFound) { Write-Host "✅ Console logging configured" } else { Write-Host "❌ No Console logging detected" }

if ($results.FileOnlyLogging -and -not $results.ConsoleLoggingFound) {
    Write-Host "❌ File-only logging configured – stdout logging missing"
}

if ($results.IISStdOutEnabled) {
    Write-Host "⚠️ IIS stdoutLogEnabled=true (uses files, not stdout)"
}

if ($results.OpenTelemetryLogging) { Write-Host "✅ OpenTelemetry logging present" } else { Write-Host "❌ No OpenTelemetry logging found" }

Write-Host "`nDone."
