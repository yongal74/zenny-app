import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Zenny DB...');

    // ─── 명상 트랙 초기 20개 (EN 10 + KO 10) ─────────────────
    const CDN = 'https://cdn.zenny.app/tracks';
    const MUSIC = 'https://cdn.zenny.app/music';

    await prisma.meditationTrack.createMany({
        skipDuplicates: true,
        data: [
            // ── EN 10개 ──
            { id: 'en-breath-box-01', title: '2-Min Box Breathing', titleKo: '박스 호흡 2분', type: 'breathing', emotion: 'stressed', lang: 'en', duration: 120, audioUrl: `${CDN}/en/breath-box-01.mp3`, musicUrl: `${MUSIC}/calm-focus-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-breath-478-01', title: '4-7-8 Anxiety Relief', titleKo: '4-7-8 불안 해소', type: 'breathing', emotion: 'anxious', lang: 'en', duration: 120, audioUrl: `${CDN}/en/breath-478-01.mp3`, musicUrl: `${MUSIC}/soft-rain-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-body-scan-01', title: 'Full Body Relaxation Scan', titleKo: '전신 이완 스캔', type: 'bodyscan', emotion: 'tired', lang: 'en', duration: 120, audioUrl: `${CDN}/en/body-scan-01.mp3`, musicUrl: `${MUSIC}/deep-calm-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-guided-love-01', title: 'Loving Kindness (Metta)', titleKo: '자애 명상', type: 'guided', emotion: 'lonely', lang: 'en', duration: 120, audioUrl: `${CDN}/en/loving-kindness-01.mp3`, musicUrl: `${MUSIC}/warm-glow-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-guided-zen-01', title: 'Zen Stillness', titleKo: '선 고요 명상', type: 'guided', emotion: 'stressed', lang: 'en', duration: 120, audioUrl: `${CDN}/en/zen-stillness-01.mp3`, musicUrl: `${MUSIC}/zen-bells-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-nature-rain-01', title: 'Rain Forest Calm', titleKo: '숲속 빗소리', type: 'nature', emotion: 'tired', lang: 'en', duration: 120, audioUrl: `${CDN}/en/rain-forest-01.mp3`, musicUrl: `${MUSIC}/forest-rain-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-nature-ocean-01', title: 'Ocean Waves Meditation', titleKo: '파도 소리 명상', type: 'nature', emotion: 'anxious', lang: 'en', duration: 120, audioUrl: `${CDN}/en/ocean-waves-01.mp3`, musicUrl: `${MUSIC}/ocean-calm-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-breath-pranayama-01', title: 'Pranayama Breathwork', titleKo: '프라나야마 호흡', type: 'breathing', emotion: 'confused', lang: 'en', duration: 120, audioUrl: `${CDN}/en/pranayama-01.mp3`, musicUrl: `${MUSIC}/deep-breath-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-guided-stoic-01', title: 'Stoic Morning Reflection', titleKo: '스토아 아침 명상', type: 'guided', emotion: 'sad', lang: 'en', duration: 120, audioUrl: `${CDN}/en/stoic-morning-01.mp3`, musicUrl: `${MUSIC}/morning-light-01.mp3`, weekCreated: '2026-W09' },
            { id: 'en-guided-gratitude-01', title: 'Gratitude Visualization', titleKo: '감사 시각화', type: 'guided', emotion: 'happy', lang: 'en', duration: 120, audioUrl: `${CDN}/en/gratitude-01.mp3`, musicUrl: `${MUSIC}/bright-joy-01.mp3`, weekCreated: '2026-W09' },

            // ── KO 10개 ──
            { id: 'ko-breath-box-01', title: 'Box Breathing 2분', titleKo: '박스 호흡 2분', type: 'breathing', emotion: 'stressed', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/breath-box-01.mp3`, musicUrl: `${MUSIC}/calm-focus-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-breath-478-01', title: '4-7-8 Breathing', titleKo: '4-7-8 불안 해소 호흡', type: 'breathing', emotion: 'anxious', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/breath-478-01.mp3`, musicUrl: `${MUSIC}/soft-rain-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-body-scan-01', title: 'Body Scan', titleKo: '전신 바디스캔', type: 'bodyscan', emotion: 'tired', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/body-scan-01.mp3`, musicUrl: `${MUSIC}/deep-calm-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-guided-love-01', title: 'Loving Kindness', titleKo: '자애 명상 (메타)', type: 'guided', emotion: 'lonely', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/loving-kindness-01.mp3`, musicUrl: `${MUSIC}/warm-glow-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-guided-zen-01', title: 'Zen Stillness', titleKo: '선(禪) 고요 명상', type: 'guided', emotion: 'stressed', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/zen-stillness-01.mp3`, musicUrl: `${MUSIC}/zen-bells-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-nature-rain-01', title: 'Rain Forest', titleKo: '숲속 빗소리', type: 'nature', emotion: 'tired', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/rain-forest-01.mp3`, musicUrl: `${MUSIC}/forest-rain-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-nature-ocean-01', title: 'Ocean Waves', titleKo: '파도 소리 명상', type: 'nature', emotion: 'anxious', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/ocean-waves-01.mp3`, musicUrl: `${MUSIC}/ocean-calm-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-breath-pranayama-01', title: 'Pranayama', titleKo: '프라나야마 호흡법', type: 'breathing', emotion: 'confused', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/pranayama-01.mp3`, musicUrl: `${MUSIC}/deep-breath-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-guided-cbt-01', title: 'CBT Morning', titleKo: 'CBT 기반 아침 명상', type: 'guided', emotion: 'sad', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/cbt-morning-01.mp3`, musicUrl: `${MUSIC}/morning-light-01.mp3`, weekCreated: '2026-W09' },
            { id: 'ko-guided-gratitude-01', title: 'Gratitude', titleKo: '감사 시각화 명상', type: 'guided', emotion: 'happy', lang: 'ko', duration: 120, audioUrl: `${CDN}/ko/gratitude-01.mp3`, musicUrl: `${MUSIC}/bright-joy-01.mp3`, weekCreated: '2026-W09' },
        ],
    });
    console.log('✅ 명상 트랙 20개 (EN 10 + KO 10) 생성 완료');

    // ─── 스킨 20종 ───────────────────────────────────────────────
    await prisma.shopItem.createMany({
        skipDuplicates: true,
        // 스킨: rare 10000~14000 / legendary 16000~22000
        data: [
            { id: 'skin_starlight',  name: '✨ Starlight',  type: 'skin', slot: 'skin', category: 'skin', price: 0,     rarity: 'common',    imageUrl: '', bgTheme: 'starlight', levelRequired: 1 },
            { id: 'skin_sakura',     name: '🌸 Sakura',     type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'sakura',    levelRequired: 2 },
            { id: 'skin_ocean',      name: '🌊 Ocean',      type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'ocean',     levelRequired: 2 },
            { id: 'skin_forest',     name: '🌿 Forest',     type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'forest',    levelRequired: 2 },
            { id: 'skin_aurora',     name: '🌌 Aurora',     type: 'skin', slot: 'skin', category: 'skin', price: 12000, rarity: 'rare',      imageUrl: '', bgTheme: 'aurora',    levelRequired: 4 },
            { id: 'skin_desert',     name: '🏜️ Desert',     type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'desert',    levelRequired: 3 },
            { id: 'skin_arctic',     name: '🧊 Arctic',     type: 'skin', slot: 'skin', category: 'skin', price: 12000, rarity: 'rare',      imageUrl: '', bgTheme: 'arctic',    levelRequired: 3 },
            { id: 'skin_zen_garden', name: '🪨 Zen Garden', type: 'skin', slot: 'skin', category: 'skin', price: 12000, rarity: 'rare',      imageUrl: '', bgTheme: 'zenGarden', levelRequired: 3 },
            { id: 'skin_neon_city',  name: '🌃 Neon City',  type: 'skin', slot: 'skin', category: 'skin', price: 14000, rarity: 'rare',      imageUrl: '', bgTheme: 'neonCity',  levelRequired: 4 },
            { id: 'skin_deep_sea',   name: '🐟 Deep Sea',   type: 'skin', slot: 'skin', category: 'skin', price: 14000, rarity: 'rare',      imageUrl: '', bgTheme: 'deepSea',   levelRequired: 4 },
            { id: 'skin_moonlight',  name: '🌙 Moonlight',  type: 'skin', slot: 'skin', category: 'skin', price: 12000, rarity: 'rare',      imageUrl: '', bgTheme: 'moonlight', levelRequired: 3 },
            { id: 'skin_sunfire',    name: '🔥 Sunfire',    type: 'skin', slot: 'skin', category: 'skin', price: 14000, rarity: 'rare',      imageUrl: '', bgTheme: 'sunfire',   levelRequired: 4 },
            { id: 'skin_bamboo',     name: '🎋 Bamboo',     type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'bamboo',    levelRequired: 2 },
            { id: 'skin_crystal',    name: '💎 Crystal',    type: 'skin', slot: 'skin', category: 'skin', price: 16000, rarity: 'legendary', imageUrl: '', bgTheme: 'crystal',   levelRequired: 5 },
            { id: 'skin_autumn',     name: '🍂 Autumn',     type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'autumn',    levelRequired: 2 },
            { id: 'skin_midnight',   name: '🌑 Midnight',   type: 'skin', slot: 'skin', category: 'skin', price: 18000, rarity: 'legendary', imageUrl: '', bgTheme: 'midnight',  levelRequired: 5 },
            { id: 'skin_cloud',      name: '☁️ Cloud',      type: 'skin', slot: 'skin', category: 'skin', price: 10000, rarity: 'rare',      imageUrl: '', bgTheme: 'cloud',     levelRequired: 2 },
            { id: 'skin_rainbow',    name: '🌈 Rainbow',    type: 'skin', slot: 'skin', category: 'skin', price: 18000, rarity: 'legendary', imageUrl: '', bgTheme: 'rainbow',   levelRequired: 5 },
            { id: 'skin_gold',       name: '👑 Gold',       type: 'skin', slot: 'skin', category: 'skin', price: 22000, rarity: 'legendary', imageUrl: '', bgTheme: 'gold',      levelRequired: 7 },
            { id: 'skin_cherry',     name: '🍒 Cherry',     type: 'skin', slot: 'skin', category: 'skin', price: 12000, rarity: 'rare',      imageUrl: '', bgTheme: 'cherry',    levelRequired: 3 },
        ],
    });
    console.log('✅ 스킨 20종 생성 완료');

    // ─── 악세사리 80종 (카테고리별 생성 함수) ────────────────────
    await createAccessories();
    console.log('✅ 악세사리 80종 생성 완료');

    // ─── 기본 퀘스트 정의 ────────────────────────────────────────
    await prisma.questDefinition.createMany({
        skipDuplicates: true,
        data: [
            { id: 'daily-breath', type: 'daily', title: '2-Min Breathing', titleKo: '2분 호흡하기', description: 'Complete a 2-minute breathing session', coinsReward: 20, expReward: 30, category: 'meditation' },
            { id: 'daily-checkin', type: 'daily', title: 'Log Your Emotion', titleKo: '감정 기록하기', description: 'Check in with Zen AI about your mood', coinsReward: 15, expReward: 20, category: 'checkin' },
            { id: 'daily-meditation', type: 'daily', title: 'Meditate 5 Minutes', titleKo: '5분 명상하기', description: 'Complete a guided meditation', coinsReward: 50, expReward: 50, category: 'meditation' },
            { id: 'weekly-streak', type: 'weekly', title: '7-Day Streak', titleKo: '7일 연속 달성', description: 'Keep your streak going for 7 days', coinsReward: 150, expReward: 200, category: 'habit' },
            { id: 'weekly-meditation', type: 'weekly', title: 'Meditate 5 Times', titleKo: '이번 주 5회 명상', description: 'Meditate 5 times this week', coinsReward: 100, expReward: 120, category: 'meditation' },
        ],
    });
    console.log('✅ 퀘스트 정의 5개 생성 완료');

    console.log('\n🎉 Seeding complete!');
}

// ─── 악세사리 (가격 1000단위) ──────────────────────────────────
// common: 1000~2000, rare: 3000~4000, legendary: 5000~8000
async function createAccessories() {
    // 악세사리: common 2000~4000 / rare 4000~6000 / legendary 8000~10000
    const hats = [
        { id: 'hat_flower_crown',   name: '🌸 Flower Crown',    price: 2000, rarity: 'common' },
        { id: 'hat_moon_headband',  name: '🌙 Moon Headband',   price: 2000, rarity: 'common' },
        { id: 'hat_star_crown',     name: '⭐ Star Crown',       price: 4000, rarity: 'common' },
        { id: 'hat_sage_hood',      name: '🧙 Sage Hood',        price: 4000, rarity: 'rare' },
        { id: 'hat_lotus_tiara',    name: '🪷 Lotus Tiara',      price: 6000, rarity: 'rare' },
        { id: 'hat_wizard',         name: '🎩 Wizard Hat',       price: 4000, rarity: 'rare' },
        { id: 'hat_halo',           name: '👼 Halo',             price: 6000, rarity: 'rare' },
        { id: 'hat_samurai',        name: '⛩️ Samurai Helm',     price: 6000, rarity: 'rare' },
        { id: 'hat_diamond_crown',  name: '💎 Diamond Crown',    price: 8000, rarity: 'legendary' },
        { id: 'hat_zen_bamboo',     name: '🎋 Zen Bamboo',       price: 2000, rarity: 'common' },
    ];
    const faces = [
        { id: 'face_crystal_glasses',   name: '🔮 Crystal Glasses',    price: 2000, rarity: 'common' },
        { id: 'face_third_eye',         name: '👁️ Third Eye Gem',       price: 4000, rarity: 'common' },
        { id: 'face_zen_blush',         name: '🌸 Zen Blush',           price: 2000, rarity: 'common' },
        { id: 'face_starry_eyes',       name: '✨ Starry Eyes',          price: 4000, rarity: 'rare' },
        { id: 'face_monocle',           name: '🎭 Sage Monocle',        price: 4000, rarity: 'rare' },
        { id: 'face_meditation_mark',   name: '🕉️ Meditation Mark',     price: 6000, rarity: 'rare' },
        { id: 'face_rainbow_blush',     name: '🌈 Rainbow Blush',       price: 8000, rarity: 'legendary' },
        { id: 'face_moon_tears',        name: '🌙 Moon Tears',          price: 4000, rarity: 'common' },
        { id: 'face_fire_eyes',         name: '🔥 Fire Eyes',           price: 6000, rarity: 'rare' },
        { id: 'face_nature_mark',       name: '🍃 Nature Mark',         price: 2000, rarity: 'common' },
    ];
    const bodies = [
        { id: 'body_starlight_robe',    name: '✨ Starlight Robe',      price: 4000, rarity: 'common' },
        { id: 'body_sakura_kimono',     name: '🌸 Sakura Kimono',       price: 6000, rarity: 'rare' },
        { id: 'body_cloud_cape',        name: '☁️ Cloud Cape',           price: 4000, rarity: 'common' },
        { id: 'body_zen_robe',          name: '🧘 Zen Robe',            price: 4000, rarity: 'common' },
        { id: 'body_warrior_armor',     name: '⚔️ Warrior Armor',       price: 6000, rarity: 'rare' },
        { id: 'body_mage_cloak',        name: '🪄 Mage Cloak',          price: 6000, rarity: 'rare' },
        { id: 'body_fox_vest',          name: '🦊 Fox Vest',            price: 6000, rarity: 'rare' },
        { id: 'body_aurora_cape',       name: '🌌 Aurora Cape',         price: 10000, rarity: 'legendary' },
        { id: 'body_nature_wrap',       name: '🌿 Nature Wrap',         price: 4000, rarity: 'common' },
        { id: 'body_ocean_mantle',      name: '🌊 Ocean Mantle',        price: 6000, rarity: 'rare' },
    ];
    const auras = [
        { id: 'bg_starlight_aura',  name: '✨ Starlight Aura',  price: 4000, rarity: 'rare' },
        { id: 'bg_flame_aura',      name: '🔥 Flame Aura',      price: 6000, rarity: 'rare' },
        { id: 'bg_ice_aura',        name: '🧊 Ice Aura',        price: 6000, rarity: 'rare' },
        { id: 'bg_nature_aura',     name: '🌿 Nature Aura',     price: 4000, rarity: 'rare' },
        { id: 'bg_cosmic_aura',     name: '🌌 Cosmic Aura',     price: 10000, rarity: 'legendary' },
        { id: 'bg_rainbow_aura',    name: '🌈 Rainbow Aura',    price: 10000, rarity: 'legendary' },
        { id: 'bg_moon_aura',       name: '🌙 Moon Aura',       price: 4000, rarity: 'rare' },
        { id: 'bg_sun_aura',        name: '☀️ Sun Aura',         price: 6000, rarity: 'rare' },
        { id: 'bg_zen_aura',        name: '🕉️ Zen Aura',        price: 6000, rarity: 'rare' },
        { id: 'bg_shadow_aura',     name: '🌑 Shadow Aura',     price: 6000, rarity: 'rare' },
    ];
    const staffs = [
        { id: 'hand_bamboo_staff',      name: '🎋 Bamboo Staff',    price: 2000, rarity: 'common' },
        { id: 'hand_crystal_ball',      name: '🔮 Crystal Ball',    price: 6000, rarity: 'rare' },
        { id: 'hand_prayer_beads',      name: '📿 Prayer Beads',    price: 2000, rarity: 'common' },
        { id: 'hand_lotus_scepter',     name: '🪷 Lotus Scepter',   price: 6000, rarity: 'rare' },
        { id: 'hand_moon_wand',         name: '🌙 Moon Wand',       price: 4000, rarity: 'common' },
        { id: 'hand_zen_bowl',          name: '🎵 Singing Bowl',    price: 4000, rarity: 'common' },
        { id: 'hand_fire_torch',        name: '🔥 Fire Torch',      price: 6000, rarity: 'rare' },
        { id: 'hand_nature_branch',     name: '🌿 Nature Branch',   price: 2000, rarity: 'common' },
        { id: 'hand_cosmic_staff',      name: '⭐ Cosmic Staff',     price: 10000, rarity: 'legendary' },
        { id: 'hand_book_wisdom',       name: '📖 Wisdom Book',     price: 4000, rarity: 'common' },
    ];
    const pets = [
        { id: 'pet_mini_dragon',    name: '🐉 Mini Dragon',    price: 10000, rarity: 'legendary' },
        { id: 'pet_firefly',        name: '✨ Firefly',         price: 4000,  rarity: 'common' },
        { id: 'pet_cloud_rabbit',   name: '☁️ Cloud Rabbit',    price: 6000,  rarity: 'rare' },
        { id: 'pet_lotus_fish',     name: '🐟 Lotus Fish',     price: 4000,  rarity: 'common' },
        { id: 'pet_moon_cat',       name: '🌙 Moon Cat',       price: 6000,  rarity: 'rare' },
        { id: 'pet_zen_turtle',     name: '🐢 Zen Turtle',     price: 4000,  rarity: 'common' },
        { id: 'pet_star_bird',      name: '🕊️ Star Bird',       price: 6000,  rarity: 'rare' },
        { id: 'pet_spirit_wolf',    name: '🐺 Spirit Wolf',    price: 10000, rarity: 'legendary' },
    ];
    const seasonal = [
        { id: 'seasonal_cherry_blossom',    name: '🌸 Cherry Blossom',  price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_snowflake',         name: '❄️ Winter Snowflake', price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_harvest_moon',      name: '🌕 Harvest Moon',    price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_new_year',          name: '🎆 New Year Spirit',  price: 10000, rarity: 'legendary' },
        { id: 'seasonal_spring_spirit',     name: '🌱 Spring Spirit',    price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_summer_wave',       name: '🌊 Summer Wave',      price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_autumn_leaves',     name: '🍁 Autumn Leaves',    price: 8000,  rarity: 'legendary' },
        { id: 'seasonal_winter_sage',       name: '🌨️ Winter Sage',      price: 10000, rarity: 'legendary' },
    ];

    const makeItems = (items: typeof hats, slot: string, category: string) =>
        items.map((item) => ({ ...item, type: 'accessory' as const, slot, category, imageUrl: '', levelRequired: 1 }));

    await prisma.shopItem.createMany({
        skipDuplicates: true,
        data: [
            ...makeItems(hats, 'hat', 'hat'),
            ...makeItems(faces, 'face', 'face'),
            ...makeItems(bodies, 'body', 'body'),
            ...makeItems(auras, 'bg', 'aura'),
            ...makeItems(staffs, 'body', 'hand'),
            ...makeItems(pets, 'pet', 'pet'),
            ...makeItems(seasonal, 'bg', 'seasonal'),
            // 나머지 14개 (모자 추가)
            ...Array.from({ length: 14 }, (_, i) => ({
                id: `accessory_extra_${i + 1}`,
                name: `Zen Accessory ${i + 1}`,
                type: 'accessory' as const,
                slot: 'hat',
                category: 'general',
                price: 1000 + i * 200,
                rarity: i < 7 ? 'common' : 'rare' as const,
                imageUrl: '',
                levelRequired: 1,
            })),
        ],
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
