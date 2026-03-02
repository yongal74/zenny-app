import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { AdBanner } from "@/components/AdBanner";

const COIN_PACKAGES = [
  { coins: 100, label: "100 Coins", price: "$0.99" },
  { coins: 500, label: "500 Coins", price: "$3.99" },
  { coins: 1200, label: "1,200 Coins", price: "$7.99" },
  { coins: 3000, label: "3,000 Coins", price: "$14.99" },
];

const CHAKRA_LEVELS = [
  { level: 1, name: "Root", color: Colors.chakra.root, meaning: "Stability & Foundation", range: "Lv 1–5" },
  { level: 2, name: "Sacral", color: Colors.chakra.sacral, meaning: "Emotions & Creativity", range: "Lv 6–10" },
  { level: 3, name: "Solar Plexus", color: Colors.chakra.solarPlexus, meaning: "Confidence & Willpower", range: "Lv 11–15" },
  { level: 4, name: "Heart", color: Colors.chakra.heart, meaning: "Love & Empathy", range: "Lv 16–20" },
  { level: 5, name: "Throat", color: Colors.chakra.throat, meaning: "Communication & Truth", range: "Lv 21–25" },
  { level: 6, name: "Third Eye", color: Colors.chakra.thirdEye, meaning: "Intuition & Insight", range: "Lv 26–30" },
  { level: 7, name: "Crown", color: Colors.chakra.crown, meaning: "Awakening & Connection", range: "Lv 31+" },
];

function getChakraStage(level: number) {
  if (level >= 31) return 6;
  if (level >= 26) return 5;
  if (level >= 21) return 4;
  if (level >= 16) return 3;
  if (level >= 11) return 2;
  if (level >= 6) return 1;
  return 0;
}

