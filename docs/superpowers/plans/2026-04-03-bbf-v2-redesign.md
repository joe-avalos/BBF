# BBF v2 Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild BBF website with audience-specific bilingual content (EN=donors, ES=applicants), Google Sheets data pipeline for non-technical content updates, automated newsletter system, and WordPress migration.

**Architecture:** Astro 5.x static site on Netlify. Per-language navigation and page layouts. Google Sheets → pre-build scripts → Astro content collections for scholars/stats. Google Apps Script for newsletter automation (Drive → Mailchimp) and auto-deploy triggers. Entity-aware addresses and legal compliance per language.

**Tech Stack:** Astro 5.x, TypeScript, CSS custom properties, Google Sheets API, Google Drive API, Google Apps Script, Mailchimp API (free tier), PayPal JS SDK, sharp (image optimization)

---

## File Structure

```
BBF/
  astro.config.mjs                          # (modify) Add newsletter collection
  package.json                              # (modify) Add googleapis, sharp deps
  .env.example                              # (create) Template for API keys
  scripts/
    copy-to-ui.mjs                          # (existing) Copy bridge
    ui-to-copy.mjs                          # (existing) Copy bridge
    fetch-sheets.mjs                        # (create) Google Sheets → scholars MD + stats JSON
    fetch-photos.mjs                        # (create) Google Drive → public/scholars/
  src/
    i18n/
      ui.ts                                 # (modify) Add new keys, restructure nav keys
      utils.ts                              # (modify) Add nav config helper
      nav.ts                                # (create) Per-language nav configuration
    components/
      Header.astro                          # (modify) Fixed nav, per-lang menus, donate always
      Footer.astro                          # (modify) Full bilingual sitemap, entity addresses
      StatCounter.astro                     # (modify) Add animation support via data attributes
      ScholarCard.astro                     # (modify) Add photo/thumbnail support
      BcsCallout.astro                      # (create) Eligibility callout component
      NewsletterArchive.astro               # (create) Newsletter list component
      SubscribeForm.astro                   # (create) Mailchimp embedded form
    js/
      stat-counter.ts                       # (create) Synchronized eased counter animation
      scholar-filter.ts                     # (existing, modify) Add status filter
    content/
      newsletters/                          # (create) Newsletter PDF metadata collection
    content.config.ts                       # (modify) Add newsletters collection, update scholars
    pages/
      en/
        index.astro                         # (modify) Donor-focused home layout
        newsletter.astro                    # (create) Newsletter page
        your-impact.astro                   # (create) EN-only transparency page
        our-story.astro                     # (modify) Update copy keys
        how-we-help.astro                   # (modify) Donor framing layout
        how-to-donate.astro                 # (existing) Keep as-is
        friends-of-bbf.astro                # (existing) Keep as-is
        scholars.astro                      # (modify) Update intro copy
      es/
        index.astro                         # (modify) Applicant-focused home layout
        newsletter.astro                    # (create) Newsletter page
        student-resources.astro             # (create) ES-only resources page
        our-story.astro                     # (modify) Update copy keys
        how-we-help.astro                   # (modify) Applicant framing layout
        how-to-apply.astro                  # (existing) Keep as-is
        scholars.astro                      # (modify) Update intro copy
    data/
      stats.json                            # (generated) Stats from Google Sheets
  apps-script/
    newsletter/
      Code.gs                               # (create) Drive watcher + Mailchimp integration
      Config.gs                             # (create) API keys and folder IDs
      EmailHandler.gs                       # (create) OK/STOP reply processor
      appsscript.json                       # (create) Apps Script manifest
    deploy-trigger/
      Code.gs                               # (create) Sheet edit → Netlify build hook
      appsscript.json                       # (create) Apps Script manifest
  docs/
    client-guide/
      updating-scholars.md                  # (create) Client onboarding doc
      uploading-newsletters.md              # (create) Client onboarding doc
```

---

## Phase 1: Infrastructure Cleanup

### Task 1: Remove blog pages and blog content collection

Blog is no longer part of the site. Remove all blog-related files and references.

**Files:**
- Delete: `src/pages/en/blog/index.astro`
- Delete: `src/pages/en/blog/[...slug].astro`
- Delete: `src/pages/es/blog/index.astro`
- Delete: `src/pages/es/blog/[...slug].astro`
- Delete: `src/content/blog/2026-scholarship-applications.md`
- Delete: `src/content/blog/scholar-spotlight-carolina.md`
- Delete: `src/content/blog/year-in-review-2025.md`
- Modify: `src/content.config.ts`
- Modify: `src/i18n/ui.ts`
- Delete: `src/components/BlogCard.astro`

- [ ] **Step 1: Delete blog page files**

```bash
rm -rf src/pages/en/blog src/pages/es/blog
```

- [ ] **Step 2: Delete blog content collection**

```bash
rm -rf src/content/blog
```

- [ ] **Step 3: Delete BlogCard component**

```bash
rm src/components/BlogCard.astro
```

- [ ] **Step 4: Remove blog collection from content.config.ts**

In `src/content.config.ts`, remove the entire `blog` collection definition. Keep only the `scholars` collection.

- [ ] **Step 5: Remove blog i18n keys from ui.ts**

Remove all keys starting with `blog.` from both the `en` and `es` objects in `src/i18n/ui.ts`. Also remove `nav.blog` from both language objects.

- [ ] **Step 6: Remove blog nav link from Header.astro**

In `src/components/Header.astro`, remove the blog navigation link (`nav.blog`).

- [ ] **Step 7: Verify build succeeds**

```bash
npx astro build
```

Expected: Build succeeds with no references to blog pages.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove blog pages, content collection, and component"
```

---

### Task 2: Create per-language navigation configuration

Different nav menus per language. EN shows donor links, ES shows applicant links. Donate button always present in both.

**Files:**
- Create: `src/i18n/nav.ts`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add new nav i18n keys to ui.ts**

Add these keys to the `en` object in `src/i18n/ui.ts`:

```typescript
'nav.newsletter': 'Newsletter',
'nav.yourImpact': 'Your Impact',
'nav.studentResources': 'Student Resources',
```

Add these keys to the `es` object:

```typescript
'nav.newsletter': 'Boletín',
'nav.yourImpact': 'Tu Impacto',
'nav.studentResources': 'Recursos para Becarios',
```

- [ ] **Step 2: Create nav.ts with per-language nav config**

Create `src/i18n/nav.ts`:

```typescript
export interface NavItem {
  key: string;
  href: string;
}

export const navLinks: Record<'en' | 'es', NavItem[]> = {
  en: [
    { key: 'nav.home', href: '/en/' },
    { key: 'nav.ourStory', href: '/en/our-story/' },
    { key: 'nav.howWeHelp', href: '/en/how-we-help/' },
    { key: 'nav.scholars', href: '/en/scholars/' },
    { key: 'nav.yourImpact', href: '/en/your-impact/' },
    { key: 'nav.howToDonate', href: '/en/how-to-donate/' },
    { key: 'nav.friendsOfBbf', href: '/en/friends-of-bbf/' },
    { key: 'nav.newsletter', href: '/en/newsletter/' },
  ],
  es: [
    { key: 'nav.home', href: '/es/' },
    { key: 'nav.ourStory', href: '/es/our-story/' },
    { key: 'nav.howWeHelp', href: '/es/how-we-help/' },
    { key: 'nav.scholars', href: '/es/scholars/' },
    { key: 'nav.howToApply', href: '/es/how-to-apply/' },
    { key: 'nav.studentResources', href: '/es/student-resources/' },
    { key: 'nav.newsletter', href: '/es/newsletter/' },
  ],
};

/** All pages across both languages, for the footer sitemap */
export const allPages: Record<'en' | 'es', NavItem[]> = {
  en: [
    ...navLinks.en,
    { key: 'nav.howToApply', href: '/en/how-to-apply/' },
    { key: 'nav.studentResources', href: '/en/student-resources/' },
  ],
  es: [
    ...navLinks.es,
    { key: 'nav.howToDonate', href: '/es/how-to-donate/' },
    { key: 'nav.friendsOfBbf', href: '/es/friends-of-bbf/' },
    { key: 'nav.yourImpact', href: '/es/your-impact/' },
  ],
};

/**
 * Maps each page path to its counterpart in the other language.
 * Used by the language toggle. Pages without a counterpart map to
 * the other language's homepage.
 */
export const langCounterparts: Record<string, string> = {
  // Shared pages — direct counterpart
  '/en/': '/es/',
  '/es/': '/en/',
  '/en/our-story/': '/es/our-story/',
  '/es/our-story/': '/en/our-story/',
  '/en/how-we-help/': '/es/how-we-help/',
  '/es/how-we-help/': '/en/how-we-help/',
  '/en/scholars/': '/es/scholars/',
  '/es/scholars/': '/en/scholars/',
  '/en/newsletter/': '/es/newsletter/',
  '/es/newsletter/': '/en/newsletter/',
  // EN-exclusive → ES homepage
  '/en/how-to-donate/': '/es/',
  '/en/friends-of-bbf/': '/es/',
  '/en/your-impact/': '/es/',
  // ES-exclusive → EN homepage
  '/es/how-to-apply/': '/en/',
  '/es/student-resources/': '/en/',
  // Footer sitemap cross-links (exclusive pages in "wrong" language)
  '/es/how-to-donate/': '/en/how-to-donate/',
  '/es/friends-of-bbf/': '/en/friends-of-bbf/',
  '/es/your-impact/': '/en/your-impact/',
  '/en/how-to-apply/': '/es/how-to-apply/',
  '/en/student-resources/': '/es/student-resources/',
};

