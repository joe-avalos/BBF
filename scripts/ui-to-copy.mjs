#!/usr/bin/env node
/**
 * ui-to-copy.mjs — Generate copy.md from src/i18n/ui.ts
 *
 * Reads ui.ts, extracts all EN/ES key-value pairs,
 * and writes a consolidated bilingual copy.md file.
 *
 * Usage: node scripts/ui-to-copy.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const uiPath = join(root, 'src', 'i18n', 'ui.ts');
const copyPath = join(root, 'copy.md');

const src = readFileSync(uiPath, 'utf-8');

// Extract EN and ES key-value pairs
function extractKeys(section) {
  const map = {};
  // Match 'key.name': 'value' or 'key.name': "value"
  const regex = /'([a-zA-Z0-9_.]+)':\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
  let match;
  while ((match = regex.exec(section)) !== null) {
    const key = match[1];
    const val = (match[2] ?? match[3])
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    map[key] = val;
  }
  return map;
}

// Split into EN and ES sections
const esSplit = src.match(/\n\s*es:\s*\{/);
if (!esSplit) {
  console.error('Could not find es: { in ui.ts');
  process.exit(1);
}

const enSection = src.slice(0, esSplit.index);
const esSection = src.slice(esSplit.index);

const en = extractKeys(enSection);
const es = extractKeys(esSection);

// Keys that intentionally differ in meaning (not just translation)
const entityAwareKeys = new Set([
  'footer.entityName',
  'footer.address.line1',
  'footer.address.line2',
  'footer.legal',
  'cta.trust',
  'meta.description',
  'donate.check.text',
]);

const entityNotes = {
  'footer.entityName': 'EN refers to the US 501(c)(3) entity; ES refers to the Mexican Asociación Civil.',
  'footer.address.line1': 'EN shows the US mailing address; ES shows the Mexico office address.',
  'footer.address.line2': 'EN shows LA, CA; ES shows Cabo San Lucas, BCS.',
  'footer.legal': 'EN states 501(c)(3) tax-deductible status; ES states Asociación Civil status.',
  'cta.trust': 'EN references 501(c)(3); ES references Asociación Civil Autorizada.',
  'meta.description': 'EN says "nonprofit organization"; ES says "Asociación Civil".',
  'donate.check.text': 'ES clarifies check goes to BBF USA.',
};

// Section groupings — map key prefixes to page sections
const sections = [
  { title: 'Shared (Header / Navigation)', prefix: 'nav.', note: 'Present on all pages — edit once applies everywhere' },
  { title: 'Shared (Footer)', prefix: 'footer.', note: 'Present on all pages — edit once applies everywhere' },
  { title: 'Shared (CTA Strip)', prefix: 'cta.', note: 'Donation call-to-action — appears on multiple pages' },
  { title: 'Shared (Newsletter)', prefix: 'newsletter.', note: 'Newsletter signup section' },
  { title: 'Shared (Theme / Language)', prefix: 'theme.|lang.', note: 'UI controls' },
  { title: 'Shared (Meta / SEO)', prefix: 'meta.|motto', note: 'Page metadata and brand motto' },
  { title: 'Shared (Impact Quote)', prefix: 'quote.', note: 'Quote section on home page' },
  { title: 'Home Page — Hero', prefix: 'hero.', note: 'Hero section at top of home page' },
  { title: 'Home Page — Stats', prefix: 'stats.', note: 'Impact statistics counters' },
  { title: 'Home Page — Mission', prefix: 'mission.', note: 'Mission section' },
  { title: 'Home Page — Programs', prefix: 'programs.', note: 'Three program cards' },
  { title: 'Our Story — Page Header & Timeline', prefix: 'story.eyebrow|story.title|story.subtitle|story.timeline|story.2006|story.2008|story.2012|story.today', note: '' },
  { title: 'Our Story — Purpose & Foundations', prefix: 'story.purpose.', note: 'Objective, Mission, Vision, Goal' },
  { title: 'Our Story — Three Pillars', prefix: 'story.pillars.|story.pillar1.|story.pillar2.|story.pillar3.', note: 'BBF Tree of Life framework' },
  { title: 'Our Story — Tree of Life (Support Areas)', prefix: 'story.tree.', note: 'Individual support area cards' },
  { title: 'Our Story — Logo', prefix: 'story.logo.', note: 'Logo meaning section' },
  { title: 'Our Story — Board & Staff', prefix: 'story.board.|story.staff.|story.reports.', note: 'Leadership, team, and reports' },
  { title: 'How We Help — Page Header & Intro', prefix: 'help.eyebrow|help.title|help.subtitle|help.free', note: '' },
  { title: 'How We Help — Pillar Headers', prefix: 'help.pillar', note: 'Section headers for each pillar' },
  { title: 'How We Help — Programs', prefix: 'help.program', note: '14 programs under 3 pillars' },
  { title: 'How We Help — CTA', prefix: 'help.cta.', note: 'Call to action at bottom' },
  { title: 'Scholars Page', prefix: 'scholars.', note: 'Scholar grid and filters' },
  { title: 'How to Apply — Page Header', prefix: 'apply.eyebrow|apply.title|apply.subtitle', note: '' },
  { title: 'How to Apply — Annual Call', prefix: 'apply.call.', note: '' },
  { title: 'How to Apply — Applicant Profile', prefix: 'apply.profile.', note: '' },
  { title: 'How to Apply — Eligibility', prefix: 'apply.req', note: 'Requirements to be eligible' },
  { title: 'How to Apply — Selection Criteria', prefix: 'apply.criteria', note: '7 evaluation criteria' },
  { title: 'How to Apply — Application Steps', prefix: 'apply.steps.|apply.step|apply.download', note: '7 steps including essays' },
  { title: 'How to Apply — Required Essays', prefix: 'apply.essay', note: 'Two required essays' },
  { title: 'How to Apply — BBF Office', prefix: 'apply.office.', note: 'Address and hours' },
  { title: 'How to Apply — Selection Process', prefix: 'apply.process', note: '6 stages after application' },
  { title: 'How to Apply — Scholar Obligations', prefix: 'apply.obligation', note: '8 requirements to maintain scholarship' },
  { title: 'How to Apply — If Accepted', prefix: 'apply.accepted.', note: 'What the scholarship covers' },
  { title: 'How to Donate', prefix: 'donate.', note: 'Donation page content' },
  { title: 'Friends of BBF', prefix: 'friends.', note: 'Sponsors and community page' },
  { title: 'Blog', prefix: 'blog.', note: 'Blog page — code only, not linked in navigation' },
];

function keyMatchesPrefix(key, prefixStr) {
  const prefixes = prefixStr.split('|');
  return prefixes.some(p => {
    // 'help.pillar' matches 'help.pillar1.title', 'help.pillar2.text', etc.
    return key === p || key.startsWith(p) || key.startsWith(p + '.');
  });
}

// Build output
let out = `# BBF Website Copy — Consolidated EN/ES

> **Single source of truth** for all site text.
> Edit this file, then run \`node scripts/copy-to-ui.mjs\` to apply changes to \`src/i18n/ui.ts\`.
> To regenerate this file from ui.ts: \`node scripts/ui-to-copy.mjs\`

`;

const allEnKeys = Object.keys(en);
const usedKeys = new Set();

for (const section of sections) {
  const sectionKeys = allEnKeys.filter(k => {
    if (usedKeys.has(k)) return false;
    return keyMatchesPrefix(k, section.prefix);
  });

  if (sectionKeys.length === 0) continue;

  sectionKeys.forEach(k => usedKeys.add(k));

  out += `---\n\n## ${section.title}\n`;
  if (section.note) out += `> ${section.note}\n`;
  out += '\n';

  for (const key of sectionKeys) {
    const isEntityAware = entityAwareKeys.has(key);
    out += `**${key}**${isEntityAware ? ' — ENTITY-AWARE' : ''}\n`;
    out += `- EN: "${en[key] ?? ''}"\n`;
    out += `- ES: "${es[key] ?? ''}"\n`;
    if (isEntityAware && entityNotes[key]) {
      out += `- Note: ${entityNotes[key]}\n`;
    }
    out += '\n';
  }
}

// Catch any keys not matched by sections
const unmatchedKeys = allEnKeys.filter(k => !usedKeys.has(k));
if (unmatchedKeys.length) {
  out += `---\n\n## Uncategorized\n\n`;
  for (const key of unmatchedKeys) {
    out += `**${key}**\n`;
    out += `- EN: "${en[key] ?? ''}"\n`;
    out += `- ES: "${es[key] ?? ''}"\n\n`;
  }
}

writeFileSync(copyPath, out, 'utf-8');
console.log(`✓ Generated copy.md with ${allEnKeys.length} keys`);
console.log(`  ${sections.length} sections, ${unmatchedKeys.length} uncategorized`);
