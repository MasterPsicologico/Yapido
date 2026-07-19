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
    pwsh scripts/generate-keystore.ps1
#>

[CmdletBinding()]
param(
    [string]$OutDir = (Join-Path $PSScriptRoot '..' 'secrets')
)

$ErrorActionPreference = 'Stop'

# 1. Detectar binario de Java (keytool) — Android Studio suele traer uno.
$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    $java = Get-Command java -ErrorAction SilentlyContinue
    if (-not $java) {
        throw "Java no está instalado. Instala JDK 17+ (Android Studio lo trae) y vuelve a correr."
    }
}

# 2. Asegurar carpeta secrets/
if (-not (Test-Path -LiteralPath $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
    Write-Host "Carpeta $OutDir creada." -ForegroundColor Green
}

# 3. Generar contraseñas aleatorias seguras (32 chars).
function New-RandomPassword([int]$len = 32) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^*()-_=+'
    $bytes = New-Object 'System.Security.Cryptography.RNGCryptoServiceProvider'
    $result = ''
    for ($i = 0; $i -lt $len; $i++) {
        $index = [int]$bytes.GetBytes(1)[0] % $chars.Length
        $result += $chars[$index]
    }
    return $result
}

$storePass = New-RandomPassword 32
$keyPass = New-RandomPassword 32
$alias = 'lavadoras-upload'

# 4. Construir keytool command.
$jksPath = Join-Path $OutDir 'lav-release.jks'

$cn = 'CN=Lavadoras Yapido, O=Yapido Click, L=Aguachica, ST=Cesar, C=CO'

if (Test-Path -LiteralPath $jksPath) {
    Write-Host "Ya existe $jksPath. Abortando para no pisar la clave." -ForegroundColor Yellow
    Write-Host "Si necesitas rotarla, bórrala primero: Remove-Item '$jksPath'" -ForegroundColor Yellow
    exit 1
}

$keytoolArgs = @(
    '-genkey'
    '-v'
    '-keystore', $jksPath
    '-storetype', 'JKS'
    '-storepass', $storePass
    '-keypass', $keyPass
    '-alias', $alias
    '-keyalg', 'RSA'
    '-keysize', '2048'
    '-validity', '9125'   # 25 años
    '-dname', $cn
)

Write-Host ""
Write-Host "⇒ Generando keystore RSA 2048 / 25 años:" -ForegroundColor Cyan
Write-Host "  · Ruta: $jksPath"
Write-Host "  · Alias: $alias"
Write-Host "  · Distinguised Name: $cn"
Write-Host ""

# 5. Ejecutar keytool (la salida se reenvía al usuario).
$proc = Start-Process -FilePath 'keytool' -ArgumentList $keytoolArgs -NoNewWindow -Wait -PassThru

if ($proc.ExitCode -ne 0) {
    throw "keytool falló con código $($proc.ExitCode)."
}

Write-Host ""
Write-Host "✅ Keystore generado." -ForegroundColor Green

# 6. Guardar contraseñas en archivo .env (NO COMMITEAR).
$envFile = Join-Path $OutDir 'keystore.env'
$envContent = @"
# Keystore para Lavadoras (FIRMADO). NO COMMITEAR.
LAV_KEYSTORE_PASSWORD=$storePass
LAV_KEY_ALIAS=$alias
LAV_KEY_PASSWORD=$keyPass
LAV_KEYSTORE_PATH=$jksPath
"@
Set-Content -LiteralPath $envFile -Value $envContent -Encoding UTF8
Write-Host "  · Credenciales guardadas en $envFile" -ForegroundColor Green

# 7. Hacer backup SHA-256 + meta info (útil para Play App Signing).
$sha = (Get-FileHash -LiteralPath $jksPath -Algorithm SHA256).Hash
$metaPath = Join-Path $OutDir 'keystore-info.txt'
$meta = @"
LAVADORAS KEYSTORE - Información de seguridad
=============================================
Ruta     : $jksPath
Alias    : $alias
Algoritmo: RSA 2048
Validez  : 25 años (9125 días)
SHA-256  : $sha
Creado   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

⚠️  IMPORTANTE:
  1. Guarda $jksPath y $envFile en un gestor de contraseñas (1Password, Bitwarden, Proton).
  2. Si pierdes la clave, NO se puede subir updates de la app a Play Store con la misma clave.
  3. Si usas Play App Signing: sube esta clave como "Upload Key"; Google guardará la "App Signing Key".
"@
Set-Content -LiteralPath $metaPath -Value $meta -Encoding UTF8

Write-Host "  · Información de respaldo en $metaPath" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Magenta
Write-Host "  1. set-content env:lav keystore_pass '$storePass' (o export en PowerShell)"
Write-Host "  2. Lee DEPLOY_GUIDE.md"
Write-Host ""