export function getCounterpart(pathname: string): string {
  // Normalize trailing slash
  const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
  return langCounterparts[normalized] ?? (normalized.startsWith('/es/') ? '/en/' : '/es/');
}
```

- [ ] **Step 3: Verify build succeeds**

```bash
npx astro build
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/nav.ts src/i18n/ui.ts
git commit -m "feat: add per-language navigation config and lang counterpart mapping"
```

---

### Task 3: Refactor Header — fixed nav with per-language menus

Make the navbar fixed to top on scroll. Use per-language nav links. Donate button always visible in both languages.

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/js/lang-toggle.ts`

- [ ] **Step 1: Update Header.astro to use nav config**

Replace the hardcoded nav links in `src/components/Header.astro` with the per-language config. Import `navLinks` from `nav.ts` and loop over `navLinks[lang]` to render links. Keep the donate button outside the nav loop so it's always rendered.

In the component script section at the top:

```astro
---
import Logo from './Logo.astro';
import { getLang, t } from '../i18n/utils';
import { navLinks, getCounterpart } from '../i18n/nav';

const lang = getLang(Astro.url);
const links = navLinks[lang];
const counterpart = getCounterpart(Astro.url.pathname);
---
```

In the template, replace the existing nav links `<ul>` with:

```astro
<ul class="nav-links" id="navLinks">
  {links.map(link => (
    <li>
      <a href={link.href} class:list={[{ active: Astro.url.pathname.startsWith(link.href) }]}>
        {t(lang, link.key as any)}
      </a>
    </li>
  ))}
</ul>
```

Keep the donate button and language/theme toggles as separate elements outside this list. Update the language toggle link to use `counterpart` instead of the simple path swap:

```astro
<a href={counterpart} class="lang-toggle" aria-label={t(lang, 'language.switch')}>
  {lang === 'en' ? 'ES' : 'EN'}
</a>
```

- [ ] **Step 2: Make the navbar fixed to top**

In the `<style>` section of `Header.astro`, update the header/nav styles:

```css
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--nav-border);
}
```

Add a body offset in `src/styles/global.css` to prevent content from hiding behind the fixed nav:

```css
body {
  padding-top: var(--header-height, 72px);
}
```

And in the Header.astro style, define the CSS variable:

```css
:root {
  --header-height: 72px;
}
```

- [ ] **Step 3: Update lang-toggle.ts to use counterpart data attribute**

Replace the path-swap logic in `src/js/lang-toggle.ts`. Since the counterpart URL is now rendered as the `href` on the language toggle link in the server-rendered HTML, the JS file no longer needs language toggle logic. Remove the lang-toggle click handler — the `<a>` tag handles navigation natively.

If `lang-toggle.ts` only handles the language toggle, delete the file and remove its import. If it does other things, remove only the toggle handler.

- [ ] **Step 4: Verify build and check nav renders**

```bash
npx astro dev
```

Open `http://localhost:4321/en/` and `http://localhost:4321/es/` in a browser. Verify:
- EN nav shows: Home, Our Story, How We Help, Scholars, Your Impact, How to Donate, Friends of BBF, Newsletter + Donate button
- ES nav shows: Inicio, Quiénes Somos, Cómo Ayudamos, Becarios, Cómo Obtener la Beca, Recursos para Becarios, Boletín + Donate button
- Nav is fixed to top and stays visible on scroll
- Language toggle switches to counterpart page

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.astro src/js/lang-toggle.ts src/styles/global.css
git commit -m "feat: fixed navbar with per-language menus and donate button always visible"
```

---

### Task 4: Refactor Footer — full bilingual sitemap and entity-aware addresses

Footer sitemap lists all pages in both languages. Addresses are entity-aware (EN=Van Nuys, ES=Cabo San Lucas).

**Files:**
- Modify: `src/components/Footer.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Update address i18n keys**

In `src/i18n/ui.ts`, ensure the address keys are entity-aware:

EN:
```typescript
'footer.address.line1': '15139 Hamlin St.',
'footer.address.line2': 'Van Nuys, CA, 91411. USA.',
```

ES:
```typescript
'footer.address.line1': 'Camino del Pedernal 160, Fraccionamiento Pedregal',
'footer.address.line2': 'Cabo San Lucas, Los Cabos, Baja California Sur, México. C.P. 23453',
```

Also verify `footer.entityName` is entity-aware:

EN: `'footer.entityName': 'BBF USA — 501(c)(3) Nonprofit'`
ES: `'footer.entityName': 'Building Baja\'s Future, A.C. — Asociación Civil'`

- [ ] **Step 2: Refactor Footer.astro to use allPages config**

Import `allPages` from `nav.ts`:

```astro
---
import Logo from './Logo.astro';
import { getLang, t } from '../i18n/utils';
import { allPages } from '../i18n/nav';

const lang = getLang(Astro.url);
const currentLangPages = allPages[lang];
const otherLang = lang === 'en' ? 'es' : 'en';
const otherLangPages = allPages[otherLang];
---
```

Replace the hardcoded footer columns with a sitemap that shows:
1. **Brand column** — Logo, entity name, legal note (entity-aware)
2. **Current language pages** — all pages in the current language
3. **Other language pages** — all pages in the other language (this is where exclusive pages become accessible)
4. **Contact** — entity-aware address, email, phone

```astro
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <Logo />
      <p>{t(lang, 'footer.entityName')}</p>
      <p class="legal">{t(lang, 'footer.legal')}</p>
    </div>

    <div class="footer-nav">
      <h4>{lang === 'en' ? 'Pages' : 'Páginas'}</h4>
      <ul>
        {currentLangPages.map(page => (
          <li><a href={page.href}>{t(lang, page.key as any)}</a></li>
        ))}
      </ul>
    </div>

    <div class="footer-nav">
      <h4>{lang === 'en' ? 'En Español' : 'In English'}</h4>
      <ul>
        {otherLangPages.map(page => (
          <li><a href={page.href}>{t(otherLang, page.key as any)}</a></li>
        ))}
      </ul>
    </div>

    <div class="footer-contact">
      <h4>{t(lang, 'footer.contact')}</h4>
      <p>{t(lang, 'footer.address.line1')}</p>
      <p>{t(lang, 'footer.address.line2')}</p>
      <p><a href={`mailto:${t(lang, 'footer.email')}`}>{t(lang, 'footer.email')}</a></p>
    </div>
  </div>

  <div class="footer-bottom">
    <p>{t(lang, 'footer.copyright')}</p>
    <p class="disclaimer">{t(lang, 'footer.disclaimer')}</p>
  </div>
</footer>
```

- [ ] **Step 3: Verify build and check footer**

```bash
npx astro dev
```

Open both `/en/` and `/es/` pages. Verify:
- EN footer shows Van Nuys address, 501(c)(3) entity name
- ES footer shows Cabo San Lucas address, A.C. entity name
- Both footers list all pages in both languages
- Links work correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro src/i18n/ui.ts
git commit -m "feat: bilingual footer sitemap with entity-aware addresses"
```

---

## Phase 2: Core Components

### Task 5: Animated stat counter with synchronized easing

Replace the static StatCounter with an animated version. All counters start and finish together with ease-in-out easing. Triggered when section scrolls into view.

**Files:**
- Modify: `src/components/StatCounter.astro`
- Create: `src/js/stat-counter.ts`

- [ ] **Step 1: Update StatCounter.astro to support animation**

Replace `src/components/StatCounter.astro` with a version that outputs data attributes for the JS to read:

```astro
---
interface Props {
  target: number;
  label: string;
  suffix?: string;
}

const { target, label, suffix = '' } = Astro.props;
---

<div class="stat-counter" data-target={target} data-suffix={suffix}>
  <span class="stat-number" aria-label={`${target}${suffix}`}>
    <span class="stat-display">0</span>{suffix && <span class="stat-suffix">{suffix}</span>}
  </span>
  <span class="stat-label">{label}</span>
</div>

