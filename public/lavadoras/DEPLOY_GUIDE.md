# DEPLOY_GUIDE — Lavadoras APK & Play Store

> **Para quién es esto:** dueño del proyecto que NO ha subido la APK antes.
> **Cuánto tarda:** 2-3 horas la primera vez (incluye esperar revisión de Play, 30-90 min después).
> **Resultado final en el repo:** una carpeta `dist/` con `.apk` + `.aab` + `.jks` (cada uno en su sitio).

---

## 📋 CHECKLIST — 7 pasos

```
[ ] 1. Instalar Android Studio (si no lo tienes)             ← 30 min
[ ] 2. Crear keystore (1 solo vez)                              ← 3 min (corres un script)
[ ] 3. Compilar APK + AAB                                       ← 5 min (corres un script)
[ ] 4. Crear app en Play Console                                ← 15 min (rellena formulario)
[ ] 5. Responder Data Safety (privacidad)                       ← 10 min (plantillas aquí)
[ ] 6. Subir AAB y completar "lanzamiento"                      ← 10 min
[ ] 7. Esperar revisión + publicar                              ← 30-90 min
```

---

## PASO 1 · Instalar Android Studio

Necesitas **JDK 17+** y **Android SDK 36**.

1. Descarga: https://developer.android.com/studio
2. Instala con todas las opciones default.
3. Abre Android Studio, completa el primer wizard (instala SDK si te lo pide).
4. Verifica en PowerShell:

