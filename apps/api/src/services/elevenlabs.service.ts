import * as fs from 'fs';
import * as path from 'path';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

// Best voice for calm meditation guidance
// "Rachel" = calm, warm, professional
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

interface GenerateOpts {
    text: string;
    voiceId?: string;
    stability?: number;      // 0-1, higher = more consistent
    similarityBoost?: number; // 0-1, higher = more expressive
    style?: number;           // 0-1
}

export async function generateSpeech(opts: GenerateOpts): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

    const voiceId = opts.voiceId ?? VOICE_ID;

    const response = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
            text: opts.text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
                stability: opts.stability ?? 0.75,
                similarity_boost: opts.similarityBoost ?? 0.75,
                style: opts.style ?? 0.3,
                use_speaker_boost: true,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`ElevenLabs error ${response.status}: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ─── Meditation scripts ─────────────────────────────────────────────────────

export const MEDITATION_SCRIPTS: Record<string, string> = {
    'en-breath-box-01': `
Welcome. Find a comfortable position and close your eyes gently.

We'll practice box breathing together — a technique used by Navy SEALs and neuroscientists alike to calm the nervous system instantly.

Breathe in slowly... two, three, four.
Hold... two, three, four.
Breathe out... two, three, four.
Hold... two, three, four.

Again. Breathe in... two, three, four.
Hold... two, three, four.
Breathe out... two, three, four.
Hold... two, three, four.

Your prefrontal cortex — the seat of calm, rational thought — is activating now. Each breath quiets the amygdala's stress signals.

Once more. Breathe in... two, three, four.
Hold gently.
Breathe out, releasing all tension.
And hold.

You are doing beautifully. Return here anytime you need stillness.
    `.trim(),

    'en-breath-478-01': `
Let's practice the four-seven-eight breathing technique, developed by Dr. Andrew Weil and rooted in ancient pranayama wisdom.

This breath pattern activates your vagus nerve — the pathway from your brain to your heart — creating an immediate sense of safety and calm.

Place the tip of your tongue behind your upper front teeth.

Breathe in through your nose... one, two, three, four.
Hold your breath... one, two, three, four, five, six, seven.
Exhale completely through your mouth... one through eight.

Feel the shift. Your cortisol levels are dropping right now.

Again. Breathe in... one, two, three, four.
Hold... seven counts.
Release... one through eight.

The Stoics called this practice of conscious breath "pneuma" — the vital force. You are reclaiming your inner stillness.

One final cycle. Breathe in... four counts.
Hold... seven.
And release completely... eight.

Carry this peace with you.
    `.trim(),

    'en-breath-pranayama-01': `
Welcome to pranayama — the ancient science of breath control, practiced for over three thousand years in yogic tradition.

The word prana means life force. Yama means regulation. Together, we learn to regulate the very energy of life itself.

Begin with natural breath. Simply observe. Notice the air entering... and leaving.

Now, alternate nostril breathing. Close your right nostril with your thumb. Breathe in through the left... slowly, deeply.

Close both nostrils. Hold.

Release the right. Breathe out through the right.

Now breathe in through the right.
Close both. Hold.
Release the left. Exhale through the left.

This practice balances the left and right hemispheres of your brain — logic and intuition, analysis and creativity — bringing you into harmony.

Continue this rhythm. Each breath a meditation. Each pause a moment of pure awareness.

You are the stillness beneath the storm.
    `.trim(),

    'en-guided-zen-01': `
In Zen tradition, there is a concept called mushin — no mind. Not the absence of thought, but the freedom from attachment to thought.

Allow your eyes to soften and close.

Thoughts may arise. Like clouds crossing an empty sky, let them pass without holding them. You are the sky. Not the clouds.

Bring awareness to this present moment. The feeling of your body. The rhythm of your breath. The quiet space between thoughts.

Marcus Aurelius wrote: "You have power over your mind, not outside events. Realize this, and you will find strength."

You don't need to fix anything right now. You don't need to be anywhere else. This moment — exactly as it is — is enough.

Rest in this knowing.

The present moment is the only place where peace truly lives.

When you're ready, gently return.
    `.trim(),

    'en-guided-gratitude-01': `
Gratitude is not merely a feeling — it is a neurological practice. Research from UCLA shows that genuine gratitude activates the brain's reward centers, releasing dopamine and serotonin simultaneously.