<style>
  .stat-counter {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 700;
    color: var(--red);
    line-height: 1.1;
  }

  .stat-suffix {
    font-size: 0.6em;
  }

  .stat-label {
    display: block;
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
</style>
```

- [ ] **Step 2: Create the stat counter animation script**

Create `src/js/stat-counter.ts`:

```typescript
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCounters(container: Element): void {
  const counters = container.querySelectorAll<HTMLElement>('.stat-counter');
  if (counters.length === 0) return;

  const duration = 2000; // ms
  const startTime = performance.now();

  function tick(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target ?? '0', 10);
      const current = Math.round(eased * target);
      const display = counter.querySelector('.stat-display');
      if (display) display.textContent = current.toLocaleString();
    });

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function init(): void {
  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('.stats-section').forEach(section => {
    if (prefersReducedMotion) {
      // Show final values immediately
      section.querySelectorAll<HTMLElement>('.stat-counter').forEach(counter => {
        const target = parseInt(counter.dataset.target ?? '0', 10);
        const display = counter.querySelector('.stat-display');
        if (display) display.textContent = target.toLocaleString();
      });
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters(section);
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
  });
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 3: Verify the component renders**

Add a test usage in any page (e.g., `src/pages/en/index.astro`) temporarily if not already using StatCounter:

```astro
<section class="stats-section">
  <StatCounter target={650} label="Scholars" suffix="+" />
  <StatCounter target={20} label="Years of Impact" />
  <StatCounter target={200} label="Graduates" />
</section>
```

```bash
npx astro dev
```

Open the page, scroll to the stats section. Verify all three counters animate from 0 to their target simultaneously over ~2 seconds with eased motion.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatCounter.astro src/js/stat-counter.ts
git commit -m "feat: animated stat counter with synchronized easing and reduced-motion support"
```

---

### Task 6: BCS eligibility callout component

A styled callout for the BCS-only scholarship requirement. Prominent on ES pages, natural framing on EN.

**Files:**
- Create: `src/components/BcsCallout.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add i18n keys**

Add to `en` in `src/i18n/ui.ts`:

```typescript
'bcs.callout': '[PENDING CLIENT COPY — BCS eligibility, donor-facing framing]',
```

Add to `es` in `src/i18n/ui.ts`:

```typescript
'bcs.callout': '[PENDING CLIENT COPY — BCS eligibility, applicant-facing, prominent]',
```

- [ ] **Step 2: Create BcsCallout.astro**

Create `src/components/BcsCallout.astro`:

```astro
---
import { getLang, t } from '../i18n/utils';

interface Props {
  variant?: 'prominent' | 'inline';
}

const { variant = 'inline' } = Astro.props;
const lang = getLang(Astro.url);
---

<aside class:list={['bcs-callout', `bcs-callout--${variant}`]} role="note">
  <p>{t(lang, 'bcs.callout')}</p>
</aside>

<style>
  .bcs-callout {
    line-height: 1.6;
  }

  /* Inline: woven into copy on EN donor pages */
  .bcs-callout--inline {
    font-style: italic;
    color: var(--text-muted);
    margin: 1rem 0;
  }

  /* Prominent: styled callout on ES applicant pages */
  .bcs-callout--prominent {
    padding: 1.25rem 1.5rem;
    border-left: 4px solid var(--red);
    background: var(--bg-alt);
    border-radius: 0 var(--radius, 4px) var(--radius, 4px) 0;
    font-family: var(--font-display);
    font-size: var(--text-lg, 1.125rem);
    color: var(--text);
    margin: 2rem 0;
  }
</style>
```

- [ ] **Step 3: Verify component renders**

```bash
npx astro build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BcsCallout.astro src/i18n/ui.ts
git commit -m "feat: BCS eligibility callout component with prominent and inline variants"
```

---

## Phase 3: Page Layouts

### Task 7: EN Home — donor-focused layout

Full-bleed hero, impact stats, programs overview, testimonial, donate CTA. Keep the emotional, donation-driving structure.

**Files:**
- Modify: `src/pages/en/index.astro`

- [ ] **Step 1: Restructure EN home page**

Update `src/pages/en/index.astro`. Keep the existing hero, stats, mission, and CTA sections. Ensure it imports the animated StatCounter and uses the `stats-section` class wrapper. Update section ordering to match the spec:

1. Hero (full-bleed, emotional headline, Donate CTA button)
2. Stats section (animated counters — scholars, years, graduates)
3. Programs overview ("what your money funds")
4. Impact quote / testimonial
5. Donate CTA strip

Ensure the stats section uses `class="stats-section"` so the animation JS finds it, and each `StatCounter` receives `target` as a number prop.

Import the stat-counter script in the page:

```astro
<script src="../../js/stat-counter.ts"></script>
```

The actual copy text uses i18n keys with `[PENDING CLIENT COPY]` placeholders where new copy is needed.

- [ ] **Step 2: Verify EN home renders**

```bash
npx astro dev
```

Open `http://localhost:4321/en/`. Verify hero, animated stats, programs, quote, and CTA render correctly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/en/index.astro
git commit -m "feat: EN home — donor-focused layout with animated stats"
```

---

### Task 8: ES Home — applicant-focused layout

Compact intro (no hero), what is BBF, impact stats, scholarship benefits, how to apply steps, apply CTA. BCS callout integrated.

**Files:**
- Modify: `src/pages/es/index.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add ES home-specific i18n keys**

Add to `es` in `src/i18n/ui.ts`:

```typescript
'home.es.intro': '[PENDING CLIENT COPY — brief intro to BBF for applicants]',
'home.es.whatIsBbf': '[PENDING CLIENT COPY — what is BBF, asociación civil, scholarships]',
'home.es.benefits.tuition': '[PENDING CLIENT COPY]',
'home.es.benefits.books': '[PENDING CLIENT COPY]',
'home.es.benefits.mentorship': '[PENDING CLIENT COPY]',
'home.es.benefits.support': '[PENDING CLIENT COPY]',
'home.es.steps.title': '[PENDING CLIENT COPY — how to apply section title]',
'home.es.steps.step1': '[PENDING CLIENT COPY — requirements]',
'home.es.steps.step2': '[PENDING CLIENT COPY — apply]',
'home.es.steps.step3': '[PENDING CLIENT COPY — interview]',
'home.es.applyCtaText': '[PENDING CLIENT COPY — apply CTA]',
```

Add corresponding `en` fallback keys (same keys, English descriptions).

- [ ] **Step 2: Rewrite ES home page layout**

Replace the hero-based layout in `src/pages/es/index.astro` with the applicant-focused structure:

```astro
---
import Page from '../../layouts/Page.astro';
import StatCounter from '../../components/StatCounter.astro';
import BcsCallout from '../../components/BcsCallout.astro';
import { t } from '../../i18n/utils';

const lang = 'es' as const;

// TODO: These will come from stats.json once Sheets integration is built
const stats = { scholars: 650, years: 20, graduates: 200 };
---

<Page title={t(lang, 'meta.title')}>

  {/* Compact intro — no full-bleed hero */}
  <section class="intro">
    <div class="container">
      <h1>{t(lang, 'home.es.intro')}</h1>
      <p>{t(lang, 'home.es.whatIsBbf')}</p>
      <BcsCallout variant="prominent" />
    </div>
  </section>

  {/* Impact stats — same animated counters as EN */}
  <section class="stats-section">
    <div class="container stats-grid">
      <StatCounter target={stats.scholars} label={t(lang, 'stats.scholars')} suffix="+" />
      <StatCounter target={stats.years} label={t(lang, 'stats.years')} />
      <StatCounter target={stats.graduates} label={t(lang, 'stats.graduates')} />
    </div>
  </section>

  {/* Scholarship benefits grid */}
  <section class="benefits">
    <div class="container">
      <div class="benefits-grid">
        <div class="benefit-card">{t(lang, 'home.es.benefits.tuition')}</div>
        <div class="benefit-card">{t(lang, 'home.es.benefits.books')}</div>
        <div class="benefit-card">{t(lang, 'home.es.benefits.mentorship')}</div>
        <div class="benefit-card">{t(lang, 'home.es.benefits.support')}</div>
      </div>
    </div>
  </section>

  {/* How to apply steps */}
  <section class="apply-steps">
    <div class="container">
      <h2>{t(lang, 'home.es.steps.title')}</h2>
      <div class="steps-grid">
        <div class="step"><span class="step-number">1</span><p>{t(lang, 'home.es.steps.step1')}</p></div>
        <div class="step"><span class="step-number">2</span><p>{t(lang, 'home.es.steps.step2')}</p></div>
        <div class="step"><span class="step-number">3</span><p>{t(lang, 'home.es.steps.step3')}</p></div>
      </div>
    </div>
  </section>

  {/* Apply CTA */}
  <section class="apply-cta">
    <div class="container">
      <p>{t(lang, 'home.es.applyCtaText')}</p>
      <a href="/es/how-to-apply/" class="btn btn-primary">{t(lang, 'nav.howToApply')}</a>
    </div>
  </section>

  <script src="../../js/stat-counter.ts"></script>
</Page>
```

- [ ] **Step 3: Add styles for ES home sections**

Add scoped styles in the same file for the intro, benefits grid, steps, and CTA sections. Keep them minimal and using CSS variables for theming:

```astro
<style>
  .intro {
    padding: var(--space-2xl, 4rem) 0 var(--space-xl, 2rem);
  }

  .intro h1 {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    margin-bottom: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    text-align: center;
    padding: var(--space-xl, 2rem) 0;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .benefit-card {
    padding: 1.25rem;
    background: var(--bg-card);
    border-radius: var(--radius, 4px);
    border: 1px solid var(--border);
  }

  .steps-grid {
    display: flex;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .step {
    flex: 1;
    text-align: center;
  }

  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--red);
    color: white;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
  }

  .apply-cta {
    text-align: center;
    padding: var(--space-xl, 2rem) 0;
    background: var(--bg-alt);
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .steps-grid { flex-direction: column; }
  }
</style>
```

- [ ] **Step 4: Verify ES home renders**

```bash
npx astro dev
```

Open `http://localhost:4321/es/`. Verify: compact intro (no hero), BCS callout, animated stats, benefits grid, apply steps, CTA.

- [ ] **Step 5: Commit**

```bash
git add src/pages/es/index.astro src/i18n/ui.ts
git commit -m "feat: ES home — applicant-focused layout with BCS callout and apply steps"
```

---

### Task 9: How We Help — per-language framing

EN frames programs as "what your donations fund." ES frames programs as "what you receive as a scholar."

**Files:**
- Modify: `src/pages/en/how-we-help.astro`
- Modify: `src/pages/es/how-we-help.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add framing-specific i18n keys**

Add to `en` in `src/i18n/ui.ts`:

```typescript
'help.en.heading': '[PENDING CLIENT COPY — what your donations fund]',
'help.en.subheading': '[PENDING CLIENT COPY — donor-framed subheading]',
```

Add to `es`:

```typescript
'help.es.heading': '[PENDING CLIENT COPY — what you receive as a scholar]',
'help.es.subheading': '[PENDING CLIENT COPY — applicant-framed subheading]',
```

- [ ] **Step 2: Update EN How We Help page**

In `src/pages/en/how-we-help.astro`, update the page header section to use donor-framed copy. Replace the intro heading and subheading with the new i18n keys. Add a donate CTA at the bottom of the page. Keep the existing program cards/sections — just change the framing around them.

- [ ] **Step 3: Update ES How We Help page**

In `src/pages/es/how-we-help.astro`, update the page header to use applicant-framed copy. Add the BCS callout component near the top. Replace the CTA at the bottom with an "apply" CTA linking to `/es/how-to-apply/` instead of a donate CTA.

```astro
import BcsCallout from '../../components/BcsCallout.astro';
```

Add after the page intro:

```astro
<BcsCallout variant="prominent" />
```

- [ ] **Step 4: Verify both pages**

```bash
npx astro dev
```

Check `/en/how-we-help/` (donor framing, donate CTA) and `/es/how-we-help/` (applicant framing, BCS callout, apply CTA).

- [ ] **Step 5: Commit**

```bash
git add src/pages/en/how-we-help.astro src/pages/es/how-we-help.astro src/i18n/ui.ts
git commit -m "feat: per-language How We Help — donor framing (EN) and applicant framing (ES)"
```

---

### Task 10: Create Newsletter page (shared layout, both languages)

Latest newsletter PDF, archive list, Mailchimp subscribe form.

**Files:**
- Create: `src/components/SubscribeForm.astro`
- Create: `src/components/NewsletterArchive.astro`
- Create: `src/pages/en/newsletter.astro`
- Create: `src/pages/es/newsletter.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add newsletter i18n keys**

Add to both `en` and `es` in `src/i18n/ui.ts`:

EN:
```typescript
'newsletter.pageTitle': 'Newsletter',
'newsletter.latest': 'Latest Newsletter',
'newsletter.archive': 'Previous Newsletters',
'newsletter.subscribe.title': 'Subscribe',
'newsletter.subscribe.text': 'Get our quarterly newsletter delivered to your inbox.',
'newsletter.subscribe.email': 'Email address',
'newsletter.subscribe.button': 'Subscribe',
'newsletter.download': 'Download PDF',
'newsletter.noNewsletters': 'No newsletters available yet. Subscribe to be notified when the first one is published.',
```

ES:
```typescript
'newsletter.pageTitle': 'Boletín',
'newsletter.latest': 'Último Boletín',
'newsletter.archive': 'Boletines Anteriores',
'newsletter.subscribe.title': 'Suscríbete',
'newsletter.subscribe.text': 'Recibe nuestro boletín trimestral en tu correo.',
'newsletter.subscribe.email': 'Correo electrónico',
'newsletter.subscribe.button': 'Suscribirse',
'newsletter.download': 'Descargar PDF',
'newsletter.noNewsletters': 'Aún no hay boletines disponibles. Suscríbete para recibir una notificación cuando se publique el primero.',
```

- [ ] **Step 2: Create SubscribeForm component**

Create `src/components/SubscribeForm.astro`:

```astro
---
import { getLang, t } from '../i18n/utils';

const lang = getLang(Astro.url);

// TODO: Replace with actual Mailchimp form action URL from Mailchimp account setup
const MAILCHIMP_ACTION = import.meta.env.PUBLIC_MAILCHIMP_ACTION ?? '#';
---

<div class="subscribe-form">
  <h3>{t(lang, 'newsletter.subscribe.title')}</h3>
  <p>{t(lang, 'newsletter.subscribe.text')}</p>
  <form action={MAILCHIMP_ACTION} method="post" target="_blank" novalidate>
    <div class="form-row">
      <input
        type="email"
        name="EMAIL"
        placeholder={t(lang, 'newsletter.subscribe.email')}
        required
        aria-label={t(lang, 'newsletter.subscribe.email')}
      />
      <button type="submit" class="btn btn-primary">
        {t(lang, 'newsletter.subscribe.button')}
      </button>
    </div>
  </form>
</div>

<style>
  .subscribe-form {
    padding: 2rem;
    background: var(--bg-alt);
    border-radius: var(--radius, 4px);
  }

  .subscribe-form h3 {
    font-family: var(--font-display);
    margin-bottom: 0.5rem;
  }

  .subscribe-form p {
    color: var(--text-muted);
    margin-bottom: 1.25rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
  }

  .form-row input {
    flex: 1;
    padding: 0.625rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius, 4px);
    background: var(--bg);
    color: var(--text);
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    .form-row {
      flex-direction: column;
    }
  }
</style>
```

- [ ] **Step 3: Create NewsletterArchive component**

Create `src/components/NewsletterArchive.astro`:

```astro
---
import { getLang, t } from '../i18n/utils';

interface Newsletter {
  title: string;
  date: string;
  url: string;
}

interface Props {
  newsletters: Newsletter[];
}

const { newsletters } = Astro.props;
const lang = getLang(Astro.url);
---

{newsletters.length === 0 ? (
  <p class="no-newsletters">{t(lang, 'newsletter.noNewsletters')}</p>
) : (
  <div class="archive">
    <h3>{t(lang, 'newsletter.archive')}</h3>
    <ul class="archive-list">
      {newsletters.map(nl => (
        <li>
          <a href={nl.url} target="_blank" rel="noopener">
            <span class="nl-title">{nl.title}</span>
            <span class="nl-date">{new Date(nl.date).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long' })}</span>
            <span class="nl-download">{t(lang, 'newsletter.download')} ↓</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
)}

<style>
  .archive-list {
    list-style: none;
    padding: 0;
  }

  .archive-list li {
    border-bottom: 1px solid var(--border);
  }

  .archive-list a {
    display: flex;
    align-items: center;
    padding: 1rem 0;
    text-decoration: none;
    color: var(--text);
    gap: 1rem;
  }

  .archive-list a:hover {
    color: var(--red);
  }

  .nl-title {
    flex: 1;
    font-weight: 500;
  }

  .nl-date {
    color: var(--text-muted);
    font-size: var(--text-sm, 0.875rem);
  }

  .nl-download {
    color: var(--red);
    font-size: var(--text-sm, 0.875rem);
    white-space: nowrap;
  }

  .no-newsletters {
    color: var(--text-muted);
    padding: 2rem 0;
  }
</style>
```

- [ ] **Step 4: Create EN newsletter page**

Create `src/pages/en/newsletter.astro`:

```astro
---
import Page from '../../layouts/Page.astro';
import PageHeader from '../../components/PageHeader.astro';
import SubscribeForm from '../../components/SubscribeForm.astro';
import NewsletterArchive from '../../components/NewsletterArchive.astro';
import { t } from '../../i18n/utils';

const lang = 'en' as const;

// TODO: This will be populated from Google Drive /sent/ folder during build
// For now, empty array — the component handles the empty state
const newsletters: { title: string; date: string; url: string }[] = [];
---

<Page title={t(lang, 'newsletter.pageTitle')}>
  <div class="container">
    <PageHeader eyebrow="" title={t(lang, 'newsletter.pageTitle')} />

    <div class="newsletter-layout">
      <section class="newsletter-main">
        <NewsletterArchive newsletters={newsletters} />
      </section>

      <aside class="newsletter-sidebar">
        <SubscribeForm />
      </aside>
    </div>
  </div>
</Page>

<style>
  .newsletter-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 3rem;
    padding: var(--space-xl, 2rem) 0;
  }

  @media (max-width: 768px) {
    .newsletter-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 5: Create ES newsletter page**

Create `src/pages/es/newsletter.astro` — identical structure, just `lang = 'es'`.

```astro
---
import Page from '../../layouts/Page.astro';
import PageHeader from '../../components/PageHeader.astro';
import SubscribeForm from '../../components/SubscribeForm.astro';
import NewsletterArchive from '../../components/NewsletterArchive.astro';
import { t } from '../../i18n/utils';

const lang = 'es' as const;

const newsletters: { title: string; date: string; url: string }[] = [];
---

<Page title={t(lang, 'newsletter.pageTitle')}>
  <div class="container">
    <PageHeader eyebrow="" title={t(lang, 'newsletter.pageTitle')} />

    <div class="newsletter-layout">
      <section class="newsletter-main">
        <NewsletterArchive newsletters={newsletters} />
      </section>

      <aside class="newsletter-sidebar">
        <SubscribeForm />
      </aside>
    </div>
  </div>
</Page>

<style>
  .newsletter-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 3rem;
    padding: var(--space-xl, 2rem) 0;
  }

  @media (max-width: 768px) {
    .newsletter-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 6: Verify build and newsletter pages**

```bash
npx astro dev
```

Open `/en/newsletter/` and `/es/newsletter/`. Verify empty state message, subscribe form layout.

- [ ] **Step 7: Commit**

```bash
git add src/components/SubscribeForm.astro src/components/NewsletterArchive.astro src/pages/en/newsletter.astro src/pages/es/newsletter.astro src/i18n/ui.ts
git commit -m "feat: newsletter page with archive list and Mailchimp subscribe form"
```

---

### Task 11: Create Your Impact page (EN-only)

Transparency page showing where donations go. EN primary nav, ES footer-only.

**Files:**
- Create: `src/pages/en/your-impact.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add i18n keys**

Add to `en` in `src/i18n/ui.ts`:

```typescript
'impact.title': 'Your Impact',
'impact.subtitle': '[PENDING CLIENT COPY — transparency, where your money goes]',
'impact.section1.title': '[PENDING CLIENT COPY]',
'impact.section1.text': '[PENDING CLIENT COPY]',
'impact.section2.title': '[PENDING CLIENT COPY]',
'impact.section2.text': '[PENDING CLIENT COPY]',
'impact.ctaText': '[PENDING CLIENT COPY — donate CTA]',
```

Add matching `es` keys as placeholders for the footer sitemap cross-link.

- [ ] **Step 2: Create the page**

Create `src/pages/en/your-impact.astro`:

```astro
---
import Page from '../../layouts/Page.astro';
import PageHeader from '../../components/PageHeader.astro';
import CtaStrip from '../../components/CtaStrip.astro';
import { t } from '../../i18n/utils';

const lang = 'en' as const;
---

<Page title={t(lang, 'impact.title')}>
  <div class="container">
    <PageHeader eyebrow="" title={t(lang, 'impact.title')} subtitle={t(lang, 'impact.subtitle')} />

    <section class="impact-section">
      <h2>{t(lang, 'impact.section1.title')}</h2>
      <p>{t(lang, 'impact.section1.text')}</p>
    </section>

    <section class="impact-section">
      <h2>{t(lang, 'impact.section2.title')}</h2>
      <p>{t(lang, 'impact.section2.text')}</p>
    </section>
  </div>

  <CtaStrip />
</Page>

<style>
  .impact-section {
    padding: var(--space-lg, 1.5rem) 0;
    border-bottom: 1px solid var(--border);
  }

  .impact-section:last-of-type {
    border-bottom: none;
  }

  .impact-section h2 {
    font-family: var(--font-display);
    margin-bottom: 0.75rem;
  }
</style>
```

- [ ] **Step 3: Verify build**

```bash
npx astro build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/en/your-impact.astro src/i18n/ui.ts
git commit -m "feat: Your Impact page (EN-only, donor transparency)"
```

---

### Task 12: Create Student Resources page (ES-only)

Resources for scholars — obligations, support services, FAQ. ES primary nav, EN footer-only.

**Files:**
- Create: `src/pages/es/student-resources.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add i18n keys**

Add to `es` in `src/i18n/ui.ts`:

```typescript
'resources.title': 'Recursos para Becarios',
'resources.subtitle': '[PENDING CLIENT COPY — what scholars need to know]',
'resources.obligations.title': '[PENDING CLIENT COPY — scholar obligations]',
'resources.obligations.text': '[PENDING CLIENT COPY]',
'resources.support.title': '[PENDING CLIENT COPY — support services]',
'resources.support.text': '[PENDING CLIENT COPY]',
'resources.faq.title': '[PENDING CLIENT COPY — FAQ]',
```

Add matching `en` keys for footer sitemap cross-link.

- [ ] **Step 2: Create the page**

Create `src/pages/es/student-resources.astro`:

```astro
---
import Page from '../../layouts/Page.astro';
import PageHeader from '../../components/PageHeader.astro';
import BcsCallout from '../../components/BcsCallout.astro';
import { t } from '../../i18n/utils';

const lang = 'es' as const;
---

<Page title={t(lang, 'resources.title')}>
  <div class="container">
    <PageHeader eyebrow="" title={t(lang, 'resources.title')} subtitle={t(lang, 'resources.subtitle')} />

    <BcsCallout variant="prominent" />

    <section class="resource-section">
      <h2>{t(lang, 'resources.obligations.title')}</h2>
      <p>{t(lang, 'resources.obligations.text')}</p>
    </section>

    <section class="resource-section">
      <h2>{t(lang, 'resources.support.title')}</h2>
      <p>{t(lang, 'resources.support.text')}</p>
    </section>

    <section class="resource-section">
      <h2>{t(lang, 'resources.faq.title')}</h2>
      <p>{t(lang, 'resources.faq.title')}</p>
    </section>
  </div>
</Page>

<style>
  .resource-section {
    padding: var(--space-lg, 1.5rem) 0;
    border-bottom: 1px solid var(--border);
  }

  .resource-section:last-of-type {
    border-bottom: none;
  }

  .resource-section h2 {
    font-family: var(--font-display);
    margin-bottom: 0.75rem;
  }
</style>
```

- [ ] **Step 3: Verify build**

```bash
npx astro build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/es/student-resources.astro src/i18n/ui.ts
git commit -m "feat: Student Resources page (ES-only, applicant support)"
```

---

## Phase 4: Google Sheets Integration

### Task 13: Build script — fetch scholars and stats from Google Sheets

Pre-build script that reads the Google Sheet and generates scholar markdown files + stats JSON.

**Files:**
- Create: `scripts/fetch-sheets.mjs`
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Install googleapis dependency**

```bash
npm install googleapis
```

- [ ] **Step 2: Create .env.example**

Create `.env.example`:

```bash
# Google Sheets integration
# Option A: Public sheet (no auth needed, sheet must be "Published to web")
GOOGLE_SHEET_ID=your-sheet-id-here

# Option B: Service account (private sheet)
# GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
# GOOGLE_SERVICE_ACCOUNT_KEY=base64-encoded-private-key

# Google Drive (scholar photos)
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here

# Mailchimp (newsletter subscribe form)
PUBLIC_MAILCHIMP_ACTION=https://your-list.us1.list-manage.com/subscribe/post?u=xxx&id=yyy

# Netlify (build hook for auto-deploy)
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/xxx
```

- [ ] **Step 3: Create fetch-sheets.mjs**

Create `scripts/fetch-sheets.mjs`:

```javascript
import { google } from 'googleapis';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) {
  console.warn('⚠ GOOGLE_SHEET_ID not set — skipping sheet fetch, using existing content');
  process.exit(0);
}

const SCHOLARS_DIR = join(process.cwd(), 'src/content/scholars');
const STATS_PATH = join(process.cwd(), 'src/data/stats.json');

async function getSheets() {
  // Public sheet — no auth needed (sheet must be published to web)
  const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY || undefined });

  // If no API key, use public access (works for published sheets)
  if (!process.env.GOOGLE_API_KEY) {
    return google.sheets({ version: 'v4' });
  }
  return sheets;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchScholars(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Scholars!A:F',
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.warn('⚠ No scholar data found in sheet');
    return;
  }

  const [header, ...data] = rows;
  // Expected columns: Name, University, Degree, Status, Cohort Year, Photo Filename
  const nameIdx = header.indexOf('Name');
  const uniIdx = header.indexOf('University');
  const degIdx = header.indexOf('Degree');
  const statusIdx = header.indexOf('Status');
  const yearIdx = header.indexOf('Cohort Year');
  const photoIdx = header.indexOf('Photo Filename');

  if (nameIdx === -1) {
    console.error('✗ "Name" column not found in Scholars tab');
    process.exit(1);
  }

  // Clear existing scholar files
  if (existsSync(SCHOLARS_DIR)) {
    const { readdirSync, unlinkSync } = await import('fs');
    readdirSync(SCHOLARS_DIR).forEach(f => {
      if (f.endsWith('.md')) unlinkSync(join(SCHOLARS_DIR, f));
    });
  }
  mkdirSync(SCHOLARS_DIR, { recursive: true });

  let count = 0;
  for (const row of data) {
    const name = row[nameIdx]?.trim();
    if (!name) continue;

    const slug = slugify(name);
    const university = row[uniIdx]?.trim() ?? '';
    const degree = row[degIdx]?.trim() ?? '';
    const status = row[statusIdx]?.trim() ?? 'Active';
    const cohortYear = row[yearIdx]?.trim() ?? '';
    const photoFilename = row[photoIdx]?.trim() ?? '';

    // Determine photo path — if filename exists, build script will have downloaded it
    const photo = photoFilename
      ? `/scholars/${photoFilename}`
      : '';

    const frontmatter = [
      '---',
      `name: "${name}"`,
      `university: "${university}"`,
      `degree: "${degree}"`,
      `status: "${status}"`,
      cohortYear ? `cohortYear: ${cohortYear}` : null,
      `photo: "${photo}"`,
      '---',
    ].filter(Boolean).join('\n');

    writeFileSync(join(SCHOLARS_DIR, `${slug}.md`), frontmatter + '\n');
    count++;
  }

  console.log(`✓ Generated ${count} scholar files`);
}

async function fetchStats(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Stats!A:B',
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.warn('⚠ No stats data found in sheet');
    return;
  }

  const [, ...data] = rows; // Skip header
  const stats = {};
  for (const [key, value] of data) {
    if (key && value) {
      stats[key.trim()] = isNaN(Number(value)) ? value.trim() : Number(value);
    }
  }

  mkdirSync(join(process.cwd(), 'src/data'), { recursive: true });
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
  console.log(`✓ Generated stats.json: ${JSON.stringify(stats)}`);
}

async function main() {
  const sheets = await getSheets();
  await fetchScholars(sheets);
  await fetchStats(sheets);
}

main().catch(err => {
  console.error('✗ Sheet fetch failed:', err.message);
  console.warn('⚠ Continuing build with existing content');
});
```

- [ ] **Step 4: Add prebuild script to package.json**

In `package.json`, update the scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "prebuild": "node scripts/fetch-sheets.mjs",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "copy:client": "node scripts/ui-to-copy.mjs",
    "copy:ui": "node scripts/copy-to-ui.mjs"
  }
}
```

- [ ] **Step 5: Create default stats.json**

Create `src/data/stats.json` with placeholder values (used when sheet is unavailable):

```json
{
  "scholars_count": 650,
  "years_of_impact": 20,
  "graduates_count": 200
}
```

- [ ] **Step 6: Verify build without sheet credentials**

```bash
npx astro build
```

Expected: Warning about GOOGLE_SHEET_ID not set, build continues with existing content files.

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-sheets.mjs .env.example src/data/stats.json package.json
git commit -m "feat: Google Sheets pre-build script for scholars and stats"
```

