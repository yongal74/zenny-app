import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { ACCESSORY_IMAGES } from "@/constants/accessories";

type Category = "all" | "hat" | "glasses" | "sunglasses" | "clothes" | "bag" | "badge" | "wings" | "pet";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "grid" },
  { key: "hat", label: "Hats", icon: "baseball" },
  { key: "glasses", label: "Glasses", icon: "glasses" },
  { key: "sunglasses", label: "Sunglasses", icon: "sunny" },
  { key: "clothes", label: "Clothes", icon: "shirt" },
  { key: "bag", label: "Bags", icon: "bag-handle" },
  { key: "badge", label: "Badges", icon: "ribbon" },
  { key: "wings", label: "Wings", icon: "sparkles" },
  { key: "pet", label: "Pets", icon: "paw" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#9B97B0",
  rare: "#6B9FE8",
  epic: "#A78BFA",
  legendary: "#FFB347",
};

const COIN_PACKAGES = [
  { coins: 100, label: "100 Coins", price: "$0.99" },
  { coins: 500, label: "500 Coins", price: "$3.99" },
  { coins: 1200, label: "1,200 Coins", price: "$7.99" },
  { coins: 3000, label: "3,000 Coins", price: "$14.99" },
];

export default function ShopScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [showCoinModal, setShowCoinModal] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: shopItems = [] } = useQuery({
    queryKey: ["shopItems"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/shop"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: ownedItems = [] } = useQuery({
    queryKey: ["ownedItems"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/shop/owned"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/character"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const purchase = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(getApiUrl("/api/shop/purchase"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Purchase failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopItems"] });
      queryClient.invalidateQueries({ queryKey: ["ownedItems"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      Alert.alert("Purchased!", "Item added to your collection");
    },
    onError: (err: Error) => {
      Alert.alert("Oops", err.message);
    },
  });

  const equip = useMutation({
    mutationFn: async ({ itemId, category }: { itemId: number; category: string }) => {
      const res = await fetch(getApiUrl("/api/shop/equip"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, category }),
      });
      if (!res.ok) throw new Error("Equip failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownedItems"] });
      queryClient.invalidateQueries({ queryKey: ["equippedItems"] });
    },
  });

  const handleBuyCoinPackage = (pkg: typeof COIN_PACKAGES[0]) => {
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
  };

  const ownedMap = new Map<number, any>();
  ownedItems.forEach((i: any) => ownedMap.set(i.itemId, i));
  const filtered = activeCategory === "all" ? shopItems : shopItems.filter((i: any) => i.category === activeCategory);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soul Shop</Text>
          <TouchableOpacity style={styles.coinBadge} onPress={() => setShowCoinModal(true)}>
            <Ionicons name="diamond" size={16} color="#FFD700" />
            <Text style={styles.coinText}>{character?.soulCoins || 0}</Text>
            <Ionicons name="add-circle" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 20 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.key}
              style={[styles.categoryChip, activeCategory === c.key && styles.categoryActive]}
              onPress={() => setActiveCategory(c.key)}>
              <Ionicons name={c.icon as any} size={16} color={activeCategory === c.key ? "#FFFFFF" : "#9B97B0"} />
              <Text style={[styles.categoryChipText, activeCategory === c.key && { color: "#FFFFFF" }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.itemGrid} showsVerticalScrollIndicator={false}>
          {filtered.map((item: any) => {
            const ownedItem = ownedMap.get(item.id);
            const owned = !!ownedItem;
            const isEquipped = ownedItem?.equipped === true;
            const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            const accessoryImg = item.imageAsset ? ACCESSORY_IMAGES[item.imageAsset] : null;
            return (
              <View key={item.id} style={[styles.itemCard, owned && { borderColor: "#5B7AE8" + "40" }, isEquipped && { borderColor: "#5B7AE8", backgroundColor: "#F8F5FF" }]}>
                <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                {accessoryImg ? (
                  <Image source={accessoryImg} style={styles.itemImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.itemEmoji}>{item.imageEmoji}</Text>
                )}
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                <View style={[styles.rarityLabel, { backgroundColor: rarityColor + "15" }]}>
                  <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity}</Text>
                </View>
                {owned ? (
                  <TouchableOpacity
                    style={[styles.equipBtn, isEquipped && styles.equippedBtn]}
                    onPress={() => equip.mutate({ itemId: item.id, category: item.category })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={isEquipped ? "checkmark-circle" : "shirt-outline"} size={14} color={isEquipped ? "#FFFFFF" : "#5B7AE8"} />
                    <Text style={[styles.equipBtnText, isEquipped && { color: "#FFFFFF" }]}>{isEquipped ? "Equipped" : "Equip"}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => {
                      const coins = character?.soulCoins || 0;
                      if (coins < item.price) {
                        Alert.alert(
                          "Not Enough Coins",
                          `You need ${item.price - coins} more Soul Coins.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Get Coins", onPress: () => setShowCoinModal(true) },
                          ]
                        );
                        return;
                      }
                      purchase.mutate(item.id);
                    }}
                    disabled={purchase.isPending}>
                    <Ionicons name="diamond" size={14} color="#FFD700" />
                    <Text style={styles.buyBtnText}>{item.price}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={{ height: bottomInset + 40 }} />
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
              <TouchableOpacity key={i} style={styles.coinPkg} onPress={() => handleBuyCoinPackage(pkg)} activeOpacity={0.7}>
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
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  header: { paddingBottom: 40, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.3 },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  coinText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  contentWrap: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20, overflow: "hidden" },
  categoryBar: { maxHeight: 64, marginBottom: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0ECF8" },
  categoryActive: { backgroundColor: "#5B7AE8" },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: "#9B97B0" },
  itemGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, paddingTop: 8 },
  itemCard: { width: "47%", borderRadius: 16, backgroundColor: "#FFFFFF", padding: 14, alignItems: "center", gap: 6, flexGrow: 1, maxWidth: "48%", shadowColor: "#7C6DC5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1, borderWidth: 1.5, borderColor: "#EDE8F5" },
  rarityDot: { position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  itemImage: { width: 48, height: 48 },
  itemEmoji: { fontSize: 36 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#2D2B3D", textAlign: "center" },
  itemDesc: { fontSize: 11, textAlign: "center", lineHeight: 16, color: "#9B97B0" },
  rarityLabel: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  rarityText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  buyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#5B7AE8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 4 },
  buyBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  equipBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(91,122,232,0.1)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, marginTop: 4 },
  equippedBtn: { backgroundColor: "#5B7AE8" },
  equipBtnText: { color: "#5B7AE8", fontSize: 12, fontWeight: "700" },
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
