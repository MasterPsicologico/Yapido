# SECURITY — Lavadoras

> Procedimientos de seguridad y rotación de secretos para la app Lavadoras.
> Propietario: equipo lavadoras · Última revisión: 18 Julio, 2026

---

## 🗝️ Inventario de secretos

| Secreto | Dónde vive | Audiencia | Rotación |
|---------|------------|-----------|----------|
| `FIREBASE_PROJECT_ID` | `apphosting.yaml` RUNTIME | server | nunca rota (es el ID público del proyecto) |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK — servidor | server | cuando se rota la service account |
| `FIREBASE_PRIVATE_KEY` | Admin SDK — servidor | server | **90 días** |
| `GEMINI_API_KEY` | Genkit flows — servidor | server | **90 días** + restricción HTTP referer en GCP |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | cliente (`NEXT_PUBLIC_`) | pública | cuando se detecte abuso |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | cliente (`NEXT_PUBLIC_`) | pública | cuando se detecte abuso (URL restrict) |
| `NEQUI_API_KEY` / `NEQUI_CLIENT_SECRET` | cliente + server | server | **180 días** |
| `NEQUI_WEBHOOK_SECRET` | server | server | rotar al rotar la integración |
| `CRON_SECRET` | server | server | **180 días** + tras cualquier incidente |
| `DEBUG_SECRET` | server | server | **180 días** + tras cualquier incidente |

⚠️ Las claves con prefijo `NEXT_PUBLIC_*` son **públicas** (se incluyen en el bundle). Aplícales quotas y restricciones por dominio/HTTP referer en sus consolas; nunca las trates como secreto.

---

## 🔁 Runbook de rotación — `FIREBASE_PRIVATE_KEY`

1. Abrir Firebase Console → Configuración del proyecto → Cuentas de servicio.
2. Click **Generar nueva clave privada** → descarga `serviceAccount.json`.
3. Convertir a multilínea para `.env.local`:
   ```
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX\n-----END PRIVATE KEY-----\n"
   ```
   (Mantener los `\n` literales; el helper `firebase-admin.ts` los reemplaza en runtime.)
4. En staging: `vercel env add FIREBASE_PRIVATE_KEY production <valor>` / staging.
5. Desplegar. Si falla deploy, rollback urgente del env.
6. Borrar la clave anterior de cualquier cache o secret manager.
7. Documentar fecha y motivo en `_SECURITY_LOG` abajo.

## 🔁 Runbook de rotación — otros secretos
Mismo patrón. **Nunca** commitear la clave antigua. **Nunca** publicar logs con valores.

---

## 🛡️ Reglas Firestore — operación

- Las reglas viven en `firestore.rules` y se despliegan con:
  ```
  firebase deploy --only firestore:rules --project studio-4796645076-6f375
  ```
- Revisión manual trimestral. Cualquier nueva colección debe tener regla explícita antes de mergear.
- Toda regla permisiva (`allow read: if true`) requiere justificación escrita en este archivo.
- Prohibido `match /{allPaths=**}` o defaults permisivos.

## 📜 _SECURITY_LOG

| Fecha | Acción | Ejecutado por |
|-------|--------|---------------|
| 2026-07-18 | Recorte de `firestore.rules` (elimina subsecciones de Yapido: `machines`, `geoData`, `analytics`). Endurece `washerRentals` con `canAccessRental`. | refactor IA |
| 2026-07-18 | Eliminada clave privada hardcodeada en `scripts/setup-firebase.js`. Reemplazo por scripts TypeScript que leen `.env.local`. | refactor IA |
| 2026-07-18 | Creado `src/lib/server/firebase-admin.ts` (server-only) + `guards.ts`. Centraliza inicialización. | refactor IA |

---

## 🚨 Reporte de incidentes

Si descubres credenciales expuestas en el repo:

1. **ABRIR ISSUE INMEDIATO** con etiqueta `security:leak`.
2. Borrar archivo del working tree.
3. `git filter-repo` o `git rebase --interactive` para limpiar historial.
4. Rotar la clave en el proveedor.
5. Documentar en `_SECURITY_LOG`.

Si detectas abuso en producción:

1. Bloquear IP/fingerprint en el WAF (Vercel/Firebase).
2. Revisar logs de Firestore / GCP / Vercel.
3. Rollback reglas de Firestore si están abusadas.
4. Rotar claves afectadas.
5. Comunicar a `security@yapido.click`.
