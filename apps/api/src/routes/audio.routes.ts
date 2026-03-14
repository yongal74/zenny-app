import { Router, Request, Response } from 'express';
import { generateSpeech, MEDITATION_SCRIPTS, listScripts } from '../services/elevenlabs.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

// GET /api/audio/music/:trackId — proxy ambient music with CORS headers
// just_audio web requires CORS; archive.org CDN lacks it, so we proxy server-side
router.get('/music/:trackId', async (req: Request, res: Response) => {
    const { trackId } = req.params;

    try {
        const track = await prisma.meditationTrack.findUnique({ where: { id: trackId } });
        if (!track || !track.musicUrl) {
            return res.status(404).json({ error: `No music for track: ${trackId}` });
        }

        const upstream = await fetch(track.musicUrl);
        if (!upstream.ok) {
            return res.status(502).json({ error: `Upstream ${upstream.status}` });
        }

        res.set({
            'Content-Type': upstream.headers.get('content-type') ?? 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
        });

        const buf = Buffer.from(await upstream.arrayBuffer());
        res.send(buf);
        console.log(`[Zenny:Audio] Proxied music ${trackId} — ${buf.length} bytes`);
    } catch (err: any) {
        console.error('[Zenny:Audio] Music proxy error:', err?.message);
        res.status(500).json({ error: err?.message });
    }
});

export default router;
