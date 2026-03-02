# Zone 3: AI 서비스 — Claude Code 지시서
# OpenAI GPT + Redis 캐시 + 다국어 Conversational UI

## 실행 방법
```bash
cd /path/to/Zenny
claude --directive DevArtifacts/claude-directives/zone3-ai-service.md
```

---

## 컨텍스트
- AI 모델: **GPT-4o-mini 기본**, 복잡 세션(10턴+)만 GPT-4o
- 비용 최적화: Redis 캐시 + 10턴 컨텍스트 압축
- 언어: EN/KO 분기 프롬프트
- 이론 기반: 심리학(CBT/MBSR), 뇌과학(DMN), 철학(Zen/스토이시즘), 종교(위파사나), 호흡(박스/4-7-8)

---

## Task 1 — OpenAI 서비스

파일: `apps/api/src/services/openai.service.ts`

```typescript
import OpenAI from 'openai';
import { redisService } from './redis.service';
import { Language, ChatMessage, QuickReply, Emotion, EMOTION_LABELS } from '../../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── 시스템 프롬프트 ────────────────────────────────────────
const getSystemPrompt = (lang: Language, characterType: string): string => {
  const isKo = lang === 'ko';
  return `You are Zenny AI, a compassionate meditation coach speaking as ${characterType.charAt(0).toUpperCase() + characterType.slice(1)}.

${isKo ? 'Always respond in Korean.' : 'Always respond in English.'}

Your responses are grounded in multiple disciplines:
- Psychology: CBT (Cognitive Behavioral Therapy), MBSR (Mindfulness-Based Stress Reduction)
- Neuroscience: Default Mode Network (DMN), serotonin/dopamine regulation through meditation
- Philosophy: Zen Buddhism, Stoicism (Marcus Aurelius), Epicurus
- Religious traditions: Vipassana (Buddhist), Contemplative prayer (Christian), Transcendental Meditation (Hindu)
- Breathwork: 4-7-8 breathing, Box breathing, Pranayama

RESPONSE FORMAT:
1. Empathize briefly with the user's feeling (1-2 sentences)
2. Optionally share ONE relevant insight from the disciplines above (cite simply, e.g. "CBT research shows...")
3. Offer a concrete next step: breathing exercise, short meditation, or journaling prompt
4. Keep response under 100 words for quick read

CHARACTER PERSONALITY:
- hana: warm, empathetic, nurturing
- sora: calm, intellectual, analytical  
- tora: energetic, encouraging, action-oriented`;
};

// ─── 감정별 빠른 응답 버튼 생성 ─────────────────────────────
export const generateQuickReplies = (lang: Language): QuickReply[] => {
  const emotions: Emotion[] = ['happy', 'anxious', 'tired', 'stressed', 'sad', 'confused'];
  return emotions.map((emotion, i) => ({
    id: `qr-${i}`,
    label: EMOTION_LABELS[emotion][lang],
    emotion,
  }));
};

// ─── 채팅 응답 생성 (비용 최적화 포함) ─────────────────────
export interface ChatOptions {
  userId: string;
  sessionId: string;
  message: string;
  lang: Language;
  characterType: string;
  history: ChatMessage[];
  turnCount: number;
}

export const generateCoachResponse = async (options: ChatOptions): Promise<{
  response: string;
  quickReplies?: QuickReply[];
  model: string;
}> => {
  const { userId, message, lang, characterType, history, turnCount } = options;

  // 1. Redis 캐시 확인 (동일 감정/메시지 패턴 재활용)
  const cacheKey = `coach:${lang}:${characterType}:${message.toLowerCase().trim().slice(0, 50)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return { response: cached, model: 'cache' };
  }

  // 2. 10턴 초과 시 컨텍스트 압축 (토큰 절약)
  let contextMessages = history;
  if (turnCount >= 10) {
    const summary = await summarizeSession(history.slice(0, -4), lang);
    contextMessages = [
      { id: 'summary', role: 'assistant' as const,
        content: `[Previous context summary: ${summary}]`,
        timestamp: new Date().toISOString() },
      ...history.slice(-4),
    ];
  }

  // 3. 모델 선택 (비용 최적화)
  const model = turnCount > 15 ? 'gpt-4o' : 'gpt-4o-mini';

  // 4. OpenAI 호출
  const messages = [
    { role: 'system' as const, content: getSystemPrompt(lang, characterType) },
    ...contextMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const completion = await openai.chat.completions.create({ model, messages, max_tokens: 200, temperature: 0.7 });
  const response = completion.choices[0]?.message?.content ?? '';

  // 5. 캐시 저장 (5분 TTL)
  if (response) await redisService.setex(cacheKey, 300, response);

  // 6. 감정 선택지가 필요한 첫 응답 또는 체크인 시
  const isCheckinTurn = turnCount === 0 || message.length < 20;
  const quickReplies = isCheckinTurn ? generateQuickReplies(lang) : undefined;

  return { response, quickReplies, model };
};

