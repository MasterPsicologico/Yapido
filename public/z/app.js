/* ============================================================
   YAPIDO ECOSYSTEM — Interactions & Animations
   Particles, Magnetic Cursor, Scroll Reveals, Bento Tilt
   ============================================================ */

(function () {
  'use strict';

  /* ── Particle Background ──────────────────────────────── */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;
  let animFrame;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() > 0.5 ? 255 : 180; // purple or teal tint
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.hue}, ${this.hue === 255 ? 200 : 220}, ${this.hue === 255 ? 255 : 201}, ${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    resize();
    const count = Math.min(Math.floor((w * h) / 12000), 120);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108, 92, 231, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animFrame = requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animFrame);
    initParticles();
    animateParticles();
  });

  initParticles();
  animateParticles();

  /* ── Cursor Glow Follow ───────────────────────────────── */
  const cursorGlow = document.getElementById('cursorGlow');
  let mouseX = -300, mouseY = -300;
  let glowX = -300, glowY = -300;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.transform = `translate(${glowX - 300}px, ${glowY - 300}px)`;
    requestAnimationFrame(updateGlow);
  }
  updateGlow();

  /* ── Scroll Reveal (Intersection Observer) ─────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Bento Card Tilt Effect ────────────────────────────── */
  const bentoCards = document.querySelectorAll('.bento-card');

  bentoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;

      const bg = card.querySelector('.bento-card-bg');
      if (bg) {
        bg.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(108, 92, 231, 0.08), var(--glass-hover))`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      const bg = card.querySelector('.bento-card-bg');
      if (bg) {
        bg.style.background = '';
      }
    });
  });

  /* ── Magnetic Hover on CTA Buttons ─────────────────────── */
  const magneticEls = document.querySelectorAll('.hero-cta, .btn-primary, .eco-feat');

  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  /* ── Navbar Background on Scroll ───────────────────────── */
  const nav = document.querySelector('.nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      nav.style.background = 'rgba(6, 6, 10, 0.85)';
    } else {
      nav.style.background = 'rgba(6, 6, 10, 0.6)';
    }
    lastScroll = scrollY;
  }, { passive: true });

  /* ── Smooth anchor scroll ──────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Parallax on hero orbs ─────────────────────────────── */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 0.08;
      orb.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }, { passive: true });

})();
