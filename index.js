export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/submit-quote' && request.method === 'POST') {
      return handleQuoteSubmit(request, env);
    }

    if (url.pathname === '/api/availability' && request.method === 'GET') {
      return handleAvailability(request, env);
    }

    // Fallback: serve static assets directly from binding
    return env.ASSETS.fetch(request);
  }
};

// ---------------------------------------------------------------------------
// Scheduling constants — Ameen Painting operates 8am–6pm Central, every day.
// The estimate visit itself is short (15–30 min), but booking an hour also
// blocks the next hour from other customers (travel/buffer time), so no two
// bookings on the same day can start within 1 hour of each other.
// ---------------------------------------------------------------------------
const CONFIG = {
  timezone: 'America/Chicago',
  dayStartHour: 8,
  dayEndHour: 18, // last bookable start time
  estimateDurationMinutes: 30,
  bufferHours: 1, // booking an hour also blocks this many hours after it
  maxAdvanceDays: 90,
  minLeadHours: 2,
};
// Hourly start times, e.g. 8am, 9am, ... 6pm.
CONFIG.startTimes = Array.from(
  { length: CONFIG.dayEndHour - CONFIG.dayStartHour + 1 },
  (_, i) => CONFIG.dayStartHour + i
);

// ---------------------------------------------------------------------------
// D1 schema helpers
// ---------------------------------------------------------------------------
async function ensureSchema(db) {
  if (!db) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT,
      project_type TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(date, time)
    )
  `).run();
}

// ---------------------------------------------------------------------------
// Date / time utilities (Central / America/Chicago)
// ---------------------------------------------------------------------------
function localParts(date = new Date(), timeZone = CONFIG.timezone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = type => parts.find(p => p.type === type)?.value;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function localDateString(date = new Date(), timeZone = CONFIG.timezone) {
  const p = localParts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function localTimeString(date = new Date(), timeZone = CONFIG.timezone) {
  const p = localParts(date, timeZone);
  return `${p.hour}:${p.minute}`;
}

function addLocalDays(days) {
  const now = new Date();
  const utc = now.getTime() + days * 24 * 60 * 60 * 1000;
  return localDateString(new Date(utc));
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isValidTime(str) {
  return CONFIG.startTimes.map(t => `${String(t).padStart(2, '0')}:00`).includes(str);
}

// Basic sanity check — the frontend's phone widget sends E.164 (+12105551234),
// but this stays permissive enough to accept the plain-input fallback too.
function isValidPhone(str) {
  const digits = (str.match(/\d/g) || []).length;
  return digits >= 7 && /^\+?[0-9()+\-.\s]{7,20}$/.test(str);
}

// ASCII-only — matches what Resend's API requires for the `reply_to` header.
// Rejects addresses with accented/unicode characters here, at submit time,
// instead of letting them through to a confusing failure at send time.
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
function isValidEmail(str) {
  return EMAIL_PATTERN.test(str);
}

// Formats a stored phone number for human display in the lead email.
// E.164 US/Canada numbers (+1XXXXXXXXXX) become "(XXX) XXX-XXXX"; anything
// else (other countries, or a raw fallback value) is shown as-is.
function formatPhoneDisplay(str) {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(str);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : str;
}

function formatTimeLabel(time) {
  const [h] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${ampm}`;
}

function formatDateLong(dateStr, timeZone = CONFIG.timezone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone
  }).format(date);
}

// UTC offset string (e.g. '-05:00') for CONFIG.timezone at a given instant.
// Correctly accounts for DST (CDT = -05:00, CST = -06:00).
function tzOffsetString(date, timeZone = CONFIG.timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(date);
  const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT-6';
  const m = /GMT([+-])(\d+)(?::(\d+))?/.exec(tz);
  if (!m) return '-06:00';
  return `${m[1]}${m[2].padStart(2, '0')}:${(m[3] || '00').padStart(2, '0')}`;
}

