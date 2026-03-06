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

// ─── OpenAI 불가 시 로컬 폴백 응답 ────────────────────────────
function getFallbackResponse(message: string, lang: Language, turnCount: number): string {
    const msg = message.toLowerCase();
    const isKo = lang === 'ko';

    if (msg.includes('anxi') || msg.includes('worry') || msg.includes('불안')) {
        return isKo
            ? '불안함을 느끼고 계시는군요. 4-7-8 호흡을 해보세요: 4초 들이쉬고, 7초 멈추고, 8초 내쉬세요. 부교감신경을 활성화해 불안을 빠르게 줄여줍니다. 지금 한번 해보실까요?'
            : 'I hear you\'re feeling anxious. Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. This activates your parasympathetic system and reduces anxiety within minutes. Want to try it now?';
    }
    if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('피곤') || msg.includes('지쳐')) {
        return isKo
            ? '피곤하시군요. 눈을 감고 3번 깊게 숨을 쉬어보세요. 뇌과학적으로 짧은 마음챙김 호흡도 피질의 피로 신호를 줄여줍니다. 지금 잠깐 쉬어가는 건 어떨까요?'
            : 'You sound tired. Close your eyes and take 3 deep breaths. Even brief mindful breathing reduces cortical fatigue signals. How about a short rest right now?';
    }
    if (msg.includes('stress') || msg.includes('스트레스') || msg.includes('힘들')) {
        return isKo
            ? '스트레스가 많으시군요. 스토아 철학자 마르쿠스 아우렐리우스는 말했습니다: "우리가 통제할 수 없는 것에 에너지를 쓰지 말라." 지금 내가 통제할 수 있는 것에만 집중해보세요. 무엇이 가장 힘드신가요?'
            : 'Stress is weighing on you. Marcus Aurelius wrote: "You have power over your mind, not outside events." Let\'s focus only on what you can control. What\'s weighing on you most right now?';
    }
    if (msg.includes('happy') || msg.includes('good') || msg.includes('행복') || msg.includes('좋아')) {
        return isKo
            ? '좋은 기분이시군요! 긍정적인 감정을 더 깊게 느끼려면, 지금 이 순간 감사한 것 3가지를 생각해보세요. 감사 명상은 옥시토신 분비를 촉진해 행복감을 증폭시킵니다.'
            : 'That\'s wonderful! To deepen this positive feeling, try naming 3 things you\'re grateful for right now. Gratitude meditation amplifies joy by boosting oxytocin. What are you thankful for today?';
    }
    if (msg.includes('sad') || msg.includes('슬픔') || msg.includes('슬퍼')) {
        return isKo
            ? '슬픔을 느끼고 계시는군요. 슬픔은 자연스러운 감정이에요. 자애 명상(Loving-Kindness)을 해보세요: "나는 행복하기를, 나는 평안하기를, 나는 건강하기를." 이 연습이 옥시토신을 높여 외로움을 줄여줍니다.'
            : 'I\'m sorry you\'re feeling sad. Sadness is natural and valid. Try Loving-Kindness meditation: "May I be happy, may I be peaceful, may I be well." This practice increases oxytocin and eases loneliness.';
    }
    // 기본 응답 (턴 수에 따라 변화)
    const defaults = isKo
        ? ['오늘 어떤 감정을 가장 많이 느끼셨나요? 감정을 인식하는 것 자체가 마음챙김의 시작이에요.', '지금 이 순간, 몸의 어느 부분에 긴장이 느껴지나요? 그 부분에 부드러운 호흡을 보내보세요.', '오늘 하루 중 가장 평화로웠던 순간은 언제였나요?']
        : ['What emotion stands out most for you today? Simply noticing it is the first step of mindfulness.', 'Right now, where do you feel tension in your body? Try sending a soft breath to that area.', 'What was the most peaceful moment of your day so far?'];
    return defaults[turnCount % defaults.length];
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

    // 4. OpenAI 호출 (실패 시 로컬 폴백으로 대체)
    let response = '';
    let usedModel = model;
    try {
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
        response = completion.choices[0]?.message?.content ?? '';
    } catch (err: any) {
        console.warn('[Zenny:Coach] OpenAI failed, using local fallback:', err?.message ?? err);
        response = getFallbackResponse(message, lang, turnCount);
        usedModel = 'fallback';
    }

    // 5. 캐시 저장 (Redis 미연결 시 무시)
    if (response && usedModel !== 'fallback') try { await redisService.setex(cacheKey, 300, response); } catch { /* skip */ }

    // 6. 첫 턴이거나 짧은 메시지 → quickReplies 제공
    const quickReplies = turnCount === 0 ? getInitialQuickReplies(lang) : undefined;

    return { response, quickReplies, model: usedModel };
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
