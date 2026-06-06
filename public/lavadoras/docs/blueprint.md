# Yapido — Blueprint del Producto

> Plataforma multi-rol de comercio, logística y servicios.
> Cliente · Admin · Repartidor. E-commerce + Alquiler de Lavadoras + Delivery + 20 Agentes AI.

## Identidad

- **Nombre del producto:** Yapido
- **Brand:** Cyber-Luxe (gradients, glassmorphism, animaciones fluidas)
- **Idioma:** Español (es-CO) por defecto
- **Moneda:** COP (Peso Colombiano)
- **Modelo de negocio:** Marketplace multi-tienda con logística propia + flota de repartidores.

## Roles del Sistema

| Rol | Capacidades |
|-----|-------------|
| **Cliente** | Explorar tiendas, comprar productos, alquilar lavadoras, chatear con repartidores, calificar servicios. |
| **Admin / Owner** | Gestionar tiendas, productos, inventario, pedidos, agentes AI, flota, ciudades/zonas, plan de negocio. |
| **Repartidor** | Aceptar misiones de delivery, navegar a pickup/dropoff, gestionar lavadoras, ganar comisiones. |

## Core Features

### 1. E-commerce Multi-Tienda
- Registro y gestión de tiendas (perfil, contacto, categorías).
- Catálogo de productos con descripciones generadas por IA.
- Páginas de detalle con galería, descripción y precio.
- Búsqueda y filtros por categoría, tienda, precio.
- Carrito persistente y checkout con PaymentGateway (stub).
- Sistema de pedidos multi-estado: `pending → preparing → ready_for_pickup → at_store → delivered_to_driver → at_destination → delivered → cancelled`.

### 2. Alquiler de Lavadoras
- Flujo dedicado en `/washer` con waiting-room (`/washer/waiting-room/[id]`).
- Selección de tipo de lavadora y horas con cálculo dinámico de precio.
- Solicitud que notifica a la flota de reparto.
- Estados: `waiting → assigned → in_transit → delivered → in_use → returned`.
- Panel admin para gestionar inventario de lavadoras (`/admin/washer`).

### 3. Delivery Multi-Etapa
- Pipeline: `preparando → listo → en tienda → con driver → en destino → entregado`.
- Dashboard del repartidor con mapa en tiempo real.
- Pickup mission view con notificaciones context-aware.
- Wizard secuencial de solicitud (auto-collapse, step indicator).
- Sistema de cancelación con motivos definidos.
- Validación GPS (coordenadas, velocidad, timestamp).

### 4. Gestión de Flota
- Verificación de personal (admin): panel de aprobación con códigos de vinculación.
- FleetMap: mapa en tiempo real de todos los drivers.
- Métricas individualizadas por conductor (rating, ganancias, aceptación, cancelaciones).
- Reportes evolutivos con exportación a PDF (`EvolutionaryReport`).
- Economía por conductor y tienda.
- Hook `useFleetLiveLocations` para tracking en vivo.

### 5. Gestión Geográfica
- Editor de ciudades y zonas en panel admin (`/admin/geography`).
- Cada ciudad tiene su geofence (polígono operativo) y serviceArea.
- Selector dinámico de zonas en flujo de alquiler.
- Hook `useCityConfig` para acceder a configuraciones por ciudad.
- Persistencia en Firestore.

### 6. Sistema de Rating
- Rating automático al completar misión (`useAutoRating`).
- Actualización de promedio en tiempo real.
- Visualización con estrellas en pedidos y perfiles.

### 7. Centro de Mensajería
- Chat en tiempo real vinculado a pedidos.
- Badges visuales con diseño "Squircle".
- Notificaciones con FCM (Firebase Cloud Messaging).
- Acceso rápido desde el Navbar con redirección inteligente.

### 8. 20 Agentes AI (Genkit + Gemini)
- 13 dominios cubiertos en `src/ai/agents/`:
  - `category`, `chat`, `delivery`, `home`, `layout`, `notification`, `order`, `product`, `rating`, `security`, `store`, `ui`, `visual-design`.
- Flujos en `src/ai/flows/`.
- Panel admin dedicado: `/admin/agents` + detalle `/admin/agents/[id]`.
- Generación de descripciones de productos.
- Asistente de soporte al cliente (futuro).
- Recomendaciones personalizadas (futuro).

## Style Guidelines

