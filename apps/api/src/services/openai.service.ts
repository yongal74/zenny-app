import OpenAI from 'openai';
import { redisService } from './redis.service';
import type { Language, ChatMessage, QuickReply, Emotion } from '../../../../packages/shared-types/src/index';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set');
        _openai = new OpenAI({ apiKey });
    }
    return _openai;
}

// ─── 시스템 프롬프트 ────────────────────────────────────────────
function getSystemPrompt(lang: Language, characterType: string): string {
    const name = characterType.charAt(0).toUpperCase() + characterType.slice(1);
    const isKo = lang === 'ko';

    const PERSONALITY: Record<string, string> = {
        hana: 'warm, empathetic and nurturing',
        sora: 'calm, intellectual and analytical',
        tora: 'energetic, encouraging and action-oriented',
        mizu: 'gentle, flexible and deeply empathetic',
        kaze: 'free-spirited, intuitive and inspirational',
    };

    return `You are Zenny AI, a compassionate meditation coach manifesting as ${name} — ${PERSONALITY[characterType] ?? 'warm'}.

${isKo ? 'ALWAYS respond in Korean.' : 'ALWAYS respond in English.'}

Your responses are grounded in:
- Psychology: CBT, MBSR (Mindfulness-Based Stress Reduction)
- Neuroscience: Default Mode Network suppression, cortisol/serotonin regulation
- Philosophy: Zen Buddhism, Stoicism (Marcus Aurelius), Epicurus
- Religious traditions: Vipassana (Buddhism), Lectio Divina (Christianity), Transcendental Meditation
- Breathwork: Box breathing, 4-7-8, Pranayama, Wim Hof

RESPONSE RULES:
1. Empathize briefly with the user's feeling (1-2 sentences)
2. Share ONE relevant insight citing a discipline (e.g. "Neuroscience shows...")
3. Offer a CONCRETE 2-minute action: breathing, body scan, or micro-meditation
4. Keep total response under 100 words for mobile reading
5. Always end with a gentle question or encouragement`;
}

// ─── 초기 quickReplies (6개 감정 선택지) ─────────────────────
function getInitialQuickReplies(lang: Language): QuickReply[] {
    const labels: Record<string, { en: string; ko: string }> = {
        happy: { en: '😊 Happy', ko: '😊 행복해요' },
        anxious: { en: '😰 Anxious', ko: '😰 불안해요' },
        tired: { en: '😴 Tired', ko: '😴 피곤해요' },
        stressed: { en: '😤 Stressed', ko: '😤 스트레스' },
        sad: { en: '😢 Sad', ko: '😢 슬퍼요' },
        confused: { en: '🤷 Not sure', ko: '🤷 잘 모르겠어요' },
    };

    return Object.entries(labels).map(([emotion, label], i) => ({
        id: `qr-${i}`,
        label: lang === 'ko' ? label.ko : label.en,
        emotion: emotion as Emotion,
    }));
}

// ─── AI 응답 생성 (메인) ────────────────────────────────────────
export async function generateCoachResponse(opts: {
    userId: string;
    message: string;
    lang: Language;
    characterType: string;
    history: ChatMessage[];
    turnCount: number;
}): Promise<{ response: string; quickReplies?: QuickReply[]; model: string }> {
    const { message, lang, characterType, history, turnCount } = opts;

    // 1. Redis 캐시 확인 (동일 패턴 재활용, 5분 TTL)
    const cacheKey = `coach:${lang}:${characterType}:${message.toLowerCase().slice(0, 60)}`;
    let cached: string | null = null;
    try { cached = await redisService.get(cacheKey); } catch { /* Redis 미연결 시 무시 */ }
    if (cached) return { response: cached, model: 'cache' };

    // 2. 10턴 이상 → 컨텍스트 압축 (토큰 절약)
    let contextMessages = history;
    if (turnCount >= 10) {
        const summary = await summarizeSession(history.slice(0, -4), lang);
        contextMessages = [
            { id: 'ctx', role: 'assistant', content: `[Prior summary: ${summary}]`, timestamp: '' },
            ...history.slice(-4),
        ];
    }

    // 3. 모델 선택 (비용 최적화)
    const model = turnCount > 15 ? 'gpt-4o' : 'gpt-4o-mini';

    // 4. OpenAI 호출
    const completion = await getOpenAI().chat.completions.create({
        model,
        max_tokens: 200,
        temperature: 0.72,
        messages: [
            { role: 'system', content: getSystemPrompt(lang, characterType) },
            ...contextMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user', content: message },
        ],
    });

    const response = completion.choices[0]?.message?.content ?? '';

    // 5. 캐시 저장 (Redis 미연결 시 무시)
    if (response) try { await redisService.setex(cacheKey, 300, response); } catch { /* skip */ }

    // 6. 첫 턴이거나 짧은 메시지 → quickReplies 제공
    const quickReplies = turnCount === 0 ? getInitialQuickReplies(lang) : undefined;

    return { response, quickReplies, model };
}

// ─── 세션 요약 (10턴 초과 시 컨텍스트 압축) ──────────────────
export async function summarizeSession(messages: ChatMessage[], lang: Language): Promise<string> {
    const text = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const prompt = lang === 'ko'
        ? `다음 명상 코치 대화를 2문장으로 요약하세요:\n${text}`
        : `Summarize this meditation coaching session in 2 sentences:\n${text}`;

    const res = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0]?.message?.content ?? '';
}

// ─── 감정 → 명상 트랙 추천 ────────────────────────────────────
export function recommendTrackType(emotion: string): { type: string; reason: string } {
    const map: Record<string, { type: string; reason: string }> = {
        anxious: { type: 'breathing', reason: 'Box breathing activates the parasympathetic system' },
        stressed: { type: 'breathing', reason: '4-7-8 reduces cortisol within 60 seconds' },
        sad: { type: 'guided', reason: 'Loving-kindness meditation increases oxytocin' },
        tired: { type: 'nature', reason: 'Nature sounds restore attention (ART Theory)' },
        angry: { type: 'bodyscan', reason: 'Body scan interrupts the amygdala stress loop' },
        lonely: { type: 'guided', reason: 'Compassion meditation builds felt connection' },
        happy: { type: 'nature', reason: 'Nature sounds deepen positive emotional states' },
        calm: { type: 'bodyscan', reason: 'Maintain calm with gentle body awareness' },
        excited: { type: 'breathing', reason: 'Pranayama channels energy productively' },
        grateful: { type: 'guided', reason: 'Gratitude visualization amplifies joy' },
        confused: { type: 'breathing', reason: 'Box breathing clears the prefrontal cortex' },
    };
    return map[emotion] ?? { type: 'guided', reason: 'A guided meditation session' };
}
