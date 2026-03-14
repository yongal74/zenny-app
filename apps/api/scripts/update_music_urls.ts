/**
 * update_music_urls.ts — archive.org CC0 ambient music으로 DB 업데이트
 *
 * 사용법:
 *   cd apps/api && npx ts-node scripts/update_music_urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CC0 free ambient tracks from archive.org
const MUSIC: Record<string, string> = {
  'calm-focus':   'https://archive.org/download/CalmPills/Uplifting_Pills_-_Calm_Pill_1_-_Still_Habitat.mp3',
  'soft-rain':    'https://archive.org/download/relaxingrainsounds/Light%20Gentle%20Rain%20Part%201.mp3',
  'deep-breath':  'https://archive.org/download/CalmPills/Uplifting_Pills_-_Calm_Pill_33_-_Stasis.mp3',
  'deep-calm':    'https://archive.org/download/CalmPills/Uplifting_Pills_-_Calm_Pill_56_-_Quiet_Peace.mp3',
  'forest-rain':  'https://archive.org/download/relaxingrainsounds/Rainforest%20Part%201.mp3',
  'ocean-calm':   'https://archive.org/download/relaxingsounds/Waves%203%2010h%20Night%20Beach-Gentle%2C%20NO%20GULLS.mp3',
  'warm-glow':    'https://archive.org/download/ZenMeditationMusicSoothingMusicRelaxingMusicMeditationZenBinauralBeats3236/Healing%20And%20Relaxing%20Music%20For%20Meditation%20%28Harp%2009%29%20-%20Pablo%20Arellano.mp3',
  'zen-bells':    'https://archive.org/download/singingbowlmeditation/Singing%20Bowl%20Meditation.mp3',
  'morning-light':'https://archive.org/download/CalmPills/Uplifting_Pills_-_Calm_Pill_46_-_Morning_Dew.mp3',
  'bright-joy':   'https://archive.org/download/CalmPills/Uplifting_Pills_-_Calm_Pill_59_-_Chance_for_Splendor.mp3',
};

// trackId → music key 매핑
const TRACK_MUSIC: Record<string, string> = {
  'en-breath-box-01':       MUSIC['calm-focus'],
  'en-breath-478-01':       MUSIC['soft-rain'],
  'en-breath-pranayama-01': MUSIC['deep-breath'],
  'en-body-scan-01':        MUSIC['deep-calm'],
  'en-nature-rain-01':      MUSIC['forest-rain'],
  'en-nature-ocean-01':     MUSIC['ocean-calm'],
  'en-guided-love-01':      MUSIC['warm-glow'],
  'en-guided-zen-01':       MUSIC['zen-bells'],
  'en-guided-stoic-01':     MUSIC['morning-light'],
  'en-guided-gratitude-01': MUSIC['bright-joy'],
  'ko-breath-box-01':       MUSIC['calm-focus'],
  'ko-breath-478-01':       MUSIC['soft-rain'],
  'ko-breath-pranayama-01': MUSIC['deep-breath'],
  'ko-body-scan-01':        MUSIC['deep-calm'],
  'ko-nature-rain-01':      MUSIC['forest-rain'],
  'ko-nature-ocean-01':     MUSIC['ocean-calm'],
  'ko-guided-love-01':      MUSIC['warm-glow'],
  'ko-guided-zen-01':       MUSIC['zen-bells'],
  'ko-guided-cbt-01':       MUSIC['morning-light'],
  'ko-guided-gratitude-01': MUSIC['bright-joy'],
};

async function main() {
  console.log('🎵 Updating meditation track musicUrls...\n');
  let ok = 0; let skip = 0;

  for (const [trackId, musicUrl] of Object.entries(TRACK_MUSIC)) {
    const result = await prisma.meditationTrack.updateMany({
      where: { id: trackId },
      data: { musicUrl },
    });
    if (result.count > 0) {
      const fileName = decodeURIComponent(musicUrl.split('/').pop() ?? '').slice(0, 40);
      console.log(`  ✅ ${trackId.padEnd(28)} → ${fileName}`);
      ok++;
    } else {
      console.log(`  ⚠️  ${trackId} — not found in DB`);
      skip++;
    }
  }

  console.log(`\n🎵 Done. Updated: ${ok}  Skipped: ${skip}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
