import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

const BREATHING_EXERCISES = [
  {
    id: "478",
    title: "4-7-8 Relaxation",
    subtitle: "Calm your nervous system",
    description: "Inhale 4s, hold 7s, exhale 8s. Activates your parasympathetic nervous system for deep relaxation.",
    phases: [
      { label: "Inhale", duration: 4, color: "#5B7AE8" },
      { label: "Hold", duration: 7, color: "#A78BFA" },
      { label: "Exhale", duration: 8, color: "#7ED957" },
    ],
    cycles: 4,
    icon: "moon" as const,
    color: "#6366F1",
  },
  {
    id: "box",
    title: "Box Breathing",
    subtitle: "Navy SEAL technique",
    description: "Equal 4-second intervals. Used by Navy SEALs to stay calm under pressure.",
    phases: [
      { label: "Inhale", duration: 4, color: "#5B7AE8" },
      { label: "Hold", duration: 4, color: "#FFB347" },
      { label: "Exhale", duration: 4, color: "#7ED957" },
      { label: "Hold", duration: 4, color: "#A78BFA" },
    ],
    cycles: 4,
    icon: "square" as const,
    color: "#3B82F6",
  },
  {
    id: "energize",
    title: "Energizing Breath",
    subtitle: "Wake up your body",
    description: "Quick inhale, short hold, powerful exhale. Increases alertness and energy.",
    phases: [
      { label: "Inhale", duration: 2, color: "#FF6B6B" },
      { label: "Hold", duration: 2, color: "#FFB347" },
      { label: "Exhale", duration: 3, color: "#F97316" },
    ],
    cycles: 6,
    icon: "flash" as const,
    color: "#F97316",
  },
  {
    id: "calm",
    title: "Deep Calm",
    subtitle: "Extended exhale technique",
    description: "Long exhale activates vagus nerve. Great for anxiety and stress relief.",
    phases: [
      { label: "Inhale", duration: 4, color: "#5B7AE8" },
      { label: "Hold", duration: 2, color: "#9B97B0" },
      { label: "Exhale", duration: 8, color: "#4ECDC4" },
    ],
    cycles: 5,
    icon: "water" as const,
    color: "#4ECDC4",
  },
  {
    id: "sleep",
    title: "Sleep Breathing",
    subtitle: "Drift off naturally",
    description: "Gentle breathing pattern designed to slow your heart rate and prepare for sleep.",
    phases: [
      { label: "Inhale", duration: 4, color: "#8B5CF6" },
      { label: "Hold", duration: 4, color: "#6366F1" },
      { label: "Exhale", duration: 6, color: "#A78BFA" },
      { label: "Rest", duration: 2, color: "#C4B5FD" },
    ],
    cycles: 5,
    icon: "bed" as const,
    color: "#8B5CF6",
  },
];

