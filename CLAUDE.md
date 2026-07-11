# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client project for **Ameen Painting**, a painting contractor business in San Antonio. The user (Nikita) is building/maintaining this site on the client's behalf — **this is not Nikita's own business/site**, keep that in mind when writing copy or emails (e.g. lead notification emails should not greet the client contact as if they were Nikita).

Static marketing site + a Cloudflare Pages Function backend for the quote form:
- `index.html` — main site markup, includes the quote request modal
- `portfolio.html` — portfolio page
- `js/main.js` — front-end behavior (nav, quote modal, quote form submission, etc.)
- `css/` — styles
- `index.js` — Cloudflare Worker/Pages Function handling `POST /api/submit-quote` (sends the lead email via Resend, notifies the business)
- `wrangler.jsonc` — Cloudflare deployment config
- `portfolio/` (if present) — before/after and work-in-progress photos for marketing

## Git / Deployment

- Remote: `https://github.com/ameen-painting/main-site.git` (org repo — Nikita's personal GitHub account does **not** have push access to it).
- A `GITHUB_TOKEN` (and `RESEND_API_KEY`) live in the local `.env` file at the repo root. To push, use the token inline rather than relying on the default `git push`:
  ```bash
  source .env && git push "https://${GITHUB_TOKEN}@github.com/ameen-painting/main-site.git" main
  ```
- Do not print/echo the token in output; redact it if it appears in command logs.
