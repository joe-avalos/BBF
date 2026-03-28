# BBF Content Overhaul — Design Spec

**Date:** 2026-03-27
**Goal:** Replace scraped WordPress content with official client-provided content, ensure legal compliance with SAT requirements, implement dual-entity handling, and clean up unused content.

---

## Legal Compliance Framework

Every page must frame BBF's activities under three authorized pillars:

| Pillar | Spanish | Authorized Activities |
|---|---|---|
| Scholarship Provider | Becante | Tuition payment, financial aid for books/supplies/transport |
| Assistance Provider | Prestadora Asistencial | Academic accompaniment, psychological support, health services, mentoring |
| Social Development Promoter | Promotora de Desarrollo Social | Community service, volunteering, educational seminars, values curriculum |

### Content Reframing Rules

- "Swimming lessons" → "Health assistance and physical activity" (authorized assistance)
- "Film club, social events" → "Social development activities"
- "Concerts and performances" → "Cultural formation" (educational framing)
- Never say BBF "spends on" non-educational activities — say BBF "provides services" or "facilitates access"
- Each program description must tie back to its authorized pillar
- Remove any content that could be interpreted as BBF funding entertainment or non-educational spending

---

## Dual Entity Implementation (Option 2: Context-Aware)

### Spanish Pages (Mexican A.C.)
- Footer entity name: "Building Baja's Future, A.C."
- Footer address: Camino del Pedernal 160, Pedregal, Cabo San Lucas, B.C.S. C.P. 23453, México
- Footer contact: info@buildingbajasfuture.org | +52 624 355 4314
- Legal note: "BBF México es una Asociación Civil constituida conforme a las leyes mexicanas."

### English Pages (US 501(c)(3))
- Footer entity name: "Building Baja's Future"
- Footer address: 378 West Avenue 45, Los Angeles, CA 90065
- Legal note: "BBF USA is a 501(c)(3) nonprofit organization. Donations are tax-deductible."

### Shared Footer Disclaimer (both languages)
- EN: "Building Baja's Future operates through independent organizations in Mexico and the United States, each governed by its respective laws."
- ES: "Building Baja's Future opera a través de organizaciones independientes en México y Estados Unidos, cada una regida por las leyes de su respectivo país."

---

## Page-by-Page Content Changes

### Home Page
**Source:** `0 Inicio.docx` + cross-references

Changes:
- Add motto "Deja tu huella" / "Leave your mark" prominently (hero subtitle or eyebrow)
- Reframe "three ways to change a life" cards to align with three pillars
- Update mission text to match Document 1 official language
- Stats remain: 348+, 18 years, 100% tuition

### Our Story Page
**Source:** `1 Quiénes somos version Final 250514.docx`

Changes:
- Replace overview text with official Document 1 content
- Add Purpose and Foundations section: Objective, Mission, Vision, Goal
- Update history with same milestones but official wording
- Reframe Tree of Life: present three pillars FIRST, then 10 support areas nested under them
- Add Board of Directors: Jacinto Avalos (President), Cecilia Portilla (Secretary/Executive Director), Diego Avalos Portilla (Treasurer)
- Add Staff: Mirna Romero (Accounting), Alicia Garcia (Secretary), Amando Lazaro (Assistant)
- Add English Department: Lucy Baker
- Keep logo meaning section, update to official wording
- Mention annual activity reports available

### How We Help Page
**Source:** `2 Cómo ayudamos version JARG 250503.docx`

Changes:
- Open with three-pillar framework (Scholarship, Assistance, Social Development)
- Reorganize 10 programs under their respective pillars
- Add missing programs: Vocational Guidance and Victim Support, Tutoring, Community Group Cooperation, Seminars/Workshops/Conferences
- Reframe each program description to use authorized language
- Core Values Program: keep Teleton reference but frame as "moral and civic formation"
- Emphasize: all services are FREE and EXCLUSIVE to BBF scholars

### Scholars Page
**Source:** `3 Becarios.docx`

Changes:
- Update filter dropdown options with full university list (35+)
- Update degree filter with full degree list (50+)
- Scholar cards stay the same (20 sample profiles)

### How to Apply Page — MAJOR OVERHAUL
**Source:** `4 Cómo obtener la Beca BBF version JARG 250503 CCVRN resp JARG 250513.docx`

