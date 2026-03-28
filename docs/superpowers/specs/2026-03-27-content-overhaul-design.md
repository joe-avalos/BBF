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

- Never say BBF "spends on" non-educational activities — say BBF "provides services" or "facilitates access"
- Each program description must tie back to its authorized pillar
- Remove any content that could be interpreted as BBF funding entertainment or non-educational spending
- All services described as "free and exclusive to BBF scholars"

---

## SAT-Sensitive Content Audit

Complete list of existing i18n keys containing problematic language that MUST be reframed or replaced:

### CRITICAL — Entity blurring (501(c)(3) on Spanish pages)

| Key | Current Value (ES) | Problem | Replacement |
|---|---|---|---|
| `footer.description` (es) | "...organización sin fines de lucro 501(c)(3)..." | Mexican A.C. claiming US tax status | "Building Baja's Future, A.C. es una asociación civil dedicada a impulsar la educación de jóvenes en Baja California Sur desde 2006." |
| `footer.nonprofit` (es) | "Organización sin fines de lucro 501(c)(3)" | Same entity blurring | "Asociación Civil — Donataria Autorizada" |
| `cta.trust` (es) | "Seguro · Deducible de impuestos · 501(c)(3)" | Mexican donations are NOT 501(c)(3) deductible | "Seguro · Transparente · Asociación Civil Autorizada" |
| `meta.description` (es) | "...organización sin fines de lucro..." | Should reference A.C. | "Building Baja's Future (BBF) es una Asociación Civil que otorga becas universitarias completas a estudiantes en Baja California Sur, México." |

### CRITICAL — Activities that could be misread as unauthorized spending

| Key | Current Value | Problem | Replacement |
|---|---|---|---|
| `story.tree.cultural` / `story.tree.culturalText` | "Cultural Life" / "Access to concerts and performances" | SAT reads this as BBF funding entertainment | "Cultural Formation" / "Educational and cultural enrichment activities" |
| `story.tree.social` / `story.tree.socialText` | "Social Life" / "Activities, outings, and celebrations" | SAT reads this as BBF funding parties | "Social Development" / "Community-building activities and formative events" |
| `story.tree.artistic` / `story.tree.artisticText` | "Artistic Expression" / "Classes in dance and creative self-expression" | Could be read as funding dance classes | "Artistic Formation" / "Workshops in creative expression and personal development" |
| `story.tree.health` / `story.tree.healthText` | "Health & Fitness" / "Yoga, swimming, and medical assistance" | "Yoga, swimming" sounds recreational | "Health Assistance" / "Wellness services and medical assistance for scholars" |
| `help.program6.title` / `help.program6.text` | "Swimming Lessons" / "Water safety instruction..." | Could be read as BBF funding recreation | "Health and Physical Activity" / "Physical wellness programs including water safety instruction" |
| `help.program9.title` / `help.program9.text` | "Social & Life Skills" / "Film club, self-esteem seminars..." | "Film club" is the exact type of content SAT flagged | "Social Development and Life Skills" / "Formative seminars on self-esteem, healthcare, financial planning, and professional development" |
| `story.tree.subtitle` | "Eight branches of support..." | Outdated — now three pillars with sub-areas | Rewrite to reflect three-pillar model |
| `story.today.text` | "...across eight areas of life and learning..." | Same — outdated count | Update to reference three pillars |
| `help.core.title` | "10 pillars of student success" | Outdated count — now 14 programs under 3 pillars | Update to reflect actual structure |

### IMPORTANT — CTA currency on Spanish pages

| Key | Current Value (ES) | Problem | Replacement |
|---|---|---|---|
| `cta.title` (es) | "Cada dólar es una inversión..." | Mexican entity referencing dollars | "Cada aportación es una inversión en un mejor Baja California Sur." |
| `help.cta.text` (es) | "Cada dólar va directamente..." | Same | "Cada aportación va directamente a apoyar a los becarios..." |

---

## Dual Entity Implementation (Option 2: Context-Aware)

