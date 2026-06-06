# Yapido - Sistema de Diseño Visual Responsive

## Resumen Ejecutivo

Este documento especifica los 3 diseños visuales responsive para la aplicación Yapido, adaptados a cada tipo de dispositivo (móvil, tablet, desktop). **La versión móvil existente se preserva exactamente como está** - sin cambios en funciones ni lógica.

---

## 1. Breakpoints del Sistema

| Dispositivo | Ancho Mínimo | Ancho Máximo | Columnas Grid |
|------------|-------------|-------------|--------------|
| **Móvil** | 0px | 767px | 1 |
| **Tablet** | 768px | 1279px | 2 |
| **Desktop** | 1280px | ∞ | 3-4 |

---

## 2. especificación Visual por Dispositivo

### 2.1 MÓVIL (0-767px) —Diseño Existente Preservado

#### Layout
- **Ancho máximo**: 100% (sin restricciones)
- **Padding horizontal**: 0.5rem (16px total)
- **Navbar height**: 64px (h-16)
- **Safe area**: respected fornotch devices

#### Tipografía
- **h1**: 1.75rem / line-height 1.2
- **h2**: 1.5rem / line-height 1.25
- **h3**: 1.25rem / line-height 1.3
- **Body**: 1rem / line-height 1.5
- **Caption**: 0.875rem

#### Tarjetas (Cards)
- **Border-radius**: 1rem (rounded-2xl)
- **Padding**: 1rem
- **Shadow**: shadow-md
- **Touch targets**: min-h-12 (48px)

#### Botones
- **Height**: 48px (h-12)
- **Padding**: 1rem px, 0.75rem py
- **Font**: text-sm font-semibold
- **Border-radius**: full (rounded-full)

#### Inputs
- **Height**: 48px (h-12)
- **Font-size**: 1rem
- **Border-radius**: 0.75rem (rounded-xl)

#### Badges
- **Font-size**: 10px
- **Min-width**: 18px
- **Height**: 18px
- **Padding**: 0.25rem

#### Iconos
- **Size**: 20px (w-5 h-5)
- **Spacing**: 0.5rem gap

#### Animaciones
- **Float**: 6s duration
- **Glow pulse**: 3s duration
- **Transitions**: 300ms

#### Efectos Visuales
- **Glass**: backdrop-blur-md (performance)
- **Aurora**: opacity-50

---

### 2.2 TABLET (768-1279px) —Diseño Nuevo

#### Layout
- **Ancho máximo**: 100% ( expandable)
- **Padding horizontal**: 1.5rem (24px)
- **Navbar height**: 72px (h-[72px])
- **Margin auto**: centered

#### Tipografía
- **h1**: 2.25rem
- **h2**: 1.875rem
- **h3**: 1.5rem
- **Body**: 1rem
- **Caption**: 0.875rem

#### Tarjetas (Cards)
- **Border-radius**: 1.25rem (rounded-3xl)
- **Padding**: 1.25rem (p-5)
- **Shadow**: shadow-lg
- **Touch targets**: min-h-14 (56px)

#### Botones
- **Height**: 56px (h-14)
- **Padding**: 1.75rem px, 1rem py
- **Font**: text-base font-bold
- **Border-radius**: full

#### Inputs
- **Height**: 56px (h-14)
- **Font-size**: 1.125rem (text-lg)
- **Border-radius**: 0.75rem

#### Badges
- **Font-size**: 12px (text-xs)
- **Min-width**: 22px
- **Height**: 22px
- **Padding**: 0.375rem

#### Iconos
- **Size**: 24px (w-6 h-6)
- **Spacing**: 0.75rem gap

#### Layout de Grilla
- **Grid columns**: 2
- **Gap**: 1rem (gap-4)

#### Sidebar
- **Width**: 0px (no sidebar)
- **Nota**: El contenido se muestra debajo del navbar

#### Animaciones
- **Float**: 8s duration
- **Glow pulse**: 4s duration
- **Transitions**: 400ms

#### Efectos Visuales
- **Glass**: backdrop-blur-xl
- **Aurora**: opacity-75

---

### 2.3 DESKTOP (1280px+) —Diseño Nuevo

#### Layout
- **Ancho máximo**: 1400px (max-w-7xl)
- **Padding horizontal**: 2rem (32px)
- **Navbar height**: 80px (h-20)
- **Sidebar width**: 280px (fijo)

#### Tipografía
- **h1**: 2.5rem
- **h2**: 2rem
- **h3**: 1.625rem
- **Body**: 1.0625rem (text-base[17])
- **Caption**: 1rem

#### Tarjetas (Cards)
- **Border-radius**: 1.5rem (rounded-[1.5rem])
- **Padding**: 1.5rem (p-6)
- **Shadow**: shadow-xl
- **Touch targets**: min-h-16 (64px)

#### Botones
- **Height**: 64px (h-16)
- **Padding**: 2rem px, 1.25rem py
- **Font**: text-lg font-extrabold
- **Border-radius**: full

