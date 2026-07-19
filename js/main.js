'use strict';

/* ============================================================
   PORTFOLIO
   Work is grouped by project. Each project can carry:
     - pairs:         before/after image pairs (the transformation)
     - gallery:       standalone "finished" / detail shots
     - galleryGroups: labeled shot piles (e.g. unpaired Before / After)
   `type` drives the filter bar (commercial | residential | fencing).
   To add work later: drop the images in assets/images and add an
   entry here — the page rebuilds itself, no markup changes needed.
   Image paths are relative to assets/images/.
   ============================================================ */
const portfolioProjects = [
  {
    id: 'hollister',
    type: 'commercial',
    tag: 'Commercial Retail Buildout',
    name: 'Hollister — Ingram Park Mall',
    blurb: 'A full interior and storefront finish for a national retailer — custom display millwork, barrel-vault plank ceilings, and a flawless, showroom-ready result.',
    pairs: [
      { before: 'hollister-before-01.webp', after: 'hollister-after-01.webp', ratio: 'portrait', caption: 'Custom Display Millwork — primer to finish' },
      { before: 'hollister-outside-before.webp', after: 'hollister-outside-after.webp', ratio: 'portrait', caption: 'Mall Storefront' },
    ],
    gallery: [
      { src: 'hollister-05.PNG', caption: 'Finished Cashwrap & Sales Floor' },
      { src: 'hollister-06.webp', caption: 'Completed Interior' },
      { src: 'wooden-store-window-01.PNG', caption: 'Arched Millwork Detail' },
      { src: 'wooden-store-window-02.PNG', caption: 'Barrel-Vault Ceiling & Shutters' },
      { src: 'hollister-01.webp', caption: 'Completed Storefront' },
      { src: 'hollister-02.webp', caption: 'Ceiling & Wall Finishing' },
      { src: 'hollister-03.webp', caption: 'Interior Buildout' },
      { src: 'hollister-04.webp', caption: 'Our Crew at Work' },
      { src: 'owner-infront-of-hollister.JPG', caption: 'Project Complete' },
      { src: 'work-in-progress.JPG', caption: 'Prep & Surface Protection' },
    ],
  },
  {
    id: 'office-suite',
    type: 'commercial',
    tag: 'Commercial Interior',
    name: 'Office Suite Repaint',
    blurb: 'A dated, scuffed office suite brightened top to bottom — walls in a clean white with doors and trim refinished in a rich dark stain for sharp, modern contrast.',
    pairs: [
      { before: 'office-before-1.jpeg', after: 'office-after-7.jpeg', ratio: 'portrait', caption: 'Main Hallway' },
      { before: 'office-before-4.jpeg', after: 'office-after-3.jpeg', ratio: 'portrait', caption: 'Reception & Kitchenette' },
    ],
    gallery: [],
    galleryGroups: [
      {
        label: 'Before',
        shots: [
          { src: 'office-before-2.jpeg', caption: 'Private Office' },
          { src: 'office-before-3.jpeg', caption: 'Corner Office' },
          { src: 'office-before-5.jpeg', caption: 'Carpeted Office' },
        ],
      },
      {
        label: 'After',
        shots: [
          { src: 'office-after-1.jpeg', caption: 'Open Work Area' },
          { src: 'office-after-2.jpeg', caption: 'Private Office' },
          { src: 'office-after-4.jpeg', caption: 'Carpeted Office' },
          { src: 'office-after-5.jpeg', caption: 'Door & Trim Detail' },
          { src: 'office-after-6.jpeg', caption: 'Hallway Detail' },
        ],
      },
    ],
  },
  {
    id: 'exterior-home',
    type: 'residential',
    tag: 'Residential Exterior',
    name: 'Two-Story Exterior Repaint',
    blurb: 'Tired, patchy siding brought back to life with a crisp white body, bold charcoal trim, and meticulous detail — right down to the utility boxes.',
    pairs: [
      { before: 'house-ext-before.PNG', after: 'house-ext-after.PNG', ratio: 'portrait', caption: 'Full Exterior Transformation' },
    ],
    gallery: [
      { src: 'house-outside-door.JPG', caption: 'Entry, Columns & Trim Detail' },
      { src: 'house-outside-utills.JPG', caption: 'Utility Boxes Painted to Match' },
    ],
  },
  {
    id: 'staircase',
    type: 'residential',
    tag: 'Residential Interior',
    name: 'Interior Staircase Refinish',
    blurb: 'Worn, dated stair treads and railings transformed with a clean, durable painted finish that brightens the whole entry.',
    pairs: [
      { before: 'house-stairs-before.webp', after: 'house-stairs-after.webp', ratio: 'portrait', caption: 'Staircase & Railings' },
    ],
    gallery: [],
  },
  {
    id: 'garage',
    type: 'residential',
    tag: 'Residential Interior',
    name: 'Garage Interior Makeover',
    blurb: 'Patched, primed, and rolled to a smooth, uniform charcoal finish — a clean, finished look for an everyday space.',
    pairs: [
      { before: 'garage-before.JPG', after: 'garage-after.JPG', ratio: 'landscape', caption: 'Patch, Prime & Finish' },
    ],
    gallery: [],
  },
  {
    id: 'fence',
    type: 'fencing',
    tag: 'Staining & Sealing',
    name: 'Fence Restoration',
    blurb: 'Sun-faded, weathered fencing cleaned and re-stained to a rich, even, protective finish that lasts.',
    pairs: [
      { before: 'fence-before-01.JPG', after: 'fence-after-01.JPG', ratio: 'portrait', caption: 'Backyard Privacy Fence' },
      { before: 'fence-before-02.JPG', after: 'fence-after-02.JPG', ratio: 'portrait', caption: 'Front-Yard Fence' },
    ],
    gallery: [],
  },
  {
    id: 'metalwork',
    type: 'commercial',
    tag: 'Commercial',
    name: 'Metalwork & Specialty Finishes',
    blurb: 'Spray-finished railings and balconies plus hand-troweled specialty wall textures for commercial clients.',
    pairs: [],
    gallery: [
      { src: 'house-side.webp', caption: 'Powder-Finish Railings' },
      { src: 'balcony.JPG', caption: 'Balcony Railing Unit' },
      { src: 'wall-close-view.webp', caption: 'Hand-Troweled Wall Texture' },
    ],
  },
];

