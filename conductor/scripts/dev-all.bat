@echo off
REM =============================================================================
REM Dev con emuladores Firebase + Next.js en paralelo.
REM =============================================================================
echo Iniciando emuladores Firebase + Next.js...

REM Levanta emuladores (en otra ventana)
start "Firebase Emulators" cmd /k "npx firebase emulators:start --only auth,firestore,functions,storage"

REM Espera 5s a que arranquen
timeout /t 5 /nobreak >nul

REM Configura para apuntar al emulador
set NEXT_PUBLIC_USE_EMULATOR=true
set FIRESTORE_EMULATOR_HOST=localhost:8080
set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
set FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

REM Next.js dev
npx next dev -p 9005
