/**
 * Animaciones avanzadas del Portal de Sueños con anime.js v3.
 * Cada función devuelve timelines compostables con `play()`.
 */

import anime from 'animejs';

// === UTILIDADES ===
export const EASE = {
  spring: 'spring(1, 80, 10, 0)',
  elastic: 'easeOutElastic(1, .6)',
  bounce: 'easeOutBounce',
  back: 'easeOutBack',
  expo: 'easeOutExpo',
  cubic: 'easeOutCubic',
  circ: 'easeOutCirc',
  sine: 'easeInOutSine',
};

export const TIMING = {
  fast: 350,
  base: 700,
  slow: 1400,
  epic: 2200,
};

// === ENTRADA MAESTRA (cuando se monta la página) ===
export function playEntranceMaster(refs: {
  portal?: HTMLElement;
  moon?: HTMLElement;
  stars?: HTMLElement[];
  hero?: HTMLElement;
  subtitle?: HTMLElement;
  textarea?: HTMLElement;
  cta?: HTMLElement;
}) {
  // 1) Portal base — sutil parallax perspective
  if (refs.portal) {
    anime.set(refs.portal, {
      perspective: 1200,
      transformStyle: 'preserve-3d',
    });
  }

  // 2) Luna: rotación orbital + eclipse
  if (refs.moon) {
    anime.set(refs.moon, { opacity: 0, scale: 0.4 });
    anime({
      targets: refs.moon,
      opacity: [0, 1],
      scale: [0.4, 1],
      translateY: [-180, 0],
      duration: TIMING.epic,
      easing: EASE.elastic,
      complete: () => {
        // Eclipse permanente después de entrada
        anime({
          targets: refs.moon,
          boxShadow: [
            '0 0 60px rgba(253, 230, 138, 0.08), 0 0 120px rgba(253, 230, 138, 0.04)',
            '0 0 100px rgba(253, 230, 138, 0.2), 0 0 200px rgba(253, 230, 138, 0.1)',
            '0 0 60px rgba(253, 230, 138, 0.08), 0 0 120px rgba(253, 230, 138, 0.04)',
          ],
          duration: 5000,
          direction: 'alternate',
          easing: EASE.sine,
          loop: true,
        });
        // Drift orbital lento
        anime({
          targets: refs.moon,
          translateX: [-12, 12],
          translateY: [-6, 6],
          rotate: [-3, 3],
          duration: TIMING.epic * 2.5,
          direction: 'alternate',
          easing: EASE.sine,
          loop: true,
        });
      },
    });
  }

  // 3) Estrellas: cascada gravitacional con ondas concéntricas
  if (refs.stars && refs.stars.length) {
    refs.stars.forEach((star, i) => {
      const finalTop = parseFloat((star as any).__finalY || Math.random() * 80 + 10);
      const finalLeft = parseFloat((star as any).__finalX || Math.random() * 95);
      const size = (star as any).__size || 2;
      const hue = (star as any).__hue || 220;

      anime.set(star, {
        opacity: 0,
        scale: 0,
        translateY: -600,
        translateX: (Math.random() - 0.5) * 200,
        top: '-50px',
        left: `${finalLeft}%`,
        background: `hsla(${hue}, 90%, 80%, 1)`,
        boxShadow: `0 0 ${size * 4}px hsla(${hue}, 90%, 80%, 0.8)`,
      });

      // Fase 1: Caída con gravedad (easeInQuad = aceleración)
      anime({
        targets: star,
        translateY: [0, 600],
        opacity: [0, 1, 1, 0.8],
        scale: [0, 1.2, 1],
        duration: 1800 + Math.random() * 800,
        delay: 200 + i * 50,
        easing: 'easeInQuad',
        complete: () => {
          // Fase 2: Onda expansiva concéntrica al tocar el "lago"
          const ripple = document.createElement('div');
          ripple.className = 'dream-star-ripple';
          star.parentElement?.appendChild(ripple);
          const rect = star.getBoundingClientRect();
          ripple.style.left = `${rect.left + rect.width / 2}px`;
          ripple.style.top = `${rect.top + rect.height / 2}px`;
          anime({
            targets: ripple,
            scale: [0, 8],
            opacity: [0.5, 0],
            duration: 1200,
            easing: EASE.cubic,
            complete: () => ripple.remove(),
          });

          // Fase 3: Reposicionar a su órbita permanente + twinkle infinite
          anime.set(star, {
            position: 'fixed',
            top: `${finalTop}%`,
            left: `${finalLeft}%`,
            translateY: 0,
            translateX: 0,
          });

          anime({
            targets: star,
            opacity: [
              { value: 0.9, duration: 2000 + Math.random() * 2000 },
              { value: 0.15, duration: 2000 + Math.random() * 2000 },
              { value: 0.9, duration: 2000 + Math.random() * 2000 },
            ],
            scale: [
              { value: 1.4, duration: 1500 },
              { value: 1, duration: 1500 },
            ],
            translateX: () => [0, (Math.random() - 0.5) * 10, 0],
            translateY: () => [0, (Math.random() - 0.5) * 8, 0],
            easing: EASE.sine,
            duration: 4000,
            loop: true,
            delay: Math.random() * 1500,
          });
        },
      });
    });
  }

  // 4) Hero — fragmentación tipo aurora boreal
  if (refs.hero && refs.subtitle) {
    const text = refs.hero.textContent || '';
    refs.hero.setAttribute('data-text', text); // store original
    refs.hero.innerHTML = '';

    const chars: HTMLSpanElement[] = [];
    text.split('').forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'dream-hero-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      refs.hero!.appendChild(span);
      chars.push(span);
    });

    anime.set(chars, {
      opacity: 0,
      translateY: () => [anime.random(-100, -40), 0],
      rotateZ: () => anime.random(-30, 30),
      scale: 0.3,
      color: '#a5b4fc',
    });

    // Título aparece como aurora fragmentada
    anime({
      targets: chars,
      opacity: [0, 1],
      scale: [0.3, 1],
      rotateZ: (el: any, i: number) => {
        const target = (el as HTMLElement) as any;
        return [target._rotZ ? target._rotZ : 0, 0];
      },
      translateY: (el: any) => [anime.random(-100, -40), 0],
      color: [
        { value: '#a5b4fc', duration: 800 },
        { value: '#93c5fd', duration: 800 },
        { value: '#c4b5fd', duration: 800 },
        { value: '#ffffff', duration: 600 },
      ],
      delay: anime.stagger(35, { start: 1200 }),
      duration: TIMING.epic,
      easing: EASE.expo,
      complete: () => {
        // Aurora permanente después de montarse
        animateHeroAurora(chars);
      },
    });

    // Subtitle: fade + blur
    anime.set(refs.subtitle, { opacity: 0, filter: 'blur(12px)', translateY: 20 });
    anime({
      targets: refs.subtitle,
      opacity: [0, 0.7],
      filter: ['blur(12px)', 'blur(0px)'],
      translateY: [20, 0],
      duration: TIMING.epic,
      delay: 2400,
      easing: EASE.cubic,
    });
  }

  // 5) Textarea: fade-in suave
  if (refs.textarea) {
    anime.set(refs.textarea, {
      opacity: 0,
      translateY: 30,
    });
    anime({
      targets: refs.textarea,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: TIMING.base,
      delay: 2400,
      easing: EASE.cubic,
    });
  }

  // 6) CTA: morphing gradient + halo expansion
  if (refs.cta) {
    anime.set(refs.cta, {
      opacity: 0,
      scale: 0,
      rotate: -10,
    });
    anime({
      targets: refs.cta,
      opacity: [0, 1],
      scale: [0, 1.15, 1],
      rotate: [-10, 5, 0],
      duration: TIMING.epic,
      delay: 3400,
      easing: EASE.back,
      complete: () => {
        animateCtaHalo(refs.cta!);
      },
    });
  }
}

