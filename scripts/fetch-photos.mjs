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
const THUMB_SIZE = 300;

async function main() {
  const drive = google.drive({ version: 'v3' });

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
