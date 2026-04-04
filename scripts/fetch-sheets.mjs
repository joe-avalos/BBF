import { google } from 'googleapis';
import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) {
  console.warn('⚠ GOOGLE_SHEET_ID not set — skipping sheet fetch, using existing content');
  process.exit(0);
}

const SCHOLARS_DIR = join(process.cwd(), 'src/content/scholars');
const STATS_PATH = join(process.cwd(), 'src/data/stats.json');

async function getSheets() {
  if (process.env.GOOGLE_API_KEY) {
    return google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY });
  }
  return google.sheets({ version: 'v4' });
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

  if (existsSync(SCHOLARS_DIR)) {
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
    const photo = photoFilename ? `/scholars/${photoFilename}` : '';

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

  const [, ...data] = rows;
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
