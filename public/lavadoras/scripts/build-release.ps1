#requires -Version 5.1
<#
.SYNOPSIS
    Compila y firma la APK + AAB release para Lavadoras.

.DESCRIPTION
    Steps:
      1) next build  -> /out
      2) cap sync android
      3) gradlew bundleRelease   -> app-release.aab (Play Store)
      4) gradlew assembleRelease -> app-release.apk (testing local)
#>

[CmdletBinding()]
param(
    [switch]$ApkOnly,
    [switch]$AabOnly
)

$ErrorActionPreference = 'Stop'

# 0. Cargar credenciales del keystore si secrets/keystore.env existe.
$candidates = @()
if ($PSScriptRoot) {
    $candidates += (Join-Path $PSScriptRoot '..\secrets\keystore.env')
}
$candidates += (Join-Path (Get-Location) 'secrets\keystore.env')

$envFile = $null
foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) {
        $envFile = $c
        break
    }
}

if ($envFile) {
    Write-Host ("Cargando credenciales de {0}" -f $envFile) -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            switch -wildcard ($name) {
                'LAV_KEYSTORE_PASSWORD' { $env:LAV_KEYSTORE_PASS = $value; break }
                'LAV_KEY_ALIAS'         { $env:LAV_KEY_ALIAS = $value; break }
                'LAV_KEY_PASSWORD'      { $env:LAV_KEY_PASS = $value; break }
                'LAV_KEYSTORE_PATH'     { $env:LAV_KEYSTORE_PATH = $value; break }
                default { Set-Item -Path "env:$name" -Value $value }
            }
        }
    }
} else {
    Write-Host '(Aviso) secrets/keystore.env no encontrado. Build sin firma de release.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '1/4 next build' -ForegroundColor Magenta
cmd.exe /c 'npm run build'
if ($LASTEXITCODE -ne 0) { throw 'next build falló.' }

Write-Host ''
Write-Host '2/4 cap sync android' -ForegroundColor Magenta
cmd.exe /c 'npx cap sync android'
if ($LASTEXITCODE -ne 0) { throw 'cap sync falló.' }

$androidDir = $null
if ($PSScriptRoot) {
    $androidDir = Join-Path $PSScriptRoot '..\android'
}
if (-not $androidDir -or -not (Test-Path -LiteralPath $androidDir)) {
    $androidDir = Join-Path (Get-Location) 'android'
}
$gradlew = Join-Path $androidDir 'gradlew.bat'
if (-not (Test-Path -LiteralPath $gradlew)) {
    throw ("No se encontro {0}." -f $gradlew)
}

Push-Location $androidDir
try {
    # Detectar JAVA_HOME si no está en la sesión actual
    if (-not $env:JAVA_HOME) {
        $candidates = @(
            'C:\Program Files\Android\Android Studio\jbr',
            "$env:LOCALAPPDATA\Android\Studio\jbr"
        )
        foreach ($c in $candidates) {
            if (Test-Path -LiteralPath (Join-Path $c 'bin\java.exe')) {
                $env:JAVA_HOME = $c
                break
            }
        }
    }
    if (-not $env:JAVA_HOME) {
        throw 'JAVA_HOME no está definido. Configúralo o reinicia en una sesión con él.'
    }

    if (-not $ApkOnly) {
        Write-Host ''
        Write-Host '3/4 gradlew bundleRelease (aab)' -ForegroundColor Magenta
        cmd.exe /c "set JAVA_HOME=$env:JAVA_HOME&& gradlew.bat bundleRelease"
        if ($LASTEXITCODE -ne 0) { throw 'gradlew bundleRelease fallo.' }
    }
    if (-not $AabOnly) {
        Write-Host ''
        Write-Host '4/4 gradlew assembleRelease (apk)' -ForegroundColor Magenta
        cmd.exe /c "set JAVA_HOME=$env:JAVA_HOME&& gradlew.bat assembleRelease"
        if ($LASTEXITCODE -ne 0) { throw 'gradlew assembleRelease fallo.' }
    }
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '=========' -ForegroundColor Green
Write-Host 'OK: Build completo.' -ForegroundColor Green
Write-Host '=========' -ForegroundColor Green

$appBuild = Join-Path $androidDir 'app\build\outputs'
Write-Host ''
Write-Host 'Archivos:' -ForegroundColor Yellow
if (Test-Path -LiteralPath $appBuild) {
    Get-ChildItem -Path $appBuild -Recurse -Include '*.apk','*.aab' |
        Where-Object { $_.DirectoryName -match 'release' } |
        ForEach-Object {
            $size = ('{0:N2} MB' -f ($_.Length / 1MB))
            Write-Host ("  {0}  ({1})" -f $_.FullName, $size)
        }
}
Write-Host ''
