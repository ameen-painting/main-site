'use strict';

/* ============================================================
   PORTFOLIO IMAGES
   Categories: before | after
   Project: the job each photo belongs to — new projects added
   later automatically get their own filter chip (see initPortfolio).
   ============================================================ */
const portfolioImages = [
  // BEFORE
  { src: 'assets/images/hollister-before-01.webp', label: 'Hollister — Priming Phase',       category: 'before', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-before-02.webp', label: 'Hollister — In Progress',          category: 'before', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-before-03.webp', label: 'Hollister — In Progress',          category: 'before', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-before-04.webp', label: 'Hollister — Three-Coat Process',   category: 'before', project: 'Hollister Retail' },
  // AFTER
  { src: 'assets/images/hollister-after-01.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-02.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-03.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-04.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-05.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-06.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-07.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-08.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-09.webp',  label: 'Hollister — Completed',            category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-10.webp',  label: 'Hollister — Final Result',         category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-11.webp',  label: 'Hollister — Final Result',         category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-12.webp',  label: 'Hollister — Final Result',         category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-13.webp',  label: 'Hollister — Final Result',         category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-14.webp',  label: 'Hollister — Premium Finish',       category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-15.webp',  label: 'Hollister — Flawless Result',      category: 'after', project: 'Hollister Retail' },
  { src: 'assets/images/hollister-after-16.webp',  label: 'Hollister — Showroom Quality',     category: 'after', project: 'Hollister Retail' },
];

/* ============================================================
   HEADER — scroll behaviour
   ============================================================ */
function initHeader() {
  const header = document.getElementById('site-header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function initMobileNav() {
  const header    = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelectorAll('.nav-link');

  hamburger.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', open);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (!header.contains(e.target)) {
      header.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   SMOOTH SCROLL + ACTIVE NAV
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   COUNTER ANIMATION (About stats)
   ============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const start = performance.now();

      const tick = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target;
          el.classList.add('done');
        }
      };
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ============================================================
   SERVICES ACCORDION
   ============================================================ */
function initServicesAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  if (!items.length) return;

  items.forEach(item => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-expanded', item.classList.contains('is-active') ? 'true' : 'false');

    const activate = () => {
      items.forEach(i => {
        i.classList.remove('is-active');
        i.setAttribute('aria-expanded', 'false');
      });
      item.classList.add('is-active');
      item.setAttribute('aria-expanded', 'true');
    };

    item.addEventListener('click', activate);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });
}

/* ============================================================
   PORTFOLIO GRID + FILTER
   ============================================================ */
function initPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  portfolioImages.forEach((img, index) => {
    const figure = document.createElement('figure');
    figure.className = 'portfolio-item';
    figure.dataset.category = img.category;
    figure.dataset.project = img.project;
    figure.dataset.index = index;
    figure.setAttribute('data-animate', '');

    const tag = document.createElement('span');
    tag.className = 'cat-tag';
    tag.textContent = img.category === 'after' ? 'After' : 'Before';

    const image = document.createElement('img');
    image.src = img.src;
    image.alt = img.label;
    image.loading = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'portfolio-item-overlay';

    const caption = document.createElement('p');
    caption.className = 'portfolio-item-caption';
    caption.textContent = img.label;

    overlay.appendChild(caption);
    figure.append(tag, image, overlay);
    figure.addEventListener('click', () => openLightbox(index));
    grid.appendChild(figure);
  });

  // Re-trigger animations for dynamically added items
  initScrollAnimations();

  // Build the "By Project" filter row from whatever distinct projects are
  // present — dropping a new project's photos into portfolioImages later
  // gives it a filter chip automatically, no markup changes needed.
  const projectFilterRow = document.getElementById('portfolio-project-filters');
  if (projectFilterRow) {
    const projects = [...new Set(portfolioImages.map(img => img.project))];
    projects.forEach(project => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.type = 'button';
      btn.dataset.projectFilter = project;
      btn.textContent = project;
      projectFilterRow.appendChild(btn);
    });
  }

  let activeCategory = 'all';
  let activeProject = 'all';

  const applyFilters = () => {
    document.querySelectorAll('.portfolio-item').forEach(item => {
      const matchesCategory = activeCategory === 'all' || item.dataset.category === activeCategory;
      const matchesProject = activeProject === 'all' || item.dataset.project === activeProject;
      item.style.display = matchesCategory && matchesProject ? '' : 'none';
    });
  };

  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter;
      applyFilters();
    });
  });

  if (projectFilterRow) {
    projectFilterRow.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn[data-project-filter]');
      if (!btn) return;
      projectFilterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProject = btn.dataset.projectFilter;
      applyFilters();
    });
  }
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  const lb = document.getElementById('lightbox');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  lb.focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.hidden = true;
  document.body.style.overflow = '';
}