### Spanish Pages (Mexican A.C.)
- Footer entity name: "Building Baja's Future, A.C."
- Footer address: Camino del Pedernal 160, Pedregal, Cabo San Lucas, B.C.S. C.P. 23453, México
- Footer contact: info@buildingbajasfuture.org | +52 624 355 4314
- Legal note: "BBF México es una Asociación Civil constituida conforme a las leyes mexicanas."
- CTA trust: "Seguro · Transparente · Asociación Civil Autorizada"
- Meta description: References "Asociación Civil"
- Donation context: No US tax-deductible claims

### English Pages (US 501(c)(3))
- Footer entity name: "Building Baja's Future"
- Footer address: 378 West Avenue 45, Los Angeles, CA 90065
- Footer contact: info@buildingbajasfuture.org (shared email)
- Legal note: "BBF USA is a 501(c)(3) nonprofit organization. Donations are tax-deductible."
- CTA trust: "Secure · Tax-deductible · 501(c)(3)"
- Meta description: References "nonprofit organization"
- Donation context: US tax-deductible, check to LA address

### Shared Footer Disclaimer (both languages)
- EN: "Building Baja's Future operates through independent organizations in Mexico and the United States, each governed by its respective laws."
- ES: "Building Baja's Future opera a través de organizaciones independientes en México y Estados Unidos, cada una regida por las leyes de su respectivo país."

### Footer Implementation
The footer address block uses per-language values in the i18n system (same key name, different values in `en` vs `es` objects). The template renders `footer.address.line1`, `footer.address.line2`, etc. — the i18n layer handles the language switching. Same pattern for legal notes and entity names.

---

## Program Structure — Definitive List (14 programs under 3 pillars)

### Pillar 1: Scholarship Provider (Becante)
1. **Financial Assistance** — 100% tuition coverage + support for books/supplies/transport in extreme need

### Pillar 2: Assistance Provider (Prestadora Asistencial)
2. **English Classes** — Mandatory weekly instruction, free, exclusive to BBF scholars
3. **Reading and Writing Comprehension** — Expert-led academic literacy sessions
4. **Humanities Coursework** — Logic, aesthetics, philosophy + professional lectures
5. **Health Assistance and Physical Activity** — Wellness programs, medical assistance, physical activity
6. **Psychological Support** — Counseling and therapy services
7. **Vocational Guidance and Victim Support** — Professional counseling for vocational/crisis situations
8. **Tutoring** — Personalized academic assistance

### Pillar 3: Social Development Promoter (Promotora de Desarrollo Social)
9. **Community Service** — Required 60hrs/year with BBF-approved projects
10. **Core Values Program** — Three-year moral and civic formation curriculum (personal → family → community values)
11. **Social Development and Life Skills** — Formative seminars on professional development, financial planning, healthcare
12. **Cultural Formation** — Educational and cultural enrichment activities
13. **Community Group Cooperation** — Partnerships amplifying program impact
14. **Seminars, Workshops, and Conferences** — Educational events for scholars and community

### Our Story page: Tree of Life presentation
- Present three pillars FIRST as the framework
- Then show the 10 direct-service areas (programs 1-10 from the original Tree of Life, reframed under pillar language)
- Programs 11-14 appear only on How We Help page as additional programs

---

## Page-by-Page Content Changes

### Home Page
**Source:** `0 Inicio.docx` + cross-references

Changes:
- Hero title stays "Leave Your Mark on Baja" / "Deja tu huella en Baja" (already uses motto)
- Fix hardcoded hero HTML markup — hero title currently hardcoded in page templates, should use i18n with a rendering approach for the `<em>` tag (split into `hero.titlePre`, `hero.titleAccent`, `hero.titlePost` keys, or keep current approach since EN/ES have different word positions)
- Update mission text to match Document 1 official language
- Reframe program cards: Scholarships (Pillar 1), Assistance (Pillar 2), Social Development (Pillar 3)
- Stats remain: 348+, 18 years, 100% tuition

### Our Story Page
**Source:** `1 Quiénes somos version Final 250514.docx`

