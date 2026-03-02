import type { ChatMessage, Language, QuickReply } from '../types';
import { apiClient } from '../utils/api';

interface CoachResponse {
    response: string;
    quickReplies?: QuickReply[];
    model: string;
    sessionId?: string;
}

export async function generateAIResponse(params: {
    message: string;
    lang: Language;
    characterType: string;
    history: ChatMessage[];
    turnCount: number;
    sessionId?: string;
}): Promise<CoachResponse> {
    const { data } = await apiClient.post<CoachResponse>('/coach/chat', {
        message: params.message,
        lang: params.lang,
        characterType: params.characterType,
        history: params.history.slice(-10),
        turnCount: params.turnCount,
        sessionId: params.sessionId,
    });
    return data;
}

export async function startCoachSession(params: {
    lang: Language;
    characterType: string;
}): Promise<CoachResponse> {
    const { data } = await apiClient.post<CoachResponse>('/coach/session/start', params);
    return data;
}

export async function submitEmotionCheckin(params: {
    emotion: string;
    text?: string;
    intensity: number;
}) {
    const { data } = await apiClient.post('/emotion/checkin', params);
    return data;
}
