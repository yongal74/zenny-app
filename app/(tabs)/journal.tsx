import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { AdBanner } from "@/components/AdBanner";

const ACTIVITIES = [
  { key: "breath", label: "Breathing", exp: 30 },
  { key: "meditation", label: "Meditation", exp: 25 },
  { key: "gratitude", label: "Gratitude", exp: 25 },
  { key: "water", label: "Drink Water", exp: 15 },
  { key: "stretch", label: "Stretch", exp: 20 },
  { key: "etc", label: "Etc.", exp: 10 },
];

export default function JournalScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8);
  const [journalText, setJournalText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/character"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/dashboard"));
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

  const completeActivity = useMutation({
    mutationFn: async (activity: typeof ACTIVITIES[0]) => {
      const res = await fetch(getApiUrl(`/api/quests/${activity.key}/complete`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_data, activity) => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      Alert.alert("Done!", `+${activity.exp} XP earned!`);
    },
  });

  const saveJournal = async () => {
    if (!journalText.trim()) return;
    setIsSaving(true);
    try {
      await fetch(getApiUrl("/api/emotions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotions: [{ type: "calm", intensity: 3 }], tags: ["journal"], note: journalText.trim() }),
      });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["emotionHistory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setJournalText("");
      Alert.alert("Saved!", "Your journal entry has been logged. +20 XP!");
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = dashboard || { totalEmotionLogs: 0, totalFeelingLogs: 0, totalQuests: 0, streak: 0 };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <Text style={styles.headerTitle}>Journal</Text>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: bottomInset + 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.journalBox}>
            <Text style={styles.journalLabel}>Write a journal entry</Text>
            <TextInput
              style={styles.journalInput}
              placeholder="How are you feeling today? What's on your mind..."
              placeholderTextColor="#A9A3C0"
              value={journalText}
              onChangeText={setJournalText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { opacity: journalText.trim() ? 1 : 0.5 }]}
              onPress={saveJournal}
              disabled={!journalText.trim() || isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Entry"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Activity Log</Text>
          <Text style={styles.sectionDesc}>Tap to log an activity and earn XP.</Text>
          <View style={styles.activityBtnWrap}>
            {ACTIVITIES.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={styles.activityPill}
                onPress={() => completeActivity.mutate(a)}
                activeOpacity={0.7}
              >
                <Text style={styles.activityPillText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Stats</Text>

          <View style={styles.statsCard}>
            <View style={styles.growthRow}>
              {[
                { label: "Emotion", value: character?.emotionGrowth || 0, color: "#FF9A8B" },
                { label: "Feeling", value: character?.feelingGrowth || 0, color: "#A78BFA" },
                { label: "Stress", value: character?.stressManagement || 0, color: "#7ED957" },
                { label: "Spiritual", value: character?.spiritualGrowth || 0, color: "#FFB347" },
              ].map((g) => (
                <View key={g.label} style={styles.growthItem}>
                  <View style={styles.growthBarBg}>
                    <View style={[styles.growthBarFill, { height: `${Math.min(g.value, 100)}%`, backgroundColor: g.color }]} />
                  </View>
                  <Text style={styles.growthBarLabel}>{g.label}</Text>
                  <Text style={[styles.growthBarValue, { color: g.color }]}>{g.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStatCard}>
                <Ionicons name="checkmark-circle" size={18} color="#7ED957" />
                <Text style={styles.miniStatValue}>{stats.totalQuests}</Text>
                <Text style={styles.miniStatLabel}>Quests</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Ionicons name="flame" size={18} color="#FFB347" />
                <Text style={styles.miniStatValue}>{stats.streak}</Text>
                <Text style={styles.miniStatLabel}>Streak</Text>
              </View>
            </View>
          </View>

          <AdBanner variant="medium" />

          {emotionLogs.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Recent Logs</Text>
              {emotionLogs.slice(0, 5).map((log: any) => {
                const emotions = Array.isArray(log.emotions) ? log.emotions : [];
                const labels = emotions.map((e: any) => e.type).join(", ");
                const d = new Date(log.loggedAt);
                return (
                  <View key={log.id} style={styles.logItem}>
                    <View style={[styles.logDot, { backgroundColor: Colors.emotions[emotions[0]?.type as keyof typeof Colors.emotions] || colors.tint }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logText}>{labels || "—"}</Text>
                      {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                    </View>
                    <Text style={styles.logTime}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
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
  journalBox: {
    backgroundColor: "#F8F5FF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#EDE8F5",
  },
  journalLabel: { fontSize: 15, fontWeight: "700", color: "#2D2B3D", marginBottom: 10 },
  journalInput: {
    minHeight: 100,
    maxHeight: 180,
    fontSize: 14,
    lineHeight: 22,
    color: "#2D2B3D",
    padding: 0,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#5B7AE8",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2D2B3D", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#9B97B0", marginBottom: 14, lineHeight: 19 },
  activityBtnWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  activityPill: {
    backgroundColor: "#5B7AE8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    width: "31%",
    alignItems: "center",
  },
  activityPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsCard: {
    backgroundColor: "#F8F5FF", borderRadius: 20, padding: 20,
  },
  growthRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 130 },
  growthItem: { alignItems: "center", gap: 6 },
  growthBarBg: { width: 32, height: 90, backgroundColor: "#EDE8F5", borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  growthBarFill: { width: "100%", borderRadius: 16, minHeight: 4 },
  growthBarLabel: { fontSize: 10, fontWeight: "600", color: "#9B97B0" },
  growthBarValue: { fontSize: 14, fontWeight: "700" },
  miniStatsRow: {
    flexDirection: "row", gap: 12, marginTop: 16,
    borderTopWidth: 1, borderTopColor: "#EDE8F5", paddingTop: 14,
  },
  miniStatCard: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 10,
  },
  miniStatValue: { fontSize: 18, fontWeight: "800", color: "#2D2B3D" },
  miniStatLabel: { fontSize: 11, color: "#9B97B0", fontWeight: "500" },
  logItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EDE8F5" },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logText: { fontSize: 14, fontWeight: "600", color: "#2D2B3D", textTransform: "capitalize" },
  logNote: { fontSize: 12, color: "#9B97B0", marginTop: 2 },
  logTime: { fontSize: 11, color: "#C4BFD6" },
});