---

### Task 14: Build script — fetch scholar photos from Google Drive

Downloads photos from a shared Drive folder, optimizes them, and places them in `public/scholars/`.

**Files:**
- Create: `scripts/fetch-photos.mjs`
- Modify: `package.json`

- [ ] **Step 1: Install sharp for image optimization**

```bash
npm install sharp
```

- [ ] **Step 2: Create fetch-photos.mjs**

Create `scripts/fetch-photos.mjs`:

```javascript
import { google } from 'googleapis';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
if (!FOLDER_ID) {
  console.warn('⚠ GOOGLE_DRIVE_FOLDER_ID not set — skipping photo fetch');
  process.exit(0);
}

const OUTPUT_DIR = join(process.cwd(), 'public/scholars');
const THUMB_SIZE = 300; // px, square thumbnail

async function main() {
  const drive = google.drive({ version: 'v3' });

  // List all image files in the folder
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, mimeType)',
    pageSize: 1000,
  });

  const files = res.data.files;
  if (!files || files.length === 0) {
    console.warn('⚠ No photos found in Drive folder');
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Track which files we've downloaded to avoid re-downloading
  const existing = new Set(
    existsSync(OUTPUT_DIR) ? readdirSync(OUTPUT_DIR) : []
  );

  let downloaded = 0;
  let skipped = 0;

  for (const file of files) {
    const outputName = file.name.replace(/\.[^.]+$/, '.webp');

    if (existing.has(outputName)) {
      skipped++;
      continue;
    }

    try {
      const response = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const buffer = Buffer.from(response.data);
      const optimized = await sharp(buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      writeFileSync(join(OUTPUT_DIR, outputName), optimized);
      downloaded++;
    } catch (err) {
      console.warn(`⚠ Failed to download ${file.name}: ${err.message}`);
    }
  }

  console.log(`✓ Photos: ${downloaded} downloaded, ${skipped} already cached`);
}

main().catch(err => {
  console.error('✗ Photo fetch failed:', err.message);
  console.warn('⚠ Continuing build with existing photos');
});
```

