import React, { useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Dimensions,
    Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants/colors';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TABS = ['Skins', 'Hat', 'Face', 'Body', 'Aura', 'Pet'] as const;
const SLOT_MAP: Record<string, string> = { Skins: 'skin', Hat: 'hat', Face: 'face', Body: 'body', Aura: 'bg', Pet: 'pet' };
const RARITY_COLOR: Record<string, string> = {
    common: COLORS.text3,
    rare: COLORS.accent,
    legendary: COLORS.gold,
};

interface CustomizeModalProps {
    visible: boolean;
    onClose: () => void;
}

export function CustomizeModal({ visible, onClose }: CustomizeModalProps) {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Skins');
    const { character, equipItem } = useCharacterStore();

    const slot = SLOT_MAP[activeTab];
    const itemType = activeTab === 'Skins' ? 'skin' : 'accessory';

    const { data: items = [] } = useQuery({
        queryKey: ['shopItems', itemType, slot],
        queryFn: async () => {
            const { data } = await apiClient.get('/shop/items', {
                params: { type: itemType, category: slot },
            });
            return data;
        },
        enabled: visible,
    });

    const handleEquip = useCallback(async (itemId: string) => {
        try {
            await apiClient.post('/character/equip', { itemId, slot });
            equipItem(slot as any, itemId);
        } catch (e) {
            console.error('Equip error:', e);
        }
    }, [slot, equipItem]);

    const handleBuy = useCallback(async (itemId: string, price: number) => {
        const coins = useCharacterStore.getState().zenCoins;
        if (coins < price) {
            Alert.alert('Zen Coins 부족', `${price - coins} 코인이 더 필요해요. 상점에서 구매하세요!`);
            return;
        }
        try {
            const { data } = await apiClient.post('/shop/purchase', { itemId });
            if (data.success) {
                useCharacterStore.getState().setZenCoins(data.remainingCoins);
            }
        } catch (e: any) {
            const msg = e?.response?.data?.error || '구매 실패';
            Alert.alert('오류', msg);
        }
    }, []);

    const equippedId = (character?.equippedItems as any)?.[slot] ?? null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.title}>✦ Customize</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Zen Coins 표시 */}
                <View style={styles.coinsRow}>
                    <Text style={styles.coinsLabel}>✦ Zen Coins</Text>
                    <Text style={styles.coinsValue}>{useCharacterStore.getState().zenCoins.toLocaleString()}</Text>
                </View>

                {/* 탭 */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 아이템 그리드 */}
                <FlatList
                    data={items}
                    numColumns={3}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.grid}
                    renderItem={({ item }) => {
                        const isEquipped = item.id === equippedId;
                        const isOwned = item.owned;

                        return (
                            <TouchableOpacity
                                style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}
                                onPress={() => isOwned ? handleEquip(item.id) : handleBuy(item.id, item.price)}
                                activeOpacity={0.8}
                            >
                                {/* 아이템 이모지/이미지 */}
                                <Text style={styles.itemEmoji}>{item.name.split(' ')[0]}</Text>

                                {/* 이름 */}
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.name.replace(/^[^\w\s]*\s*/, '')}
                                </Text>

                                {/* 가격 or 장착됨 */}
                                {isEquipped ? (
                                    <View style={styles.equippedBadge}>
                                        <Text style={styles.equippedText}>ON</Text>
                                    </View>
                                ) : isOwned ? (
                                    <Text style={styles.ownedText}>Owned</Text>
                                ) : (
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.priceText, { color: RARITY_COLOR[item.rarity] ?? COLORS.text }]}>
                                            ✦ {item.price.toLocaleString()}
                                        </Text>
                                    </View>
                                )}

                                {/* 레어도 */}
                                <View style={[styles.rarityDot, { backgroundColor: RARITY_COLOR[item.rarity] ?? COLORS.border }]} />
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
    title: { fontSize: 20, fontFamily: 'Fraunces_500Medium', color: COLORS.text },
    closeBtn: { width: 36, height: 36, backgroundColor: COLORS.surface, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    closeText: { fontSize: 14, fontWeight: '600', color: COLORS.text2 },

    coinsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.surface, padding: 12, borderRadius: 12 },
    coinsLabel: { fontSize: 14, color: COLORS.gold, fontFamily: 'DMSans_600SemiBold' },
    coinsValue: { fontSize: 18, color: COLORS.gold, fontFamily: 'DMSans_700Bold' },

    tabBar: { flexGrow: 0, marginBottom: 16 },
    tabBarContent: { paddingHorizontal: 16, gap: 8 },
    tab: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center' },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: COLORS.text3 },
    tabTextActive: { color: COLORS.text },

    grid: { paddingHorizontal: 12, paddingBottom: 40, gap: 10 },

    itemCard: {
        flex: 1,
        margin: 4,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
        position: 'relative',
    },
    itemCardEquipped: { borderColor: COLORS.accent },
    itemCardLocked: { opacity: 0.5 },
    itemEmoji: { fontSize: 28, marginBottom: 2 },
    itemName: { fontSize: 10, textAlign: 'center', color: COLORS.text2, fontFamily: 'DMSans_400Regular' },

    equippedBadge: { backgroundColor: 'rgba(200,200,240,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    equippedText: { fontSize: 10, color: COLORS.accent, fontFamily: 'DMSans_700Bold' },
    ownedText: { fontSize: 10, color: COLORS.text3, fontFamily: 'DMSans_400Regular' },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    priceText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold' },

    rarityDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },
});
