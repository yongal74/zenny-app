export const COLORS = {
    bg: '#09090F',
    bg2: '#111118',
    surface: '#19191F',
    surface2: '#222230',

    text: '#E0E0E8',
    text2: '#8888A0',
    text3: '#505068',

    primary: '#3A3A55',
    accent: '#B8B8D8',
    gold: '#C8A860',
    teal: '#8888B8',

    border: '#28283A',
    bottomBar: '#060608',

    charGlow1: 'rgba(180,180,220,0.06)',
    charGlow2: 'rgba(180,180,220,0.10)',
    charGlow3: 'rgba(200,200,240,0.16)',

    gradient: {
        splash: ['#09090F', '#14141C', '#09090F'] as const,
        header: ['#111118', '#09090F'] as const,
        card: ['#19191F', '#14141C'] as const,
    },
} as const;
