import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const MEDITATION_TRACKS = [
  { id: 1, title: "Ocean Waves", duration: "5 min", icon: "water" as const, color: "#5B9BD5", category: "nature" },
  { id: 2, title: "Forest Rain", duration: "10 min", icon: "rainy" as const, color: "#7ED957", category: "nature" },
  { id: 3, title: "Gentle Stream", duration: "8 min", icon: "leaf" as const, color: "#4ECDC4", category: "nature" },
  { id: 4, title: "Mountain Wind", duration: "7 min", icon: "cloud" as const, color: "#9B97B0", category: "nature" },
  { id: 5, title: "Night Crickets", duration: "15 min", icon: "moon" as const, color: "#6366F1", category: "nature" },
  { id: 6, title: "Tibetan Bowls", duration: "10 min", icon: "musical-notes" as const, color: "#FFB347", category: "music" },
  { id: 7, title: "Crystal Tones", duration: "8 min", icon: "diamond" as const, color: "#A78BFA", category: "music" },
  { id: 8, title: "Zen Garden", duration: "12 min", icon: "flower" as const, color: "#FF9A8B", category: "music" },
  { id: 9, title: "Deep Space", duration: "15 min", icon: "planet" as const, color: "#3B82F6", category: "ambient" },
  { id: 10, title: "Warm Fireplace", duration: "10 min", icon: "flame" as const, color: "#F97316", category: "ambient" },
  { id: 11, title: "Morning Birds", duration: "7 min", icon: "sunny" as const, color: "#FBBF24", category: "nature" },
  { id: 12, title: "Binaural Focus", duration: "20 min", icon: "headset" as const, color: "#8B5CF6", category: "focus" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "nature", label: "Nature" },
  { key: "music", label: "Music" },
  { key: "ambient", label: "Ambient" },
  { key: "focus", label: "Focus" },
];

export default function MeditationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeCategory, setActiveCategory] = useState("all");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playingId) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playingId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const filtered = activeCategory === "all"
    ? MEDITATION_TRACKS
    : MEDITATION_TRACKS.filter((t) => t.category === activeCategory);

  const playingTrack = MEDITATION_TRACKS.find((t) => t.id === playingId);

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meditation</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: bottomInset + 100 }}
        >
          {playingTrack && (
            <View style={styles.nowPlaying}>
              <Animated.View style={[styles.nowPlayingCircle, { transform: [{ scale: pulseAnim }], backgroundColor: playingTrack.color + "20" }]}>
                <Ionicons name={playingTrack.icon} size={48} color={playingTrack.color} />
              </Animated.View>
              <Text style={styles.nowPlayingTitle}>{playingTrack.title}</Text>
              <Text style={styles.nowPlayingTimer}>{formatTime(timer)}</Text>
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={() => setPlayingId(null)}
              >
                <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
                <Text style={styles.stopBtnText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.categoryChip, activeCategory === c.key && styles.categoryActive]}
                onPress={() => setActiveCategory(c.key)}
              >
                <Text style={[styles.categoryText, activeCategory === c.key && styles.categoryTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Meditation Sounds</Text>
          <Text style={styles.sectionDesc}>Tap to play calming sounds for your meditation practice.</Text>

          {filtered.map((track) => {
            const isPlaying = playingId === track.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.trackCard, isPlaying && { borderColor: track.color, borderWidth: 2 }]}
                onPress={() => setPlayingId(isPlaying ? null : track.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.trackIcon, { backgroundColor: track.color + "15" }]}>
                  <Ionicons name={track.icon} size={24} color={track.color} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackDuration}>{track.duration}</Text>
                </View>
                <Ionicons
                  name={isPlaying ? "pause-circle" : "play-circle"}
                  size={36}
                  color={isPlaying ? track.color : "#9B97B0"}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.3,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    overflow: "hidden",
  },
  nowPlaying: {
    alignItems: "center",
    backgroundColor: "#F8F5FF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    gap: 12,
  },
  nowPlayingCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  nowPlayingTitle: {
    fontSize: 20, fontWeight: "700", color: "#2D2B3D",
  },
  nowPlayingTimer: {
    fontSize: 32, fontWeight: "800", color: "#5B7AE8", fontVariant: ["tabular-nums"],
  },
  stopBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FF6B6B", borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  stopBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  categoryBar: { marginBottom: 16, maxHeight: 44 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F0ECF8",
  },
  categoryActive: { backgroundColor: "#5B7AE8" },
  categoryText: { fontSize: 13, fontWeight: "600", color: "#9B97B0" },
  categoryTextActive: { color: "#FFFFFF" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2D2B3D", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#9B97B0", marginBottom: 16, lineHeight: 19 },
  trackCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#EDE8F5",
    shadowColor: "#7C6DC5", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  trackIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  trackInfo: { flex: 1, gap: 2 },
  trackTitle: { fontSize: 15, fontWeight: "700", color: "#2D2B3D" },
  trackDuration: { fontSize: 12, color: "#9B97B0" },
});
