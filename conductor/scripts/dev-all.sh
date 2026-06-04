#!/usr/bin/env bash
# Dev con emuladores Firebase + Next.js en paralelo (Linux/macOS)
set -e
echo "Iniciando emuladores Firebase + Next.js..."

# Levanta emuladores
npx firebase emulators:start --only auth,firestore,functions,storage &
EMU_PID=$!
sleep 5

# Config para apuntar al emulador
export NEXT_PUBLIC_USE_EMULATOR=true
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
export FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

trap "kill $EMU_PID 2>/dev/null || true" EXIT
npx next dev -p 9005
