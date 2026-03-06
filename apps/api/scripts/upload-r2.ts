/**
 * upload-r2.ts
 * Cloudflare R2에 audio 폴더의 mp3 파일 업로드
 *
 * 사전 준비:
 *   1. Cloudflare 대시보드 → R2 → 버킷 생성 (예: zenny-audio)
 *   2. R2 API 토큰 생성 (Object Read & Write 권한)
 *   3. 아래 .env 항목 추가:
 *      R2_ACCOUNT_ID=your_account_id
 *      R2_ACCESS_KEY_ID=your_access_key
 *      R2_SECRET_ACCESS_KEY=your_secret_key
 *      R2_BUCKET_NAME=zenny-audio
 *      R2_PUBLIC_URL=https://cdn.zenny.app  (R2 커스텀 도메인)
 *
 * 사용법:
 *   cd apps/api
 *   npm install @aws-sdk/client-s3   (최초 1회)
 *   npx ts-node scripts/upload-r2.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';

const ACCOUNT_ID    = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY    = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY    = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET        = process.env.R2_BUCKET_NAME ?? 'zenny-audio';
const PUBLIC_URL    = (process.env.R2_PUBLIC_URL ?? 'https://cdn.zenny.app').replace(/\/$/, '');
const AUDIO_DIR     = path.join(__dirname, '..', 'audio');

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) {
  console.error('Missing R2 env vars. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function upload() {
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
  if (files.length === 0) {
    console.error('No mp3 files found in audio/. Run generate-audio.ts first.');
    process.exit(1);
  }

  console.log(`Uploading ${files.length} files to R2 bucket: ${BUCKET}\n`);

  const results: Array<{ id: string; url: string }> = [];

  for (const file of files) {
    const key = `tracks/${file}`;
    const exists = await fileExistsInR2(key);
    if (exists) {
      const url = `${PUBLIC_URL}/${key}`;
      console.log(`  SKIP  ${file} (already in R2)`);
      results.push({ id: file.replace('.mp3', ''), url });
      continue;
    }

    process.stdout.write(`  UP    ${file}... `);
    const body = fs.readFileSync(path.join(AUDIO_DIR, file));
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000',
    }));
    const url = `${PUBLIC_URL}/${key}`;
    console.log(`done → ${url}`);
    results.push({ id: file.replace('.mp3', ''), url });
  }

  // URL 목록 파일로 저장 (update-audio-urls.ts에서 사용)
  const out = path.join(__dirname, '..', 'audio', '_uploaded-urls.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\nURL list saved to: ${out}`);
  console.log('Next step: npx ts-node scripts/update-audio-urls.ts');
}

upload().catch(console.error);
