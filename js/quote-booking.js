'use strict';

/* ============================================================
   QUOTE BOOKING FLOW
   Replaces the old Cal.com integration with a custom,
   two-step booking flow: project details → pick date/time → submit.
   ============================================================ */

function initQuoteBooking() {
  const modal = document.getElementById('quote-modal');
  if (!modal) return;

  const formView = document.getElementById('quote-form-view');
  const calendarView = document.getElementById('quote-calendar-view');
  const successView = document.getElementById('quote-success-view');
  const closeBtn = document.getElementById('quote-modal-close');
  const successCloseBtn = document.getElementById('quote-success-close');
  const form = document.getElementById('quote-form');
  const status = document.getElementById('qf-status');
  const calendarStatus = document.getElementById('qf-status-calendar');
  const calendarLoading = document.getElementById('calendar-loading');
  const calendarError = document.getElementById('calendar-error');
  const calendarGrid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('calendar-month-label');
  const prevBtn = document.querySelector('.calendar-prev');
  const nextBtn = document.querySelector('.calendar-next');
  const backBtn = document.getElementById('quote-calendar-back');
  const timesWrap = document.getElementById('quote-times-wrap');
  const timesContainer = document.getElementById('quote-times');
  const selectedDateLabel = document.getElementById('selected-date-label');
  const bookBtn = document.getElementById('quote-book-btn');
  const successMessage = document.getElementById('quote-success-message');
  const successGcalLink = document.getElementById('quote-success-gcal');
  const dialog = modal.querySelector('.modal-dialog');
  const phoneInput = document.getElementById('qf-phone');

  const phoneIti = (typeof window.intlTelInput === 'function' && phoneInput)
    ? window.intlTelInput(phoneInput, {
        initialCountry: 'us',
        strictMode: true,
      })
    : null;

  let lastFocused = null;
  let hideTimer = null;
  let lockedScrollY = 0;
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let availability = { days: {} };
  let selectedDate = null;
  let selectedTime = null;
  let savedFormData = null;

  // ASCII-only — matches the backend's check. Non-ASCII addresses pass a
  // looser regex but get rejected later by the email API's reply-to header,
  // which used to surface as a confusing error only after the calendar step.
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const phonePattern = /^[0-9()+\-.\s]{7,}$/;
  const MAX_ADVANCE_DAYS = 90;

  const pad = n => String(n).padStart(2, '0');

  function dateStr(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function getToday() {
    const now = new Date();
    return dateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function formatMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    });
  }

  function formatDateLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  function formatTimeLabel(time) {
    const [h] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function lockBodyScroll() {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
  }

  function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, lockedScrollY);
  }

  function showView(view) {
    [formView, calendarView, successView].forEach(v => { v.hidden = v !== view; });
    if (dialog) {
      dialog.classList.toggle('modal-dialog--wide', view === calendarView);
    }
  }

  function showStatus(el, msg, isError) {
    el.textContent = msg || '';
    el.className = isError ? 'form-status error' : 'form-status success';
  }

  function clearStatus(el) {
    el.textContent = '';
    el.className = 'form-status';
  }

  function openModal(projectType) {
    clearTimeout(hideTimer);
    lastFocused = document.activeElement;
    showView(formView);
    clearStatus(status);
    form.reset();
    resetCalendar();
    if (projectType) {
      const select = form.querySelector('#qf-project-type');
      if (select) select.value = projectType;
    }
    modal.hidden = false;
    lockBodyScroll();
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const firstField = formView.querySelector('input, select, textarea');
    if (firstField) firstField.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    unlockBodyScroll();
    hideTimer = setTimeout(() => {
      modal.hidden = true;
      showView(formView);
      form.reset();
      resetCalendar();
    }, 250);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function resetCalendar() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    selectedDate = null;
    selectedTime = null;
    timesWrap.hidden = true;
    bookBtn.disabled = true;
    clearStatus(calendarStatus);
    calendarError.hidden = true;
    calendarLoading.hidden = true;
    availability = { days: {} };
    successGcalLink.hidden = true;
    successGcalLink.href = '#';
  }

  async function loadAvailability(year, month) {
    calendarLoading.hidden = false;
    calendarError.hidden = true;
    const monthStr = `${year}-${pad(month + 1)}`;
    try {
      const res = await fetch(`/api/availability?month=${monthStr}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load availability');
      availability = data;
      renderCalendar(year, month);
    } catch (err) {
      calendarError.textContent = err.message;
      calendarError.hidden = false;
    } finally {
      calendarLoading.hidden = true;
    }
  }

  function renderCalendar(year, month) {
    monthLabel.textContent = formatMonthLabel(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = daysInMonth(year, month);
    const today = getToday();

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    const maxDateStr = dateStr(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

    let html = '';
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>';
    }
    for (let d = 1; d <= totalDays; d++) {
      const ds = dateStr(year, month, d);
      const daySlots = availability.days[ds] || [];
      const hasAvailable = daySlots.some(s => s.available);
      const isPast = ds < today;
      const isOutOfRange = ds > maxDateStr;
      const disabled = isPast || isOutOfRange || !hasAvailable;
      const selected = ds === selectedDate;

      let classes = 'calendar-day';
      if (disabled) classes += ' is-unavailable';
      if (selected) classes += ' is-selected';
      if (ds === today) classes += ' is-today';

      const indicator = hasAvailable && !disabled ? '<span class="calendar-day-dot" aria-hidden="true"></span>' : '';
      const label = ds === today ? `${ds} (today)` : ds;
      html += `<button type="button" class="${classes}" data-date="${ds}" ${disabled ? 'disabled' : ''} aria-label="${label}${disabled ? ' unavailable' : ''}">${d}${indicator}</button>`;
    }
    calendarGrid.innerHTML = html;
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    selectedTime = null;
    bookBtn.disabled = true;
    renderCalendar(currentYear, currentMonth);
    selectedDateLabel.textContent = formatDateLabel(dateStr);
    renderTimes(dateStr);
    timesWrap.hidden = false;
  }

  function renderTimes(dateStr) {
    const slots = availability.days[dateStr] || [];
    if (!slots.length) {
      timesContainer.innerHTML = '<p class="no-times">No available windows for this day. Please choose another date.</p>';
      return;
    }
    timesContainer.innerHTML = slots.map(s => `
      <button type="button" class="time-slot${s.available ? '' : ' is-booked'}" data-time="${s.time}" ${s.available ? '' : 'disabled'} aria-label="${s.label}${s.available ? '' : ' (already booked)'}">
        <span class="time-slot-label">${s.label}</span>
        ${s.available ? '' : '<span class="time-slot-tag">Booked</span>'}
      </button>
    `).join('');
    if (selectedTime) {
      const btn = timesContainer.querySelector(`.time-slot[data-time="${selectedTime}"]`);
      if (btn) btn.classList.add('is-selected');
    }
  }

  function submitBooking() {
    if (!selectedDate || !selectedTime || !savedFormData) return;
    clearStatus(calendarStatus);
    bookBtn.disabled = true;
    const originalText = bookBtn.textContent;
    bookBtn.textContent = 'Booking…';

    const payload = { ...savedFormData, estimateDate: selectedDate, estimateTime: selectedTime };

    fetch('/api/submit-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Booking failed. Please try again.');
        const appointment = `${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedTime)}`;
        successMessage.textContent = `Your free estimate is booked for ${appointment}. We'll see you then.`;
        if (data.googleCalendarUrl) {
          successGcalLink.href = data.googleCalendarUrl;
          successGcalLink.hidden = false;
        } else {
          successGcalLink.hidden = true;
        }
        showView(successView);
        successView.querySelector('h3')?.focus();
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', { send_to: 'AW-18265858431/E0HjCOTIiMQcEP_C64VE' });
        }
      })
      .catch(err => {
        showStatus(calendarStatus, err.message, true);
        bookBtn.disabled = false;
        loadAvailability(currentYear, currentMonth);
      })
      .finally(() => {
        if (bookBtn.textContent === 'Booking…') bookBtn.textContent = originalText;
      });
  }

  // Form validation → move to scheduling
  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearStatus(status);
    form.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const address = form.address.value.trim();
    const projectType = form.projectType.value;
    const details = form.details.value.trim();

    let firstInvalid = null;
    const markError = fieldName => {
      const field = form.elements[fieldName].closest('.form-field');
      field.classList.add('has-error');
      if (!firstInvalid) firstInvalid = field;
    };

    if (!name) markError('name');

    let phone = form.phone.value.trim();
    if (phoneIti) {
      if (phoneIti.promise) await phoneIti.promise.catch(() => {});
      if (!phoneIti.isValidNumber()) {
        markError('phone');
      } else {
        phone = phoneIti.getNumber();
      }
    } else if (!phonePattern.test(phone)) {
      markError('phone');
    }

    if (!emailPattern.test(email)) markError('email');
    if (!projectType) markError('projectType');

    if (firstInvalid) {
      showStatus(status, 'Please fill in the highlighted fields correctly.', true);
      firstInvalid.querySelector('input, select, textarea').focus();
      return;
    }

    savedFormData = { name, phone, email, address, projectType, details };
    showView(calendarView);
    loadAvailability(currentYear, currentMonth);
    calendarView.querySelector('h3')?.focus();
  });

  backBtn.addEventListener('click', () => {
    showView(formView);
    clearStatus(status);
    formView.querySelector('input, select, textarea')?.focus();
  });

  prevBtn.addEventListener('click', () => {
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth()) return;
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    loadAvailability(currentYear, currentMonth);
  });

  nextBtn.addEventListener('click', () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    if (currentYear > maxDate.getFullYear() ||
        (currentYear === maxDate.getFullYear() && currentMonth >= maxDate.getMonth())) return;
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    loadAvailability(currentYear, currentMonth);
  });

  calendarGrid.addEventListener('click', e => {
    const btn = e.target.closest('.calendar-day');
    if (!btn || btn.disabled || btn.classList.contains('is-unavailable')) return;
    selectDate(btn.dataset.date);
  });

  timesContainer.addEventListener('click', e => {
    const btn = e.target.closest('.time-slot');
    if (!btn || btn.disabled) return;
    selectedTime = btn.dataset.time;
    timesContainer.querySelectorAll('.time-slot').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    bookBtn.disabled = false;
  });

  bookBtn.addEventListener('click', submitBooking);

  closeBtn.addEventListener('click', closeModal);
  successCloseBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.querySelectorAll('.js-open-quote').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      openModal();
    });
  });

  modal.openQuote = projectType => openModal(projectType);
}

document.addEventListener('DOMContentLoaded', initQuoteBooking);
