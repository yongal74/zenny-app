import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { CustomizeModal } from '../../components/character/CustomizeModal';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';

const COIN_PACKAGES = [
  { id: 'coins-100', label: '100 Zen Coins', coins: 100, price: '$0.99', emoji: '✦' },
  { id: 'coins-500', label: '500 Zen Coins', coins: 500, price: '$3.99', emoji: '💎', popular: true },
  { id: 'coins-1200', label: '1,200 Zen Coins', coins: 1200, price: '$7.99', emoji: '🌟' },
  { id: 'coins-3000', label: '3,000 Zen Coins', coins: 3000, price: '$14.99', emoji: '👑' },
];

export function ShopScreen() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { lang, zenCoins } = useCharacterStore();

  const handleBuyCoins = async (pkg: typeof COIN_PACKAGES[0]) => {
    setPurchasing(pkg.id);
    try {
      const { data } = await apiClient.post('/polar/checkout', {
        productKey: pkg.id,
        coins: pkg.coins,
      });
      if (data.checkoutUrl) {
        Linking.openURL(data.checkoutUrl);
      } else {
        Alert.alert(
          lang === 'ko' ? '결제 준비 중' : 'Payment Setup',
          lang === 'ko' ? '결제 기능이 곧 활성화됩니다.' : 'Payment will be available soon.'
        );
      }
    } catch (e: any) {
      Alert.alert(
        lang === 'ko' ? '오류' : 'Error',
        lang === 'ko' ? '결제 페이지를 열 수 없습니다.' : 'Could not open checkout.'
      );
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{lang === 'ko' ? '💎 상점' : '💎 Shop'}</Text>
        </View>

        <View style={s.balanceCard}>
          <View style={s.balanceLeft}>
            <Text style={s.balanceLabel}>{lang === 'ko' ? '보유 Zen Coins' : 'Your Zen Coins'}</Text>
            <Text style={s.balanceAmount}>✦ {zenCoins.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.customizeCard} onPress={() => setShowCustomize(true)} activeOpacity={0.85}>
          <View style={s.customizeLeft}>
            <Text style={s.customizeEmoji}>✿</Text>
            <View>
              <Text style={s.customizeTitle}>{lang === 'ko' ? '캐릭터 꾸미기' : 'Customize Character'}</Text>
              <Text style={s.customizeSub}>{lang === 'ko' ? '스킨 · 악세사리 · 오라 · 펫' : 'Skins · Accessories · Aura · Pets'}</Text>
            </View>
          </View>
          <Text style={s.arrowText}>→</Text>
        </TouchableOpacity>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{lang === 'ko' ? '💰 Zen Coins 구매' : '💰 Buy Zen Coins'}</Text>
          <Text style={s.sectionSub}>
            {lang === 'ko'
              ? '코인으로 스킨, 악세사리, 오라를 구매할 수 있어요'
              : 'Use coins to buy skins, accessories, and auras'}
          </Text>

          {COIN_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[s.coinPackage, pkg.popular && s.coinPackagePopular]}
              onPress={() => handleBuyCoins(pkg)}
              activeOpacity={0.85}
              disabled={purchasing === pkg.id}
            >
              {pkg.popular && (
                <View style={s.popularBadge}>
                  <Text style={s.popularText}>{lang === 'ko' ? '인기' : 'BEST'}</Text>
                </View>
              )}
              <View style={s.coinPackageLeft}>
                <Text style={s.coinPackageEmoji}>{pkg.emoji}</Text>
                <View>
                  <Text style={s.coinPackageLabel}>{pkg.label}</Text>
                </View>
              </View>
              <View style={s.coinPackagePriceBtn}>
                <Text style={s.coinPackagePrice}>{pkg.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.infoText}>
            {lang === 'ko'
              ? '🎮 매일 퀘스트를 완료하면 무료 코인을 받을 수 있어요!'
              : '🎮 Complete daily quests to earn free coins!'}
          </Text>
        </View>
      </ScrollView>

      <CustomizeModal visible={showCustomize} onClose={() => setShowCustomize(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Fraunces_500Medium', color: COLORS.text },

  balanceCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(200,168,96,0.12)',
    borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: 'rgba(200,168,96,0.25)',
  },
  balanceLeft: { gap: 4 },
  balanceLabel: { fontSize: 12, color: COLORS.gold, fontFamily: 'DMSans_600SemiBold' },
  balanceAmount: { fontSize: 28, color: COLORS.gold, fontFamily: 'DMSans_700Bold' },

  customizeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 24, backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  customizeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  customizeEmoji: { fontSize: 32 },
  customizeTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: COLORS.text, marginBottom: 2 },
  customizeSub: { fontSize: 12, color: COLORS.text2, fontFamily: 'DMSans_400Regular' },
  arrowText: { fontSize: 18, color: COLORS.accent },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: COLORS.text, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: COLORS.text3, fontFamily: 'DMSans_400Regular', marginBottom: 16 },

  coinPackage: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent', position: 'relative',
  },
  coinPackagePopular: { borderColor: COLORS.gold, backgroundColor: 'rgba(200,168,96,0.08)' },
  coinPackageLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coinPackageEmoji: { fontSize: 28 },
  coinPackageLabel: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: COLORS.text },
  coinPackagePriceBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },
  coinPackagePrice: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#FFFFFF' },
  popularBadge: {
    position: 'absolute', top: -8, right: 14,
    backgroundColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8,
  },
  popularText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#09090F' },

  infoText: {
    fontSize: 13, color: COLORS.text3, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12,
  },
});