// Resolves an estimate's wall-clock date/time (America/Chicago) to the actual
// UTC instant it represents, so calendar invites land on the correct time
// regardless of the recipient's own timezone or calendar default.
function estimateToUtcRange(estimateDate, estimateTime) {
  const [y, mo, d] = estimateDate.split('-').map(Number);
  // Use noon UTC on that date just to resolve the correct DST offset — the
  // actual appointment time is applied afterward via the offset string.
  const refInstant = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const offset = tzOffsetString(refInstant);
  const start = new Date(`${estimateDate}T${estimateTime}:00${offset}`);
  const end = new Date(start.getTime() + CONFIG.estimateDurationMinutes * 60 * 1000);
  return { start, end };
}

function toGCalStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Builds a Google Calendar "quick add" link so the recipient can add the
// booked estimate to their calendar in one click, no sign-in prompts.
function buildCalendarUrl({ text, details, address, estimateDate, estimateTime }) {
  const { start, end } = estimateToUtcRange(estimateDate, estimateTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${toGCalStamp(start)}/${toGCalStamp(end)}`,
    details,
    location: address || 'San Antonio, TX',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Owner-facing invite — framed around who's coming and what they need.
function buildOwnerCalendarUrl({ name, phone, email, address, projectType, details, estimateDate, estimateTime }) {
  const descriptionLines = [
    `Customer: ${name}`,
    `Phone: ${formatPhoneDisplay(phone)}`,
    `Email: ${email}`,
    `Project type: ${projectType}`,
    details ? `Details: ${details}` : null,
  ].filter(Boolean);
  return buildCalendarUrl({
    text: `Free Estimate — ${name} (${projectType})`,
    details: descriptionLines.join('\n'),
    address,
    estimateDate,
    estimateTime,
  });
}

// Customer-facing invite — framed around the visit they're expecting.
function buildCustomerCalendarUrl({ projectType, address, estimateDate, estimateTime }) {
  const descriptionLines = [
    `Ameen Painting LLC will arrive for your free ${projectType.toLowerCase()} estimate.`,
    `Questions or need to reschedule? Call (210) 802-0818 or email ameenpaintingteam@gmail.com.`,
  ];
  return buildCalendarUrl({
    text: 'Free Painting Estimate — Ameen Painting LLC',
    details: descriptionLines.join('\n'),
    address,
    estimateDate,
    estimateTime,
  });
}

function hourFromTime(time) {
  return Number(time.split(':')[0]);
}

// A booked hour also blocks CONFIG.bufferHours after it (travel/buffer time),
// and — symmetrically — blocks the hours before it that would otherwise
// overlap that buffer. Two bookings can't start within bufferHours of
// each other.
function isHourBlocked(hour, bookedHours) {
  for (let offset = -CONFIG.bufferHours; offset <= CONFIG.bufferHours; offset++) {
    if (bookedHours.has(hour + offset)) return true;
  }
  return false;
}

// `cutoffMinutes` is the earliest bookable minute-of-day (minutes since midnight).
// Pass it for "today" so slots that are already past, or inside the minimum lead
// time, show as unavailable instead of relying on the client's clock.
function buildSlots(dateStr, bookedTimes = [], cutoffMinutes = null) {
  const bookedHours = new Set(bookedTimes.map(hourFromTime));
  return CONFIG.startTimes.map(hour => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    const isPastCutoff = cutoffMinutes !== null && hour * 60 < cutoffMinutes;
    return {
      time,
      label: formatTimeLabel(time),
      available: !isHourBlocked(hour, bookedHours) && !isPastCutoff,
    };
  });
}

// Minutes-since-midnight (America/Chicago) after which a new booking may start.
function bookingCutoffMinutes() {
  const p = localParts();
  const nowMinutes = Number(p.hour) * 60 + Number(p.minute);
  return nowMinutes + CONFIG.minLeadHours * 60;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // Availability changes with every booking — never let the browser or
      // Cloudflare's edge cache serve a stale snapshot.
      'Cache-Control': 'no-store',
    },
  });
}

function jsonError(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ---------------------------------------------------------------------------
// Availability API
// ---------------------------------------------------------------------------
async function handleAvailability(request, env) {
  try {
    if (!env.DB) {
      return jsonError('Booking database is not configured.', 503);
    }
    await ensureSchema(env.DB);

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const month = url.searchParams.get('month');

    if (date) {
      if (!isValidDate(date)) return jsonError('Invalid date format.', 400);
      const { results } = await env.DB
        .prepare('SELECT time FROM bookings WHERE date = ?')
        .bind(date)
        .all();
      const booked = results.map(r => r.time);
      const cutoff = date === localDateString() ? bookingCutoffMinutes() : null;
      return jsonResponse({ date, slots: buildSlots(date, booked, cutoff) });
    }

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) return jsonError('Invalid month format.', 400);
      const { results } = await env.DB
        .prepare('SELECT date, time FROM bookings WHERE date LIKE ?')
        .bind(`${month}-%`)
        .all();

      const bookedMap = {};
      for (const row of results) {
        if (!bookedMap[row.date]) bookedMap[row.date] = [];
        bookedMap[row.date].push(row.time);
      }

      const [y, m] = month.split('-').map(Number);
      const daysInMonth = new Date(Date.UTC(y, m, 0, 12, 0, 0)).getUTCDate();
      const today = localDateString();
      const todayCutoff = bookingCutoffMinutes();
      const days = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${month}-${String(d).padStart(2, '0')}`;
        const cutoff = ds === today ? todayCutoff : null;
        const slots = buildSlots(ds, bookedMap[ds] || [], cutoff);
        if (ds < today) slots.forEach(s => (s.available = false));
        days[ds] = slots;
      }
      return jsonResponse({ month, days });
    }

    return jsonError('Provide ?date=YYYY-MM-DD or ?month=YYYY-MM.', 400);
  } catch (err) {
    console.error('handleAvailability error:', err);
    return jsonError('Could not load availability right now. Please try again.', 500);
  }
}

