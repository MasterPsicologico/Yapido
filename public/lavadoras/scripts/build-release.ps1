#requires -Version 5.1
<#
.SYNOPSIS
    Compila y firma la APK + AAB release para Lavadoras.
.DESCRIPTION
    Ejecuta:
      1) next build (web → /out)
      2) cap sync android (mueve bundle a android/app/src/main/assets/public)
      3) gradlew bundleRelease    → produce app-release.aab  (Play Store)
      4) gradlew assembleRelease  → produce app-release.apk  (testing local)
.PARAMETER ApkOnly
    Solo generar .apk (testing)
.PARAMETER AabOnly
    Solo generar .aab (Play Store)
.EXAMPLE
    pwsh scripts/build-release.ps1
.EXAMPLE
    pwsh scripts/build-release.ps1 -ApkOnly
#>

[CmdletBinding()]
param(
    [switch]$ApkOnly,
    [switch]$AabOnly
)

$ErrorActionPreference = 'Stop'

# 0. Cargar credenciales del keystore si secrets/keystore.env existe.
$envFile = Join-Path $PSScriptRoot '..' 'secrets' 'keystore.env'
if (Test-Path -LiteralPath $envFile) {
    Write-Host "Cargando credenciales de $envFile" -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            # Map al alias que gradle espera
            switch -wildcard ($name) {
                'LAV_KEYSTORE_PASSWORD' { $env:LAV_KEYSTORE_PASS = $value }
                'LAV_KEY_ALIAS'         { $env:LAV_KEY_ALIAS = $value }
                'LAV_KEY_PASSWORD'      { $env:LAV_KEY_PASS = $value }
                'LAV_KEYSTORE_PATH'     { $env:LAV_KEYSTORE_PATH = $value }
                default { Set-Item -Path "env:$name" -Value $value }
            }
        }
    }
}

# 1. next build
Write-Host ""
Write-Host "1/4 · next build → /out" -ForegroundColor Magenta
& npm run build
if ($LASTEXITCODE -ne 0) { throw "next build falló." }

# 2. cap sync android
Write-Host ""
Write-Host "2/4 · cap sync android" -ForegroundColor Magenta
& npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync falló." }

# 3 + 4. Gradle
$gradlew = Join-Path $PSScriptRoot '..' 'android' 'gradlew.bat'
if (-not (Test-Path -LiteralPath $gradlew)) {
    throw "No se encontró $gradlew. ¿Corriste `npx cap add android`?"
}

Push-Location (Split-Path $gradlew -Parent)

try {
    if (-not $ApkOnly) {
        Write-Host ""
        Write-Host "3/4 · gradlew bundleRelease (→ .aab)" -ForegroundColor Magenta
        & .\gradlew.bat bundleRelease
        if ($LASTEXITCODE -ne 0) { throw "gradlew bundleRelease falló." }
    }
    if (-not $AabOnly) {
        Write-Host ""
        Write-Host "4/4 · gradlew assembleRelease (→ .apk)" -ForegroundColor Magenta
        & .\gradlew.bat assembleRelease
        if ($LASTEXITCODE -ne 0) { throw "gradlew assembleRelease falló." }
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=========" -ForegroundColor Green
Write-Host "✅ Build completo." -ForegroundColor Green
Write-Host "=========" -ForegroundColor Green
$appBuild = Join-Path $PSScriptRoot '..' 'android' 'app' 'build' 'outputs'
Write-Host ""
Write-Host "Archivos:" -ForegroundColor Yellow
Get-ChildItem -Path $appBuild -Recurse -Include '*.apk','*.aab' | Where-Object { $_.DirectoryName -match 'release' } | ForEach-Object {
    $size = '{0:N2} MB' -f ($_.Length / 1MB)
    Write-Host ("  · {0}  ({1})" -f $_.FullName, $size)
}
Write-Host ""
