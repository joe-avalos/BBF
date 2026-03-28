#!/usr/bin/env node
/**
 * copy-to-ui.mjs — Apply copy.md → src/i18n/ui.ts
 *
 * Reads copy.md, extracts all EN/ES key-value pairs,
 * and regenerates ui.ts with the updated values.
 *
 * Usage: node scripts/copy-to-ui.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const copyPath = join(root, 'copy.md');
const uiPath = join(root, 'src', 'i18n', 'ui.ts');

// Parse copy.md
const md = readFileSync(copyPath, 'utf-8');
const en = {};
const es = {};

// Match pattern: **key.name** (optional — ENTITY-AWARE or other notes)
// - EN: "value"
// - ES: "value"
const keyRegex = /^\*\*([a-zA-Z0-9_.]+)\*\*/;
const enRegex = /^- EN: "(.+)"$/;
const esRegex = /^- ES: "(.+)"$/;

const lines = md.split('\n');
let currentKey = null;

for (const line of lines) {
  const trimmed = line.trim();

  const keyMatch = trimmed.match(keyRegex);
  if (keyMatch) {
    currentKey = keyMatch[1];
    continue;
  }

  if (currentKey) {
    const enMatch = trimmed.match(enRegex);
    if (enMatch) {
      // Restore literal escape sequences that exist in the TS source
      en[currentKey] = enMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      continue;
    }

    const esMatch = trimmed.match(esRegex);
    if (esMatch) {
      es[currentKey] = esMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      currentKey = null; // Done with this key
      continue;
    }

    // Skip note lines, blank lines within a key block
    if (trimmed.startsWith('- Note:') || trimmed === '') {
      continue;
    }

    // If we hit a non-matching line that isn't a note or blank, reset
    if (trimmed.startsWith('##') || trimmed.startsWith('---') || trimmed.startsWith('>')) {
      currentKey = null;
    }
  }
}

// Validate
const enKeys = Object.keys(en).sort();
const esKeys = Object.keys(es).sort();

const missingInEs = enKeys.filter(k => !es[k]);
const missingInEn = esKeys.filter(k => !en[k]);

if (missingInEs.length) {
  console.warn(`⚠ Keys in EN but missing in ES: ${missingInEs.join(', ')}`);
}
if (missingInEn.length) {
  console.warn(`⚠ Keys in ES but missing in EN: ${missingInEn.join(', ')}`);
}

console.log(`Parsed ${enKeys.length} EN keys, ${esKeys.length} ES keys from copy.md`);

// Read existing ui.ts to preserve key ordering and comments
const existingUi = readFileSync(uiPath, 'utf-8');

// Strategy: Replace values in the existing file rather than regenerating from scratch.
// This preserves comments, formatting, and key ordering.
let output = existingUi;

function escapeForTs(val) {
  // Determine if original used double or single quotes by checking the file
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Track which keys were updated
let updatedCount = 0;

// For each key, find and replace its value in the file
// We need to handle both the EN section and ES section separately.
// The file structure is: en: { ... }, es: { ... }

// Split file into EN and ES sections
const esStartMatch = existingUi.match(/\n\s*es:\s*\{/);
if (!esStartMatch) {
  console.error('Could not find es: { section in ui.ts');
  process.exit(1);
}
const esSplitIndex = esStartMatch.index;
let enSection = existingUi.slice(0, esSplitIndex);
let esSection = existingUi.slice(esSplitIndex);

function replaceValue(section, key, newValue) {
  // Match: 'key.name': 'value' or 'key.name': "value"
  // Handle multi-line isn't needed since all values are single-line strings in this file
  const escaped = key.replace(/\./g, '\\.');

  // Try single-quoted pattern first
  const singleQuotePattern = new RegExp(
    `'${escaped}':\\s*'((?:[^'\\\\]|\\\\.)*)'`,
    'g'
  );
  const doubleQuotePattern = new RegExp(
    `'${escaped}':\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    'g'
  );

  let replaced = false;
  const escapedSingle = newValue.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/'/g, "\\'");
  const escapedDouble = newValue.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/"/g, '\\"');

  // Try single quotes
  if (singleQuotePattern.test(section)) {
    singleQuotePattern.lastIndex = 0;
    section = section.replace(singleQuotePattern, `'${key}': '${escapedSingle}'`);
    replaced = true;
  }

  // Try double quotes
  if (!replaced && doubleQuotePattern.test(section)) {
    doubleQuotePattern.lastIndex = 0;
    section = section.replace(doubleQuotePattern, `'${key}': "${escapedDouble}"`);
    replaced = true;
  }

  return { section, replaced };
}

// Apply EN updates
for (const [key, value] of Object.entries(en)) {
  const result = replaceValue(enSection, key, value);
  if (result.replaced) {
    enSection = result.section;
    updatedCount++;
  } else {
    console.warn(`⚠ Could not find EN key '${key}' in ui.ts to update`);
  }
}

// Apply ES updates
for (const [key, value] of Object.entries(es)) {
  const result = replaceValue(esSection, key, value);
  if (result.replaced) {
    esSection = result.section;
    updatedCount++;
  } else {
    console.warn(`⚠ Could not find ES key '${key}' in ui.ts to update`);
  }
}

output = enSection + esSection;

writeFileSync(uiPath, output, 'utf-8');
console.log(`✓ Updated ${updatedCount} values in src/i18n/ui.ts`);
console.log('Run `npx astro build` to verify.');
