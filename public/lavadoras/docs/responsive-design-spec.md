# Lavadoras — Sistema de Diseño Visual Responsive

> Especificación del sistema responsive para la app standalone **Lavadoras**.
> Reutiliza los 3 breakpoints del ecosistema (móvil / tablet / desktop)
> pero aplica overrides específicos del producto: foco mobile-first APK
> y CTA grandes para uso outdoor.

---

## 1. Breakpoints del Sistema

| Dispositivo | Ancho Mínimo | Ancho Máximo | Columnas Grid | Notas |
|------------|-------------|-------------|--------------|-------|
| **Móvil** | 0px | 767px | 1 | Default APK. Bottom nav fijo. Touch targets 48px. |
| **Tablet** | 768px | 1279px | 2 | Pantallas tienda/inventario. Touch 56px. |
| **Desktop** | 1280px | ∞ | 3-4 | Admin y business-plan. Sidebar 280px. Touch 64px. |

---

## 2. MÓVIL (0-767px) — Diseño base APK

### Layout
- Ancho 100% (sin restricciones).
- Padding horizontal `0.5rem` (16px total).
- `Navbar` 64px (`h-16`).
- `BottomNav` 64px fijo (iconos 24px, label 10px, gap 4px).
- Safe area respetada para notch devices (`env(safe-area-inset-*)`).

### Tipografía
- `h1` 1.75rem / lh 1.2
- `h2` 1.5rem / lh 1.25
- `h3` 1.25rem / lh 1.3
- `body` 1rem / lh 1.5
- `caption` 0.875rem

### Cards
- `rounded-2xl` (1rem), `p-4`, `shadow-md`.
- Touch targets `min-h-12` (48px).

### Botones
- `h-12`, `px-4 py-3`, `text-sm font-semibold`, `rounded-full`.

### Inputs
- `h-12`, `text-base`, `rounded-xl`.

### Badges
- 10px, min-w 18px, h 18px, px 1.

### Iconos
- 20px (`w-5 h-5`), gap 2.

### Animaciones
- Float 6s, Glow pulse 3s, transitions 300ms.

### Overrides Lavadoras (vs catálogo multi-tienda)
- CTA primario `h-14` (56px) en `Reservar lavadora` y `Confirmar reserva` (it operates in outdoor).
- Botón flotante de soporte siempre visible (FAB 56px en `bottom-right`).
- Glass más marcado en pantallas de waiting-room (`backdrop-blur-2xl`).
- Modo kiosk opcional (`/delivery`): oculta navbar superior, deja BottomNav.

---

## 3. TABLET (768-1279px) — Tienda / Inventario

### Layout
- Ancho 100%, padding 24px (`px-6`).
- `Navbar` 72px (`h-[72px]`).
- Grid 2 columnas con gap 1rem.

### Tipografía
- `h1` 2.25rem, `h2` 1.875rem, `h3` 1.5rem, body 1rem, caption 14px.

### Cards
- `rounded-3xl`, `p-5`, `shadow-lg`, touch 56px.

### Botones / Inputs
- `h-14` con text-lg y rounded-xl.

### Iconos y badges
- 24px / 12px.

### Animaciones
- Float 8s, Glow 4s, transitions 400ms.

### Overrides Lavadoras
- Side-by-side: mapa de zona + catálogo de lavadoras disponibles.
- Inventario `/admin/washer` en grid 2 columnas con cards expandibles.

---

## 4. DESKTOP (1280px+) — Admin / Business Plan

### Layout
- `max-w-7xl` (1400px), padding 32px.
- `Navbar` 80px (`h-20`).
- Sidebar fijo 280px a la izquierda.
- Grid 3-4 columnas.

### Tipografía
- `h1` 2.5rem, `h2` 2rem, `h3` 1.625rem, body 17px, caption 1rem.

### Cards
- `rounded-[1.5rem]`, `p-6`, `shadow-xl`, touch 64px.

### Botones / Inputs
- `h-16` con text-xl y rounded-xl.

### Iconos y badges
- 28px / 14px.

### Animaciones
- Float 10s, Glow 5s, transitions 500ms.

### Overrides Lavadoras
- `/admin/business-plan`: layout editorial 2 columnas (texto sticky + gráfico).
- `/admin/washer`: tabla densa + acciones inline + drawer lateral de detalle.
- `/admin/fleet`: mapa 60% / lista drivers 40% (split view).

---

## 5. Sistema de Espaciado Responsive

| Token | Móvil | Tablet | Desktop |
|-------|-------|--------|--------|
| `--space-1` | 4px | 6px | 8px |
| `--space-2` | 8px | 10px | 12px |
| `--space-3` | 12px | 16px | 20px |
| `--space-4` | 16px | 20px | 24px |
| `--space-6` | 24px | 32px | 40px |
| `--space-8` | 32px | 40px | 48px |
| `--space-12` | 48px | 56px | 64px |
| `--space-16` | 64px | 80px | 96px |

---

## 6. Visual Design System — Componentes Device*

