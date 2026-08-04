# LavaGo - Alquiler de lavadoras a domicilio en Colombia

Aplicacion web (vanilla JS) para un negocio de alquiler de lavadoras a domicilio
cubierto por todo el territorio colombiano.

La app sirve a los 3 actores principales del sistema:
  1. **Cliente** - solicita la lavadora a su ciudad
  2. **Repartidor** - entrega la lavadora y gana un porcentaje
  3. **Dueno de tienda** - tiene una tienda, repartidores y ve income completo
  4. **Admin principal** - gestiona la prioridad de las tiendas por ciudad

---

## Estructura

```
lava/
├─ index.html                            Pagina principal - carga todos los modulos
├─ css/
│  ├─ styles.css                          Importa todos los CSS (modular)
│  ├─ tokens.css                          Variables (colores, tipografia)
│  ├─ base.css                            Reset
│  ├─ layout.css                          Header, navegacion
│  ├─ buttons.css                          Botones genericos y por tipo
│  ├─ forms.css                            Inputs, selects, switchs
│  ├─ cards.css                           Tarjetas (tienda, pedido, metricas...)
│  ├─ cliente.css                          Vista del cliente
│  ├─ dueno.css                            Panel dueno de tienda
│  ├─ repartidor.css                       Panel repartidor
│  ├─ admin.css                            Panel admin principal
│  ├─ notif.css                            Banners y toasts
│  ├─ modal.css                            Ventanas modales
│  └─ responsive.css                       Ajustes mobile-first
└─ js/
   ├─ data/
   │  ├─ config.js                        Configuracion (reglas de negocio, Nequi, Firebase)
   │  └─ colombia.js                      Departamentos y ciudades de Colombia
   ├─ auth/
   │  └─ auth.js                           Login Google / telefono / anónimo
   ├─ services/
   │  ├─ store.js                          Capa de persistencia (emula Firestore con localStorage)
   │  ├─ tiendaService.js                  Registro y edicion de tiendas
   │  ├─ repartidorService.js              Vinculacion y ganancias de repartidores
   │  ├─ prioridadService.js              Prioridades de tiendas por ciudad
   │  ├─ pedidoService.js                 Sistema Didi/Rappi de pedidos (5min / 15min)
   │  ├─ notificaciones.js                 Notificaciones(cliente, repartidor, dueno)
   │  ├─ pedidoRouter.js                   Conecta eventos de pedido con notif
   │  ├─ pagoService.js                   Pagos via Nequi
   │  └─ adminService.js                  Funciones del admin principal
   ├─ utils/
   │  └─ gps.js                            Geolocation Haversine
   └─ ui/
      ├─ uiHelpers.js                      Helpers ($/$$, modal, toast, selector)
      ├─ authView.js                        Pantalla de login
      ├─ clienteView.js                   Cliente: elegir ciudad, ver tiendas, pedir
      ├─ duenoView.js                       Panel completo del dueno
      ├─ repartidorView.js                  Panel simplificado del repartidor
      ├─ adminView.js                       Panel del admin principal (prioridades)
      ├─ perfilView.js                      Perfil usuario + codigo de vinculacion
      ├─ notifBanners.js                   Banners persistentes (llegada - vibracion)
      └─ app.js                            Coordinator: enruta por sesion/rol
```

---

## Flujo de un pedido

1. El **cliente** entra, selecciona su departamento y ciudad.
2. Se muestran solo las tiendas **activas en esa ciudad** (categorizacion geografica).
3. Toca una tienda y completa:
   - Nombre (obligatorio)
   - Telefono/WhatsApp (obligatorio)
   - Direccion (obligatorio) **o** usa el boton GPS para capturar lat/lng
   - Horas de alquiler
4. Se crea el pedido y se asigna a la **prioridad #1** de esa ciudad.
5. Si la #1 tiene **auto-aceptacion** activada:
   - El pedido se acepta enseguida, notifica al cliente y el dueno/repartidor tiene **15 minutos** para confirmar manualmente la entrega.
6. Si no tiene auto-aceptacion:
   - La #1 recibe notificacion de nuevo pedido y tiene **5 minutos** para aceptar.
   - Si no acepta, el pedido pasa automaticamente a la siguiente tienda de prioridad.
7. El dueno o un repartidor vinculado puede **tomar el pedido** ("Yo lo llevo").
8. Se requiere **segunda confirmacion manual** (15 min) que marca "lo voy a entregar".
9. Estados sucesivos: en_camino -> llegada -> entregado (en uso) -> completado (se devuelve).
10. Al finalizar se calcula `precioFinal = hora * 10.000 COP` (configurable).
11. Se inicia el **pago Nequi** y el cliente lo confirma manualmente.

---

## Sistema de prioridades

- Cada **ciudad** tiene una lista ordenada de tiendas.
- El **admin principal** puede:
  - Mover tiendas arriba/abajo con los botones ↑ ↓
  - Asignar manualmente una posicion con "Mover a #N"
  - Resetear las prioridades de una ciudad (todas quedan en 999 sin prioridad)
- Las prioridades se reordenan automaticamente cuando se asigna una nueva.

Para entrar como admin principal:
1. Inicia sesion (Google, telefono o anónimo)
2. Ve a tu perfil -> "Acceso administrador principal"
3. Usa el codigo secreto: `LAVAGO2026ADMIN`

---

## Vinculacion de repartidores

1. El dueno de tienda entra a su panel.
2. Ve un **codigo de 6 digitos** (ej. `482910`).
3. Lo comparte con quien quiera que sea repartidor.
4. El repartidor entra a "Mi perfil" -> "Tengo un codigo de repartidor" -> lo introduce -> queda vinculado.
5. El dueno puede:
   - Cambiar el porcentaje individual de cada repartidor
   - Eliminarlo de la tienda
6. El repartidor puede desvincularse y re-vincularse con el mismo codigo.

---

## Notificaciones

- **Toasts**: para notificaciones efimeras (asignado, completado, error)
- **Banners persistentes**: para la notificacion de **"llegada del repartidor"**
  - Vibracion del telefono
  - Sonido sintetizado (Web Audio)
  - No se cierra hasta que el usuario presiona "Entendido"

Pedir permiso de notificaciones del navegador automaticamente al hacer login.

---

## Configuracion (`js/data/config.js`)

- `reglas.tiempoEsperaAceptacion` - 5 min
- `reglas.tiempoConfirmacionEnvio` - 15 min
- `reglas.porcentajeRepartidorDefecto` - 30%
- `reglas.precioHoraBase` - $10.000 COP
- `reglas.precioMinimo` - $30.000 COP
- `reglas.distanciaNotificacionLlegada` - 200m
- `nequi.nequiNumero` - número de Nequi del negocio (a configurar)

---

## Roadmap (lo que falta para produccion)

1. **Real Firebase / Firestore** - el actual usa localStorage.
2. **Cloud Functions** para los timeouts (5 min / 15 min). En el front,
   si el usuario cierra la app el timeout no dispara.
3. **Nequi API real** con webhook para confirmaar pagos automaticamente.
4. **Firebase Cloud Messaging** para push notifications reales.
5. **OTP real por SMS** (Firebase phone auth con reCAPTCHA).
6. **Traking GPS en servidor** (ahora solo localStorage) - para que el
   cliente vea en tiempo real al repartidor en el mapa.
7. Confirmar manualmente el cobro via webhook Nequi o toast de admin.