Changes:
- Replace overview text with official Document 1 content
- Add Purpose and Foundations section: Objective, Mission, Vision, Goal
- Update history with same milestones but official wording
- Reframe Tree of Life: present three pillars FIRST, then 10 support areas nested under them (reframed titles)
- Add Board of Directors: Jacinto Avalos Raz Guzmán (President), Cecilia Portilla Robertson de Avalos (Secretary/Executive Director), Diego Jacinto Avalos Portilla (Treasurer)
- Add Staff: Mirna Romero Antonio (Accounting/Admin), Alicia García Antonio (Secretary), Amando Lázaro Jacobo (Assistant)
- Add English Department: Lucy Baker
- Keep logo meaning section, update to official wording
- Mention annual activity reports available

### How We Help Page
**Source:** `2 Cómo ayudamos version JARG 250503.docx`

Changes:
- Open with three-pillar framework with pillar descriptions
- List all 14 programs grouped under their respective pillars
- Each program uses authorized language per the SAT audit above
- Emphasize: all services are FREE and EXCLUSIVE to BBF scholars
- CTA strip with entity-aware language

### Scholars Page
**Source:** `3 Becarios.docx`

Changes:
- Update filter dropdown options with full university list (35+ from Document 3)
- Update degree filter with full degree list (50+ from Document 3)
- Scholar cards stay the same (20 sample profiles)
- Filter data update is in the content collection, not i18n

### How to Apply Page — MAJOR OVERHAUL
**Source:** `4 Cómo obtener la Beca BBF version JARG 250503 CCVRN resp JARG 250513.docx`

New page structure with 9 sections:

1. **Annual Call** — Published on website; BBF visits ALL public high schools in Los Cabos
2. **Applicant Profile** — Commitment, merit, financial need, good character aligned with BBF values
3. **Eligibility Requirements** — Financial need, 9.0/10 GPA, leadership, desire to attend university, role model, BCS institution
4. **Selection Criteria** (NEW) — 7 criteria: Need, Ability, Knowledge/Preparation, Merit, Character, Potential, Commitment
5. **Application Requirements** — 7 steps:
   - Download application form (hosted locally at `/docs/solicitud-bbf.pdf`)
   - Complete all sections (black ink or typed, signed, dated)
   - Passport-size photo
   - Official high school transcript (9.0+ average)
   - TWO ESSAYS: (a) autobiography + motivation — virtues, goals, why requesting, why deserving; (b) significant life experience, achievements, influences (each max 1 page, single-spaced)
   - Teacher recommendation letter
   - Deliver to BBF office before March 30
6. **BBF Office** — Camino del Pedernal 160, Pedregal, Cabo San Lucas, BCS, CP 23453. Hours: Mon-Fri 9-16, Sat 9-14
7. **Selection Process** — 6 stages: Personal interview with Executive Director → Knowledge exam → Aptitude test + vocational seminar → Results by June 15 → Contract signing → Welcome ceremony in July
8. **Scholar Obligations** — Complete degree on time (no extensions), 8.5/10 GPA per term, submit grades each term, 60hrs community service/year with pre-approved project, 2hrs/week Saturday English, participate in all BBF activities, annual renewal, BBF may cancel at any time per regulations
9. **If Accepted** — Scholarship covers 100% tuition + all BBF program costs (free, exclusive)

### How to Donate Page
**Source:** `5 Cómo apoyar.docx`

Changes:
- Add "Deja tu huella en Baja" messaging
- EN: "Every dollar is an investment in a better Baja California Sur" + US tax-deductible + check to LA
- ES: "Cada aportación es una inversión en un mejor Baja California Sur" + no tax claims + PayPal
- Update sponsor description: sponsors pay full tuition AND act as mentors

### Friends of BBF Page
**Source:** `6 Amigos de BBF.docx`

Changes:
- Update sponsor description to match Document 6
- Emphasize: sponsors pay full tuition and serve as mentors
- "Their participation is extremely significant for BBF scholars"

---

## Complete i18n Key Inventory

### New keys to add

**Motto:**
- `motto` — EN: "Leave your mark" / ES: "Deja tu huella"

