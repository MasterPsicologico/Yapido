/* ============================================
   GUÍA DE JUEGOS — APP.JS
   Loader + Lenis + GSAP + Reveals + Calc
   ============================================ */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     LOADER (counter 000 → 100)
     ============================================ */
  const loader = document.getElementById('loader');
  const loaderNum = document.getElementById('loaderNum');
  const loaderBar = loader ? loader.querySelector('.loader__bar span') : null;

  function runLoader() {
    if (!loader) return;
    let n = 0;
    const target = 100;
    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      n = Math.floor(eased * target);
      if (loaderNum) loaderNum.textContent = String(n).padStart(3, '0');
      if (loaderBar) loaderBar.style.width = (eased * 100) + '%';
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(hideLoader, 250);
    }

    requestAnimationFrame(tick);
  }

  function hideLoader() {
    if (!loader) return;
    loader.classList.add('is-hidden');
    document.body.style.overflow = '';
    initHero();
  }

  /* ============================================
     LENIS SMOOTH SCROLL
     ============================================ */
  let lenis = null;
  function initLenis() {
    if (typeof Lenis === 'undefined' || reducedMotion) return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href === '#top') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
      });
    });
  }

  /* ============================================
     HERO WORD REVEAL
     ============================================ */
  function initHero() {
    if (reducedMotion) {
      document.querySelectorAll('.word').forEach((w) => w.classList.add('is-in'));
      return;
    }
    if (typeof gsap === 'undefined') return;
    gsap.to('.word', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.06,
    });
  }

  /* ============================================
     SCROLL REVEAL (data-reveal)
     ============================================ */
  function initReveals() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (reducedMotion || typeof gsap === 'undefined') {
      els.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    els.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => el.classList.add('is-revealed'),
        once: true,
      });
    });
  }

  /* ============================================
     RULE BARS — fill animation
     ============================================ */
  function initRuleBars() {
    const bars = document.querySelectorAll('.rule__bar');
    if (!bars.length) return;
    if (reducedMotion) {
      bars.forEach((b) => b.classList.add('is-visible'));
      return;
    }
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    bars.forEach((bar) => {
      ScrollTrigger.create({
        trigger: bar,
        start: 'top 85%',
        onEnter: () => bar.classList.add('is-visible'),
        once: true,
      });
    });
  }

  /* ============================================
     TIMELINE / ROADMAP stagger
     ============================================ */
  function initStaggers() {
    if (reducedMotion || typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // timeline phases
    gsap.utils.toArray('.phase').forEach((phase, i) => {
      ScrollTrigger.create({
        trigger: phase,
        start: 'top 90%',
        onEnter: () => phase.classList.add('is-revealed'),
        once: true,
      });
    });
  }

  /* ============================================
     CALCULATOR
     ============================================ */
  function initCalculator() {
    const fighters = document.getElementById('calcFighters');
    const fightersVal = document.getElementById('calcFightersVal');
    const stages = document.getElementById('calcStages');
    const stagesVal = document.getElementById('calcStagesVal');
    const artQuality = document.getElementById('calcArtQuality');
    const vfx = document.getElementById('calcVFX');
    const audio = document.getElementById('calcAudio');

    if (!fighters || !stages) return;

    function formatUSD(n) {
      return '$' + Math.round(n).toLocaleString('en-US') + ' USD';
    }

    function recalc() {
      const f = parseInt(fighters.value, 10);
      const s = parseInt(stages.value, 10);
      const perFighter = parseInt(artQuality.value, 10);
      fightersVal.textContent = f;
      stagesVal.textContent = s;

      // Costo de luchadores
      const fightersCost = f * perFighter;

      // Costo de stages ($2k cada uno, incluye parallax art)
      const stagesCost = s * 2000;

      // Costo de VFX: 2 jutsus especiales por luchador × $2k
      const vfxCost = vfx && vfx.checked ? f * 2 * 2000 : 0;

      // Costo de audio: 3 tracks + SFX
      const audioCost = audio && audio.checked ? 3 * 3000 + 1500 : 0;

      // Software + licencias (Aseprite, Apple, Google, etc.)
      const softwareCost = 200 + 25 + 99; // ~$324

      const artTotal = fightersCost + stagesCost;
      const total = artTotal + vfxCost + audioCost + softwareCost;

      // Tiempo estimado
      let months;
      if (f <= 2 && s <= 1 && !vfx.checked && !audio.checked) {
        months = '12-18 meses (equipo pequeño)';
      } else if (f <= 4) {
        months = '10-16 meses (equipo medio)';
      } else {
        months = '12-24 meses (producción completa)';
      }

      document.getElementById('calcArtTotal').textContent = formatUSD(artTotal);
      document.getElementById('calcVfxTotal').textContent = formatUSD(vfxCost);
      document.getElementById('calcAudioTotal').textContent = formatUSD(audioCost);
      document.getElementById('calcTotal').textContent = formatUSD(total);
      document.getElementById('calcTime').textContent = months;
    }

    fighters.addEventListener('input', recalc);
    stages.addEventListener('input', recalc);
    artQuality.addEventListener('change', recalc);
    if (vfx) vfx.addEventListener('change', recalc);
    if (audio) audio.addEventListener('change', recalc);

    recalc();
  }

  /* ============================================
     TOPBAR active section
     ============================================ */
  function initTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    let lastY = 0;
    function onScroll() {
      const y = window.scrollY;
      if (y > 100) topbar.classList.add('is-scrolled');
      else topbar.classList.remove('is-scrolled');
      lastY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================
     INIT
     ============================================ */
  document.addEventListener('DOMContentLoaded', () => {
    document.body.style.overflow = 'hidden';
    initTopbar();
    initLenis();
    initReveals();
    initRuleBars();
    initStaggers();
    initCalculator();
    runLoader();
  });
})();