- [ ] **Step 3: Chain photo fetch into prebuild**

Update `package.json` prebuild script:

```json
"prebuild": "node scripts/fetch-sheets.mjs && node scripts/fetch-photos.mjs"
```

- [ ] **Step 4: Create default scholar thumbnail SVG**

Create `public/scholars/default-thumbnail.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none">
  <rect width="300" height="300" rx="8" fill="#e2ddd7"/>
  <circle cx="150" cy="120" r="50" fill="#9a9392"/>
  <ellipse cx="150" cy="260" rx="80" ry="60" fill="#9a9392"/>
</svg>
```

- [ ] **Step 5: Verify build**

```bash
npx astro build
```

Expected: Warning about GOOGLE_DRIVE_FOLDER_ID not set, build continues.

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-photos.mjs public/scholars/default-thumbnail.svg package.json
git commit -m "feat: Google Drive photo fetch with sharp optimization and default thumbnail"
```

---

### Task 15: Update ScholarCard to show photo with fallback thumbnail

Wire the scholar card to display the photo from the content collection, falling back to the default SVG.

**Files:**
- Modify: `src/components/ScholarCard.astro`
- Modify: `src/content.config.ts`

- [ ] **Step 1: Update scholar schema in content.config.ts**

In `src/content.config.ts`, update the scholars collection schema to include the new fields:

```typescript
import { defineCollection, z } from 'astro:content';