// ---------------------------------------------------------------------------
// Quote submission + atomic booking
// ---------------------------------------------------------------------------
async function handleQuoteSubmit(request, env) {
  try {
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return jsonError('Resend API Key is not configured on the server.', 500);
    }
    if (!env.DB) {
      return jsonError('Booking database is not configured.', 503);
    }
    await ensureSchema(env.DB);

    let data;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }

    const { name, phone, email, address, projectType, details, estimateDate, estimateTime } = data;

    if (!name || !phone || !email || !projectType || !estimateDate || !estimateTime) {
      return jsonError('Please provide all required fields, including a date and time for your estimate.', 400);
    }

    if (!isValidPhone(phone)) return jsonError('Please provide a valid phone number.', 400);
    if (!isValidEmail(email)) return jsonError('Please provide a valid email address.', 400);
    if (!isValidDate(estimateDate)) return jsonError('Invalid estimate date.', 400);
    if (!isValidTime(estimateTime)) return jsonError('Invalid estimate time.', 400);

    const today = localDateString();
    const maxDateStr = addLocalDays(CONFIG.maxAdvanceDays);

    if (estimateDate < today) return jsonError('Please choose a future date.', 400);
    if (estimateDate > maxDateStr) {
      return jsonError(`Bookings are only available up to ${CONFIG.maxAdvanceDays} days in advance.`, 400);
    }

    if (estimateDate === today) {
      const now = new Date();
      const currentTime = localTimeString(now);
      const [selH] = estimateTime.split(':').map(Number);
      const selectedMinutes = selH * 60;
      const [curH, curM] = currentTime.split(':').map(Number);
      const currentMinutes = curH * 60 + Number(curM);
      if (selectedMinutes < currentMinutes + CONFIG.minLeadHours * 60) {
        return jsonError('Please choose a time at least 2 hours from now.', 400);
      }
    }

    // Booking an hour also blocks the hours around it (see isHourBlocked) — that
    // can't be expressed as a DB constraint, so check it explicitly first. This
    // leaves a small race window against a simultaneous adjacent-hour booking;
    // the UNIQUE(date, time) constraint below still atomically guarantees no two
    // bookings ever land on the exact same slot.
    const { results: existingForDay } = await env.DB
      .prepare('SELECT time FROM bookings WHERE date = ?')
      .bind(estimateDate)
      .all();
    const bookedHours = new Set(existingForDay.map(r => hourFromTime(r.time)));
    if (isHourBlocked(hourFromTime(estimateTime), bookedHours)) {
      return jsonError('That time slot was just taken. Please choose another time.', 409);
    }

    // Atomic insert: the UNIQUE(date, time) constraint prevents double-booking.
    const createdAt = new Date().toISOString();
    try {
      await env.DB.prepare(`
        INSERT INTO bookings
        (date, time, name, phone, email, address, project_type, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        estimateDate, estimateTime, name, phone, email,
        address || '', projectType, details || '', createdAt
      ).run();
    } catch (dbErr) {
      if (dbErr && dbErr.message && dbErr.message.toLowerCase().includes('unique constraint failed')) {
        return jsonError('That time slot was just taken. Please choose another time.', 409);
      }
      throw dbErr;
    }

    // The booking itself is already committed at this point — a failure to
    // send either email (Resend outage, etc.) shouldn't make the customer
    // think their booking didn't go through. Each is independent and
    // best-effort: log on failure instead of surfacing it as an error.
    let emailId = null;
    try {
      const emailResult = await sendLeadEmail({
        resendApiKey, name, phone, email, address, projectType, details, estimateDate, estimateTime,
      });
      emailId = emailResult.id;
    } catch (emailErr) {
      console.error(`Lead email failed for booking ${estimateDate} ${estimateTime} (${email}):`, emailErr);
    }

    try {
      await sendConfirmationEmail({
        resendApiKey, name, email, address, projectType, estimateDate, estimateTime,
      });
    } catch (emailErr) {
      console.error(`Confirmation email failed for booking ${estimateDate} ${estimateTime} (${email}):`, emailErr);
    }

    const googleCalendarUrl = buildCustomerCalendarUrl({ projectType, address, estimateDate, estimateTime });

    return jsonResponse({ success: true, id: emailId, googleCalendarUrl });
  } catch (err) {
    console.error('handleQuoteSubmit error:', err);
    return jsonError('Something went wrong while booking your estimate. Please try again, or call us at (210) 802-0818.', 500);
  }
}

// ---------------------------------------------------------------------------
// Resend helpers
// ---------------------------------------------------------------------------
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Shared visual chrome for both the owner lead-notification email and the
// customer confirmation email — keeps them looking like the same system.
const EMAIL_STYLES = `
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f4f6f4;
      color: #1a261a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper { width: 100%; background-color: #f4f6f4; padding: 30px 15px; box-sizing: border-box; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(12, 28, 12, 0.08); border: 1px solid #dce4dc; }
    .email-header { background-color: #0C1C0C; padding: 35px 40px; text-align: center; border-bottom: 4px solid #C9A84C; }
    .email-header h1 { color: #F0EDE4; font-family: Georgia, serif; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: 1px; }
    .email-header p { color: #C9A84C; font-size: 13px; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
    .email-body { padding: 40px; }
    .email-intro { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 30px; color: #2b3a2b; }
    .field-card { background-color: #f9faf9; border: 1px solid #eef2ee; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
    .field-row { margin-bottom: 20px; border-bottom: 1px solid #eef2ee; padding-bottom: 12px; }
    .field-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #7a827a; font-weight: 700; margin-bottom: 6px; }
    .field-value { font-size: 16px; color: #0C1C0C; font-weight: 500; }
    .field-value a { color: #2D6A2D; text-decoration: none; font-weight: 600; }
    .field-value.highlight { color: #C9A84C; font-weight: 600; }
    .estimate-block { background-color: #0C1C0C; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center; border: 1px solid #C9A84C; }
    .estimate-block .field-label { color: #C9A84C; margin-bottom: 8px; }
    .estimate-block .field-value { color: #F0EDE4; font-family: Georgia, serif; font-size: 22px; margin-bottom: 6px; }
    .estimate-block .estimate-note { color: #9A9B8F; font-size: 13px; margin: 0; }
    .details-box { font-size: 15px; color: #2b3a2b; background-color: #ffffff; border: 1px solid #eef2ee; border-left: 4px solid #C9A84C; padding: 15px; border-radius: 4px; white-space: pre-wrap; margin-top: 8px; line-height: 1.6; }
    .action-container { text-align: center; margin-top: 35px; margin-bottom: 10px; }
    .btn-reply { background-color: #2D6A2D; color: #ffffff !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(45, 106, 45, 0.2); margin: 0 6px 12px; }
    .btn-calendar { background-color: #ffffff; color: #0C1C0C !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; border: 1.5px solid #C9A84C; margin: 0 6px 12px; }
    .email-footer { background-color: #0C1C0C; color: #9A9B8F; text-align: center; padding: 25px 40px; font-size: 12px; border-top: 1px solid #142014; }
    .email-footer a { color: #C9A84C; text-decoration: none; }
`;

// Owner-facing lead notification — sent to the business.
function buildLeadEmailHtml({ name, phone, email, address, projectType, details, estimateDate, estimateTime }) {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safePhoneDisplay = escapeHtml(formatPhoneDisplay(phone));
  const safeEmail = escapeHtml(email);
  const safeAddress = escapeHtml(address);
  const safeProjectType = escapeHtml(projectType);
  const safeDetails = escapeHtml(details);
  const estimateDateLong = escapeHtml(formatDateLong(estimateDate));
  const estimateTimeLabel = escapeHtml(formatTimeLabel(estimateTime));
  const googleCalendarUrl = escapeHtml(
    buildOwnerCalendarUrl({ name, phone, email, address, projectType, details, estimateDate, estimateTime })
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead - Ameen Painting</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Ameen Painting LLC</h1>
        <p>New Website Lead</p>
      </div>
      <div class="email-body">
        <p class="email-intro">Hi Stepan,</p>
        <p class="email-intro">A new free estimate has been booked on the website. The customer selected the appointment time below:</p>

        <div class="estimate-block">
          <div class="field-label">Scheduled Estimate</div>
          <div class="field-value">${estimateDateLong} at ${estimateTimeLabel}</div>
          <p class="estimate-note">Estimate visit typically takes 15–30 minutes. The following hour is held as a buffer.</p>
        </div>

        <div class="field-card">
          <div class="field-row">
            <div class="field-label">Customer Name</div>
            <div class="field-value">${safeName}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Phone Number</div>
            <div class="field-value"><a href="tel:${safePhone}">${safePhoneDisplay}</a></div>
          </div>
          <div class="field-row">
            <div class="field-label">Email Address</div>
            <div class="field-value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
          </div>
          <div class="field-row">
            <div class="field-label">Property Address</div>
            <div class="field-value">${safeAddress ? safeAddress : '<i>Not provided</i>'}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Project Type</div>
            <div class="field-value highlight">${safeProjectType}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Project Details</div>
            <div class="details-box">${safeDetails ? safeDetails : '<i>No additional details provided.</i>'}</div>
          </div>
        </div>

        <div class="action-container">
          <a href="mailto:${safeEmail}?subject=Re: Ameen Painting Estimate Booking&body=Hi ${safeName},%0D%0A%0D%0AThank you for booking a free estimate with Ameen Painting for ${safeProjectType.toLowerCase()}. We're looking forward to meeting you on ${estimateDateLong} at ${estimateTimeLabel}.%0D%0A%0D%0ABest regards,%0D%0AAmeen Painting Team" class="btn-reply">Reply directly to Customer</a>
          <a href="${googleCalendarUrl}" target="_blank" rel="noopener noreferrer" class="btn-calendar">Add to Google Calendar</a>
        </div>
      </div>
      <div class="email-footer">
        <p>Sent via Ameen Painting Website Lead System &bull; Powered by Resend</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Customer-facing booking confirmation.
function buildConfirmationEmailHtml({ name, address, projectType, estimateDate, estimateTime }) {
  const safeName = escapeHtml(name);
  const safeAddress = escapeHtml(address);
  const safeProjectType = escapeHtml(projectType);
  const estimateDateLong = escapeHtml(formatDateLong(estimateDate));
  const estimateTimeLabel = escapeHtml(formatTimeLabel(estimateTime));
  const googleCalendarUrl = escapeHtml(
    buildCustomerCalendarUrl({ projectType, address, estimateDate, estimateTime })
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Booked - Ameen Painting</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Ameen Painting LLC</h1>
        <p>Estimate Confirmed</p>
      </div>
      <div class="email-body">
        <p class="email-intro">Hi ${safeName},</p>
        <p class="email-intro">Thanks for booking with Ameen Painting! Your free ${safeProjectType.toLowerCase()} estimate is confirmed for the time below.</p>

        <div class="estimate-block">
          <div class="field-label">Your Estimate</div>
          <div class="field-value">${estimateDateLong} at ${estimateTimeLabel}</div>
          <p class="estimate-note">The visit typically takes 15–30 minutes.</p>
        </div>

        <div class="field-card">
          <div class="field-row">
            <div class="field-label">Property Address</div>
            <div class="field-value">${safeAddress ? safeAddress : '<i>Not provided</i>'}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Project Type</div>
            <div class="field-value highlight">${safeProjectType}</div>
          </div>
        </div>

        <p class="email-intro" style="margin-bottom: 0;">Need to reschedule or have a question? Just reply to this email, or call us at <a href="tel:+12108020818" style="color:#2D6A2D; font-weight:600; text-decoration:none;">(210) 802-0818</a>.</p>

        <div class="action-container">
          <a href="${googleCalendarUrl}" target="_blank" rel="noopener noreferrer" class="btn-calendar">Add to Google Calendar</a>
        </div>
      </div>
      <div class="email-footer">
        <p>Sent via Ameen Painting Website Booking System &bull; Powered by Resend</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendResendEmail({ resendApiKey, to, replyTo, subject, html }) {
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ameen Painting LLC <leads@reports.ameenpainting.com>',
      to: [to],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    throw new Error(`Resend API Error: ${errorText}`);
  }

  return await resendResponse.json();
}

async function sendLeadEmail({ resendApiKey, name, phone, email, address, projectType, details, estimateDate, estimateTime }) {
  return sendResendEmail({
    resendApiKey,
    to: 'ameenpaintingteam@gmail.com',
    replyTo: email,
    subject: `New Lead + Booking: ${name} — ${projectType} on ${formatDateLong(estimateDate)}`,
    html: buildLeadEmailHtml({ name, phone, email, address, projectType, details, estimateDate, estimateTime }),
  });
}

async function sendConfirmationEmail({ resendApiKey, name, email, address, projectType, estimateDate, estimateTime }) {
  return sendResendEmail({
    resendApiKey,
    to: email,
    replyTo: 'ameenpaintingteam@gmail.com',
    subject: `You're booked! Ameen Painting estimate on ${formatDateLong(estimateDate)}`,
    html: buildConfirmationEmailHtml({ name, address, projectType, estimateDate, estimateTime }),
  });
}
