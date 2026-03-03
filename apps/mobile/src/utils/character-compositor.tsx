/**
 * PNG 레이어 합성 유틸리티
 * 
 * 캐릭터는 다음 레이어 순서로 렌더링됩니다:
 *   1. bg      ─ 배경 테마
 *   2. body    ─ 캐릭터 기본 바디 (레벨별 다름)
 *   3. skin    ─ 스킨 오버레이
 *   4. bodyAcc ─ 바디 악세사리
 *   5. face    ─ 표정/얼굴 악세사리
 *   6. hat     ─ 모자
 *   7. pet     ─ 펫 (오른쪽 하단)
 *   8. aura    ─ 글로우 오라 (전체 위에)
 */

import React from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import type { CharacterType, ItemSlot } from '../types';

// CDN 베이스 URL (실제 배포 시 교체)
const CDN = process.env.EXPO_PUBLIC_CDN_URL ?? 'https://cdn.zenny.app/characters';

// ─── 레이어 경로 생성 ──────────────────────────────────────────
function getCharacterBodyUrl(type: CharacterType, level: number): string {
    return `${CDN}/${type}/lv${level}_body.png`;
}

function getSkinUrl(skinId: string): string {
    return `${CDN}/skins/${skinId}_overlay.png`;
}

function getAccessoryUrl(slot: ItemSlot, itemId: string): string {
    return `${CDN}/accessories/${slot}/${itemId}.png`;
}

function getBgUrl(bgTheme: string): string {
    return `${CDN}/backgrounds/${bgTheme}_bg.png`;
}

function getAuraUrl(itemId: string): string {
    return `${CDN}/accessories/aura/${itemId}.png`;
}

// ─── 레이어 스택 컴포넌트 ────────────────────────────────────
interface LayerProps {
    uri: string;
    style?: ImageStyle;
    zIndex?: number;
}

function Layer({ uri, style, zIndex = 1 }: LayerProps) {
    return (
        <Image
            source={{ uri }}
            style={[StyleSheet.absoluteFillObject, { zIndex }, style]}
            resizeMode="contain"
            // 이미지가 없으면 조용히 실패
            onError={() => {/* silent */ }}
        />
    );
}

// ─── 메인 컴포지터 ────────────────────────────────────────────
interface CharacterCompositorProps {
    characterType: CharacterType;
    level: number;
    equippedSkin?: string;
    equippedItems?: Partial<Record<ItemSlot, string | null>>;
    bgTheme?: string;
    size?: number;
    showBg?: boolean;
    style?: ViewStyle;
}

export function CharacterCompositor({
    characterType,
    level,
    equippedSkin = 'starlight',
    equippedItems = {},
    bgTheme = 'starlight',
    size = 200,
    showBg = true,
    style,
}: CharacterCompositorProps) {
    return (
        <View style={[{ width: size, height: size, position: 'relative' }, style]}>
            {/* Layer 1: 배경 */}
            {showBg && <Layer uri={getBgUrl(bgTheme)} zIndex={1} />}

            {/* Layer 2: 캐릭터 바디 (레벨별) */}
            <Layer uri={getCharacterBodyUrl(characterType, level)} zIndex={2} />

            {/* Layer 3: 스킨 오버레이 */}
            {equippedSkin && equippedSkin !== 'starlight' && (
                <Layer uri={getSkinUrl(equippedSkin)} zIndex={3} />
            )}

            {/* Layer 4: 바디 악세사리 */}
            {equippedItems.body && (
                <Layer uri={getAccessoryUrl('body', equippedItems.body)} zIndex={4} />
            )}

            {/* Layer 5: 얼굴 악세사리 */}
            {equippedItems.face && (
                <Layer uri={getAccessoryUrl('face', equippedItems.face)} zIndex={5} />
            )}

            {/* Layer 6: 모자 */}
            {equippedItems.hat && (
                <Layer uri={getAccessoryUrl('hat', equippedItems.hat)} zIndex={6} />
            )}

            {/* Layer 7: 펫 (우하단) */}
            {equippedItems.pet && (
                <Layer
                    uri={getAccessoryUrl('pet', equippedItems.pet)}
                    zIndex={7}
                    style={{ width: size * 0.35, height: size * 0.35, right: 0, bottom: 0, top: undefined, left: undefined }}
                />
            )}

            {/* Layer 8: 오라 글로우 (최상단) */}
            {equippedItems.bg && (
                <Layer uri={getAuraUrl(equippedItems.bg)} zIndex={8} />
            )}
        </View>
    );
}

// ─── 캐릭터 레벨별 설명 ───────────────────────────────────────
export const CHARACTER_LEVEL_INFO: Record<number, {
    name: string; nameKo: string;
    description: string; descriptionKo: string;
}> = {
    1: { name: 'Seed', nameKo: '씨앗', description: 'Your journey begins', descriptionKo: '여정이 시작됩니다' },
    2: { name: 'Sprout', nameKo: '새싹', description: 'Growing with every breath', descriptionKo: '매 호흡마다 성장해요' },
    3: { name: 'Blossom', nameKo: '꽃봉오리', description: 'Opening to new awareness', descriptionKo: '새로운 인식이 열립니다' },
    4: { name: 'Awakened', nameKo: '각성', description: 'Seeing clearly within', descriptionKo: '내면이 선명해집니다' },
    5: { name: 'Meditator', nameKo: '명상자', description: 'Flowing in stillness', descriptionKo: '고요 속에 흐릅니다' },
    6: { name: 'Practitioner', nameKo: '수련자', description: 'Walking the mindful path', descriptionKo: '마음챙김의 길을 걷습니다' },
    7: { name: 'Sage', nameKo: '현자', description: 'Wisdom radiates from within', descriptionKo: '내면의 지혜가 빛납니다' },
};

// ─── 스킨 → 배경 테마 매핑 ───────────────────────────────────
export const SKIN_TO_BG: Record<string, string> = {
    starlight: 'starlight',
    sakura: 'sakura',
    ocean: 'ocean',
    forest: 'forest',
    aurora: 'aurora',
    desert: 'desert',
    arctic: 'arctic',
    zen_garden: 'zenGarden',
    neon_city: 'neonCity',
    deep_sea: 'deepSea',
    moonlight: 'moonlight',
    sunfire: 'sunfire',
    bamboo: 'bamboo',
    crystal: 'crystal',
    autumn: 'autumn',
    midnight: 'midnight',
    cloud: 'cloud',
    rainbow: 'rainbow',
    gold: 'gold',
    cherry: 'cherry',
};