New page structure:
1. **Annual Call** — Published on website/Facebook; BBF visits ALL public high schools in Los Cabos
2. **Applicant Profile** — Commitment, merit, financial need, good character aligned with BBF values
3. **Eligibility Requirements** — Financial need, 9.0/10 GPA, leadership, desire to attend university, role model, BCS institution
4. **Selection Criteria** (NEW section) — 7 criteria: Need, Ability, Knowledge/Preparation, Merit, Character, Potential, Commitment
5. **Application Requirements** — 7 steps:
   - Download application form
   - Complete all sections (black ink or typed, signed, dated)
   - Passport-size photo
   - Official secondary school transcript (9.0+ average)
   - TWO ESSAYS (new): autobiography+motivation AND significant life experience (each max 1 page, single-spaced)
   - Teacher recommendation letter
   - Deliver to BBF office before March 30
6. **BBF Office** — Full address, hours (Mon-Fri 9-16, Sat 9-14)
7. **Selection Process** (expanded) — 6 stages:
   - Personal interview with Executive Director
   - Knowledge exam
   - Aptitude test and vocational seminar
   - Results notification by June 15
   - Acceptance and commitment contract signing
   - Welcome ceremony in July (red t-shirt delivery)
8. **Scholar Obligations** (expanded) — Complete degree within timeframe (no extensions), 8.5/10 GPA per term, submit grades each term, 60hrs community service/year with approved project, 2hrs/week English on Saturdays, participate in all BBF activities, annual renewal, cancellation clause
9. **If Accepted** — Scholarship covers 100% tuition + all BBF program costs (free, exclusive)

### How to Donate Page
**Source:** `5 Cómo apoyar.docx`

Changes:
- Add "Deja tu huella en Baja" / "Leave your mark in Baja" messaging
- "Every dollar is an investment in a better Baja California Sur"
- Update sponsor description: sponsors pay full tuition AND act as mentors
- ES version: Mexico-relevant donation context
- EN version: US tax-deductible context, check to LA address

### Friends of BBF Page
**Source:** `6 Amigos de BBF.docx`

Changes:
- Update sponsor description to match Document 6
- Emphasize: sponsors pay full tuition and serve as mentors
- "Their participation is extremely significant for BBF scholars"

---

## i18n String Updates

All content changes go through `src/i18n/ui.ts`. New keys needed:

### New keys to add:
- `motto` — "Deja tu huella" / "Leave your mark"
- `story.purpose.*` — Objective, Mission, Vision, Goal
- `story.board.*` — Board member names and titles
- `story.staff.*` — Staff names and roles
- `story.pillars.*` — Three-pillar descriptions
- `help.pillars.*` — Pillar section headers
- `help.vocational.*`, `help.tutoring.*`, `help.cooperation.*`, `help.seminars.*` — New programs
- `apply.call.*` — Annual call section
- `apply.profile.*` — Applicant profile section
- `apply.criteria.*` — 7 selection criteria
- `apply.essay1.*`, `apply.essay2.*` — Essay requirements
- `apply.office.*` — Office address and hours
- `apply.process.*` — Expanded 6-stage selection process
- `apply.obligations.*` — Expanded scholar obligations
- `apply.accepted.*` — If accepted section
- `footer.legal.*` — Dual entity legal notes
- `footer.address.mx.*` — Mexico address
- `footer.address.us.*` — US address
- `footer.email`, `footer.phone` — Contact info
- `footer.disclaimer` — Shared dual-entity disclaimer

### Keys to update:
- All existing `story.*`, `help.*`, `apply.*`, `donate.*`, `friends.*` keys — replace scraped content with official document content

### Keys to remove:
- Any orphaned keys no longer referenced by any component or page

---

## Structural Component Changes

### Footer.astro
- Language-aware address block (Mexico for ES, LA for EN)
- Add email and phone
- Add legal disclaimer
- Add entity-specific legal note

### How to Apply pages
- Add new sections: Annual Call, Applicant Profile, Selection Criteria, Essays, Office Info, Expanded Process, Obligations, If Accepted
- More i18n keys means more content blocks in the page template

### Our Story pages
- Add Board of Directors section
- Add Staff section
- Restructure Tree of Life into three-pillar presentation

### How We Help pages
- Add pillar grouping headers
- Add new program items (Vocational Guidance, Tutoring, Community Cooperation, Seminars)

---

## Pages — No Deletions Needed

All 7 content pages map to client documents. Blog stays code-only. No pages to remove from the build.

---

## Out of Scope

- Visual redesign (design system stays as-is)
- Scholar data scraping (20 sample profiles sufficient for now)
- Mailchimp/PayPal integration changes
- Blog activation
- Netlify deployment