function animateHeroAurora(chars: HTMLSpanElement[]) {
  // Cada carácter ondea con un gradiente cromático continuo
  chars.forEach((char, i) => {
    anime({
      targets: char,
      color: [
        { value: '#a5b4fc', duration: 3000 },
        { value: '#86efac', duration: 3000 },
        { value: '#93c5fd', duration: 3000 },
        { value: '#67e8f9', duration: 3000 },
        { value: '#c4b5fd', duration: 3000 },
        { value: '#a5b4fc', duration: 3000 },
      ],
      translateY: (el: any) => {
        const t = (i + anime.random(0, 100)) * 0.001;
        return [Math.sin(t) * 4, Math.sin(t + 1) * 4];
      },
      opacity: [
        { value: 0.85, duration: 2000 },
        { value: 1, duration: 2000 },
      ],
      duration: 20000,
      easing: 'linear',
      loop: true,
    });
  });
}

function animateCtaHalo(cta: HTMLElement) {
  // Halo SVG permanente detrás del botón
  if (cta.querySelector('.cta-halo')) return;

  const halo = document.createElement('div');
  halo.className = 'cta-halo';
  cta.appendChild(halo);

  // Conic gradient rotando
  anime({
    targets: halo,
    rotate: 360,
    duration: 6000,
    easing: 'linear',
    loop: true,
  });

  // Pulse expansivo
  anime({
    targets: halo,
    scale: [1, 1.4, 1],
    opacity: [0.3, 0.6, 0.3],
    duration: 2000,
    easing: EASE.sine,
    loop: true,
  });
}