- **Estética:** Cyber-Luxe (gradientes vibrantes, glassmorphism, animaciones fluidas).
- **Color primario:** Verde Yapido `rgb(0 184 113)` (brand-600).
- **Acento:** Violeta `rgb(124 58 237)` (accent-600).
- **Fondo:** Slate oscuro con glass overlays.
- **Fuente principal:** `Inter` (sans-serif moderna y legible).
- **Iconos:** Lucide React (lineales modernos) + emojis nativos en algunos contextos.
- **Animaciones:** Framer Motion (transiciones) + Tailwind animate (utilities).
- **Componentes:** Radix UI primitives (accesibles) + shadcn/ui patterns.
- **Diseño adaptable y basado en tarjetas** (ver `docs/responsive-design-spec.md`).
- **Glassmorphism:** clases `.glass`, `.glass-strong`, `.glass-dark` con `backdrop-filter`.

## Sistema de Diseño Responsive

3 breakpoints (ver `docs/responsive-design-spec.md`):
- **Móvil (0-767px):** 1 columna, navbar 64px, cards `rounded-2xl`, touch targets 48px.
- **Tablet (768-1279px):** 2 columnas.
- **Desktop (1280px+):** 3-4 columnas, layout expandido.

## Arquitectura Multi-Zone (Monorepo)

Yapido (root, puerto 9002) es el host. Sirve y orquesta:

- `/finanzas` → Finanzas Inteligentes (puerto 9003 / Vercel)
- `/nimbus` → NimbusChat (puerto 9004 / Vercel)
- `/p` → CineStream (estático, con headers de seguridad)
- `conductor/` → Yapido Movilidad (puerto 9005, deploy independiente)

`/p` se sirve con headers: `noindex, nofollow, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer`.

## Stack Técnico

- **Frontend:** Next.js 15.5.9 (App Router + Turbopack), React 19.2, Tailwind CSS 3.4.
- **UI:** Radix UI primitives, Lucide React, Framer Motion, Embla Carousel.
- **Backend:** Firebase 11.9 (Firestore + Auth + Storage + FCM + RTDB), firebase-admin 13.8.
- **AI:** Genkit 1.28 + `@genkit-ai/google-genai`.
- **Mapas:** Mapbox GL JS + `@mapbox/mapbox-gl-directions` + Google Maps API loader.
- **Nativo:** Capacitor 8.3 (Android).
- **Forms:** react-hook-form + zod (`@hookform/resolvers`).
- **Utilidades:** date-fns, html2canvas, jspdf, recharts.
- **TypeScript:** ^5 (strict), ignoreBuildErrors habilitado en next.config.

## Aplicación Nativa (APK)

Distribución como APK con Capacitor 8.3 (WebView). Ver `APK_STRUCTURE.md` para capacidades detalladas:
- Auth nativa con Google (plugin `@capacitor-firebase/authentication`).
- Push notifications con FCM.
- Haptics, geolocalización, network detection, status bar.
- Pendiente: iconos profesionales, splash animado, deep linking, biometría, modo offline real, modo kiosko/conductor.

## Seguridad

- Superadmin leído de `appConfig/superAdmins` (no hardcodeado).
- Reglas de Firestore y Storage con validación de roles y tipos.
- Middleware con headers de seguridad.
- Endpoints de debug protegidos con token.
- API keys en variables de entorno (`.env.local` ignorado por git).
- Validación GPS en cliente (coordenadas, velocidad, timestamp).
- `/p` aislado con `X-Frame-Options: DENY` y `noindex`.

## Métricas y Operación

- Cron de mantenimiento: `purge-trash` diario a las 02:00 (en `vercel.json`).
- Reportes evolutivos exportables a PDF.
- Tracking de eventos custom para analytics.

## Roadmap de Alto Nivel

1. **Pagos reales:** Integrar Nequi/MercadoPago/PayU/Stripe con credenciales live.
2. **Geofencing automático:** Validar dirección vs zona seleccionada.
3. **Poblar zonas geográficas reales:** Medellín (Aranjuez, Manrique), expansión a más ciudades.
4. **PWA offline:** Cachear productos y tiendas para uso sin internet.
5. **Onboarding presencial de conductores en Aguachica** (proyecto Conductor).
6. **IoT en lavadoras:** Sensores que reporten estado en tiempo real.

---

*Última actualización: 5 de Junio, 2026*
