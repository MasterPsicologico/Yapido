# PLAY_STORE_DATA_SAFETY — Plantilla para "Data Safety" en Play Console

> Copia y pega cada respuesta en https://play.google.com/console → tu app → **Privacy → Data Safety**.

---

## Sección 1 · ¿Recolección y compartición?

### Ubicación
- **¿Recolectada?** Sí
- **Tipo:** Aproximada y precisa
- **Compartida con terceros?** NO
- **Finalidad:** Funcionalidad de la app (reservar lavadora, logística de entrega)
- **El usuario puede solicitar eliminación?** Sí (desde Soporte o eliminando cuenta en `/profile`)
- **Encriptada en tránsito:** Sí (HTTPS)
- **El usuario puede optar por no compartirla?** Sí (sin ubicación no puede usar el flujo de reserva)

### Información personal
- **Nombre**
- **Email**
- **Número de teléfono**
- **Compartidos con terceros?** NO
- **Finalidad:** Comunicación, entrega, soporte
- **Eliminable:** Sí

### Mensajes
- **Texto** entre cliente y driver
- **Finalidad:** Comunicación entre las partes
- **Compartidos:** solo el destinatario
- **Encriptados:** Sí

### Fotos y vídeos
- Subidos voluntariamente por el usuario (ej: foto de lavadora dañada)
- **Compartidos:** solo admin
- **Eliminables:** Sí

### Notificaciones
- FCM token (no PII, identificador anónimo)
- **Compartido con Firebase (subprocesador de Google)**

### Cookies y elementos similares
- **Sí**: cookies de sesión Firebase Auth en Chromium WebView
- **Finalidad**: mantener sesión iniciada

---

## Sección 2 · ¿Cómo se trata?

| Pregunta | Respuesta |
|---|---|
| ¿Usas los datos analizados sin consentimiento? | NO |
| ¿Compartes datos con terceros para su propio beneficio? | NO |
| ¿Se procesan los datos en la nube del usuario? | NO |
| ¿Permitir que el usuario borre sus datos sin contactar soporte? | SÍ, vía `/profile` → Eliminar cuenta |
| ¿Política de privacidad URL? | https://lavadoras.yapido.click/privacidad |

---

## Sección 3 · Seguridad

- **¿Datos encriptados en tránsito?** SÍ (HTTPS/HSTS)
- **¿Datos encriptados en reposo?** SÍ (Firestore Security Rules + Firebase Storage encryption)
- **¿Los usuarios pueden pedir copia de sus datos?** SÍ (`/profile` → Exporta mis datos)

---

## Permisos peligrosos — declaraciones granulares

Play Console ahora permite decir **para qué** se usa cada permiso de Android:

### `android.permission.ACCESS_FINE_LOCATION`
- **Finalidad**: Selección de dirección de entrega, tracking durante mission de entrega / devolución.
- **Solo mientras se usa la app** (no en background). Excepción: durante una mission activa, se usa background durante máximo 24 horas.

### `android.permission.ACCESS_BACKGROUND_LOCATION`
- **Finalidad**: Tracking del driver durante missions activas.
- **Notificación al usuario**: diálogo explícito antes de pedirles background location.

### `android.permission.POST_NOTIFICATIONS` (API 33+)
- **Finalidad**: Avisar al cliente del estado de su reserva, al driver de aceptar mission.

### `android.permission.USE_BIOMETRIC`
- **Finalidad**: Login rápido después del primer login con Google.

### `android.permission.CAMERA`
- **Finalidad**: Foto opcional de lavadora dañada en soporte.

---

## "¿Y GDPR / Ley 1581 (Colombia)?"

- DPO interno: `dpo@yapido.click`
- Datos personales recolectados con base legal: ejecución del contrato (Ley 1581 / art. 6).
- Transferencias internacionales: Firebase + Vercel. Usuarios aceptamos DPFU en registro.
- Periodo de retención: 5 años desde último uso (cumplimiento fiscal/tributario).

---

## 📎 Acuses de recibo en tu app

(Esto NO va en Play Console — va en tu sitio web)

Asegúrate de tener en `app.lavadoras.yapido.click/privacidad`:

- [ ] URL canónica
- [ ] Fecha de última actualización
- [ ] Tabla clara sobre qué recolectas, por qué, cómo borrar
- [ ] Email de contacto
- [ ] Cómo presentar queja ante SIC en Colombia

---

*Esta plantilla responde a: GDPR (UE), CCPA (California), Ley 1581 (Colombia), LGPD (Brasil) y los requisitos actuales de Google Data Safety (post-jul 2024).*
