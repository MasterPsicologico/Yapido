#requires -Version 5.1
<#
.SYNOPSIS
    Genera un keystore (.jks) firmado válido para subir apps a Google Play Console.
.DESCRIPTION
    Crea un keystore RSA 2048 / 25 años de validez bajo secrets/lav-release.jks.
    NO COMMITEAR el resultado. Las contraseñas se guardan en secrets/keystore.env.
    Ver DEPLOY_GUIDE.md para instrucciones en Play Store (Play App Signing).
.PARAMETER OutDir
    Carpeta donde guardar el .jks. Default: <repo>/secrets
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/generate-keystore.ps1
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/generate-keystore.ps1 -OutDir "C:\ruta\secrets"
#>

[CmdletBinding()]
param(
    [string]$OutDir = ''
)

$ErrorActionPreference = 'Stop'

# Resolver OutDir si llega vacío
if ([string]::IsNullOrEmpty($OutDir)) {
    if ($PSScriptRoot) {
        $OutDir = Join-Path $PSScriptRoot '..\secrets'
    } else {
        $OutDir = Join-Path (Get-Location) 'secrets'
    }
}

# 1. Detectar Java
$java = Get-Command java -ErrorAction SilentlyContinue
if (-not $java) {
    $candidatos = @(
        'C:\Program Files\Android\Android Studio\jbr\bin\java.exe',
        "$env:LOCALAPPDATA\Android\Studio\jbr\bin\java.exe"
    )
    foreach ($c in $candidatos) {
        if (Test-Path -LiteralPath $c) {
            $env:PATH = (Split-Path $c -Parent) + ';' + $env:PATH
            $env:JAVA_HOME = Split-Path (Split-Path $c -Parent) -Parent
            $java = Get-Command java -ErrorAction SilentlyContinue
            if ($java) { break }
        }
    }
}
if (-not $java) {
    throw 'Java no instalado. Instala JDK 17+ (Android Studio lo trae) y vuelve a correr.'
}

# 2. Carpeta secrets/
if (-not (Test-Path -LiteralPath $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
    Write-Host "Carpeta $OutDir creada." -ForegroundColor Green
}

# 3. Generar contraseña aleatoria segura (32 chars).
function New-RandomPassword([int]$len = 32) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $bytes = New-Object byte[] $len
        $rng.GetBytes($bytes)
        $sb = New-Object System.Text.StringBuilder
        foreach ($b in $bytes) {
            $idx = [int]$b % $chars.Length
            if ($idx -lt 0) { $idx += $chars.Length }
            $sb.Append($chars[$idx]) | Out-Null
        }
        return $sb.ToString()
    } finally {
        $rng.Dispose()
    }
}

$storePass = New-RandomPassword 32
$keyPass = New-RandomPassword 32
$alias = 'lavadoras-upload'

# 4. Ruta del keystore
$jksPath = Join-Path $OutDir 'lav-release.jks'
if (Test-Path -LiteralPath $jksPath) {
    Write-Host "Ya existe $jksPath. Para rotarla, bórrala primero." -ForegroundColor Yellow
    exit 1
}

# 5. Distinguished Name encodeado (comas y OU)
$dn = 'CN=Lavadoras Yapido, OU=Yapido Click, O=Yapido Click, L=Aguachica, ST=Cesar, C=CO'

# 6. Construir args para keytool. Como muchos args tienen valores con comas,
#    pre-construimos cada par como 2 entradas (clave, valor) — Start-Process
#    lo reesparse, por eso usamos un .cmd batch.
$batchFile = Join-Path $OutDir '_genkey.bat'
$dnEscaped = $dn -replace '=', '^=' -replace ',', '^,'  # keytool genkey usa ^ escapado
$batch = @"
@echo off
keytool -genkeypair -v -keystore "$jksPath" -storetype JKS -storepass $storePass -keypass $keyPass -alias $alias -keyalg RSA -keysize 2048 -validity 9125 -dname "$dn"
"@
Set-Content -LiteralPath $batchFile -Value $batch -Encoding ASCII

Write-Host ''
Write-Host '=> Generando keystore RSA 2048 / 25 anyos:' -ForegroundColor Cyan
Write-Host ("  Ruta  : {0}" -f $jksPath)
Write-Host ("  Alias : {0}" -f $alias)
Write-Host ("  DN    : {0}" -f $dn)
Write-Host ''

# 7. Ejecutar batch y capturar salida
$proc = Start-Process -FilePath $batchFile -NoNewWindow -Wait -PassThru -RedirectStandardOutput (Join-Path $OutDir '_genkey.log')
$proc.WaitForExit()
$proc.ExitCode

# Limpiar batch script
Remove-Item -LiteralPath $batchFile -ErrorAction SilentlyContinue

# 8. Parsear el exit real leyendo el log
$logLines = Get-Content -LiteralPath (Join-Path $OutDir '_genkey.log') -ErrorAction SilentlyContinue
if ($proc.ExitCode -ne 0) {
    Remove-Item -LiteralPath (Join-Path $OutDir '_genkey.log') -ErrorAction SilentlyContinue
    throw ("keytool fallo con codigo {0}." -f $proc.ExitCode)
}
Remove-Item -LiteralPath (Join-Path $OutDir '_genkey.log') -ErrorAction SilentlyContinue

if (-not (Test-Path -LiteralPath $jksPath)) {
    throw 'keytool no produjo el archivo .jks. Revisa los logs.'
}

Write-Host ''
Write-Host 'OK: Keystore generado.' -ForegroundColor Green

# 9. Guardar contrasenyas
$envFile = Join-Path $OutDir 'keystore.env'
$envContent = @"
# Keystore para Lavadoras (FIRMADO). NO COMMITEAR.
LAV_KEYSTORE_PASSWORD=$storePass
LAV_KEY_ALIAS=$alias
LAV_KEY_PASSWORD=$keyPass
LAV_KEYSTORE_PATH=$jksPath
"@
Set-Content -LiteralPath $envFile -Value $envContent -Encoding UTF8
Write-Host ("  Credenciales guardadas en {0}" -f $envFile) -ForegroundColor Green

# 10. SHA-256 + meta info
$sha = (Get-FileHash -LiteralPath $jksPath -Algorithm SHA256).Hash
$metaPath = Join-Path $OutDir 'keystore-info.txt'
$meta = @"
LAVADORAS KEYSTORE - Informacion de seguridad
=============================================
Ruta     : $jksPath
Alias    : $alias
Algoritmo: RSA 2048
Validez  : 25 anyos (9125 dias)
SHA-256  : $sha
Creado   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

ADVERTENCIA:
  1. Guarda el .jks y keystore.env en 1Password / Bitwarden / ProtonPass.
  2. Si pierdes la clave, NO podras subir updates a Play Store con esta clave.
  3. Si usas Play App Signing: sube esta clave como Upload Key; Google guarda la firma real (App Signing Key).
"@
Set-Content -LiteralPath $metaPath -Value $meta -Encoding UTF8
Write-Host ("  Informacion de respaldo en {0}" -f $metaPath) -ForegroundColor Green
Write-Host ''
Write-Host 'Proximos pasos:' -ForegroundColor Magenta
Write-Host '  pwsh scripts/build-release.ps1   (o  powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1)'
Write-Host '  Lee DEPLOY_GUIDE.md'
Write-Host ''