const scholars = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    photo: z.string().default(''),
    university: z.string().default(''),
    degree: z.string().default(''),
    status: z.enum(['Active', 'Graduated']).default('Active'),
    cohortYear: z.number().optional(),
  }),
});

export const collections = { scholars };
```

- [ ] **Step 2: Update ScholarCard.astro**

In `src/components/ScholarCard.astro`, update to show the photo:

```astro
---
interface Props {
  name: string;
  photo: string;
  university: string;
  degree: string;
  status: string;
}

const { name, photo, university, degree, status } = Astro.props;
const photoSrc = photo || '/scholars/default-thumbnail.svg';
const isDefault = !photo;
---

<div
  class="scholar-card"
  data-university={university}
  data-degree={degree}
  data-status={status}
>
  <div class:list={['scholar-photo', { 'scholar-photo--default': isDefault }]}>
    <img src={photoSrc} alt={name} width="300" height="300" loading="lazy" />
  </div>
  <div class="scholar-info">
    <h3 class="scholar-name">{name}</h3>
    <p class="scholar-university">{university}</p>
    <p class="scholar-degree">{degree}</p>
    <span class:list={['scholar-status', `scholar-status--${status.toLowerCase()}`]}>
      {status}
    </span>
  </div>
</div>

<style>
  .scholar-card {
    border: 1px solid var(--border);
    border-radius: var(--radius, 4px);
    overflow: hidden;
    background: var(--bg-card);
  }

  .scholar-photo {
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--bg-alt);
  }

  .scholar-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scholar-photo--default {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .scholar-photo--default img {
    opacity: 0.4;
  }

  .scholar-info {
    padding: 1rem;
  }

  .scholar-name {
    font-family: var(--font-display);
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  .scholar-university,
  .scholar-degree {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
    margin-bottom: 0.125rem;
  }

  .scholar-status {
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    margin-top: 0.5rem;
    font-weight: 500;
  }

  .scholar-status--active {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .scholar-status--graduated {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
  }
</style>
```

- [ ] **Step 3: Update scholars page to pass photo prop**

In both `src/pages/en/scholars.astro` and `src/pages/es/scholars.astro`, ensure the ScholarCard receives the `photo` prop from the content collection data:

```astro
<ScholarCard
  name={scholar.data.name}
  photo={scholar.data.photo}
  university={scholar.data.university}
  degree={scholar.data.degree}
  status={scholar.data.status}
/>
```

- [ ] **Step 4: Verify build and scholar grid**

```bash
npx astro dev
```

Check `/en/scholars/` — cards should show default thumbnails (no photos yet) with name, university, degree, status badge.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScholarCard.astro src/content.config.ts src/pages/en/scholars.astro src/pages/es/scholars.astro
git commit -m "feat: scholar cards with photo/thumbnail fallback and status badges"
```

---

### Task 16: Wire stats.json into home pages

Both home pages read stats from the generated JSON file instead of hardcoded values.

**Files:**
- Modify: `src/pages/en/index.astro`
- Modify: `src/pages/es/index.astro`

- [ ] **Step 1: Import and use stats.json in EN home**

At the top of `src/pages/en/index.astro`, import the stats:

```astro
---
import stats from '../../data/stats.json';
---
```

Replace any hardcoded stat values with `stats.scholars_count`, `stats.years_of_impact`, `stats.graduates_count`:

```astro
<section class="stats-section">
  <div class="container stats-grid">
    <StatCounter target={stats.scholars_count} label={t(lang, 'stats.scholars')} suffix="+" />
    <StatCounter target={stats.years_of_impact} label={t(lang, 'stats.years')} />
    <StatCounter target={stats.graduates_count} label={t(lang, 'stats.graduates')} />
  </div>
</section>
```

- [ ] **Step 2: Same change in ES home**

In `src/pages/es/index.astro`, import the same stats file and replace the hardcoded `stats` object:

```astro
---
import stats from '../../data/stats.json';
---
```

Replace:
```astro
const stats = { scholars: 650, years: 20, graduates: 200 };
```

With usage:
```astro
<StatCounter target={stats.scholars_count} label={t(lang, 'stats.scholars')} suffix="+" />
```

- [ ] **Step 3: Verify both home pages read from stats.json**

```bash
npx astro dev
```

Check both `/en/` and `/es/` — stat counters should show values from `src/data/stats.json`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/en/index.astro src/pages/es/index.astro
git commit -m "feat: home pages read stats from generated stats.json"
```

---

## Phase 5: Google Apps Script — Newsletter Automation

### Task 17: Newsletter automation — Drive watcher + Mailchimp

Google Apps Script that watches a Drive folder for new PDFs, creates Mailchimp draft campaigns, and handles OK/STOP replies.

**Files:**
- Create: `apps-script/newsletter/Code.gs`
- Create: `apps-script/newsletter/Config.gs`
- Create: `apps-script/newsletter/EmailHandler.gs`
- Create: `apps-script/newsletter/appsscript.json`

- [ ] **Step 1: Create Apps Script manifest**

Create `apps-script/newsletter/appsscript.json`:

```json
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "exceptionLogging": "STACKDRIVER"
}
```

- [ ] **Step 2: Create Config.gs**

Create `apps-script/newsletter/Config.gs`:

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION — Update these values
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  // Google Drive folder IDs
  NEWSLETTER_ROOT_FOLDER_ID: 'YOUR_FOLDER_ID',  // Where client drops PDFs

  // Mailchimp
  MAILCHIMP_API_KEY: 'YOUR_API_KEY',
  MAILCHIMP_SERVER_PREFIX: 'us1',  // e.g., us1, us2, etc.
  MAILCHIMP_LIST_ID: 'YOUR_LIST_ID',  // Audience ID

  // Email addresses
  CLIENT_EMAIL: 'client@example.com',  // Who receives preview and sends OK/STOP
  ADMIN_EMAIL: 'admin@example.com',    // Jose — gets notified of errors

  // Newsletter email template
  EMAIL_FROM_NAME: 'Building Baja\'s Future',
  EMAIL_SUBJECT_PREFIX: 'BBF Newsletter: ',

  // Timing
  REMINDER_INTERVAL_HOURS: 72,
};
```

- [ ] **Step 3: Create Code.gs — main Drive watcher**

Create `apps-script/newsletter/Code.gs`:

```javascript
/**
 * Main trigger — runs hourly via Apps Script time-driven trigger.
 * Checks the Drive folder for new PDFs and manages the newsletter state machine.
 */
function checkForNewNewsletter() {
  const rootFolder = DriveApp.getFolderById(CONFIG.NEWSLETTER_ROOT_FOLDER_ID);
  const pendingFolder = getOrCreateSubfolder(rootFolder, 'pending');
  const sentFolder = getOrCreateSubfolder(rootFolder, 'sent');
  const rejectedFolder = getOrCreateSubfolder(rootFolder, 'rejected');
  const replacedFolder = getOrCreateSubfolder(rootFolder, 'replaced');

  // Check for new PDFs in root
  const newFiles = rootFolder.getFilesByType(MimeType.PDF);
  const newPdfs = [];
  while (newFiles.hasNext()) {
    newPdfs.push(newFiles.next());
  }

  if (newPdfs.length === 0) return;

  // If there's a pending newsletter, auto-reject it
  const pendingFiles = pendingFolder.getFiles();
  while (pendingFiles.hasNext()) {
    const old = pendingFiles.next();
    deletePendingMailchimpDraft();
    old.moveTo(replacedFolder);
    Logger.log('Auto-replaced pending newsletter: ' + old.getName());
  }

  // Process the newest PDF (if multiple uploaded, take the most recent)
  newPdfs.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  const pdf = newPdfs[0];

  // Move extra files to replaced
  for (let i = 1; i < newPdfs.length; i++) {
    newPdfs[i].moveTo(replacedFolder);
  }

  // Make PDF publicly accessible
  pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const pdfUrl = pdf.getUrl();

  // Move to pending
  pdf.moveTo(pendingFolder);

  // Create Mailchimp draft
  const campaignId = createMailchimpDraft(pdf.getName(), pdfUrl);

  // Store state in script properties
  const props = PropertiesService.getScriptProperties();
  props.setProperty('pending_campaign_id', campaignId);
  props.setProperty('pending_pdf_name', pdf.getName());
  props.setProperty('pending_timestamp', new Date().toISOString());

  // Send preview email to client
  sendPreviewEmail(campaignId, pdf.getName(), pdfUrl);

  Logger.log('Newsletter pending: ' + pdf.getName());
}

/**
 * Creates a Mailchimp draft campaign via API.
 */
function createMailchimpDraft(pdfName, pdfUrl) {
  const title = pdfName.replace(/\.pdf$/i, '');
  const payload = {
    type: 'regular',
    recipients: { list_id: CONFIG.MAILCHIMP_LIST_ID },
    settings: {
      subject_line: CONFIG.EMAIL_SUBJECT_PREFIX + title,
      from_name: CONFIG.EMAIL_FROM_NAME,
      reply_to: CONFIG.ADMIN_EMAIL,
    },
  };

  const res = UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify(payload),
    }
  );

  const campaign = JSON.parse(res.getContentText());
  const campaignId = campaign.id;

  // Set campaign content — simple HTML with PDF link
  const html = buildNewsletterEmailHtml(title, pdfUrl);
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
    {
      method: 'put',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify({ html: html }),
    }
  );

  return campaignId;
}

/**
 * Builds the newsletter email HTML.
 */
function buildNewsletterEmailHtml(title, pdfUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
      <h1 style="font-size: 1.5rem; color: #231f20;">Building Baja's Future</h1>
      <h2 style="font-size: 1.25rem; color: #231f20;">${title}</h2>
      <p style="color: #6b6563; line-height: 1.6;">
        Our latest newsletter is ready. Click below to read it.
      </p>
      <p style="margin: 2rem 0;">
        <a href="${pdfUrl}" style="background: #d71f2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
          Read Newsletter →
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2ddd7; margin: 2rem 0;">
      <p style="font-size: 0.8rem; color: #9a9392;">
        Building Baja's Future — Scholarships for students in Baja California Sur
      </p>
    </body>
    </html>
  `;
}

/**
 * Sends a preview/test email to the client via Mailchimp's send-test endpoint.
 */
function sendPreviewEmail(campaignId, pdfName, pdfUrl) {
  // Send test via Mailchimp
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/test`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify({
        test_emails: [CONFIG.CLIENT_EMAIL],
        send_type: 'html',
      }),
    }
  );

  // Also send a plain Gmail with OK/STOP instructions
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '📰 Newsletter Ready for Approval: ' + pdfName,
    '',
    {
      htmlBody: `
        <p>A new newsletter is ready to send to subscribers.</p>
        <p><strong>File:</strong> ${pdfName}</p>
        <p><strong>Preview:</strong> <a href="${pdfUrl}">View PDF</a></p>
        <p>You should also receive a preview email showing how it will look to subscribers.</p>
        <hr>
        <p><strong>Reply to this email with:</strong></p>
        <ul>
          <li><strong>OK</strong> — to send the newsletter to all subscribers</li>
          <li><strong>STOP</strong> — to cancel (the newsletter will not be sent)</li>
        </ul>
        <p>If you don't reply, you'll get a reminder in 72 hours.</p>
      `,
      name: CONFIG.EMAIL_FROM_NAME,
    }
  );
}

/**
 * Sends the campaign via Mailchimp API.
 */
function sendCampaign(campaignId) {
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`,
    {
      method: 'post',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
    }
  );
}

