/* ════════════════════════════════════════════════════════════
   YAPIDO — Editorial Brutalism
   Interactions: Lenis smooth scroll, custom cursor,
   GSAP loader, ScrollTrigger choreography, join sequence.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── libs are loaded with `defer`, so wait for them ─── */
  const ready = (fn) => {
    if (window.gsap && window.ScrollTrigger && window.Lenis) {
      return fn();
    }
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      if (window.gsap && window.ScrollTrigger && window.Lenis) {
        clearInterval(id);
        fn();
      } else if (tries > 80) {
        clearInterval(id);
        fn(true);
      }
    }, 50);
  };

  ready((fallback) => {
    const hasGSAP = !!window.gsap && !!window.ScrollTrigger;
    const hasLenis = !!window.Lenis;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

    /* ═══ LENIS (smooth scroll) ════════════════════════════ */
    let lenis = null;
    if (hasLenis) {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.4,
      });

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ═══ CUSTOM CURSOR ════════════════════════════════════ */
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');
    if (cursor && cursorDot && window.matchMedia('(pointer: fine)').matches) {
      let cx = -100, cy = -100;
      let dx = -100, dy = -100;
      let tx = -100, ty = -100;
      const ringSpeed = 0.18;

      const move = (e) => {
        tx = e.clientX;
        ty = e.clientY;
        dx = e.clientX;
        dy = e.clientY;
      };
      window.addEventListener('mousemove', move, { passive: true });

      const tickCursor = () => {
        cx += (tx - cx) * ringSpeed;
        cy += (ty - cy) * ringSpeed;
        cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
        cursorDot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
        requestAnimationFrame(tickCursor);
      };
      tickCursor();

      document.querySelectorAll('[data-cursor="lg"]').forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-lg'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-lg'));
      });

      document.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('mousedown', () => cursor.classList.add('is-press'));
        el.addEventListener('mouseup',   () => cursor.classList.remove('is-press'));
      });
    }

    /* ═══ PROGRESS BAR ════════════════════════════════════ */
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      const updateProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        progressFill.style.width = pct + '%';
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    /* ═══ LOADER SEQUENCE ═════════════════════════════════ */
    const loader = document.getElementById('loader');
    const loaderNum = document.getElementById('loaderNum');
    const loaderBar = document.getElementById('loaderBar');
    const loaderLabel = document.getElementById('loaderLabel');
    const loaderLines = document.querySelectorAll('[data-loader-line]');
    const loaderTag = document.querySelector('[data-loader-tag]');

    const labels = [
      'ABRIENDO LA PUERTA',
      'PREPARANDO EL ECOSISTEMA',
      'CALIBRANDO 20 AGENTES',
      'CONECTANDO NIMBUS',
      'LISTO',
    ];

    if (loader) {
      const counter = { v: 0 };
      const target = 100;
      const dur = 1.8;
      const state = { proxy: counter };

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
      });

      tl.to(state.proxy, {
        v: target,
        duration: dur,
        ease: 'power1.inOut',
        onUpdate: () => {
          const v = Math.round(state.proxy.v);
          if (loaderNum) loaderNum.textContent = String(v).padStart(2, '0');
          if (loaderBar) loaderBar.style.width = v + '%';
          if (loaderLabel) {
            const idx = Math.min(labels.length - 1, Math.floor((v / 100) * labels.length));
            loaderLabel.textContent = labels[idx];
          }
        },
      });

      tl.to(loaderLines, {
        y: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.1,
      }, '-=0.6');

      tl.to(loaderTag, {
        opacity: 1,
        duration: 0.5,
      }, '-=0.4');

      tl.to(loader, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        delay: 0.25,
        onComplete: () => {
          loader.classList.add('is-out');
          document.body.style.overflow = '';
          startHero();
        },
      });

      document.body.style.overflow = 'hidden';
    } else {
      startHero();
    }

    /* ═══ HERO ANIMATION ══════════════════════════════════ */
    function startHero() {
      const nav = document.getElementById('nav');
      if (nav) {
        setTimeout(() => nav.classList.add('is-in'), 100);
      }

      const heroLines = document.querySelectorAll('.hero-line');
      if (heroLines.length && hasGSAP) {
        gsap.set(heroLines, { opacity: 1 });
        const allChars = document.querySelectorAll('.hero-line > span');
        if (allChars.length) {
          gsap.to(allChars, {
            y: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: { each: 0.04, from: 'start' },
          });
        }
      }

      const heroMeta = document.querySelectorAll('.hero-meta-block, .hero-lede, .hero-cta');
      if (heroMeta.length && hasGSAP) {
        gsap.from(heroMeta, {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.8,
        });
      }
    }

    /* ═══ SPLIT-WORD REVEAL ════════════════════════════════ */
    if (hasGSAP) {
      document.querySelectorAll('[data-split-word]').forEach((word) => {
        gsap.from(word, {
          y: '110%',
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: word,
            start: 'top 92%',
            once: true,
          },
        });
      });
    }

    /* ═══ SECTION REVEAL (generic) ═════════════════════════ */
    if (hasGSAP) {
      gsap.utils.toArray('section > header, .longform-body, .longform-quote, .longform-sign, .cta-inner > *, .nimbus-features, .nimbus-cta').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      });
    }

    /* ═══ NUMBERS COUNT-UP ═════════════════════════════════ */
    if (hasGSAP) {
      document.querySelectorAll('[data-counter]').forEach((el) => {
        const item = el.closest('.num');
        if (!item) return;
        const targetAttr = item.getAttribute('data-counter-target');
        const target = parseInt(targetAttr, 10);
        if (isNaN(target)) return;
        const state = { v: 0 };
        const isTargetSmall = target < 100;
        gsap.to(state, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = isTargetSmall
              ? String(Math.round(state.v)).padStart(2, '0')
              : String(Math.round(state.v));
          },
        });
      });
    }

    /* ═══ SEVEN LIST REVEAL ═══════════════════════════════ */
    if (hasGSAP) {
      gsap.utils.toArray('.seven-item').forEach((item, i) => {
        gsap.from(item, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
            once: true,
          },
          delay: 0.05,
        });
      });
    }

    /* ═══ STACK ROW REVEAL ═════════════════════════════════ */
    if (hasGSAP) {
      gsap.utils.toArray('.stack-row:not(.stack-row--head)').forEach((row) => {
        gsap.from(row, {
          x: -30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 92%',
            once: true,
          },
        });
      });
    }

    /* ═══ CTA CARDS — subtle → highlight on viewport ════════ */
    if (hasGSAP) {
      document.querySelectorAll('[data-cta-card]').forEach((card) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            card.classList.add('is-active');
            // a small delayed accent animation when activated
            if (hasGSAP) {
              gsap.fromTo(card.querySelector('.cta-card-rule'),
                { width: 0 },
                { width: '40%', duration: 0.8, ease: 'expo.out', delay: 0.4 }
              );
              gsap.fromTo(card.querySelector('.cta-card-btn'),
                { x: -12, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.6 }
              );
            }
          },
        });
      });
    }

    /* ═══ NIMBUS SPOTLIGHT — title + body reveal ═══════════ */
    if (hasGSAP) {
      const nimbusTitleLine = document.querySelector('.nimbus-title-line');
      const nimbusTitleSub  = document.querySelector('.nimbus-title-sub');
      const nimbusBody      = document.querySelector('.nimbus-body');
      const nimbusFeatures  = document.querySelectorAll('.nimbus-feature');

      if (nimbusTitleLine) {
        gsap.from(nimbusTitleLine, {
          y: 80,
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: nimbusTitleLine, start: 'top 85%', once: true },
        });
      }
      if (nimbusTitleSub) {
        gsap.from(nimbusTitleSub, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: nimbusTitleSub, start: 'top 85%', once: true },
          delay: 0.2,
        });
      }
      if (nimbusBody) {
        gsap.from(nimbusBody, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: nimbusBody, start: 'top 85%', once: true },
          delay: 0.3,
        });
      }
      nimbusFeatures.forEach((feat, i) => {
        gsap.from(feat, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: feat, start: 'top 90%', once: true },
          delay: 0.1 + i * 0.08,
        });
      });
    }

    /* ═══ NAV ACTIVE SECTION ═══════════════════════════════ */
    if (hasGSAP) {
      const navLinks = document.querySelectorAll('.nav-sections a');
      const sectionIds = Array.from(navLinks).map((a) => a.getAttribute('href').replace('#', ''));

      sectionIds.forEach((id) => {
        const target = document.getElementById(id);
        if (!target) return;
        ScrollTrigger.create({
          trigger: target,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setActive(id),
          onEnterBack: () => setActive(id),
        });
      });

      function setActive(id) {
        navLinks.forEach((a) => {
          const target = a.getAttribute('href').replace('#', '');
          a.classList.toggle('is-active', target === id);
        });
      }
    }

    /* ═══ SMOOTH ANCHOR SCROLL (with Lenis) ════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        // #nimbus or other anchors that point to in-page sections still scroll
        if (anchor.hasAttribute('data-join')) return; // join CTAs handled separately
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -50, duration: 1.4 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    /* ═══ JOIN SEQUENCE OVERLAY ════════════════════════════ */
    const joinOverlay = document.getElementById('joinOverlay');
    const joinClose   = document.getElementById('joinClose');
    const joinCounter = document.getElementById('joinCounter');
    const joinPhrases = document.querySelectorAll('[data-join-phrase]');
    const joinFinal   = document.querySelector('[data-join-final]');
    const joinBar     = document.querySelector('.join-progress-bar');

    let joinActive = false;
    let joinTimers = [];
    const PHRASE_HOLD = 4000;   // ms each phrase stays visible (slow, deliberate)
    const PHRASE_TRANSITION = 800; // ms cross-fade

    function clearJoinTimers() {
      joinTimers.forEach((t) => clearTimeout(t));
      joinTimers = [];
    }

    function showPhrase(idx) {
      if (idx >= joinPhrases.length) {
        // show final
        if (joinFinal) {
          joinFinal.hidden = false;
          requestAnimationFrame(() => joinFinal.classList.add('is-visible'));
        }
        if (joinCounter) joinCounter.textContent = '— LISTO —';
        if (joinBar) joinBar.style.width = '100%';
        return;
      }
      const phrase = joinPhrases[idx];
      const num = String(idx + 1).padStart(2, '0');
      if (joinCounter) joinCounter.textContent = `${num} / ${String(joinPhrases.length).padStart(2, '0')}`;
      if (joinBar) joinBar.style.width = `${((idx + 1) / joinPhrases.length) * 100}%`;

      // make visible
      phrase.classList.remove('is-leaving');
      phrase.classList.add('is-visible');

      const t1 = setTimeout(() => {
        phrase.classList.remove('is-visible');
        phrase.classList.add('is-leaving');
        const t2 = setTimeout(() => {
          phrase.classList.remove('is-leaving');
          showPhrase(idx + 1);
        }, PHRASE_TRANSITION);
        joinTimers.push(t2);
      }, PHRASE_HOLD);
      joinTimers.push(t1);
    }

    function startJoinSequence() {
      if (joinActive || !joinOverlay) return;
      joinActive = true;
      // reset state
      joinPhrases.forEach((p) => {
        p.classList.remove('is-visible', 'is-leaving');
      });
      if (joinFinal) {
        joinFinal.classList.remove('is-visible');
        joinFinal.hidden = true;
      }
      if (joinBar) joinBar.style.width = '0%';

      // open overlay
      joinOverlay.classList.add('is-opening');
      joinOverlay.classList.remove('is-closing');
      joinOverlay.setAttribute('aria-hidden', 'false');

      requestAnimationFrame(() => {
        joinOverlay.classList.add('is-open');
        if (lenis) lenis.stop();

        // start phrases AFTER curtains open
        setTimeout(() => {
          joinOverlay.classList.remove('is-opening');
          showPhrase(0);
        }, 1100);
      });
    }

    function closeJoinSequence() {
      if (!joinActive) return;
      joinActive = false;
      clearJoinTimers();
      if (joinOverlay) {
        joinOverlay.classList.remove('is-open');
        joinOverlay.classList.add('is-closing');
        joinOverlay.setAttribute('aria-hidden', 'true');
        if (lenis) lenis.start();
        setTimeout(() => {
          joinOverlay.classList.remove('is-closing');
        }, 1000);
      }
    }

    // Bind all [data-join] triggers
    document.querySelectorAll('[data-join]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        startJoinSequence();
      });
    });

    if (joinClose) {
      joinClose.addEventListener('click', closeJoinSequence);
    }

    // restart button inside the final state
    const joinRestart = document.querySelector('[data-join-restart]');
    if (joinRestart) {
      joinRestart.addEventListener('click', (e) => {
        e.preventDefault();
        clearJoinTimers();
        if (joinFinal) {
          joinFinal.classList.remove('is-visible');
          joinFinal.hidden = true;
        }
        joinPhrases.forEach((p) => {
          p.classList.remove('is-visible', 'is-leaving');
        });
        setTimeout(() => showPhrase(0), 200);
      });
    }

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && joinActive) closeJoinSequence();
    });

    /* ═══ PARALLAX (subtle) ════════════════════════════════ */
    if (hasGSAP && lenis) {
      gsap.utils.toArray('.section-num').forEach((el) => {
        gsap.to(el, {
          y: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // Nimbus orbs subtle drift
      gsap.utils.toArray('.nimbus-bg-orb').forEach((orb, i) => {
        gsap.to(orb, {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: '.nimbus',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }

    /* ═══ FOOTER BRAND REVEAL ══════════════════════════════ */
    if (hasGSAP) {
      gsap.from('.footer-brand-mark', {
        scrollTrigger: { trigger: '.footer', start: 'top 80%', once: true },
        scale: 0,
        rotation: 90,
        duration: 0.9,
        ease: 'back.out(1.4)',
      });
    }
  });
})();