export default function GrowthScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCoinModal, setShowCoinModal] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8);

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/character"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: emotionLogs = [] } = useQuery({
    queryKey: ["emotionHistory"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/emotions"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: feelingLogs = [] } = useQuery({
    queryKey: ["feelingHistory"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/feelings"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const level = character?.level || 1;
  const chakraIdx = getChakraStage(level);
  const currentChakra = CHAKRA_LEVELS[chakraIdx];
  const totalExp = character?.totalExp || 0;
  const nextLevelExp = level * 100;
  const progress = Math.min((totalExp % nextLevelExp) / nextLevelExp, 1);

  const recentEmotionBubbles = emotionLogs.slice(0, 4).map((log: any) => {
    const emotions = Array.isArray(log.emotions) ? log.emotions : [];
    return emotions[0]?.type || "calm";
  });
  const recentFeelingBubbles = feelingLogs.slice(0, 4).map((log: any) => {
    const sensations = Array.isArray(log.sensations) ? log.sensations : [];
    return sensations[0] || "—";
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <Text style={styles.headerTitle}>Growth</Text>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: bottomInset + 100 }}
        >
          <View style={styles.forestCard}>
            <Text style={styles.forestTitle}>Your Inner Forest</Text>
            <View style={styles.quadrantGrid}>
              <View style={[styles.quadrant, { backgroundColor: "rgba(255,154,139,0.08)" }]}>
                <Text style={styles.quadrantLabel}>Emotions</Text>
                <View style={styles.bubblesArea}>
                  {recentEmotionBubbles.length > 0 ? recentEmotionBubbles.map((e: string, i: number) => (
                    <View key={i} style={[styles.speechBubble, { backgroundColor: Colors.emotions[e as keyof typeof Colors.emotions] || "#EDE8F5" }]}>
                      <Text style={styles.speechText}>{e}</Text>
                    </View>
                  )) : <Text style={styles.emptyText}>Log emotions to grow</Text>}
                </View>
              </View>
              <View style={[styles.quadrant, { backgroundColor: "rgba(167,139,250,0.08)" }]}>
                <Text style={styles.quadrantLabel}>Feelings</Text>
                <View style={styles.bubblesArea}>
                  {recentFeelingBubbles.length > 0 ? recentFeelingBubbles.map((f: string, i: number) => (
                    <View key={i} style={[styles.speechBubble, { backgroundColor: "#E8DEFF" }]}>
                      <Text style={styles.speechText}>{f}</Text>
                    </View>
                  )) : <Text style={styles.emptyText}>Log feelings to grow</Text>}
                </View>
              </View>
              <View style={[styles.quadrant, { backgroundColor: "rgba(126,217,87,0.08)" }]}>
                <Text style={styles.quadrantLabel}>Stress Mgmt</Text>
                <View style={styles.bubblesArea}>
                  <Text style={styles.growthValue}>{character?.stressManagement || 0}</Text>
                  <Text style={styles.emptyText}>points</Text>
                </View>
              </View>
              <View style={[styles.quadrant, { backgroundColor: "rgba(255,179,71,0.08)" }]}>
                <Text style={styles.quadrantLabel}>Spiritual</Text>
                <View style={styles.bubblesArea}>
                  <Text style={styles.growthValue}>{character?.spiritualGrowth || 0}</Text>
                  <Text style={styles.emptyText}>points</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.chakraCard}>
            <View style={styles.chakraHeader}>
              <View style={[styles.chakraDotLarge, { backgroundColor: currentChakra.color }]} />
              <View>
                <Text style={styles.chakraValue}>Chakra Level ({currentChakra.name})</Text>
                <Text style={styles.chakraSub}>{currentChakra.meaning}</Text>
              </View>
            </View>
          </View>

          <View style={styles.coinCard}>
            <View style={styles.coinHeader}>
              <Text style={{ fontSize: 28 }}>🪙</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.coinValue}>{character?.soulCoins || 0}</Text>
                <Text style={styles.coinLabel}>Soul Coins</Text>
              </View>
              <TouchableOpacity style={styles.getCoinBtn} onPress={() => setShowCoinModal(true)} activeOpacity={0.7}>
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.getCoinBtnText}>Get Coins</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push("/shop")} activeOpacity={0.7}>
            <View style={[styles.linkIcon, { backgroundColor: "rgba(91,122,232,0.1)" }]}>
              <Ionicons name="storefront" size={20} color="#5B7AE8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Soul Shop</Text>
              <Text style={styles.linkDesc}>Customize your Maumi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push("/wellness")} activeOpacity={0.7}>
            <View style={[styles.linkIcon, { backgroundColor: "rgba(255,154,139,0.1)" }]}>
              <Ionicons name="heart-circle" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Wellness Picks</Text>
              <Text style={styles.linkDesc}>Curated recommendations for you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <AdBanner variant="medium" />
        </ScrollView>
      </View>

      {showCoinModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Get Soul Coins</Text>
              <TouchableOpacity onPress={() => setShowCoinModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9B97B0" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>Soul Coins let you customize your Maumi with accessories, pets, and more!</Text>
            <View style={styles.currentCoins}>
              <Ionicons name="diamond" size={20} color="#FFD700" />
              <Text style={styles.currentCoinsText}>{character?.soulCoins || 0} coins</Text>
            </View>
            {COIN_PACKAGES.map((pkg, i) => (
              <TouchableOpacity key={i} style={styles.coinPkg} onPress={() => {
                Alert.alert(
                  "Get Soul Coins",
                  `Purchase ${pkg.label} for ${pkg.price}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Buy",
                      onPress: async () => {
                        try {
                          await fetch(getApiUrl("/api/coins/add"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ amount: pkg.coins, source: "purchase" }),
                          });
                          queryClient.invalidateQueries({ queryKey: ["character"] });
                          setShowCoinModal(false);
                          Alert.alert("Success!", `${pkg.coins} Soul Coins added!`);
                        } catch {
                          Alert.alert("Error", "Purchase failed. Try again.");
                        }
                      },
                    },
                  ]
                );
              }} activeOpacity={0.7}>
                <View style={styles.coinPkgLeft}>
                  <Ionicons name="diamond" size={24} color="#FFD700" />
                  <Text style={styles.coinPkgLabel}>{pkg.label}</Text>
                </View>
                <View style={styles.coinPkgPrice}>
                  <Text style={styles.coinPkgPriceText}>{pkg.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text style={styles.modalFooter}>You can also earn coins by logging emotions, feelings, and completing activities!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  contentWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    overflow: "hidden",
  },
  forestCard: { backgroundColor: "#F8F5FF", borderRadius: 20, padding: 16, marginBottom: 16 },
  forestTitle: { fontSize: 17, fontWeight: "700", color: "#2D2B3D", marginBottom: 12 },
  quadrantGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quadrant: { width: "48%", borderRadius: 14, padding: 12, minHeight: 100, flexGrow: 1 },
  quadrantLabel: { fontSize: 12, fontWeight: "700", color: "#2D2B3D", marginBottom: 8 },
  bubblesArea: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  speechBubble: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  speechText: { fontSize: 10, fontWeight: "600", color: "#2D2B3D", textTransform: "capitalize" },
  emptyText: { fontSize: 11, color: "#C4BFD6" },
  growthValue: { fontSize: 24, fontWeight: "800", color: "#2D2B3D" },
  chakraCard: { backgroundColor: "#F8F5FF", borderRadius: 20, padding: 20, marginBottom: 12 },
  chakraHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  chakraDotLarge: { width: 36, height: 36, borderRadius: 18 },
  chakraValue: { fontSize: 16, fontWeight: "800", color: "#2D2B3D" },
  chakraSub: { fontSize: 13, color: "#9B97B0", marginTop: 2 },
  coinCard: { backgroundColor: "#F8F5FF", borderRadius: 20, padding: 20, marginBottom: 12 },
  coinHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  coinValue: { fontSize: 28, fontWeight: "800", color: "#2D2B3D" },
  coinLabel: { fontSize: 13, color: "#9B97B0" },
  linkBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F5FF", borderRadius: 16, padding: 16, marginBottom: 10, gap: 14 },
  linkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  linkTitle: { fontSize: 15, fontWeight: "700", color: "#2D2B3D" },
  linkDesc: { fontSize: 12, color: "#9B97B0", marginTop: 1 },
  getCoinBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#5B7AE8", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  getCoinBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, justifyContent: "center", alignItems: "center" },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, width: "88%", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#2D2B3D" },
  modalDesc: { fontSize: 13, color: "#9B97B0", lineHeight: 19, marginBottom: 16 },
  currentCoins: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F8F5FF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16, justifyContent: "center" },
  currentCoinsText: { fontSize: 18, fontWeight: "700", color: "#2D2B3D" },
  coinPkg: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8F5FF", borderRadius: 14, padding: 14, marginBottom: 8 },
  coinPkgLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  coinPkgLabel: { fontSize: 16, fontWeight: "700", color: "#2D2B3D" },
  coinPkgPrice: { backgroundColor: "#5B7AE8", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  coinPkgPriceText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  modalFooter: { fontSize: 12, color: "#B0ABC0", textAlign: "center", marginTop: 12, lineHeight: 17 },
});
