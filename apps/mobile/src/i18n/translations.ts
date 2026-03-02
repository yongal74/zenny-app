// i18n 영문/한국어 번역 (i18next)
export const i18nResources = {
    en: {
        translation: {
            // 공통
            common: {
                back: '← Back',
                close: '✕',
                confirm: 'Confirm',
                cancel: 'Cancel',
                loading: 'Loading...',
            },

            // 네비게이션 탭
            nav: {
                home: 'Home',
                quest: 'Quest',
                coach: 'Zen AI',
                shop: 'Shop',
            },

            // 홈 화면
            home: {
                greeting: 'Good day ✨',
                zenCoins: '✦ Zen Coins',
                todayFeel: 'How are you feeling today?',
                talkCoach: '✿ Talk with Zen AI',
                dailyQuests: 'Daily Quests',
                questReward: '✦ {{coins}}',
            },

            // AI 코치
            coach: {
                placeholder: 'Type a message...',
                welcome: 'Hi there 🌟 How are you feeling right now?',
                customize: '✦ Customize',
                typing: '...',
                aiMeta: 'Zen AI',
            },

            // 캐릭터 레벨 이름
            level: {
                1: 'Seed',
                2: 'Sprout',
                3: 'Blossom',
                4: 'Awakened',
                5: 'Meditator',
                6: 'Practitioner',
                7: 'Sage',
            },

            // 감정 퀵리플라이
            emotions: {
                happy: '😊 Happy',
                anxious: '😰 Anxious',
                tired: '😴 Tired',
                stressed: '😤 Stressed',
                sad: '😢 Sad',
                confused: '🤷 Not sure',
            },

            // 온보딩
            onboarding: {
                title: 'Choose your companion',
                freeBadge: '3 free · 2 unlock at Lv.3',
                selectBtn: 'Select {{name}} {{emoji}}',
                selectPrompt: 'Select a character',
                beginJourney: 'Begin Journey ✦',
                levelBadge: 'Lv.1 Seed — Your journey begins 🌱',
            },

            // 로그인
            auth: {
                login: 'Sign In',
                register: 'Sign Up',
                email: 'Email',
                password: 'Password',
                loginBtn: 'Sign In ✦',
                registerBtn: 'Get Started ✦',
                tagline: 'Your Zen Companion',
            },

            // 숍
            shop: {
                title: '💎 Zen Shop',
                tabs: {
                    skins: 'Skins',
                    hat: 'Hat',
                    face: 'Face',
                    body: 'Body',
                    aura: 'Aura',
                    pet: 'Pet',
                },
                owned: 'Owned',
                equipped: 'ON',
                buy: '✦ {{price}}',
                notEnough: 'Not enough Zen Coins',
            },

            // 명상 플레이어
            meditation: {
                complete: 'Complete session to earn 10–50 Zen Coins ✦',
                breathPatterns: {
                    box: 'Box Breathing',
                    '4-7-8': '4-7-8 Breathing',
                    coherent: 'Coherent',
                    pranayama: 'Pranayama',
                },
                phases: {
                    Inhale: 'Inhale',
                    Hold: 'Hold',
                    Exhale: 'Exhale',
                },
            },
        },
    },

    ko: {
        translation: {
            common: {
                back: '← 뒤로',
                close: '✕',
                confirm: '확인',
                cancel: '취소',
                loading: '로딩 중...',
            },
            nav: {
                home: '홈',
                quest: '퀘스트',
                coach: 'Zen AI',
                shop: '상점',
            },
            home: {
                greeting: '좋은 하루예요 ✨',
                zenCoins: '✦ Zen 코인',
                todayFeel: '오늘 기분이 어때요?',
                talkCoach: '✿ Zen AI와 대화하기',
                dailyQuests: '오늘의 퀘스트',
                questReward: '✦ {{coins}}',
            },
            coach: {
                placeholder: '메시지를 입력하세요...',
                welcome: '안녕하세요 🌟 지금 기분이 어때요?',
                customize: '✦ 꾸미기',
                typing: '...',
                aiMeta: 'Zen AI',
            },
            level: {
                1: '씨앗',
                2: '새싹',
                3: '꽃봉오리',
                4: '각성',
                5: '명상자',
                6: '수련자',
                7: '현자',
            },
            emotions: {
                happy: '😊 행복해요',
                anxious: '😰 불안해요',
                tired: '😴 피곤해요',
                stressed: '😤 스트레스',
                sad: '😢 슬퍼요',
                confused: '🤷 잘 모르겠어요',
            },
            onboarding: {
                title: '당신의 명상 친구를 선택하세요',
                freeBadge: '3종 무료 · 2종은 Lv.3 이후 해금',
                selectBtn: '{{name}} {{emoji}} 선택',
                selectPrompt: '캐릭터를 선택하세요',
                beginJourney: '시작하기 ✦',
                levelBadge: 'Lv.1 씨앗 — 여정이 시작됩니다 🌱',
            },
            auth: {
                login: '로그인',
                register: '회원가입',
                email: '이메일',
                password: '비밀번호',
                loginBtn: '로그인 ✦',
                registerBtn: '시작하기 ✦',
                tagline: '당신의 명상 친구',
            },
            shop: {
                title: '💎 Zen 상점',
                tabs: {
                    skins: '스킨',
                    hat: '모자',
                    face: '얼굴',
                    body: '바디',
                    aura: '오라',
                    pet: '펫',
                },
                owned: '보유중',
                equipped: '착용',
                buy: '✦ {{price}}',
                notEnough: 'Zen 코인이 부족해요',
            },
            meditation: {
                complete: '세션 완료 시 10-50 Zen Coins 지급됩니다 ✦',
                breathPatterns: {
                    box: '박스 호흡',
                    '4-7-8': '4-7-8 호흡',
                    coherent: '코히어런트',
                    pranayama: '프라나야마',
                },
                phases: {
                    Inhale: '들이쉬기',
                    Hold: '멈추기',
                    Exhale: '내쉬기',
                },
            },
        },
    },
} as const;
