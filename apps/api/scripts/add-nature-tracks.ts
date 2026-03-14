/**
 * add-nature-tracks.ts
 * 새로 추가된 nature 음원을 DB에 등록
 *
 * 사용법:
 *   cd apps/api
 *   npx ts-node scripts/add-nature-tracks.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const R2 = (process.env.R2_PUBLIC_URL ?? 'https://pub-8f77d41ed9f34a6fba845e009f7574bd.r2.dev').replace(/\/$/, '');
const P = (seed: string) => `https://picsum.photos/seed/${seed}/400/260`;

async function main() {
  console.log('Adding nature tracks to DB...\n');

  const tracks = [
    {
      id: 'en-nature-forest-01',
      title: 'Morning Mist in the Forest',
      titleKo: '숲속 아침 안개',
      type: 'nature', emotion: 'tired', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-forest-01.mp3`,
      imageUrl: P('forest-morning-mist-21'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-forest-02',
      title: 'Deep Forest Sounds',
      titleKo: '깊은 숲소리',
      type: 'nature', emotion: 'stressed', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-forest-02.mp3`,
      imageUrl: P('deep-forest-canopy-23'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-forest-03',
      title: 'Forest Birdsong',
      titleKo: '숲속 새소리',
      type: 'nature', emotion: 'anxious', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-forest-03.mp3`,
      imageUrl: P('birdsong-green-grove-24'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-forest-04',
      title: 'Forest Stream',
      titleKo: '숲속 시냇물',
      type: 'nature', emotion: 'tired', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-forest-04.mp3`,
      imageUrl: P('forest-stream-mossy-25'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-rain-02',
      title: 'Gentle Rain',
      titleKo: '잔잔한 빗소리',
      type: 'nature', emotion: 'stressed', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-rain-02.mp3`,
      imageUrl: P('gentle-rain-window-26'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-rain-03',
      title: 'Thunderstorm Calm',
      titleKo: '천둥 빗소리',
      type: 'nature', emotion: 'anxious', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-rain-03.mp3`,
      imageUrl: P('thunderstorm-dark-sky-27'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-rain-04',
      title: 'Rain on Leaves',
      titleKo: '나뭇잎 빗소리',
      type: 'nature', emotion: 'tired', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-rain-04.mp3`,
      imageUrl: P('rain-leaves-close-28'), weekCreated: '2026-W10',
    },
    {
      id: 'en-nature-ambient-01',
      title: 'Ambient Incantations',
      titleKo: '앰비언트 자연음',
      type: 'nature', emotion: 'anxious', lang: 'en', duration: 300,
      audioUrl: `${R2}/tracks/en-nature-ambient-01.mp3`,
      imageUrl: P('ambient-nature-glow-22'), weekCreated: '2026-W10',
    },
  ];

  for (const track of tracks) {
    await prisma.meditationTrack.upsert({
      where: { id: track.id },
      update: { audioUrl: track.audioUrl },
      create: { ...track, musicUrl: '' },
    });
    console.log(`  OK  ${track.id} → ${track.audioUrl}`);
  }

  console.log('\nDone.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