/**
 * Deletes a Mailchimp draft campaign.
 */
function deleteMailchimpDraft(campaignId) {
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}`,
    {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
    }
  );
}

/**
 * Deletes the currently pending Mailchimp draft, if any.
 */
function deletePendingMailchimpDraft() {
  const props = PropertiesService.getScriptProperties();
  const campaignId = props.getProperty('pending_campaign_id');
  if (campaignId) {
    try {
      deleteMailchimpDraft(campaignId);
    } catch (e) {
      Logger.log('Could not delete draft: ' + e.message);
    }
    props.deleteProperty('pending_campaign_id');
    props.deleteProperty('pending_pdf_name');
    props.deleteProperty('pending_timestamp');
  }
}

// ── Helpers ──

function getOrCreateSubfolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}
```

- [ ] **Step 4: Create EmailHandler.gs — OK/STOP reply processor**

Create `apps-script/newsletter/EmailHandler.gs`:

```javascript
/**
 * Gmail trigger — runs on a time-driven trigger (every 5 minutes).
 * Checks for OK/STOP replies from the client.
 */
function checkForReply() {
  const props = PropertiesService.getScriptProperties();
  const campaignId = props.getProperty('pending_campaign_id');
  if (!campaignId) return; // No pending newsletter

  // Search for recent replies from the client
  const threads = GmailApp.search(
    `from:${CONFIG.CLIENT_EMAIL} subject:"Newsletter Ready for Approval" newer_than:7d`,
    0, 10
  );

  for (const thread of threads) {
    const messages = thread.getMessages();
    // Check the latest reply (last message in thread)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.getFrom().includes(CONFIG.CLIENT_EMAIL) && !msg.isInTrash()) {
        const body = msg.getPlainBody().trim().toUpperCase();

        if (body.startsWith('OK')) {
          handleApproval(campaignId);
          return;
        }

        if (body.startsWith('STOP')) {
          handleRejection(campaignId);
          return;
        }
      }
    }
  }

  // Check if reminder is due
  checkReminder();
}

function handleApproval(campaignId) {
  const props = PropertiesService.getScriptProperties();
  const pdfName = props.getProperty('pending_pdf_name');

  // Send the campaign
  sendCampaign(campaignId);

  // Move PDF to /sent/
  movePendingPdf('sent');

  // Clear state
  props.deleteProperty('pending_campaign_id');
  props.deleteProperty('pending_pdf_name');
  props.deleteProperty('pending_timestamp');
  props.deleteProperty('last_reminder_sent');

  // Notify
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '✅ Newsletter Sent: ' + pdfName,
    'The newsletter "' + pdfName + '" has been sent to all subscribers.',
    { name: CONFIG.EMAIL_FROM_NAME }
  );

  Logger.log('Newsletter sent: ' + pdfName);
}

function handleRejection(campaignId) {
  const props = PropertiesService.getScriptProperties();
  const pdfName = props.getProperty('pending_pdf_name');

  // Delete Mailchimp draft
  deleteMailchimpDraft(campaignId);

  // Move PDF to /rejected/
  movePendingPdf('rejected');

  // Clear state
  props.deleteProperty('pending_campaign_id');
  props.deleteProperty('pending_pdf_name');
  props.deleteProperty('pending_timestamp');
  props.deleteProperty('last_reminder_sent');

  // Notify
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '🚫 Newsletter Cancelled: ' + pdfName,
    'The newsletter "' + pdfName + '" has been cancelled and will not be sent.',
    { name: CONFIG.EMAIL_FROM_NAME }
  );

  Logger.log('Newsletter rejected: ' + pdfName);
}

function checkReminder() {
  const props = PropertiesService.getScriptProperties();
  const lastReminder = props.getProperty('last_reminder_sent');
  const pendingTimestamp = props.getProperty('pending_timestamp');
  const pdfName = props.getProperty('pending_pdf_name');

  if (!pendingTimestamp || !pdfName) return;

  const lastCheck = lastReminder ? new Date(lastReminder) : new Date(pendingTimestamp);
  const hoursSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);

  if (hoursSince >= CONFIG.REMINDER_INTERVAL_HOURS) {
    GmailApp.sendEmail(
      CONFIG.CLIENT_EMAIL,
      '⏰ Reminder: Newsletter Awaiting Approval — ' + pdfName,
      '',
      {
        htmlBody: `
          <p>You have a newsletter waiting for your approval: <strong>${pdfName}</strong></p>
          <p>Reply <strong>OK</strong> to send it to subscribers, or <strong>STOP</strong> to cancel.</p>
        `,
        name: CONFIG.EMAIL_FROM_NAME,
      }
    );

    props.setProperty('last_reminder_sent', new Date().toISOString());
    Logger.log('Reminder sent for: ' + pdfName);
  }
}

function movePendingPdf(targetFolderName) {
  const rootFolder = DriveApp.getFolderById(CONFIG.NEWSLETTER_ROOT_FOLDER_ID);
  const pendingFolder = getOrCreateSubfolder(rootFolder, 'pending');
  const targetFolder = getOrCreateSubfolder(rootFolder, targetFolderName);

  const files = pendingFolder.getFiles();
  while (files.hasNext()) {
    files.next().moveTo(targetFolder);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps-script/newsletter/
git commit -m "feat: Google Apps Script newsletter automation — Drive watcher, Mailchimp, OK/STOP replies"
```