**Our Story — Purpose & Foundations:**
- `story.purpose.eyebrow` — EN: "Purpose & Foundations" / ES: "Propósito y fundamentos"
- `story.purpose.objective` — Full objective text
- `story.purpose.mission` — Full mission text
- `story.purpose.vision` — Full vision text
- `story.purpose.goal` — Full goal text

**Our Story — Three Pillars:**
- `story.pillars.eyebrow` — EN: "Our Three Pillars" / ES: "Nuestros tres pilares"
- `story.pillars.title` — EN: "The BBF Tree of Life" / ES: "El Árbol de la Vida BBF"
- `story.pillars.subtitle` — EN: "Three pillars of comprehensive support" / ES: "Tres pilares de apoyo integral"
- `story.pillar1.title` — EN: "Scholarship Provider" / ES: "Becante"
- `story.pillar1.text` — Pillar 1 description
- `story.pillar2.title` — EN: "Assistance Provider" / ES: "Prestadora Asistencial"
- `story.pillar2.text` — Pillar 2 description
- `story.pillar3.title` — EN: "Social Development Promoter" / ES: "Promotora de Desarrollo Social"
- `story.pillar3.text` — Pillar 3 description

**Our Story — Board & Staff:**
- `story.board.eyebrow` — EN: "Leadership" / ES: "Directiva"
- `story.board.title` — EN: "Board of Directors" / ES: "Mesa Directiva"
- `story.board.president` — "Jacinto Avalos Raz Guzmán"
- `story.board.presidentRole` — EN: "President" / ES: "Presidente"
- `story.board.secretary` — "Cecilia Portilla Robertson de Avalos"
- `story.board.secretaryRole` — EN: "Secretary & Executive Director" / ES: "Secretaria y Directora Ejecutiva"
- `story.board.treasurer` — "Diego Jacinto Avalos Portilla"
- `story.board.treasurerRole` — EN: "Treasurer" / ES: "Tesorero"
- `story.staff.eyebrow` — EN: "Our Team" / ES: "Nuestro equipo"
- `story.staff.mirna` — "Mirna Romero Antonio" + role
- `story.staff.alicia` — "Alicia García Antonio" + role
- `story.staff.amando` — "Amando Lázaro Jacobo" + role
- `story.staff.lucy` — "Lucy Baker" + role

**How We Help — Pillar headers:**
- `help.pillar1.eyebrow` — EN: "Pillar 1" / ES: "Pilar 1"
- `help.pillar1.title` — EN: "Scholarship Program" / ES: "Programa de Becas"
- `help.pillar2.eyebrow` — EN: "Pillar 2" / ES: "Pilar 2"
- `help.pillar2.title` — EN: "Assistance Programs" / ES: "Programas Asistenciales"
- `help.pillar3.eyebrow` — EN: "Pillar 3" / ES: "Pilar 3"
- `help.pillar3.title` — EN: "Social Development Programs" / ES: "Programas de Desarrollo Social"

**How We Help — New programs (11-14):**
- `help.program11.title` — EN: "Vocational Guidance" / ES: "Orientación vocacional"
- `help.program11.text` — Description
- `help.program12.title` — EN: "Tutoring" / ES: "Tutorías"
- `help.program12.text` — Description
- `help.program13.title` — EN: "Community Cooperation" / ES: "Cooperación comunitaria"
- `help.program13.text` — Description
- `help.program14.title` — EN: "Seminars & Conferences" / ES: "Seminarios y conferencias"
- `help.program14.text` — Description