Close your eyes. Take one deep breath.

Bring to mind something simple you are grateful for today. Not grand gestures — something small. The warmth of light. The comfort of breath. A person who makes you feel seen.

Hold this image softly.

Now feel it in your body. Where does gratitude live in you? Your chest? Your heart? Let that warmth expand.

The Buddhist teacher Thich Nhat Hanh said: "The most precious gift we can offer anyone is our attention." Right now, you are offering that gift to life itself.

Bring another thing to mind. Something you often overlook. Your health. Your ability to think, to feel, to love.

Breathe into appreciation.

You are more abundant than you realize.

Carry this warmth into your day.
    `.trim(),

    'en-guided-love-01': `
Loving-kindness meditation — or Metta in Pali — has been practiced for over 2,600 years. Modern neuroscience confirms what ancient monks knew: it increases oxytocin, reduces self-criticism, and builds genuine compassion.

Begin by settling into stillness.

Silently, in your mind, repeat these words, feeling their meaning:

May I be happy.
May I be peaceful.
May I be free from suffering.
May I be filled with loving-kindness.

Now bring to mind someone you love easily — a friend, a pet, a child. Feel the warmth of your care for them.

May you be happy.
May you be peaceful.
May you be free from suffering.
May you be filled with loving-kindness.

Now extend this outward — to someone neutral, someone you barely know. And finally, to all beings everywhere.

May all beings be happy.
May all beings be peaceful.
May all beings know love.

This circle of compassion begins with you. And it is infinite.
    `.trim(),

    'en-guided-stoic-01': `
Good morning. The Stoics began each day with a practice called melete — morning meditation.

Marcus Aurelius wrote in his journal each dawn: "You have this moment. Use it nobly."

Take a breath. Feel the gift of consciousness.

Today, you will meet difficulty. This is certain. The question is not whether challenges will come — but who you will be when they do.

The Stoics taught: focus only on what is within your power. Your thoughts. Your responses. Your character.

Everything else — the opinions of others, unexpected events, outcomes beyond your control — these are externals. They cannot touch your inner fortress unless you allow them to.

Breathe in. I am capable.
Breathe out. I choose my response.

Breathe in. I will act with integrity.
Breathe out. I release what I cannot control.

Today, practice the Stoic virtues: wisdom, courage, justice, and temperance.

Not perfectly. Simply with intention.

Go forward, with open eyes and a steady heart.
    `.trim(),

    'en-body-scan-01': `
The body scan is one of the most evidence-based practices in mindfulness-based stress reduction, developed by Jon Kabat-Zinn at the University of Massachusetts.

Lie down or sit comfortably. Close your eyes.

We begin at the top of the head. Simply notice. No judgment. Pure awareness.

Forehead. Soften. Let go.

Eyes. The muscles around your eyes. Relax completely.

Jaw. This is where we hold so much tension. Unclench. Let your tongue rest.

Neck and shoulders. Breathe into any tightness. With each exhale, release a little more.

Move down the arms. Hands. Fingers. Let them be heavy, warm, still.

Chest. Feel it rise and fall. The heart beating beneath. Trust it.

Belly. Soft. Open. Breathing.

Lower back. Release the weight of the day.

Hips. Legs. Heavy. Grounded.

Feet. The ends of the earth that you stand upon.

Your entire body — a vessel for this one precious life. Whole. Enough. At rest.

Stay here as long as you wish.
    `.trim(),

    'en-nature-ocean-01': `
Close your eyes. Imagine yourself standing at the edge of the ocean.

Feel the sand beneath your feet — warm, shifting, vast.

Listen. The waves arriving one by one. Each wave is a breath. Each recession a release.

The ocean has been here for four billion years. It does not rush. It does not worry. It simply moves with the eternal rhythm of the earth.

Breathe with the waves.

In... as a wave rises, gathering its strength.

Out... as it exhales itself onto the shore, giving everything, holding nothing back.

The Japanese concept of "ma" — the beauty of empty space — lives in the pause between waves. That silence between sounds is not absence. It is presence.

You are as vast as this ocean. As ancient. As capable of depth and stillness.

Let the sound carry you. Let the rhythm heal.

You are not separate from this world. You belong to it completely.
    `.trim(),
};

export function listScripts(): string[] {
    return Object.keys(MEDITATION_SCRIPTS);
}
