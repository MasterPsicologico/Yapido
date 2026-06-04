# ✅ Checklist pre-launch — Yapido Movilidad Aguachica

> Usa este checklist antes de salir a producción y antes de cada release mayor.

## A. Configuración del proyecto

- [ ] Proyecto Firebase `yapido-movilidad` creado (NO usar el del e-commerce).
- [ ] Firebase Auth habilitado con Phone y Google.
- [ ] Firestore creado en `us-central1` o `southamerica-east1`.
- [ ] Realtime Database creado.
- [ ] Cloud Storage creado (con bucket regional).
- [ ] FCM habilitado.
- [ ] Billing account vinculado (alertas configuradas a $50, $200, $500).
- [ ] Secrets en Secret Manager: `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `FIREBASE_PRIVATE_KEY`.

## B. Reglas y configuración

- [ ] `firebase deploy --only firestore:rules,database,storage --project yapido-movilidad` ejecutado.
- [ ] `firebase deploy --only firestore:indexes --project yapido-movilidad` ejecutado (tarda 5-10 min).
- [ ] `firebase deploy --only functions --project yapido-movilidad` ejecutado.
- [ ] Probado: un pasajero NO puede leer datos de otro.
- [ ] Probado: un conductor solo puede escribir a `cities/{suCiudad}/drivers_online/{suId}`.
- [ ] Probado: rating solo se crea por el passenger o driver del trip.

## C. Ciudad de Aguachica

- [ ] `cities/aguachica` creado vía `npm run seed:aguachica`.
- [ ] Polígono `serviceArea` cubre toda el área operativa (calle por calle).
- [ ] Centro `8.3127, -73.6218` validado con equipo local.
- [ ] Pricing:
  - [ ] Moto: base $3.500 + $900/km + $150/min, mín $5.000
  - [ ] Auto: base $4.500 + $1.400/km + $200/min, mín $7.000
  - [ ] Auto Comfort: base $6.500 + $1.900/km + $280/min, mín $10.000
- [ ] Comisión: **0%** durante las primeras 4 semanas (lanzamiento).
- [ ] Código promo `BIENVENIDAAGUACHICA` creado (50% off 3 viajes).
- [ ] Contacto soporte WhatsApp: `+57 300 000 0000` (o el real).

## D. Conductores

- [ ] 10-15 conductores pre-aprobados con documentos.
- [ ] Capacitación hecha (1h con el equipo fundador):
  - [ ] Cómo usar la app
  - [ ] Cuándo aceptar/rechazar
  - [ ] Política de cancelación
  - [ ] Documentos en regla
- [ ] SOAT y técnico-mecánica vigentes.
- [ ] Foto del vehículo con placas legibles subida.

## E. Pasajeros

- [ ] 50 pasajeros beta registrados.
- [ ] Grupo de WhatsApp de beta testers.
- [ ] Tutorial in-app en la primera apertura (3 pantallas).

## F. Pagos (Wompi)

- [ ] Cuenta Wompi de Yapido verificada.
- [ ] Sandbox probado: pago con tarjeta exitoso.
- [ ] Sandbox probado: pago con PSE exitoso.
- [ ] Webhook de Wompi configurado apuntando a `settlePayment` Cloud Function.
- [ ] Reconciliación diaria programada (cron 6 AM).
- [ ] Política de reembolsos documentada.

## G. Anti-fraude

- [ ] Speed check: rechazar updates > 200 km/h.
- [ ] Teleport check: flag si distancia > 500m entre 2 updates consecutivos.
- [ ] Cancel pattern: conductor con > 30% cancelaciones en 7d → flag.
- [ ] Geo-spoofing: validar que `geo6` corresponda a lat/lng (distancia > 5 km = invalidar).
- [ ] Doble cuenta: validar teléfono único por usuario.

## H. Monitoreo y alertas

- [ ] Sentry instalado en cliente (Next.js + Capacitor).
- [ ] Crashlytics habilitado en APK Android.
- [ ] Cloud Logging con alertas a Slack `#yapido-movilidad-alerts`:
  - [ ] Errores en Cloud Functions > 5/min
  - [ ] Latencia `createTrip` p95 > 3s
  - [ ] Latencia `acceptOffer` p95 > 1.5s
  - [ ] Tasa de errores de GPS > 10%
  - [ ] Costos RTDB > $10/día
- [ ] Uptime check: `/api/health` cada 5 min (UptimeRobot / GCP).
- [ ] Dashboard de métricas en `/admin/m` (opcional v1, requerido v2).

## I. Legal

- [ ] Términos y condiciones publicados (es-CO).
- [ ] Política de privacidad publicada.
- [ ] Tratamiento de datos personales (Ley 1581/2012 Colombia).
- [ ] Habeas data: endpoint para descargar/eliminar datos del usuario.
- [ ] Permisos municipales de Aguachica (si aplica).

## J. Marketing pre-launch

- [ ] Landing page `/m` con countdown.
- [ ] Facebook Ads geo-targeted a Aguachica.
- [ ] Acuerdo con 1 influencer local (opcional).
- [ ] Volantes en terminales, hospitales, universidades.
- [ ] Grupo de Facebook "Yapido Aguachica".
- [ ] Comunicado a radio local.

## K. Día del lanzamiento

- [ ] Equipo de soporte 24/7 las primeras 72h.
- [ ] Botones físicos de pánico en el admin (mute driver / mute passenger).
- [ ] Plan de contingencia: si Firebase se cae, todos los conductores `offline` no reciben viajes pero la app no crashea.
- [ ] Backup diario de Firestore activado.

## L. Post-launch (semana 1)

- [ ] Reunión diaria 9 AM con métricas.
- [ ] Encuesta NPS a pasajeros y conductores (formulario en app).
- [ ] Revisión de incidentes de soporte.
- [ ] Iterar pricing si la demanda lo justifica (sin pasar de $1.5x surge).

## M. Escalabilidad (cuando > 1000 conductores)

- [ ] Evaluar migración a MongoDB + WebSocket en Cloud Run para reducir 70% del costo RTDB GPS.
- [ ] Implementar geofencing real (alertas de conductores fuera de zona).
- [ ] Integrar datos de tráfico en tiempo real.
- [ ] Machine learning para ETA más preciso.

---

> **Criterio de salida de Aguachica piloto → Valledupar:**
> - Tasa de aceptación > 80% sostenida 30 días.
> - NPS conductor > 40.
> - Equipo local identificado.
> - Margen bruto positivo (después de comisión de plataforma).