// ─── 세션 요약 (10턴 초과 시 컨텍스트 압축용) ───────────────
export const summarizeSession = async (messages: ChatMessage[], lang: Language): Promise<string> => {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const isKo = lang === 'ko';
  const prompt = isKo
    ? `다음 명상 코치 대화를 2문장으로 요약하세요:\n${text}`
    : `Summarize this meditation coaching conversation in 2 sentences:\n${text}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
  });
  return completion.choices[0]?.message?.content ?? '';
};

// ─── 감정 → 명상 트랙 추천 ───────────────────────────────────
export const recommendTrackType = (emotion: Emotion): { type: string; reason: string } => {
  const mapping: Record<Emotion, { type: string; reason: string }> = {
    anxious:  { type: 'breathing', reason: 'Box breathing activates the parasympathetic nervous system' },
    stressed: { type: 'breathing', reason: '4-7-8 breathing reduces cortisol in 60 seconds' },
    sad:      { type: 'guided',    reason: 'Loving-kindness meditation (Metta) builds emotional resilience' },
    tired:    { type: 'nature',    reason: 'Nature sounds restore attention (Attention Restoration Theory)' },
    angry:    { type: 'bodyscan',  reason: 'Body scan interrupts the amygdala stress response' },
    lonely:   { type: 'guided',    reason: 'Compassion meditation builds felt sense of connection' },
    happy:    { type: 'nature',    reason: 'Gratitude practice with nature sounds deepens positive states' },
    calm:     { type: 'bodyscan',  reason: 'Maintain your calm with a gentle body awareness scan' },
    excited:  { type: 'breathing', reason: 'Channel energy with rhythmic pranayama breathing' },
    grateful: { type: 'guided',    reason: 'Gratitude journaling + guided visualization amplifies joy' },
    confused: { type: 'breathing', reason: 'Box breathing clears the prefrontal cortex for clear thinking' },
  };
  return mapping[emotion] ?? { type: 'guided', reason: 'A guided meditation session' };
};
```

---

## Task 2 — Redis 서비스

파일: `apps/api/src/services/redis.service.ts`

```typescript
import Redis from 'ioredis';

class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 2,
    });
    this.client.on('error', (err) => console.warn('[Redis] Error:', err.message));
  }

  async get(key: string): Promise<string | null> {
    try { return await this.client.get(key); }
    catch { return null; } // Redis 장애 시 graceful fallback
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try { await this.client.setex(key, ttl, value); }
    catch { /* silent */ }
  }
}

export const redisService = new RedisService();
```

---

## Task 3 — Coach API 라우터

파일: `apps/api/src/routes/coach.routes.ts`

엔드포인트:
```
POST /api/coach/session/start    → 새 세션 시작, 첫 인사 + quickReplies 6개
POST /api/coach/chat             → 메시지 전송, 응답 + quickReplies(선택적)
POST /api/coach/session/summarize → 세션 요약 저장
GET  /api/coach/sessions          → 과거 세션 목록
```

## Task 4 — 이론 기반 응답 테스트

파일: `apps/api/src/__tests__/coach.test.ts`

테스트 케이스:
- "불안해요" 입력 시 박스 호흡 추천 포함 여부
- 10턴 후 GPT-4o 모델로 전환 확인
- 캐시 히트 시 Redis 응답 반환 확인
- quickReplies 6개 생성 확인

---

## 완료 기준
- [ ] `POST /api/coach/session/start` → greeting + 6개 quickReplies 반환
- [ ] `POST /api/coach/chat` → 100단어 이내 응답, 이론 인용 포함
- [ ] 동일 메시지 2회 전송 시 두 번째 응답이 Redis에서 옴 (cache: true)
- [ ] 10턴 후 모델이 gpt-4o로 전환
- [ ] EN/KO 분기 정상 동작