// Flat list of every portfolio image, in render order — powers the lightbox.
let lightboxImages = [];

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
   BEFORE / AFTER DRAG SLIDER
   ============================================================ */
function initBeforeAfterSliders() {
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const grip = slider.querySelector('.ba-slider-handle-grip');
    let pct = 50;

    const apply = () => {
      slider.style.setProperty('--pos', pct + '%');
      grip.setAttribute('aria-valuenow', String(Math.round(pct)));
    };

    const fromClientX = clientX => {
      const rect = slider.getBoundingClientRect();
      pct = Math.min(97, Math.max(3, ((clientX - rect.left) / rect.width) * 100));
      apply();
    };

    let dragging = false;
    slider.addEventListener('pointerdown', e => {
      dragging = true;
      slider.classList.add('is-dragging');
      slider.setPointerCapture(e.pointerId);
      fromClientX(e.clientX);
    });
    slider.addEventListener('pointermove', e => {
      if (!dragging) return;
      fromClientX(e.clientX);
    });
    const stopDrag = () => {
      dragging = false;
      slider.classList.remove('is-dragging');
    };
    slider.addEventListener('pointerup', stopDrag);
    slider.addEventListener('pointercancel', stopDrag);

    grip.setAttribute('role', 'slider');
    grip.setAttribute('tabindex', '0');
    grip.setAttribute('aria-valuemin', '0');
    grip.setAttribute('aria-valuemax', '100');
    grip.setAttribute('aria-label', 'Drag to compare before and after photos');
    grip.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { pct = Math.max(3, pct - 4); apply(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { pct = Math.min(97, pct + 4); apply(); e.preventDefault(); }
    });

    apply();
  });
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

    // First click opens the card; clicking the already-open card starts a
    // quote with that service preselected.
    const handleActivate = () => {
      if (!item.classList.contains('is-active')) {
        activate();
        return;
      }
      const modal = document.getElementById('quote-modal');
      if (modal && modal.openQuote) modal.openQuote(item.dataset.projectType);
    };

    item.addEventListener('click', handleActivate);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleActivate();
      }
    });
  });
}

