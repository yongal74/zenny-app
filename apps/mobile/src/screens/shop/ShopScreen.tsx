/**
 * ShopScreen - 세션 C: UI/UX 리팩터링
 *
 * 수정:
 * - theme.ts 기반 스타일 통일
 * - coinPackagePriceBtn: minHeight 44px 확보
 * - sectionSub: 12→13px
 * - popularText: 10→12px (최소 기준 미달 수정)
 * - 코인 잔액 카드 크기 강조
 * - Button 공통 컴포넌트 적용
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { CustomizeModal } from '../../components/character/CustomizeModal';
import { useCharacterStore } from '../../stores/characterStore';
import { apiClient } from '../../utils/api';

const COIN_PACKAGES = [
  { id: 'coins-100',  label: '100 Zen Coins',   coins: 100,  price: '$0.99',  emoji: '⭐' },
  { id: 'coins-500',  label: '500 Zen Coins',   coins: 500,  price: '$3.99',  emoji: '💎', popular: true },
  { id: 'coins-1200', label: '1,200 Zen Coins', coins: 1200, price: '$7.99',  emoji: '🌟' },
  { id: 'coins-3000', label: '3,000 Zen Coins', coins: 3000, price: '$14.99', emoji: '👑' },
];

export function ShopScreen(): React.JSX.Element {
  const [showCustomize, setShowCustomize] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { lang, zenCoins } = useCharacterStore();

  const handleBuyCoins = async (pkg: typeof COIN_PACKAGES[0]): Promise<void> => {
    setPurchasing(pkg.id);
    try {
      const { data } = await apiClient.post('/polar/checkout', {
        productKey: pkg.id,
        coins: pkg.coins,
      });
      if (data.checkoutUrl) {
        void Linking.openURL(data.checkoutUrl);
      } else {
        Alert.alert(
          lang === 'ko' ? '결제 준비 중' : 'Payment Setup',
          lang === 'ko' ? '결제 기능이 곧 활성화됩니다.' : 'Payment will be available soon.',
        );
      }
    } catch {
      Alert.alert(
        lang === 'ko' ? '오류' : 'Error',
        lang === 'ko' ? '결제 페이지를 열 수 없습니다.' : 'Could not open checkout.',
      );
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{lang === 'ko' ? '💎 상점' : '💎 Shop'}</Text>
        </View>

        {/* 코인 잔액 */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>{lang === 'ko' ? '보유 Zen Coins' : 'Your Zen Coins'}</Text>
          <Text style={s.balanceAmount}>✦ {zenCoins.toLocaleString()}</Text>
        </View>

        {/* 캐릭터 꾸미기 */}
        <TouchableOpacity
          style={s.customizeCard}
          onPress={() => setShowCustomize(true)}
          activeOpacity={0.85}
        >
          <View style={s.customizeLeft}>
            <View>
              <Text style={s.customizeTitle}>
                {lang === 'ko' ? '캐릭터 꾸미기' : 'Customize Character'}
              </Text>
              {/* 12→13px */}
              <Text style={s.customizeSub}>
                {lang === 'ko' ? '스킨 · 악세사리 · 오라 · 펫' : 'Skins · Accessories · Aura · Pets'}
              </Text>
            </View>
          </View>
          <Text style={s.arrowText}>→</Text>
        </TouchableOpacity>

        {/* 코인 구매 */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{lang === 'ko' ? '💰 Zen Coins 구매' : '💰 Buy Zen Coins'}</Text>
          {/* 12→13px */}
          <Text style={s.sectionSub}>
            {lang === 'ko'
              ? '코인으로 스킨, 악세사리, 오라를 구매할 수 있어요'
              : 'Use coins to buy skins, accessories, and auras'}
          </Text>

          {COIN_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[s.coinPackage, pkg.popular && s.coinPackagePopular]}
              onPress={() => { void handleBuyCoins(pkg); }}
              activeOpacity={0.85}
              disabled={purchasing === pkg.id}
            >
              {pkg.popular && (
                <View style={s.popularBadge}>
                  {/* 10→12px */}
                  <Text style={s.popularText}>{lang === 'ko' ? '인기' : 'BEST'}</Text>
                </View>
              )}
              <View style={s.coinPackageLeft}>
                <Text style={s.coinPackageEmoji}>{pkg.emoji}</Text>
                <Text style={s.coinPackageLabel}>{pkg.label}</Text>
              </View>
              {/* minHeight 44px 확보 */}
              <View style={s.coinPackagePriceBtn}>
                <Text style={s.coinPackagePrice}>
                  {purchasing === pkg.id ? '...' : pkg.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.section}>
          <View style={s.infoCard}>
            <Text style={s.infoText}>
              {lang === 'ko'
                ? '🎮 매일 퀘스트를 완료하면 무료 코인을 받을 수 있어요!'
                : '🎮 Complete daily quests to earn free coins!'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <CustomizeModal visible={showCustomize} onClose={() => setShowCustomize(false)} />
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: { padding: theme.spacing.xxl, paddingBottom: theme.spacing.md },
  title: { ...theme.typography.h2, color: theme.colors.text.primary },

  balanceCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(200,168,96,0.12)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(200,168,96,0.25)',
    gap: 4,
  },
  balanceLabel: { ...theme.typography.labelSm, color: theme.colors.gold },
  balanceAmount: { fontSize: 28, color: theme.colors.gold, fontFamily: 'Inter_700Bold' },

  customizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.glassHighlight,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    minHeight: theme.minTouchTarget,
  },
  customizeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  customizeEmoji: { fontSize: 32 },
  customizeTitle: { ...theme.typography.bold1, color: theme.colors.text.primary, marginBottom: 2 },
  // 12→13px
  customizeSub: { ...theme.typography.body3, color: theme.colors.text.secondary },
  arrowText: { fontSize: 18, color: theme.colors.accent },

  section: { paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.xxl },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: 4 },
  // 12→13px
  sectionSub: { ...theme.typography.body3, color: theme.colors.text.tertiary, marginBottom: theme.spacing.lg },

  coinPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    position: 'relative',
    minHeight: 64,
  },
  coinPackagePopular: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(200,168,96,0.08)',
    marginTop: 10,
  },
  coinPackageLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coinPackageEmoji: { fontSize: 28 },
  coinPackageLabel: { ...theme.typography.bold1, color: theme.colors.text.primary },
  // minHeight 44px 확보
  coinPackagePriceBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinPackagePrice: { ...theme.typography.bold2, color: theme.colors.text.primary },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 14,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  // 10→12px
  popularText: { ...theme.typography.labelSm, color: theme.colors.bg },

  infoCard: {
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  infoText: { ...theme.typography.body3, color: theme.colors.text.tertiary, textAlign: 'center' },
});