function renderLightbox() {
  const img  = document.getElementById('lightbox-img');
  const cap  = document.getElementById('lightbox-caption');
  const data = portfolioImages[currentIndex];
  img.src = data.src;
  img.alt = data.label;
  cap.textContent = `${data.label} (${currentIndex + 1} / ${portfolioImages.length})`;
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const over = lb.querySelector('.lightbox-overlay');
  const cls  = lb.querySelector('.lightbox-close');
  const prev = lb.querySelector('.lightbox-prev');
  const next = lb.querySelector('.lightbox-next');

  cls.addEventListener('click', closeLightbox);
  over.addEventListener('click', closeLightbox);

  prev.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + portfolioImages.length) % portfolioImages.length;
    renderLightbox();
  });
  next.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % portfolioImages.length;
    renderLightbox();
  });

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  { currentIndex = (currentIndex - 1 + portfolioImages.length) % portfolioImages.length; renderLightbox(); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % portfolioImages.length; renderLightbox(); }
  });

  // Swipe support
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { currentIndex = (currentIndex + 1) % portfolioImages.length; }
    else        { currentIndex = (currentIndex - 1 + portfolioImages.length) % portfolioImages.length; }
    renderLightbox();
  }, { passive: true });
}

/* ============================================================
   PAINT COVERAGE CALCULATOR
   ============================================================ */
function initCalculator() {
  const widthInput  = document.getElementById('calc-width');
  const heightInput = document.getElementById('calc-height');
  const finishInput = document.getElementById('calc-finish');
  const coatBtns     = document.querySelectorAll('.coat-btn');
  const widthVal    = document.getElementById('calc-width-val');
  const heightVal   = document.getElementById('calc-height-val');
  const gallonsOut  = document.getElementById('calc-gallons');
  if (!widthInput || !heightInput || !finishInput || !gallonsOut) return;

  let coats = 2;

  function calculate() {
    const width  = parseFloat(widthInput.value);
    const height = parseFloat(heightInput.value);
    const coveragePerGallon = parseFloat(finishInput.value);

    widthVal.textContent = `${width} ft`;
    heightVal.textContent = `${height} ft`;

    const area = width * height;
    const rawGallons = (area * coats) / coveragePerGallon;
    const gallons = Math.max(1, Math.round(rawGallons * 2) / 2);
    gallonsOut.textContent = gallons.toFixed(1);
  }

  widthInput.addEventListener('input', calculate);
  heightInput.addEventListener('input', calculate);
  finishInput.addEventListener('change', calculate);
  coatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      coatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      coats = parseInt(btn.dataset.coats, 10);
      calculate();
    });
  });

  calculate();
}

/* ============================================================
   QUOTE FORM
   No backend yet, so a valid submission is handed off to the
   owner's own mail client via a prefilled mailto: link. Swap this
   for a real POST once a Cloudflare Pages Function is in place.
   ============================================================ */
function initQuoteForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = document.getElementById('qf-status');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9()+\-.\s]{7,}$/;

  form.addEventListener('submit', e => {
    e.preventDefault();

    form.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
    status.textContent = '';
    status.className = 'form-status';

    const name        = form.name.value.trim();
    const phone       = form.phone.value.trim();
    const email       = form.email.value.trim();
    const address     = form.address.value.trim();
    const projectType = form.projectType.value;
    const details     = form.details.value.trim();

    let firstInvalidField = null;
    const markError = fieldName => {
      const field = form.elements[fieldName].closest('.form-field');
      field.classList.add('has-error');
      if (!firstInvalidField) firstInvalidField = field;
    };

    if (!name) markError('name');
    if (!phonePattern.test(phone)) markError('phone');
    if (!emailPattern.test(email)) markError('email');
    if (!projectType) markError('projectType');

    if (firstInvalidField) {
      status.textContent = 'Please fill in the highlighted fields correctly.';
      status.classList.add('error');
      firstInvalidField.querySelector('input, select, textarea').focus();
      return;
    }

    const subject = `New Quote Request — ${name}`;
    const body = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      address ? `Property Address: ${address}` : null,
      `Project Type: ${projectType}`,
      details ? `Project Details: ${details}` : null,
    ].filter(Boolean).join('\n');

    status.textContent = 'Opening your email app to send this request…';
    status.classList.add('success');
    window.location.href = `mailto:ameenpaintingteam@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* ============================================================
   HERO PARALLAX TRIGGER
   ============================================================ */
function initHero() {
  const hero = document.getElementById('hero');
  if (hero) {
    setTimeout(() => hero.classList.add('loaded'), 100);
  }
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initSmoothScroll();
  initActiveNav();
  initScrollAnimations();
  initCounters();
  initServicesAccordion();
  initPortfolio();
  initLightbox();
  initCalculator();
  initQuoteForm();
  initHero();
  initFooterYear();
});
