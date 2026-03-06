/**
 * update-audio-urls.ts
 * R2 업로드 후 DB의 audioUrl을 실제 CDN URL로 업데이트
 *
 * 사용법:
 *   cd apps/api
 *   npx ts-node scripts/update-audio-urls.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const URL_FILE = path.join(__dirname, '..', 'audio', '_uploaded-urls.json');

async function main() {
  if (!fs.existsSync(URL_FILE)) {
    console.error('_uploaded-urls.json not found. Run upload-r2.ts first.');
    process.exit(1);
  }

  const urls: Array<{ id: string; url: string }> = JSON.parse(fs.readFileSync(URL_FILE, 'utf-8'));
  console.log(`Updating ${urls.length} tracks in DB...\n`);

  for (const { id, url } of urls) {
    try {
      await prisma.meditationTrack.update({
        where: { id },
        data: { audioUrl: url },
      });
      console.log(`  OK  ${id} → ${url}`);
    } catch (e: any) {
      console.log(`  SKIP ${id} — ${e?.message ?? e}`);
    }
  }

  await prisma.$disconnect();
  console.log('\nDB updated. Audio URLs are now live.');
}

main().catch(console.error);
