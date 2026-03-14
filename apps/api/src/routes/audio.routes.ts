import { Router, Request, Response } from 'express';
import { generateSpeech, MEDITATION_SCRIPTS, listScripts } from '../services/elevenlabs.service';

const router = Router();

// GET /api/audio/scripts — list available scripts
router.get('/scripts', (_req: Request, res: Response) => {
    res.json({ scripts: listScripts() });
});

// GET /api/audio/stream/:trackId — stream audio directly (no storage needed)
router.get('/stream/:trackId', async (req: Request, res: Response) => {
    const { trackId } = req.params;
    const script = MEDITATION_SCRIPTS[trackId];

    if (!script) {
        return res.status(404).json({ error: `No script for track: ${trackId}` });
    }

    try {
        console.log(`[Zenny:Audio] Generating ElevenLabs audio for ${trackId}...`);
        const audioBuffer = await generateSpeech({ text: script });

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            'Cache-Control': 'public, max-age=86400',
        });
        res.send(audioBuffer);
        console.log(`[Zenny:Audio] Streamed ${audioBuffer.length} bytes for ${trackId}`);
    } catch (err: any) {
        console.error('[Zenny:Audio] ElevenLabs error:', err?.message);
        res.status(500).json({ error: err?.message ?? 'Audio generation failed' });
    }
});

export default router;
