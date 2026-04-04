# BBF Website v2 — Redesign Spec

**Date:** 2026-04-03
**Goal:** Redesign BBF website with audience-specific bilingual content (EN=donors, ES=applicants), Google Sheets as the non-technical content source, automated newsletter pipeline, and WordPress migration.

---

## 1. Site Architecture

**Framework:** Astro 5.x, static output, deployed to Netlify. Carries forward existing layouts, components, theming, and build configuration.

**Design/Palette:** Pending client decision. Jacinto narrowed to: Refined Monochrome, Desert Editorial, or Crimson & Slate. Implementation proceeds with current theme; palette swap is a CSS-only change once decided.

### Page Structure

| Page | EN (Donors) | ES (Applicants) | Notes |
|------|:-----------:|:----------------:|-------|
| Home | ✅ | ✅ | Same sections, different copy focus |
| Our Story | ✅ | ✅ | EN: credibility, 501(c)(3). ES: mission, A.C./SAT |
| How We Help | ✅ | ✅ | EN: "what your money funds." ES: "what you receive" |
| Scholars | ✅ | ✅ | EN: proof of impact. ES: peer role models |
| Newsletter | ✅ | ✅ | Latest PDF + archive + subscribe form |
| How to Donate | ✅ | footer only | PayPal, check, donation methods |
| Friends of BBF | ✅ | footer only | Donor recognition |
| Your Impact | ✅ | footer only | Transparency, where donations go |
| How to Apply | footer only | ✅ | Application process, requirements |
| Student Resources | footer only | ✅ | Obligations, support, FAQ |

### Navigation

- **Fixed navbar** — always visible at top of viewport on scroll, both languages.
- **Donate button in nav — both languages.** Donations are welcome regardless of audience. Always visible, always accessible.
- **Different nav links per language.** EN nav shows donor-oriented links; ES nav shows applicant-oriented links. But Donate is always present.
- **Language toggle on shared pages:** switches to the counterpart page (Our Story ↔ Quiénes Somos).
- **Language toggle on exclusive pages:** navigates to the other language's homepage.
- **Footer sitemap:** lists ALL pages in BOTH languages — the only place where exclusive pages are accessible in the "wrong" language.

### Page Layouts

Two pages get **per-language layouts** (different section structure per audience):
- **Home** — EN: full-bleed hero + impact stats + programs + testimonial + donate CTA. ES: compact intro + what is BBF + impact stats + scholarship benefits + how to apply steps + apply CTA.
- **How We Help** — EN: donor framing ("what your money funds"). ES: applicant framing ("what you receive").

Three pages use a **shared layout with different copy**:
- **Our Story** — same structure, different emphasis (EN: credibility/501c3, ES: mission/A.C.)
- **Scholars** — same grid and cards, different intro copy
- **Newsletter** — same layout (latest + archive + subscribe)

### BCS Eligibility Requirement

Scholarships are exclusively for students physically in Baja California Sur. This must be evident, classy, and hard to miss. [EXACT WORDING PENDING CLIENT APPROVAL]

**ES (applicant pages) — prominent placement:**
- **ES Home:** Integrated into the "what is BBF" section as a styled callout — part of the page design, not a warning box. Visually distinct through typography or subtle contrast.
- **How to Apply:** Near the top of the page, before the application steps. The first thing an applicant reads before investing time.
- **Student Resources:** Reinforced in context.

**EN (donor pages) — natural framing:**
- Woven into mission language ("we serve students in Baja California Sur") rather than a restriction callout. Part of the story, not a gate.

### Stat Counter Component

Both EN and ES homepages display an animated stat counter section (scholars count, years of impact, graduates count — sourced from the Stats tab in the Google Sheet).

**Animation behavior:**
- Counters animate from 0 to target value on page load (triggered when the section scrolls into view)
- Easing curve: slow start → fast middle → slow deceleration approaching the final number (ease-in-out or custom cubic-bezier)
- **All three counters are synchronized** — they start and finish at the same time regardless of target values (e.g., 650 scholars and 20 years both take the same duration)
- Animation duration: ~2 seconds (tunable)
- Respects `prefers-reduced-motion` — if enabled, show final numbers immediately with no animation

---

## 2. Data Architecture & Content Management

### Two-Tier Content Model

| Content | Source of Truth | Who Updates | How |
|---------|----------------|-------------|-----|
| Scholar profiles | Google Sheet | Client (non-technical) | Edit spreadsheet |
| Stats (scholar count, years, graduates) | Google Sheet (dedicated tab) | Client (non-technical) | Edit cells |
| Scholar photos | Google Drive folder | Client (non-technical) | Drag and drop |
| Newsletter PDFs | Google Drive folder | Client (non-technical) | Drag and drop |
| Page copy (all pages) | `src/i18n/ui.ts` | Jose | Edit code |
| Page layouts & components | `.astro` files | Jose | Edit code |
| Design/theme | CSS custom properties | Jose | Edit code |

### Google Sheet Structure

- **Tab 1 — Scholars:** Name, University, Degree, Status (Active/Graduated), Cohort Year, Photo Filename (optional, maps to Drive folder)
- **Tab 2 — Stats:** Key-value pairs: `scholars_count`, `years_of_impact`, `graduates_count`, plus any other numbers displayed on the site

### Build Pipeline

1. Google Apps Script detects sheet edit → triggers Netlify build hook (auto-deploy)
2. Astro pre-build script fetches Google Sheet via API (public sheet or service account)
3. Sheet data → generates scholar markdown files + stats JSON
4. Pre-build script downloads scholar photos from Drive, optimizes/resizes, places in `public/scholars/`
5. Astro builds using generated content
6. Netlify deploys the result