#### Inputs
- **Height**: 64px (h-16)
- **Font-size**: 1.25rem (text-xl)
- **Border-radius**: 0.75rem

#### Badges
- **Font-size**: 14px (text-sm)
- **Min-width**: 24px
- **Height**: 24px
- **Padding**: 0.5rem

#### Iconos
- **Size**: 28px (w-7 h-7)
- **Spacing**: 1rem gap

#### Layout de Grilla
- **Grid columns**: 3 (4 en xl)
- **Gap**: 1.5rem (gap-6)
- **Sidebar**: fijo a la izquierda

#### Animaciones
- **Float**: 10s duration
- **Glow pulse**: 5s duration
- **Transitions**: 500ms

#### Efectos Visuales
- **Glass**: backdrop-blur-2xl
- **Aurora**: opacity-100

---

## 3. Sistema de Espaciado Responsive

### Escala de Espaciado Base

| Token | Móvil | Tablet | Desktop |
|-------|-------|--------|--------|
| --space-1 | 4px | 6px | 8px |
| --space-2 | 8px | 10px | 12px |
| --space-3 | 12px | 16px | 20px |
| --space-4 | 16px | 20px | 24px |
| --space-6 | 24px | 32px | 40px |
| --space-8 | 32px | 40px | 48px |
| --space-12 | 48px | 56px | 64px |
| --space-16 | 64px | 80px | 96px |

---

## 4. Componentes Visual Design System

### Hook de Detección de Dispositivo

```typescript
// uso:
import { useDeviceSize, DeviceSize } from '@/hooks/use-device-size';

function MyComponent() {
  const deviceSize = useDeviceSize();
  
  if (deviceSize === 'mobile') {
    return <MobileLayout />;
  } else if (deviceSize === 'tablet') {
    return <TabletLayout />;
  }
  return <DesktopLayout />;
}
```

### Componentes Disponibles

| Componente | Descripción |
|-----------|----------|
| `DeviceAwareContainer` | Contenedor con max-width responsivo |
| `DeviceGridLayout` | Grid con columnas responsivas |
| `DeviceCardLayout` | Tarjeta con padding/shadow responsivo |
| `DeviceHeader` | Encabezado con tamaño responsivo |
| `DeviceText` | Texto con tamaño/variant responsivo |
| `DeviceButton` | Botón con tamaño responsivo |
| `DeviceInput` | Input con tamaño responsivo |
| `DeviceBadge` | Badge con tamaño responsivo |
| `DeviceSpacing` | Espaciado responsivo |

---

## 5. CSS Utilities Responsives

### Clases Disponibles

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

## 6. Paleta de Colores (Sin Cambios)

| Color | HSL | CSS Variable |
|-------|-----|--------------|
| Primary | 250 85% 65% | --primary |
| Secondary | 165 82% 51% | --secondary |
| Cyber Violet | 250 85% 65% | --cyber-violet |
| Cyber Emerald | 165 82% 51% | --cyber-emerald |
| Cyber Rose | 330 90% 65% | --cyber-rose |
| Cyber Amber | 38 92% 60% | --cyber-amber |
| Cyber Depth | 222 47% 6% | --cyber-depth |

---

## 7. Animaciones por Dispositivo

### Float Animation
```
Móvil:   6s cubic-bezier(0.45, 0, 0.15, 1)
Tablet:  8s cubic-bezier(0.45, 0, 0.15, 1)
Desktop: 10s cubic-bezier(0.45, 0, 0.15, 1)
```

### Glow Pulse
```
Móvil:   3s ease-in-out infinite
Tablet:  4s ease-in-out infinite
Desktop: 5s ease-in-out infinite
```

---

## 8. Guía de Implementación

### Paso 1: Usar el Hook
```typescript
import { useDeviceSize } from '@/hooks/use-device-size';
```

### Paso 2: Aplicar Clases Responsivas
```typescript
// En lugar de clases fijas:
<button className="h-12 px-4"> texto </button>

// Usar clases responsive:
<button className="action-button-mobile"> texto </button>
```

### Paso 3: Usar Componentes Device*
```typescript
import { DeviceButton, DeviceCard, DeviceInput } from '@/components/visual-design';

// Automatically responsivo sin lógica manual
<DeviceButton variant="primary"> Click aquí </DeviceButton>
<DeviceCard> contenido </DeviceCard>
```

---

## 9. Notas Importantes

1. **Móvil NO se touchange**: El diseño móvil existente se preserva exactamente
2. **Funciones intactas**: Todas las lógicas de negocio permanecen sin cambios
3. **Solo diseño**: Solo se modifican aspectos visuales (tamaños, espaciados, efectos)
4. **Performance**: Los efectos visuales se ajustan según capacidad del dispositivo
5. **Transiciones suaves**: Las animaciones son más rápidas en móvil, más fluidas en desktop