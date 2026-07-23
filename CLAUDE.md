# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview

This is a client project for **Ameen Painting**, a painting contractor business in San Antonio. The user (Nikita) is building/maintaining this site on the client's behalf — **this is not Nikita's own business/site**, keep that in mind when writing copy or emails (e.g. lead notification emails should not greet the client contact as if they were Nikita).

Static marketing site + a Cloudflare Pages Function backend for the quote form:
- `index.html` — main site markup, includes the quote/booking modal
- `portfolio.html` — portfolio page
- `js/main.js` — front-end behavior (nav, portfolio, calculator, etc.)
- `js/quote-booking.js` — custom two-step booking flow: project details → pick date/time → submit
- `css/` — styles
- `index.js` — Cloudflare Worker/Pages Function handling `GET /api/availability` and `POST /api/submit-quote` (stores the booking in a D1 SQLite database and sends the lead email via Resend)
- `schema.sql` — D1 database schema for bookings
- `wrangler.jsonc` — Cloudflare deployment config (includes a D1 binding)
- `portfolio/` (if present) — before/after and work-in-progress photos for marketing

## Booking Flow

1. The user fills out project details in the modal and clicks **Continue to Schedule**.
2. A calendar panel opens; the user selects a date and one of the available 3-hour arrival windows (9:00 AM, 12:00 PM, 3:00 PM Central, 7 days a week).
3. On submission, the backend inserts a row with a `UNIQUE(date, time)` constraint. If two people race for the same slot, the database rejects the second insert and the user is asked to pick another time.
4. The business receives a formatted email with the project details and the scheduled estimate time.

## D1 Database Setup (required before first deploy)

A D1 database binding named `DB` is required for the booking calendar:

```bash
wrangler d1 create ameen-painting-bookings
```

Copy the returned `database_id` into `wrangler.jsonc` under `d1_databases`. The schema is auto-created on the first API request, so you do not need to run `schema.sql` manually, but it is included for reference.

## Git / Deployment

- Remote: `https://github.com/ameen-painting/main-site.git` (org repo — Nikita's personal GitHub account does **not** have push access to it).
- A `GITHUB_TOKEN` (and `RESEND_API_KEY`) live in the local `.env` file at the repo root. To push, use the token inline rather than relying on the default `git push`:
  ```bash
  source .env && git push "https://${GITHUB_TOKEN}@github.com/ameen-painting/main-site.git" main
  ```
- Do not print/echo the token in output; redact it if it appears in command logs.