---

### Task 18: Google Apps Script — auto-deploy on sheet edit

Apps Script that triggers a Netlify build when the Google Sheet is edited.

**Files:**
- Create: `apps-script/deploy-trigger/Code.gs`
- Create: `apps-script/deploy-trigger/appsscript.json`

- [ ] **Step 1: Create manifest**

Create `apps-script/deploy-trigger/appsscript.json`:

```json
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "exceptionLogging": "STACKDRIVER"
}
```

- [ ] **Step 2: Create Code.gs**

Create `apps-script/deploy-trigger/Code.gs`:

```javascript
/**
 * Bound to the Google Sheet as an "on edit" trigger.
 * Triggers a Netlify build when the Scholars or Stats tab is edited.
 *
 * SETUP:
 * 1. Open the Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Set NETLIFY_BUILD_HOOK_URL below
 * 5. Triggers → Add Trigger → onEdit → From spreadsheet → On edit
 */

const NETLIFY_BUILD_HOOK_URL = 'YOUR_NETLIFY_BUILD_HOOK_URL';

// Debounce: don't trigger more than once per 5 minutes
const DEBOUNCE_MINUTES = 5;

function onSheetEdit(e) {
  const sheet = e.source.getActiveSheet();
  const name = sheet.getName();

  // Only trigger for Scholars or Stats tabs
  if (name !== 'Scholars' && name !== 'Stats') return;

  // Debounce — check last trigger time
  const props = PropertiesService.getScriptProperties();
  const lastTrigger = props.getProperty('last_build_trigger');
  if (lastTrigger) {
    const elapsed = (Date.now() - parseInt(lastTrigger)) / (1000 * 60);
    if (elapsed < DEBOUNCE_MINUTES) {
      Logger.log('Debounced — last build triggered ' + Math.round(elapsed) + 'm ago');
      return;
    }
  }

  // Trigger Netlify build
  try {
    UrlFetchApp.fetch(NETLIFY_BUILD_HOOK_URL, { method: 'post' });
    props.setProperty('last_build_trigger', Date.now().toString());
    Logger.log('Netlify build triggered by edit to ' + name + ' tab');
  } catch (err) {
    Logger.log('Failed to trigger build: ' + err.message);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps-script/deploy-trigger/
git commit -m "feat: Apps Script deploy trigger — Netlify build on sheet edit with debounce"
```

---

## Phase 6: Address Audit & Migration Prep

### Task 19: Audit and update all addresses

Grep for any address references and ensure they're entity-aware.

**Files:**
- Modify: `src/i18n/ui.ts` (if needed)
- Modify: `copy.md` (if needed)

- [ ] **Step 1: Search for all address references**

```bash
grep -rn "378\|West Ave\|Ave 45\|Los Angeles\|90042\|Hamlin\|Van Nuys\|Pedernal\|Pedregal\|23453\|91411" src/ copy.md
```

- [ ] **Step 2: Fix any incorrect addresses**

Ensure all EN address references point to: `15139 Hamlin St., Van Nuys, CA, 91411. USA.`
Ensure all ES address references point to: `Camino del Pedernal 160, Fraccionamiento Pedregal, Cabo San Lucas, Los Cabos, Baja California Sur, México. C.P. 23453`

Update any keys in `src/i18n/ui.ts` that still reference the old LA address. Also check `donate.check.text` keys for "send checks to" instructions.

- [ ] **Step 3: Run the copy sync script**

```bash
node scripts/ui-to-copy.mjs
```

Verify copy.md reflects the correct addresses.

- [ ] **Step 4: Verify build**

```bash
npx astro build
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ui.ts copy.md
git commit -m "fix: audit and update all addresses — EN=Van Nuys, ES=Cabo San Lucas"
```

---

### Task 20: Create client onboarding documentation

Non-technical guides for the client explaining how to update content.

**Files:**
- Create: `docs/client-guide/updating-scholars.md`
- Create: `docs/client-guide/uploading-newsletters.md`

- [ ] **Step 1: Create scholar update guide**

Create `docs/client-guide/updating-scholars.md`:

```markdown
# How to Update Scholar Information

## What You Need
- A web browser (Chrome, Edge, or Safari)
- Access to the BBF Scholars Google Sheet (you'll receive an invitation link)

## Adding a New Scholar

1. Open the Google Sheet
2. Go to the **Scholars** tab at the bottom
3. Add a new row at the bottom with:
   - **Name** — Full name of the scholar
   - **University** — Full university name (no abbreviations)
   - **Degree** — Full degree name (no abbreviations)
   - **Status** — Type exactly: `Active` or `Graduated`
   - **Cohort Year** — The year they joined (e.g., 2026)
   - **Photo Filename** — (Optional) If you uploaded a photo to the Photos folder, type the exact filename here (e.g., `juan-perez.jpg`)

4. The website will update automatically within a few minutes.

## Updating Existing Scholars

1. Find the scholar's row in the sheet
2. Edit the cell you want to change
3. The website will update automatically.

## Updating the Numbers (Stats)

1. Go to the **Stats** tab at the bottom of the sheet
2. You'll see rows like:
   - `scholars_count` → `650`
   - `years_of_impact` → `20`
   - `graduates_count` → `200`
3. Change the number in the second column
4. The website will update automatically.

## Adding Scholar Photos

1. Open the **BBF Scholar Photos** folder in Google Drive
2. Drag and drop the photo file into the folder
3. Name the file to match the scholar (e.g., `juan-perez.jpg`)
4. In the Google Sheet, add the filename to the scholar's **Photo Filename** column
5. The website will update automatically.

## Important
- Do NOT delete or rename the column headers (first row)
- Do NOT add extra tabs or change tab names
- If something looks wrong, contact Jose
```

- [ ] **Step 2: Create newsletter guide**

Create `docs/client-guide/uploading-newsletters.md`:

```markdown
# How to Send a Newsletter

## What You Need
- Your newsletter saved as a PDF file
- Access to the **BBF Newsletters** Google Drive folder

## Sending a Newsletter

1. Save your newsletter as a PDF
2. Open the **BBF Newsletters** folder in Google Drive
3. Drag and drop the PDF into the folder
4. **Wait** — within 1 hour, you'll receive a preview email
5. Check the preview email to make sure it looks right
6. **Reply to the email** with one word:
   - **OK** — to send the newsletter to all subscribers
   - **STOP** — to cancel (the newsletter will NOT be sent)

## What Happens Next

- If you reply **OK**: The newsletter is sent to all subscribers. You'll receive a confirmation email.
- If you reply **STOP**: The newsletter is cancelled. Nothing is sent. You'll receive a confirmation.
- If you don't reply: You'll get a reminder email every 3 days until you reply.

## Changing Your Mind

Uploaded the wrong file? Just drop the correct PDF into the folder. The old one is automatically replaced — you'll get a new preview email for the new file.

## Important

⚠️ **Only ONE person should upload newsletters.** If two people upload at the same time, one file will replace the other. Decide who is responsible for uploading and stick with that person.

## Questions?
Contact Jose.
```

- [ ] **Step 3: Commit**

```bash
git add -f docs/client-guide/
git commit -m "docs: client onboarding guides for scholars and newsletter management"
```

---

## Phase 7: Final Verification

### Task 21: Full build verification and cleanup

Verify everything builds, no broken links, no stale references.

- [ ] **Step 1: Full production build**

```bash
npx astro build
```

Expected: Clean build with no errors.

- [ ] **Step 2: Check for stale blog references**

```bash
grep -rn "blog" src/components/ src/pages/ src/i18n/ui.ts
```

Remove any remaining blog references.

- [ ] **Step 3: Preview the built site**

```bash
npx astro preview
```

Manually check:
- [ ] EN home: hero, animated stats, programs, CTA
- [ ] ES home: compact intro, BCS callout, stats, benefits, apply steps
- [ ] Nav: different links per language, donate always visible, fixed on scroll
- [ ] Footer: bilingual sitemap, correct addresses per language
- [ ] Scholar grid: cards with thumbnail, filters work
- [ ] Newsletter pages: empty state, subscribe form
- [ ] Language toggle: shared pages swap, exclusive pages go to homepage
- [ ] Theme toggle: light/dark both work
- [ ] `prefers-reduced-motion`: stats show final numbers, no animation

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: cleanup from full build verification"
```