type BreathState = "idle" | "active" | "done";

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedExercise, setSelectedExercise] = useState<typeof BREATHING_EXERCISES[0] | null>(null);
  const [breathState, setBreathState] = useState<BreathState>("idle");
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logSession = useMutation({
    mutationFn: async (duration: number) => {
      const res = await fetch(getApiUrl("/api/quests/breath/complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "breath", exp: 30 }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });

  useEffect(() => {
    if (breathState !== "active" || !selectedExercise) return;

    const phase = selectedExercise.phases[currentPhase];
    setPhaseTimer(phase.duration);

    if (phase.label === "Inhale") {
      Animated.timing(scaleAnim, { toValue: 1.3, duration: phase.duration * 1000, useNativeDriver: true }).start();
    } else if (phase.label === "Exhale") {
      Animated.timing(scaleAnim, { toValue: 0.6, duration: phase.duration * 1000, useNativeDriver: true }).start();
    }

    timerRef.current = setInterval(() => {
      setPhaseTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const nextPhase = currentPhase + 1;
          if (nextPhase >= selectedExercise.phases.length) {
            const nextCycle = currentCycle + 1;
            if (nextCycle >= selectedExercise.cycles) {
              setBreathState("done");
              logSession.mutate(0);
              return 0;
            }
            setCurrentCycle(nextCycle);
            setCurrentPhase(0);
          } else {
            setCurrentPhase(nextPhase);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breathState, currentPhase, currentCycle]);

  const startExercise = (exercise: typeof BREATHING_EXERCISES[0]) => {
    setSelectedExercise(exercise);
    setBreathState("active");
    setCurrentPhase(0);
    setCurrentCycle(0);
    scaleAnim.setValue(0.6);
  };

  const stopExercise = () => {
    setBreathState("idle");
    setSelectedExercise(null);
    setCurrentPhase(0);
    setCurrentCycle(0);
    if (timerRef.current) clearInterval(timerRef.current);
    scaleAnim.setValue(0.6);
  };

  if (breathState === "active" && selectedExercise) {
    const phase = selectedExercise.phases[currentPhase];
    return (
      <LinearGradient colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]} style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.activeHeader}>
          <TouchableOpacity onPress={stopExercise} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.activeTitle}>{selectedExercise.title}</Text>
          <Text style={styles.cycleText}>Cycle {currentCycle + 1}/{selectedExercise.cycles}</Text>
        </View>

        <View style={styles.breathCenter}>
          <Animated.View style={[styles.breathCircle, { transform: [{ scale: scaleAnim }], backgroundColor: phase.color + "30", borderColor: phase.color }]}>
            <Text style={[styles.breathLabel, { color: phase.color }]}>{phase.label}</Text>
            <Text style={styles.breathTimer}>{phaseTimer}</Text>
          </Animated.View>
        </View>

        <View style={[styles.phaseIndicators, { paddingBottom: bottomInset + 40 }]}>
          {selectedExercise.phases.map((p, i) => (
            <View key={i} style={[styles.phaseChip, i === currentPhase && { backgroundColor: p.color }]}>
              <Text style={[styles.phaseChipText, i === currentPhase && { color: "#FFFFFF" }]}>{p.label} {p.duration}s</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    );
  }

  if (breathState === "done") {
    return (
      <LinearGradient colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]} style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.doneCenter}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark-circle" size={72} color="#7ED957" />
          </View>
          <Text style={styles.doneTitle}>Well Done!</Text>
          <Text style={styles.doneSubtitle}>You completed {selectedExercise?.title}</Text>
          <Text style={styles.doneXp}>+30 XP earned</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={stopExercise}>
            <Text style={styles.doneBtnText}>Back to Exercises</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" }}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
          <Text style={styles.headerTitle}>Breathing Guide</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: bottomInset + 100 }}
        >
          <Text style={styles.sectionTitle}>Breathing Exercises</Text>
          <Text style={styles.sectionDesc}>Guided breathing patterns backed by neuroscience. Tap to begin.</Text>

          {BREATHING_EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.exerciseCard}
              onPress={() => startExercise(ex)}
              activeOpacity={0.7}
            >
              <View style={[styles.exerciseIcon, { backgroundColor: ex.color + "15" }]}>
                <Ionicons name={ex.icon} size={28} color={ex.color} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseTitle}>{ex.title}</Text>
                <Text style={styles.exerciseSubtitle}>{ex.subtitle}</Text>
                <Text style={styles.exerciseDesc} numberOfLines={2}>{ex.description}</Text>
                <View style={styles.phasePreview}>
                  {ex.phases.map((p, i) => (
                    <View key={i} style={[styles.miniPhase, { backgroundColor: p.color + "20" }]}>
                      <Text style={[styles.miniPhaseText, { color: p.color }]}>{p.label} {p.duration}s</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Ionicons name="play-circle" size={32} color={ex.color} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  header: { paddingBottom: 40, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.3 },
  contentWrap: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20, overflow: "hidden" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2D2B3D", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#9B97B0", marginBottom: 16, lineHeight: 19 },
  exerciseCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#EDE8F5",
    shadowColor: "#7C6DC5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  exerciseIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  exerciseInfo: { flex: 1, gap: 3 },
  exerciseTitle: { fontSize: 16, fontWeight: "700", color: "#2D2B3D" },
  exerciseSubtitle: { fontSize: 12, fontWeight: "600", color: "#9B97B0" },
  exerciseDesc: { fontSize: 12, color: "#B0ABC0", lineHeight: 17, marginTop: 2 },
  phasePreview: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  miniPhase: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  miniPhaseText: { fontSize: 10, fontWeight: "600" },
  activeHeader: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  activeTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  cycleText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  breathCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  breathCircle: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3,
  },
  breathLabel: { fontSize: 22, fontWeight: "700" },
  breathTimer: { fontSize: 56, fontWeight: "800", color: "#FFFFFF", fontVariant: ["tabular-nums"] },
  phaseIndicators: { flexDirection: "row", justifyContent: "center", gap: 8, paddingHorizontal: 20 },
  phaseChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)" },
  phaseChipText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  doneCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  doneCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  doneTitle: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  doneSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  doneXp: { fontSize: 18, fontWeight: "700", color: "#7ED957", marginBottom: 28 },
  doneBtn: { backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#5B7AE8" },
});