```typescript
import { useDeviceSize, DeviceSize } from '@/hooks/use-device-size';
import {
  DeviceAwareContainer,
  DeviceGridLayout,
  DeviceCardLayout,
  DeviceHeader,
  DeviceText,
  DeviceButton,
  DeviceInput,
  DeviceBadge,
  DeviceSpacing,
} from '@/components/visual-design';
```

Todos los componentes `Device*` aceptan las props estándar y aplican los tokens según el breakpoint detectado.

---

## 7. CSS Utilities Responsivas

| Utility | Móvil | Tablet | Desktop |
|--------|-------|--------|--------|
| `.app-container` | max-w-full | max-w-3xl | max-w-7xl |
| `.content-grid` | grid-cols-1 | grid-cols-2 | grid-cols-3 |
| `.navbar-responsive` | h-16 | h-[72px] | h-20 |
| `.action-button-mobile` | h-12 px-4 | h-14 px-6 | h-16 px-8 |
| `.dialog-responsive` | fullscreen | max-w-lg | max-w-2xl |
| `.input-responsive` | h-12 text-base | h-14 text-lg | h-16 text-xl |
| `.icon-responsive` | w-5 h-5 | w-6 h-6 | w-7 h-7 |
| `.badge-responsive` | text-[10px] | text-xs | text-sm |
| `.glass-responsive` | backdrop-blur-md | backdrop-blur-xl | backdrop-blur-2xl |
| `.shadow-responsive` | shadow-md | shadow-lg | shadow-xl |

---

## 8. Paleta de Colores

| Token | HSL | Uso |
|-------|-----|-----|
| `--brand-600` | `rgb(0 184 113)` | Color primario Yapido, navegación, CTAs. |
| `--accent-600` | `rgb(124 58 237)` | Acento lavadora, highlight de inventario. |
| `--cyber-violet` | `250 85% 65%` | Variante morada para eventos IA. |
| `--cyber-emerald` | `165 82% 51%` | Estado success en missions. |
| `--cyber-amber` | `38 92% 60%` | Mantenimiento y warnings. |
| `--cyber-rose` | `330 90% 65%` | Errores y cancelaciones. |
| `--ink-900` | `222 47% 6%` | Fondo depth. |
| `--ink-700` | `222 30% 14%` | Cards y surfaces. |
| `--paper` | `0 0% 98%` | Texto en dark mode. |

---

## 9. Animaciones por Dispositivo

```
Float:    6s (móvil) · 8s (tablet) · 10s (desktop)
Glow:     3s (móvil) · 4s (tablet) · 5s (desktop)
Timing:   300ms (móvil) · 400ms (tablet) · 500ms (desktop)
```

Implementadas con Tailwind utilities (`animate-float`, `animate-glow`) y Fire Motion cuando se requiere orchestration compleja.

---

## 10. Tokens Específicos de Lavadoras

### CTA Primario Outdoor
- Altura mínima `h-14` también en mobile (no respeta el `h-12` general).
- Contraste mínimo 7:1 (WCAG AAA outdoor).
- Iconografía grande (24px) al lado del label.

### Waiting Room
- Glass `backdrop-blur-2xl` siempre (incluso mobile).
- Pulso animado de lavadora (`animate-glow` 3s) como affordance de "esperando driver".

### Modo Kiosko Repartidor (`/delivery/welcome`)
- Sin navbar superior, solo BottomNav.
- Tipografía mínima 16px (legibilidad sobre moto).
- Botones de misión `h-16` (manos con guantes).

### Plan de Negocio Editorial (`/admin/business-plan`)
- Tipografía display serif opcional (`Fraunces`) para headings hero.
- Reglas horizontales de 2px como separadores.
- Padding generoso: `--space-16` en secciones.

---

## 11. Guía de Implementación

1. **Detectar dispositivo** vía `useDeviceSize()`.
2. **Aplicar utility classes responsive** (`.action-button-mobile`, `.glass-responsive`).
3. **Usar componentes `Device*`** cuando existen para evitar duplicación.
4. **Respetar overrides lavadoras**:CTA primario siempre `h-14`+, FAB de soporte visible, glass fuerte en waiting-room.
5. **Validar en 3 anchos** (375px, 834px, 1440px) y en 2 densidades (1x, 2x retina).

---

## 12. Notas Importantes

1. **Mobile-first:** el APK Android es la superficie primaria. Mobile nunca es la "versión reducida" sino el diseño base.
2. **Funciones intactas:** toda la lógica de negocio permanece shared con Yapido. Solo cambia la capa visual.
3. **Performance:** los efectos visuales se ajustan según capacidad (mobile usa `backdrop-blur-md`, no `2xl`).
4. **Transiciones suaves:** las animaciones son más rápidas en móvil (lifecycle corto), más fluidas en desktop.
5. **Accesibilidad WCAG 2.1 AA:** contraste de texto mínimo 4.5:1, focus ring visible, soporte para prefers-reduced-motion.

---

*Última actualización: 18 de Julio, 2026*
