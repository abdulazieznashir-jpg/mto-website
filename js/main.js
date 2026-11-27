// Mahkota Tahfizh Online — Shared JavaScript
(() => {
  'use strict';

  const html = document.documentElement;

  // Mobile menu
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  const closeMobileMenu = () => {
    if (!navToggle || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && mobileMenu) {
    navToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('open') ? 'true' : 'false');
    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMobileMenu();
    }, { passive: true });
  }

  // FAQ accordion with accessible expanded state.
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!button || !answer) return;

    if (!answer.id) answer.id = `faq-answer-${index + 1}`;
    button.setAttribute('aria-controls', answer.id);
    button.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');

    button.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach((otherItem) => {
        otherItem.classList.remove('open');
        const otherButton = otherItem.querySelector('.faq-question');
        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
      });

      if (willOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Reveal-on-scroll is progressive enhancement: content stays visible
  // if JavaScript or IntersectionObserver is unavailable.
  if ('IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length) {
      html.classList.add('js-reveal-ready');
      const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            currentObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      revealElements.forEach((element) => observer.observe(element));
    }
  }

  // Navigation background on scroll
  const nav = document.getElementById('nav');
  if (nav) {
    const updateNavBackground = () => {
      nav.style.background = window.scrollY > 20
        ? 'rgba(251, 251, 253, 0.95)'
        : 'rgba(251, 251, 253, 0.85)';
    };
    updateNavBackground();
    window.addEventListener('scroll', updateNavBackground, { passive: true });
  }

  // Smooth scroll for valid internal anchors only.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      let target = null;
      try {
        target = document.querySelector(href);
      } catch (_) {
        return;
      }

      if (!target) return;
      event.preventDefault();
      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 52;
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    });
  });
})();