/* ============================================================
   PORTFOLIO — project sections + type filter
   ============================================================ */
const IMG_BASE = 'assets/images/';

function initPortfolio() {
  const root = document.getElementById('portfolio-root');
  if (!root) return;

  lightboxImages = [];
  // Register an image with the lightbox and return its index.
  const register = (file, label) => {
    lightboxImages.push({ src: IMG_BASE + file, label });
    return lightboxImages.length - 1;
  };

  const esc = str => String(str).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  portfolioProjects.forEach(project => {
    const block = document.createElement('section');
    block.className = 'project-block';
    block.dataset.type = project.type;
    block.id = 'project-' + project.id;

    // ---- header ----
    const head = document.createElement('div');
    head.className = 'project-head';
    head.setAttribute('data-animate', '');
    head.innerHTML =
      `<span class="project-tag">${esc(project.tag)}</span>` +
      `<h2 class="project-name">${esc(project.name)}</h2>` +
      `<p class="project-blurb">${esc(project.blurb)}</p>`;
    block.appendChild(head);

    // ---- before / after pairs ----
    project.pairs.forEach(pair => {
      const bIdx = register(pair.before, `${project.name} — Before`);
      const aIdx = register(pair.after, `${project.name} — After`);
      const card = document.createElement('div');
      card.className = 'ba-pair ratio-' + (pair.ratio || 'portrait');
      card.setAttribute('data-animate', '');
      card.innerHTML =
        '<div class="ba-cells">' +
          `<figure class="ba-cell" data-lb="${bIdx}" tabindex="0" role="button" aria-label="View before photo">` +
            `<img src="${IMG_BASE}${esc(pair.before)}" alt="${esc(project.name)} — before" loading="lazy" />` +
            '<span class="ba-cell-label">Before</span>' +
          '</figure>' +
          `<figure class="ba-cell" data-lb="${aIdx}" tabindex="0" role="button" aria-label="View after photo">` +
            `<img src="${IMG_BASE}${esc(pair.after)}" alt="${esc(project.name)} — after" loading="lazy" />` +
            '<span class="ba-cell-label ba-cell-label--after">After</span>' +
          '</figure>' +
        '</div>' +
        (pair.caption ? `<p class="ba-pair-caption">${esc(pair.caption)}</p>` : '');
      block.appendChild(card);
    });

    // ---- standalone gallery ----
    const buildGallery = shots => {
      const gal = document.createElement('div');
      gal.className = 'project-gallery';
      shots.forEach(shot => {
        const idx = register(shot.src, shot.caption);
        const fig = document.createElement('figure');
        fig.className = 'gallery-item';
        fig.dataset.lb = idx;
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'View photo: ' + shot.caption);
        fig.innerHTML =
          `<img src="${IMG_BASE}${esc(shot.src)}" alt="${esc(shot.caption)}" loading="lazy" />` +
          `<figcaption class="gallery-cap">${esc(shot.caption)}</figcaption>`;
        gal.appendChild(fig);
      });
      return gal;
    };

    if (project.gallery.length) {
      const gal = buildGallery(project.gallery);
      gal.setAttribute('data-animate', '');
      block.appendChild(gal);
    }

    // ---- labeled gallery groups (unpaired before/after piles) ----
    (project.galleryGroups || []).forEach(group => {
      if (!group.shots.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'project-gallery-group';
      wrap.setAttribute('data-animate', '');
      const label = document.createElement('h3');
      label.className = 'project-gallery-group-label';
      label.textContent = group.label;
      wrap.appendChild(label);
      wrap.appendChild(buildGallery(group.shots));
      block.appendChild(wrap);
    });

    root.appendChild(block);
  });

  // Open the lightbox on click or keyboard activation of any tile.
  const activate = el => {
    const idx = parseInt(el.dataset.lb, 10);
    if (!Number.isNaN(idx)) openLightbox(idx);
  };
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-lb]');
    if (el) activate(el);
  });
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-lb]');
    if (el) { e.preventDefault(); activate(el); }
  });

  // Type filter — show/hide whole project blocks.
  const filterBar = document.getElementById('portfolio-filter-bar');
  if (filterBar) {
    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      document.querySelectorAll('.project-block').forEach(block => {
        block.style.display = (type === 'all' || block.dataset.type === type) ? '' : 'none';
      });
    });
  }

  // Animate the freshly-built sections.
  initScrollAnimations();
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
  const data = lightboxImages[currentIndex];
  if (!data) return;
  img.src = data.src;
  img.alt = data.label;
  cap.textContent = `${data.label} (${currentIndex + 1} / ${lightboxImages.length})`;
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
    currentIndex = (currentIndex - 1 + lightboxImages.length) % lightboxImages.length;
    renderLightbox();
  });
  next.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % lightboxImages.length;
    renderLightbox();
  });

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  { currentIndex = (currentIndex - 1 + lightboxImages.length) % lightboxImages.length; renderLightbox(); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % lightboxImages.length; renderLightbox(); }
  });

  // Swipe support
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { currentIndex = (currentIndex + 1) % lightboxImages.length; }
    else        { currentIndex = (currentIndex - 1 + lightboxImages.length) % lightboxImages.length; }
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
   QUOTE MODAL
   ============================================================ */
