/**
 * generate-audio.ts
 * OpenAI TTS로 명상 가이드 & 호흡 & 바디스캔 음성 생성
 *
 * 사용법:
 *   cd apps/api
 *   npx ts-node scripts/generate-audio.ts
 *
 * 생성 파일: apps/api/audio/*.mp3 (16개)
 * 자연음(rain, ocean) 4개는 Pixabay에서 별도 다운로드 필요
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import OpenAI from 'openai';
import * as fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'audio');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── 명상 스크립트 (EN) ────────────────────────────────────────────────────
const SCRIPTS_EN: Record<string, string> = {

  'en-breath-box-01': `
Find a comfortable position and gently close your eyes.
We will practice box breathing together — a technique used by Navy SEALs and neuroscientists to activate your parasympathetic system within minutes.
Breathe in slowly through your nose... one... two... three... four.
Now hold your breath gently... one... two... three... four.
Exhale smoothly through your mouth... one... two... three... four.
Hold the emptiness... one... two... three... four.
Again. Inhale... two... three... four.
Hold... two... three... four.
Exhale... two... three... four.
Rest... two... three... four.
Feel your heart rate slowing. Your mind is becoming clear.
One more round. Breathe in... two... three... four.
Hold with ease... two... three... four.
Release completely... two... three... four.
Rest in stillness... two... three... four.
When you feel ready, gently open your eyes. Carry this calm forward.
  `.trim(),

  'en-breath-478-01': `
Settle into stillness. Let your shoulders drop. Let your jaw unclench.
We are going to practice the four-seven-eight breathing technique, developed by Dr. Andrew Weil to release anxiety within minutes.
Exhale completely through your mouth first. Empty yourself.
Now, inhale through your nose for four counts.
One... two... three... four.
Hold your breath for seven counts.
One... two... three... four... five... six... seven.
Now exhale fully through your mouth for eight counts.
One... two... three... four... five... six... seven... eight.
You have just activated your parasympathetic system. Again.
Inhale... two... three... four.
Hold... two... three... four... five... six... seven.
Exhale slowly... two... three... four... five... six... seven... eight.
Notice the wave of calm moving through your body.
One final round. Breathe in... two... three... four.
Hold the stillness... two... three... four... five... six... seven.
And release everything... two... three... four... five... six... seven... eight.
Rest here. You are safe. You are calm.
  `.trim(),

  'en-breath-pranayama-01': `
Welcome. Sit tall with your spine gently upright. Place your hands softly on your knees.
We will practice Nadi Shodhana — alternate nostril breathing from the ancient Pranayama tradition. This technique balances the left and right hemispheres of the brain.
Using your right hand, bring your index and middle finger to rest between your eyebrows.
Close your right nostril with your right thumb. Inhale slowly through your left nostril... one... two... three... four.
Now close both nostrils. Hold... one... two... three... four.
Release your thumb. Exhale through your right nostril... one... two... three... four.
Inhale through the right... one... two... three... four.
Hold both... one... two... three... four.
Exhale through the left... one... two... three... four.
That is one complete round. Continue this rhythm, breathing with intention.
Feel the balance. Feel the clarity spreading from your mind into your body.
With each breath, you are restoring harmony.
  `.trim(),

  'en-body-scan-01': `
Lie down or sit comfortably. Allow your body to fully relax into the surface beneath you.
Close your eyes and take three deep breaths.
In... and out. In... and out. In... and out.
We begin at the crown of your head. Notice any sensation there — warmth, tingling, or simply the feeling of being alive.
Let your awareness slowly travel down to your forehead. Release any tension in your brow.
Move to your eyes. Let them be soft and heavy behind your closed lids.
Your jaw. Your neck. Let go of everything you have been holding there.
Your shoulders. Drop them away from your ears.
Feel your chest rising and falling with each breath. Your heart beating steadily.
Your belly, rising and falling.
Your lower back. Your hips. Let them sink.
Your legs. Heavy and warm.
Your feet. All the way to your toes.
You are fully here. Fully present. Fully at rest.
Stay in this stillness as long as you need.
  `.trim(),

  'en-guided-love-01': `
Find a comfortable seat. Place one hand over your heart.
We practice Loving-Kindness Meditation — Metta Bhavana — a 2500-year-old Buddhist tradition shown by neuroscience to increase oxytocin, reduce loneliness, and expand compassion.
Begin by breathing warmth into your own heart.
Silently repeat after me.
May I be happy.
May I be peaceful.
May I be free from suffering.
May I be well.
Let these words settle into you. You deserve kindness.
Now bring to mind someone you love. Picture their face.
May you be happy.
May you be peaceful.
May you be free from suffering.
May you be well.
Now expand that circle to all beings, everywhere.
May all beings be happy.
May all beings be peaceful.
May all beings be free from suffering.
May all beings be well.
Feel how large your heart truly is. Rest here.
  `.trim(),

  'en-guided-zen-01': `
Be still.
Zen teaches us that the present moment is the only moment.
Not the past with its regrets. Not the future with its worries. Only now.
Feel the weight of your body. Feel the air against your skin.
Listen to the sounds around you without judging them.
As Shunryu Suzuki wrote — in the beginner's mind there are many possibilities, but in the expert's mind there are few.
Come to this moment with a beginner's mind.
You do not need to achieve anything right now.
You do not need to fix anything right now.
Simply be.
With each exhale, release the need to be anywhere other than here.
With each inhale, welcome this exact moment as it is.
The ancient Zen masters called this Shikantaza — just sitting.
Not sitting toward a goal. Simply sitting.
You are already complete. Nothing is missing.
Rest in this knowing.
  `.trim(),

  'en-guided-stoic-01': `
Marcus Aurelius wrote each morning — you will meet with ingratitude, insolence, disloyalty, ill-will, and selfishness. But these will not harm you if you bring wisdom.
Begin your day with this Stoic reflection.
Take a breath in... and out.
Ask yourself — what is within my control today?
My thoughts. My effort. My responses. My kindness.
What is outside my control?
Others' opinions. Outcomes. The weather of the world.
Breathe in what you can control... and breathe out what you cannot.
Today, you will face obstacles. This is certain.
The Stoics called this the obstacle the way. What blocks your path becomes the path itself.
Breathe in courage... breathe out fear.
Breathe in wisdom... breathe out judgment.
Breathe in equanimity... breathe out urgency.
Set your intention for today. Not for perfection. For virtue.
You are ready.
  `.trim(),

  'en-guided-gratitude-01': `
Close your eyes and take a settling breath.
Gratitude has been shown by psychologists like Martin Seligman to be the single highest-impact practice for wellbeing — rewiring the brain's negativity bias in as little as three weeks.
Let us practice together.
Breathe in... and as you exhale, bring to mind one thing you are grateful for today.
It does not need to be large. Perhaps the warmth of sunlight. A kind word. The fact that you are breathing.
Let the feeling of gratitude expand in your chest.
Now bring to mind a second thing. Something from this week.
A conversation. A meal. A moment of beauty.
Let gratitude fill you.
Now bring to mind a third thing. Something about yourself.
A quality you have. A challenge you navigated. Something you created or offered.
You are worthy of your own gratitude.
Sit with these three things. Let them nourish you.
Carry this fullness into your day.
  `.trim(),
};

// ─── 명상 스크립트 (KO) ────────────────────────────────────────────────────
const SCRIPTS_KO: Record<string, string> = {

  'ko-breath-box-01': `
편안한 자세를 찾아 눈을 부드럽게 감으세요.
박스 호흡을 함께 연습합니다. 이 기법은 부교감 신경을 활성화하여 스트레스를 빠르게 줄여줍니다.
코로 천천히 들이쉬세요. 하나... 둘... 셋... 넷.
부드럽게 멈춥니다. 하나... 둘... 셋... 넷.
입으로 천천히 내쉬세요. 하나... 둘... 셋... 넷.
잠시 쉽니다. 하나... 둘... 셋... 넷.
다시. 들이쉬세요. 둘... 셋... 넷.
멈춥니다. 둘... 셋... 넷.
내쉬세요. 둘... 셋... 넷.
쉽니다. 둘... 셋... 넷.
심장 박동이 느려지는 것을 느껴보세요. 마음이 맑아지고 있습니다.
한 번 더. 들이쉬세요. 둘... 셋... 넷.
편안하게 멈춥니다. 둘... 셋... 넷.
완전히 내쉬세요. 둘... 셋... 넷.
고요함 속에 머뭅니다. 둘... 셋... 넷.
준비가 되면 천천히 눈을 뜨세요. 이 평온함을 가지고 가세요.
  `.trim(),

  'ko-breath-478-01': `
편안히 앉아 어깨를 내려놓으세요. 턱의 긴장을 풀어주세요.
4-7-8 호흡법을 연습합니다. 이 기법은 불안을 빠르게 줄이고 깊은 이완을 유도합니다.
먼저 입으로 완전히 내쉬세요. 비워내세요.
코로 4초 동안 들이쉽니다.
하나... 둘... 셋... 넷.
7초 동안 멈춥니다.
하나... 둘... 셋... 넷... 다섯... 여섯... 일곱.
입으로 8초 동안 내쉽니다.
하나... 둘... 셋... 넷... 다섯... 여섯... 일곱... 여덟.
부교감 신경이 활성화되었습니다. 다시.
들이쉬세요. 둘... 셋... 넷.
멈춥니다. 둘... 셋... 넷... 다섯... 여섯... 일곱.
천천히 내쉬세요. 둘... 셋... 넷... 다섯... 여섯... 일곱... 여덟.
온몸으로 퍼지는 평온의 물결을 느껴보세요.
마지막 한 번. 들이쉬세요. 둘... 셋... 넷.
고요히 멈춥니다. 둘... 셋... 넷... 다섯... 여섯... 일곱.
모든 것을 내려놓으세요. 둘... 셋... 넷... 다섯... 여섯... 일곱... 여덟.
여기 머무르세요. 당신은 안전합니다.
  `.trim(),

  'ko-breath-pranayama-01': `
등을 곧게 세우고 앉으세요. 손을 부드럽게 무릎 위에 올려놓으세요.
나디 쇼다나, 교호 호흡법을 연습합니다. 이 프라나야마 기법은 뇌의 좌우 반구를 균형잡아 줍니다.
오른손 검지와 중지를 미간에 올려놓으세요.
오른쪽 엄지로 오른쪽 콧구멍을 막고, 왼쪽으로 천천히 들이쉽니다. 하나... 둘... 셋... 넷.
양쪽을 모두 막고 멈춥니다. 하나... 둘... 셋... 넷.
엄지를 떼고 오른쪽으로 내쉽니다. 하나... 둘... 셋... 넷.
오른쪽으로 들이쉽니다. 하나... 둘... 셋... 넷.
양쪽을 막고 멈춥니다. 하나... 둘... 셋... 넷.
왼쪽으로 내쉽니다. 하나... 둘... 셋... 넷.
이 리듬으로 계속하세요. 균형을 느껴보세요.
마음과 몸에 조화가 회복되고 있습니다.
  `.trim(),

  'ko-body-scan-01': `
편안하게 누우시거나 앉으세요. 몸 전체가 아래로 완전히 이완되도록 합니다.
눈을 감고 세 번 깊게 호흡하세요.
들이쉬고... 내쉬고. 들이쉬고... 내쉬고. 들이쉬고... 내쉬고.
머리 꼭대기에서부터 시작합니다. 그곳의 감각을 느껴보세요.
천천히 이마로 내려옵니다. 눈썹의 긴장을 풀어주세요.
눈으로 이동합니다. 감은 눈꺼풀이 부드럽고 무겁습니다.
턱과 목. 지금껏 붙잡고 있던 모든 것을 내려놓으세요.
어깨. 귀에서 멀어지도록 내려놓으세요.
가슴이 호흡에 따라 오르내리는 것을 느껴보세요. 심장이 규칙적으로 뛰고 있습니다.
배. 오르내립니다.
허리. 골반. 바닥으로 가라앉게 두세요.
다리. 무겁고 따뜻합니다.
발. 발가락 끝까지.
당신은 완전히 여기 있습니다. 완전히 현재에. 완전히 쉬고 있습니다.
필요한 만큼 이 고요함에 머무르세요.
  `.trim(),

  'ko-guided-love-01': `
편안히 앉아 한 손을 가슴에 올려놓으세요.
자애 명상, 메타 바바나를 연습합니다. 2500년 전 불교 전통에서 온 이 수련은 옥시토신을 증가시키고 외로움을 줄여줍니다.
먼저 자신의 가슴으로 따뜻함을 호흡합니다.
조용히 따라하세요.
내가 행복하기를.
내가 평온하기를.
내가 고통에서 자유롭기를.
내가 건강하기를.
이 말들이 당신 안으로 스며들게 하세요. 당신은 친절을 받을 자격이 있습니다.
이제 당신이 사랑하는 누군가를 떠올리세요. 그 얼굴을 그려보세요.
당신이 행복하기를. 당신이 평온하기를. 당신이 고통에서 자유롭기를. 당신이 건강하기를.
이제 그 원을 모든 존재로 넓힙니다.
모든 존재가 행복하기를. 모든 존재가 평온하기를. 모든 존재가 고통에서 자유롭기를.
당신의 마음이 얼마나 넓은지 느껴보세요.
  `.trim(),

  'ko-guided-zen-01': `
고요히 머무르세요.
선은 가르칩니다 — 지금 이 순간만이 유일한 순간이라고.
과거의 후회도 아니고, 미래의 걱정도 아닌, 오직 지금.
몸의 무게를 느껴보세요. 피부에 닿는 공기를 느껴보세요.
주변의 소리를 판단 없이 들어보세요.
초심자의 마음으로 이 순간을 맞이하세요.
지금 당장 무언가를 이룰 필요가 없습니다.
지금 당장 무언가를 고칠 필요가 없습니다.
그냥 존재하면 됩니다.
내쉴 때마다, 지금이 아닌 다른 곳에 있고 싶은 마음을 내려놓으세요.
들이쉴 때마다, 이 순간을 있는 그대로 받아들이세요.
선사들은 이것을 지관타좌라고 불렀습니다. 그냥 앉기.
목표를 향한 앉기가 아닌, 그냥 앉기.
당신은 이미 완전합니다. 부족한 것이 없습니다.
이 앎 속에서 쉬세요.
  `.trim(),

  'ko-guided-cbt-01': `
아침의 첫 호흡을 함께합니다.
인지행동치료, CBT는 우리의 생각이 감정과 행동을 만든다고 가르칩니다.
오늘 아침, 당신의 마음을 부드럽게 살펴봅시다.
들이쉬고... 내쉬세요.
지금 어떤 생각이 떠오르나요? 그 생각을 판단하지 말고 그냥 바라보세요.
이 생각이 사실인가요, 아니면 해석인가요?
들이쉬고... 내쉬세요.
오늘 내가 통제할 수 있는 것은 무엇인가요?
나의 태도. 나의 노력. 나의 반응.
통제할 수 없는 것은 무엇인가요?
타인의 말. 결과. 예상치 못한 일들.
들이쉬며 통제 가능한 것을 받아들이고... 내쉬며 통제 불가한 것을 내려놓으세요.
오늘 한 가지 의도를 세워보세요. 완벽함이 아닌, 친절함을 향한 의도.
당신은 준비되어 있습니다.
  `.trim(),

  'ko-guided-gratitude-01': `
눈을 감고 안정적인 호흡을 찾으세요.
감사는 뇌의 부정 편향을 재설계하는 가장 강력한 웰빙 실천법임이 과학적으로 증명되었습니다.
함께 연습합니다.
들이쉬고... 내쉬면서, 오늘 감사한 것 하나를 떠올려보세요.
크지 않아도 됩니다. 햇빛의 따뜻함. 누군가의 친절한 말. 숨쉬고 있다는 사실.
감사함이 가슴 속에서 퍼져나가도록 두세요.
이제 두 번째. 이번 주에 있었던 일 중에서.
대화 한 가지. 식사 한 끼. 아름다운 순간 하나.
감사함이 당신을 채우게 하세요.
이제 세 번째. 당신 자신에 대해.
당신이 가진 어떤 자질. 헤쳐나온 어려움. 당신이 만들어내거나 나눈 무언가.
당신은 스스로에게 감사받을 자격이 있습니다.
이 세 가지를 마음에 담으세요. 당신을 풍요롭게 합니다.
  `.trim(),
};

// ─── 생성할 트랙 목록 ─────────────────────────────────────────────────────
const TRACKS = [
  // EN
  { id: 'en-breath-box-01',       voice: 'nova'    as const, script: SCRIPTS_EN['en-breath-box-01'] },
  { id: 'en-breath-478-01',       voice: 'nova'    as const, script: SCRIPTS_EN['en-breath-478-01'] },
  { id: 'en-breath-pranayama-01', voice: 'nova'    as const, script: SCRIPTS_EN['en-breath-pranayama-01'] },
  { id: 'en-body-scan-01',        voice: 'shimmer' as const, script: SCRIPTS_EN['en-body-scan-01'] },
  { id: 'en-guided-love-01',      voice: 'shimmer' as const, script: SCRIPTS_EN['en-guided-love-01'] },
  { id: 'en-guided-zen-01',       voice: 'onyx'    as const, script: SCRIPTS_EN['en-guided-zen-01'] },
  { id: 'en-guided-stoic-01',     voice: 'onyx'    as const, script: SCRIPTS_EN['en-guided-stoic-01'] },
  { id: 'en-guided-gratitude-01', voice: 'shimmer' as const, script: SCRIPTS_EN['en-guided-gratitude-01'] },
  // KO
  { id: 'ko-breath-box-01',       voice: 'nova'    as const, script: SCRIPTS_KO['ko-breath-box-01'] },
  { id: 'ko-breath-478-01',       voice: 'nova'    as const, script: SCRIPTS_KO['ko-breath-478-01'] },
  { id: 'ko-breath-pranayama-01', voice: 'nova'    as const, script: SCRIPTS_KO['ko-breath-pranayama-01'] },
  { id: 'ko-body-scan-01',        voice: 'shimmer' as const, script: SCRIPTS_KO['ko-body-scan-01'] },
  { id: 'ko-guided-love-01',      voice: 'shimmer' as const, script: SCRIPTS_KO['ko-guided-love-01'] },
  { id: 'ko-guided-zen-01',       voice: 'onyx'    as const, script: SCRIPTS_KO['ko-guided-zen-01'] },
  { id: 'ko-guided-cbt-01',       voice: 'onyx'    as const, script: SCRIPTS_KO['ko-guided-cbt-01'] },
  { id: 'ko-guided-gratitude-01', voice: 'shimmer' as const, script: SCRIPTS_KO['ko-guided-gratitude-01'] },
];

async function generate() {
  console.log(`Generating ${TRACKS.length} audio files with OpenAI TTS...\n`);

  for (const track of TRACKS) {
    const outPath = path.join(OUT_DIR, `${track.id}.mp3`);
    if (fs.existsSync(outPath)) {
      console.log(`  SKIP  ${track.id}.mp3 (already exists)`);
      continue;
    }
    try {
      process.stdout.write(`  GEN   ${track.id}.mp3 (voice: ${track.voice})... `);
      const res = await openai.audio.speech.create({
        model: 'tts-1',
        voice: track.voice,
        input: track.script,
        response_format: 'mp3',
        speed: 0.88, // 명상에 적합한 느린 속도
      });
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buffer);
      console.log(`done (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (e: any) {
      console.log(`FAILED — ${e?.message ?? e}`);
    }
  }

  console.log(`\nDone. Files saved to: ${OUT_DIR}`);
  console.log('\nPixabay에서 별도 다운로드 필요한 자연음 4개:');
  console.log('  en-nature-rain-01.mp3  → https://pixabay.com/music/search/rain%20forest/');
  console.log('  ko-nature-rain-01.mp3  → (동일 파일 복사 가능)');
  console.log('  en-nature-ocean-01.mp3 → https://pixabay.com/music/search/ocean%20waves/');
  console.log('  ko-nature-ocean-01.mp3 → (동일 파일 복사 가능)');
}

generate().catch(console.error);