```powershell
java -version
# debe decir 17.x o superior

$env:ANDROID_HOME
# debería apuntar a algo como C:\Users\TU_USUARIO\AppData\Local\Android\Sdk
# Si no existe:
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

---

## PASO 2 · Crear el keystore (1 solo vez en la vida del proyecto)

El keystore es la **llave maestra** de tu APK. Si la pierdes, no puedes actualizar la app en Play Store nunca más. Por eso:
- Se guarda fuera del repo (carpeta `secrets/`).
- Se respalda en 1Password / Bitwarden / ProtonPass.

### 2.1 Ejecuta el script:

```powershell
cd "C:\Users\dcard\OneDrive\Escritorio\Uix\public\lavadoras"
pwsh scripts/generate-keystore.ps1
```

Esto crea:
- `secrets/lav-release.jks` (≈ 2.7 KB, archivo binario, **NO COMMITEAR**)
- `secrets/keystore.env` (variables de entorno con las contraseñas)
- `secrets/keystore-info.txt` (info legible)

### 2.2 Respalda los 3 archivos en:

- 1Password / Bitwarden / ProtonPass
- O un USB cifrado
- O un segundo disco duro cifrado (Bitlocker / FileVault)

### 2.3 Confirma que NO está en git:

```powershell
git status
# NO debe aparecer secrets/lav-release.jks ni secrets/keystore.env
```

Si aparece, verifica el `.gitignore`.

---

## PASO 3 · Compilar `.apk` + `.aab`

```powershell
cd "C:\Users\dcard\OneDrive\Escritorio\Uix\public\lavadoras"
pwsh scripts/build-release.ps1
```

Esto produce al final:

```
android\app\build\outputs\bundle\release\app-release.aab        ← SUBE ESTO A PLAY STORE
android\app\build\outputs\apk\release\app-release.apk         ← INSTALA PARA TESTING
android\app\build\outputs\mapping\release\mapping.txt          ← SUBE A PLAY CON EL AAB (crash reports)
```

### Si quieres solo una variante:

```powershell
pwsh scripts/build-release.ps1 -ApkOnly
pwsh scripts/build-release.ps1 -AabOnly
```

### Si Gradle se queja:

| Error | Causa | Solución |
|---|---|---|
| `JAVA_HOME not found` | No instalaste JDK 17 | Instala Android Studio (trae JDK) |
| `keystore was tampered with, or password was incorrect` | Contraseñas mal | Edita `secrets/keystore.env` o regenera |
| `SDK location not found` | SIN `ANDROID_HOME` | Ver paso 1 |
| `Out of memory` | Gradle sin RAM | Edita `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4g` |

---

## PASO 4 · Crear la app en Play Console

1. Ve a https://play.google.com/console
2. Click **Crear app**
3. Rellena:
   - **App name:** Lavadoras — Alquiler de lavadoras
   - **Default language:** Español (Latinoamérica)
   - **App or game:** App
   - **Free or paid:** Gratis
4. Acepta las 4 casillas de consentimientos.
5. En **Visibilidad de la app → acceso anticipado**: empieza en "Closed testing" → 12 testers.

---

## PASO 5 · Responder Data Safety (privacidad)

Abre `PLAY_STORE_DATA_SAFETY.md` (en este repo). Cada pregunta tiene respuesta pre-llenada. Ve copiando/pegando en https://play.google.com/console → Privacy → **Data Safety**.

Resumen rápido de lo que declara esta app:

| Recolecta | Compartido con | Finalidad |
|---|---|---|
| Ubicación (última conocida + tiempo real durante missions) | No se vende. Solo visible para driver asignado y admin durante rental activa. | Entrega, tracking |
| Nombre, email, teléfono | No se vende. Solo entre ellos para delivery. | Operación de la app |
| Fotos de lavadora dañada (opcional) | No se vende. Visible para admin. | Soporte post-reserva |
| Mensajes con driver | No se vende. | Comunicación |
| Token para push notifications | No se vende. | Notificaciones |

Recolectas criptografiado: sí. Permites al usuario eliminar la cuenta: sí (en `/profile` → cuenta → eliminar).

---

## PASO 6 · Subir el AAB

### 6.1 En Play Console:

- **Test → Closed testing → Create new track.**
- Click **Manage track → Create new release.**
- Click **Upload** y arrastra `android/app/build/outputs/bundle/release/app-release.aab`.
- **Release name:** `1.0.0` (lo que guarda el historial).
- **Release notes** (escribe 1 frase):
  > "Primera versión pública de Lavadoras: reserva lavadoras con logística en Aguachica y La Jagua."

### 6.2 Sube el mapping (para desofuscar stack traces):

- Click **Upload mapping** junto al AAB.
- Selecciona `app/build/outputs/mapping/release/mapping.txt`.

### 6.3 Review y Roll out:

- Pestaña **Review and roll out → Start rollout to Closed testing**.
- Confirma el % (recomendado: 100%).

---

## PASO 7 · Esperar revisión y publicar

### Closed testing (necesario antes de Producción):

- Añade al menos 12 testers (puedes usar tu email + 11 amigos).
- Google revisa en 7 días hábiles primera vez.
- Una vez aprobado, avanzas a **Open testing** (cualquiera puede participar).
- Tras 14 días en open testing → **Production** (visible en Play Store).

### Para Producción:

- Crear **promote release** desde open testing → production.
- Otra revisión express (1-3 días).
- Una vez aprobado, ya estás en Play Store 🎉.

---

## 🔄 Después — cómo actualizar

Cada vez que cambies código:

```powershell
cd "C:\Users\dcard\OneDrive\Escritorio\Uix\public\lavadoras"
pwsh scripts/build-release.ps1
```

Luego en Play Console:

1. **Production → Create new release**.
2. Sube el nuevo AAB.
3. **Version code:** súbelo en 1 (`versionCode 4` → modificar en `android/app/build.gradle`).
4. **Release name:** `1.0.1` (respecto a la última publica).
5. Roll out.

---

## ❓ FAQ

**¿Necesito una Mac para iOS?**
Sí, en algún momento. Pero por ahora empieza con Android. Cuando lo hagas, cuéntame y montamos iOS.

**¿Cuánto cuesta Play Store?**
Una vez: USD $25 (de por vida). No hay renovación anual.

**¿Y Apple App Store?**
USD $99/año. Pero el proceso es diferente (Mac + Xcode). Lo vemos aparte.

**¿Pierdo los testers si cambio de track?**
No. Se mantienen al promover.

**¿Puedo subir archivos sensibles (claves)?**
NO. Por eso `secrets/` está en `.gitignore`. El `keystore.env` tampoco debe commitearse.

---

*Última actualización: 18 Julio, 2026 — generado por opencode + revisión manual del equipo lavadoras*