// === TILT 3D PARALLAX ===
export function bindTiltParallax(el: HTMLElement, intensity: number = 30) {
  const onMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    anime({
      targets: el,
      rotateY: dx * intensity * 0.4,
      rotateX: -dy * intensity * 0.4,
      translateZ: 30,
      duration: 500,
      easing: EASE.cubic,
    });
  };

  const onLeave = () => {
    anime({
      targets: el,
      rotateY: 0,
      rotateX: 0,
      translateZ: 0,
      duration: 900,
      easing: EASE.spring,
    });
  };

  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
}

// === PANEL CURTAIN REVEAL ===
export function animatePanelCurtain(panel: HTMLElement, isOpen: boolean, totalWidth: number) {
  if (!panel) return;

  if (isOpen) {
    // Cortina abriéndose + ondas en el borde
    anime.set(panel, { display: 'flex' });
    anime({
      targets: panel,
      translateX: [totalWidth, 0],
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: TIMING.slow,
      easing: EASE.cubic,
    });
  } else {
    anime({
      targets: panel,
      translateX: [0, totalWidth * 0.85],
      opacity: [1, 0],
      scale: [1, 0.95],
      duration: 700,
      easing: EASE.circ,
      complete: () => {
        anime.set(panel, { display: 'none' });
      },
    });
  }
}

// === SWARM STAGGER FOR DIARY ITEMS ===
export function animateDiarySwarm(items: HTMLElement[]) {
  anime.set(items, { opacity: 0, translateX: 60, scale: 0.85 });
  anime({
    targets: items,
    opacity: [0, 1],
    translateX: [60, 0],
    scale: [0.85, 1],
    rotate: [4, 0],
    duration: 900,
    delay: anime.stagger(80, { grid: [items.length, 1], from: 'first' }),
    easing: EASE.spring,
  });
}

// === CARD 3D TILT + GLOW BREATHING ===
export function animateSpecialistBreathing(card: HTMLElement, accent: string) {
  const ring = card.querySelector('.dream-glow-ring') as HTMLElement | null;
  if (!ring) return;
  anime.set(ring, {
    boxShadow: `0 0 0px ${accent}`,
  });
  anime({
    targets: ring,
    opacity: [
      { value: 0.5, duration: 1200 },
      { value: 0, duration: 1200 },
    ],
    scale: [
      { value: 1.4, duration: 1200 },
      { value: 1, duration: 1200 },
    ],
    easing: EASE.sine,
    loop: true,
  });
}

// === WATER RIPPLE ON CLICK ===
export function spawnWaterRipple(x: number, y: number, color = 'rgba(147, 197, 253, 0.4)') {
  const ripple = document.createElement('div');
  ripple.className = 'dream-water-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.borderColor = color;
  document.body.appendChild(ripple);

  anime({
    targets: ripple,
    scale: [0, 12],
    opacity: [0.8, 0],
    borderWidth: [3, 0],
    duration: 1400,
    easing: EASE.circ,
    complete: () => ripple.remove(),
  });
}

// === MORPHING BACKGROUND GRADIENT ===
export function animateMorphingBackdrop(el: HTMLElement) {
  const gradients = [
    `radial-gradient(ellipse 80% 50% at 30% 20%, rgba(96, 165, 250, 0.15) 0%, transparent 60%),
     radial-gradient(ellipse 60% 40% at 70% 60%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
     radial-gradient(ellipse 50% 50% at 50% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 50%)`,
    `radial-gradient(ellipse 60% 60% at 60% 30%, rgba(165, 180, 252, 0.18) 0%, transparent 60%),
     radial-gradient(ellipse 50% 40% at 30% 70%, rgba(196, 181, 253, 0.14) 0%, transparent 50%),
     radial-gradient(ellipse 70% 50% at 80% 90%, rgba(134, 239, 172, 0.1) 0%, transparent 50%)`,
    `radial-gradient(ellipse 70% 50% at 80% 30%, rgba(103, 232, 249, 0.16) 0%, transparent 60%),
     radial-gradient(ellipse 55% 45% at 20% 60%, rgba(147, 197, 253, 0.14) 0%, transparent 50%),
     radial-gradient(ellipse 60% 60% at 50% 90%, rgba(196, 181, 253, 0.1) 0%, transparent 50%)`,
  ];

  let idx = 1;
  setInterval(() => {
    anime({
      targets: el,
      backgroundImage: gradients[idx],
      duration: 12000,
      easing: EASE.sine,
    });
    idx = (idx + 1) % gradients.length;
  }, 12000);
}

// === PARALLAX MOUSE ===
export function bindGlobalParallax(portal: HTMLElement, layers: { el: HTMLElement; depth: number }[]) {
  portal.addEventListener('mousemove', (e) => {
    const rect = portal.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    layers.forEach(({ el, depth }) => {
      anime.set(el, {
        translateX: cx * depth * 30,
        translateY: cy * depth * 30,
      });
    });
  });
}