---

## 3. Newsletter System

**Stack:** Google Drive + Google Apps Script + Mailchimp (free tier, up to 500 subscribers)

### Client Workflow

1. Client writes newsletter in Word/Pages
2. Client exports as PDF
3. Client drops PDF into shared Google Drive folder
4. Client receives preview email in their inbox
5. Client replies "OK" to send, or "STOP" to cancel

### Automation Pipeline

1. Apps Script (timed trigger, checks Drive folder hourly) detects new PDF in root folder
2. Script moves PDF to `/pending/` subfolder
3. Script generates a public Google Drive link for the PDF (avoids needing a deploy cycle just to host the file)
4. Script creates Mailchimp draft campaign via API — branded HTML email template with intro text + link to PDF
5. Script sends test/preview email to client via Mailchimp's send-test endpoint
6. Script watches for client's email reply (Gmail trigger)

### State Machine

```
New PDF in root folder
  → Is there already a pending newsletter?
    YES → Auto-reject old one (delete Mailchimp draft, move old PDF to /replaced/)
  → Create Mailchimp draft from new PDF
  → Move new PDF to /pending/
  → Send preview email to client
  → Waiting for reply...

  "OK"    → Send campaign via API → Move PDF to /sent/
  "STOP"  → Delete Mailchimp draft → Move PDF to /rejected/
  No reply → Every 72h, send reminder email
             Draft stays in Mailchimp until client replies
```

**Design principle:** The client can never create a broken state. There is always exactly zero or one pending newsletter. Dropping a new file replaces the old one automatically.

**Constraints:**
- Only one person should upload newsletters. If multiple people have access to the Drive folder, they could overwrite each other's uploads without knowing. The onboarding documentation must clearly explain that this is a single-operator workflow and designate who is responsible for uploading.

### Newsletter Page on Site

- Embedded or downloadable latest newsletter PDF
- Archive list of previous newsletters (newest first)
- Mailchimp subscribe form for new subscribers

---

## 4. Scholar Cards & Filtering

### Card Display

- **Photo** if available (matched by filename from Drive folder), **generic thumbnail SVG** if not
- Name
- University
- Degree
- Status badge (Active / Graduated)

### Filtering

Client-side JavaScript filtering (same approach as current implementation):
- University
- Degree
- Status

### Photo Handling

- Drive folder contains photos named to match scholars (e.g., `juan-perez.jpg` or by ID number)
- Build script downloads photos, optimizes/resizes them, outputs to `public/scholars/`
- Missing photo → default thumbnail SVG

### Bilingual Difference

Same grid, same cards, same data. Only the page intro copy and CTA differ:
- EN: Framed as donor impact — [PENDING CLIENT COPY]
- ES: Framed as peer role models — [PENDING CLIENT COPY]

---

## 5. WordPress Migration & Launch

### Extract Before Shutdown

1. **Newsletter subscribers** — emails from Jetpack/plugin → export CSV
2. **Friends of BBF** — list/data for the Friends page
3. **Scholar data** — any data in WP not yet in our Google Sheet
4. **Verify all addresses** — entity-aware, per language:
   - **EN (US entity):** 15139 Hamlin St., Van Nuys, CA, 91411. USA. (footer, donate by check, contact — no exceptions)
   - **ES (Mexico A.C.):** Camino del Pedernal 160, Fraccionamiento Pedregal, Cabo San Lucas, Los Cabos, Baja California Sur, México. C.P. 23453

### Import Targets

- Subscribers → Mailchimp (CSV import)
- Friends list → static data for Friends of BBF page
- Scholar data → Google Sheet (source of truth going forward)

### Launch Sequence

1. New Astro site goes live on Netlify
2. Point `buildingbajasfuture.org` DNS to Netlify
3. Verify everything works
4. Shut down WordPress hosting

**Clean cutover** — no parallel running period. WP has no active admin or dynamic functionality users depend on.

---

## Open Items

- [ ] **Design palette** — awaiting Jacinto's final decision (Refined Monochrome / Desert Editorial / Crimson & Slate)
- [ ] **All page copy** — content under client review. Do not invent Spanish copy; use `[PENDING CLIENT COPY]` placeholders.
- [ ] **Hero subtitle** — Jacinto wants alternatives to "lift up all of BCS" (elevate, empower, transform options discussed)
- [ ] **Stats numbers** — need current data from client (scholars ~650, years of impact, graduates count)
- [ ] **WP access** — need credentials to extract subscribers, friends list, and scholar data
- [ ] **Donation check address** — confirm checks also go to Van Nuys (not old LA address)
- [ ] **Newsletter subscriber count** — determines if Mailchimp free tier (500 limit) is sufficient
- [ ] **Google Sheet + Drive setup** — create shared sheet and folders, grant client access
- [ ] **Mailchimp account** — create account, set up API key for Apps Script
- [ ] **Photos** — Jacinto wants photos on the site. Need to source scholar photos and determine naming convention.
- [ ] **Client onboarding doc** — Write a clear, non-technical guide for the client explaining: how to update scholars/stats in the Sheet, how to upload newsletter PDFs, the single-operator rule (one person uploads newsletters to avoid overwrites), and what OK/STOP replies do.
- [ ] **BCS eligibility wording** — Confirm with client: "must be a student physically in BCS" or more specific phrasing. This appears prominently on ES applicant pages.