function initQuoteModal() {
  const modal = document.getElementById('quote-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('quote-modal-close');
  const formView = document.getElementById('quote-form-view');
  const successView = document.getElementById('quote-success-view');
  const successCloseBtn = document.getElementById('quote-success-close');
  let lastFocused = null;
  let hideTimer = null;
  let lockedScrollY = 0;

  const showSuccessView = () => {
    if (formView) formView.hidden = true;
    if (successView) {
      successView.hidden = false;
      successView.querySelector('h3')?.focus?.();
    }
  };
  const showFormView = () => {
    if (successView) successView.hidden = true;
    if (formView) formView.hidden = false;
  };
  modal.showSuccessView = showSuccessView;

  // iOS Safari doesn't reliably honor `overflow: hidden` on the body to
  // stop background scroll/touch-scroll, so pin it with position:fixed
  // instead and restore the scroll position on close.
  const lockBodyScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
  };
  const unlockBodyScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, lockedScrollY);
  };

  // `projectType` is passed by the services cards to preselect the dropdown.
  const openModal = projectType => {
    clearTimeout(hideTimer);
    lastFocused = document.activeElement;
    if (projectType) {
      // A previous submission may have left the success screen showing.
      showFormView();
      const select = modal.querySelector('#qf-project-type');
      // Options carry no value attribute, so their value is their text —
      // an unknown type just leaves the placeholder selected.
      if (select) select.value = projectType;
    }
    modal.hidden = false;
    lockBodyScroll();
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const firstField = formView && !formView.hidden
      ? formView.querySelector('input, select, textarea')
      : successView?.querySelector('h3, button');
    // preventScroll stops the browser from also scrolling the (now
    // fixed) background page into "view" of the focused field.
    if (firstField) firstField.focus({ preventScroll: true });
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    unlockBodyScroll();
    hideTimer = setTimeout(() => { modal.hidden = true; showFormView(); }, 250);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  // Exposed so the services cards can open the form with a type preselected.
  // Assigned here rather than beside showSuccessView because `openModal` is a
  // const declared below that point.
  modal.openQuote = openModal;

  document.querySelectorAll('.js-open-quote').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn.addEventListener('click', closeModal);
  successCloseBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
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

    status.textContent = 'Sending your request...';
    status.className = 'form-status';

    const submitBtn = form.querySelector('button[type="submit"]');
    let originalBtnContent = '';
    if (submitBtn) {
      submitBtn.disabled = true;
      originalBtnContent = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
    }

    fetch('/api/submit-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, phone, email, address, projectType, details }),
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send your request. Please try again.');
      }
      status.textContent = '';
      status.className = 'form-status';
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
      document.getElementById('quote-modal')?.showSuccessView?.();
    })
    .catch(error => {
      status.textContent = error.message;
      status.classList.add('error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    });
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
   SCROLL TO TOP
   ============================================================ */
function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
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
  initBeforeAfterSliders();
  initPortfolio();
  initLightbox();
  initCalculator();
  initQuoteModal();
  initQuoteForm();
  initHero();
  initFooterYear();
  initScrollTop();
});