**How to Apply — New sections:**
- `apply.call.eyebrow` — EN: "Annual Call" / ES: "Convocatoria anual"
- `apply.call.text` — Description of annual call process
- `apply.profile.eyebrow` — EN: "Who Can Apply" / ES: "Quién puede aplicar"
- `apply.profile.text` — Applicant profile description
- `apply.criteria.eyebrow` — EN: "Selection Criteria" / ES: "Criterios de selección"
- `apply.criteria.title` — EN: "How We Evaluate" / ES: "Cómo evaluamos"
- `apply.criteria1.title` through `apply.criteria7.title` — 7 criteria names
- `apply.criteria1.text` through `apply.criteria7.text` — 7 criteria descriptions
- `apply.essay1.title` — EN: "Essay 1: Autobiography & Motivation" / ES: "Ensayo 1: Autobiografía y motivación"
- `apply.essay1.text` — Description (virtues, goals, why requesting, why deserving)
- `apply.essay2.title` — EN: "Essay 2: Life Experience" / ES: "Ensayo 2: Experiencia de vida"
- `apply.essay2.text` — Description (achievements, influences, development)
- `apply.office.eyebrow` — EN: "BBF Office" / ES: "Oficinas BBF"
- `apply.office.address` — Full address
- `apply.office.hours` — Hours text
- `apply.process.eyebrow` — EN: "Selection Process" / ES: "Proceso de selección"
- `apply.process.title` — EN: "What Happens After You Apply" / ES: "Qué sucede después de aplicar"
- `apply.process1.title` through `apply.process6.title` — 6 stage names
- `apply.process1.text` through `apply.process6.text` — 6 stage descriptions
- `apply.obligations.eyebrow` — EN: "Scholar Obligations" / ES: "Obligaciones del becario"
- `apply.obligations.title` — EN: "Maintaining Your Scholarship" / ES: "Mantener tu beca"
- `apply.obligation1` through `apply.obligation8` — 8 obligation items
- `apply.accepted.eyebrow` — EN: "If Accepted" / ES: "Si eres aceptado"
- `apply.accepted.text` — What the scholarship covers

**Footer — Dual entity:**
- `footer.entityName` — EN: "Building Baja's Future" / ES: "Building Baja's Future, A.C."
- `footer.address.line1` — EN: "378 West Avenue 45" / ES: "Camino del Pedernal 160"
- `footer.address.line2` — EN: "Los Angeles, CA 90065" / ES: "Pedregal, Cabo San Lucas, B.C.S. C.P. 23453"
- `footer.email` — "info@buildingbajasfuture.org" (shared)
- `footer.phone` — "+52 624 355 4314" (show on both, it's the operational office)
- `footer.legal` — Entity-specific legal note (different per language)
- `footer.disclaimer` — Shared dual-entity disclaimer

### Keys to update (replace scraped content with official)
All existing `story.*`, `help.*`, `apply.*`, `donate.*`, `friends.*`, `mission.*`, `programs.*`, `cta.*`, `footer.*`, `meta.*` keys — every string replaced with official document content using authorized language.

### Keys to retire (replaced by new keys)
- `footer.description` — replaced by `footer.entityName` + `footer.legal` (entity-specific)
- `footer.nonprofit` — replaced by `footer.legal` (entity-specific legal note)

### Keys to remove
- None orphaned beyond the two retired keys above.

---

## Structural Component Changes

### Footer.astro
- Add `lang === 'es'` conditional for address block
- Render `footer.address.mx.*` for ES, `footer.address.us.*` for EN
- Add email and phone lines
- Add legal disclaimer row
- Add entity-specific legal note

### How to Apply pages (en/es)
- Expand from 2 sections to 9 sections
- New sections: Annual Call, Applicant Profile, Selection Criteria (7 items), Essays (2 items), Office Info, Selection Process (6 stages), Obligations (8 items), If Accepted
- Uses existing component patterns (PageHeader, section layout with eyebrow + content)

### Our Story pages (en/es)
- Add Purpose & Foundations section (4 items: objective, mission, vision, goal)
- Restructure Tree of Life: three-pillar header cards + 10 sub-area cards
- Add Board of Directors section (3 members)
- Add Staff section (4 team members)

### How We Help pages (en/es)
- Add pillar grouping headers (3 pillar sections)
- Expand from 10 to 14 program items
- Programs grouped under their pillar headers

---

## Asset Migration

### Application Form PDF
- Download from: `https://buildingbajasfuture.org/wp-content/uploads/2025/05/Solicitud-BBF-version-3.pdf`
- Host locally at: `public/docs/solicitud-bbf.pdf`
- Update link in How to Apply page to `/docs/solicitud-bbf.pdf`
- Prevents broken link when WordPress site is decommissioned

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
