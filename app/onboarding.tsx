import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SLIDES = [
  {
    title: "Welcome to\nMaumi",
    subtitle: "AI Mental Care Tamagotchi",
    bullets: [
      "In the AI era, your emotions and inner world are your most valuable assets.",
      "Maumi helps you understand and manage them — one check-in at a time.",
    ],
    icon: "heart-circle" as const,
    color: "#FF6B9D",
  },
  {
    title: "Emotions &\nFeelings",
    subtitle: "Two Sides of Your Inner World",
    bullets: [
      "Emotions are psychological states — joy, sadness, anxiety, anger.",
      "Feelings are physical body sensations — tight chest, heavy shoulders, butterflies.",
      "Understanding both is the key to true self-awareness.",
    ],
    icon: "sparkles" as const,
    color: "#A78BFA",
  },
  {
    title: "Grow\nTogether",
    subtitle: "Your Tamagotchi Evolves With You",
    bullets: [
      "Your Maumi companion mirrors your growth journey.",
      "As you meditate, breathe, and check in with yourself, your character levels up and evolves.",
      "7 stages of transformation for each species.",
    ],
    icon: "trending-up" as const,
    color: "#7ED957",
  },
  {
    title: "Meditation &\nBreathing",
    subtitle: "Guided Wellness Practices",
    bullets: [
      "Calming meditation music with nature sounds and healing tones.",
      "Guided breathing exercises backed by neuroscience.",
      "Ancient practices meet modern brain science for inner peace.",
    ],
    icon: "leaf" as const,
    color: "#5B7AE8",
  },
  {
    title: "Deep\nGrowth",
    subtitle: "Philosophy · Psychology · Neuroscience · Spirituality",
    bullets: [
      "Grow not just emotionally, but intellectually.",
      "Explore insights from philosophy, psychology, brain science, and spiritual traditions.",
      "The last frontier in the AI era: your unconscious mind and emotions.",
    ],
    icon: "book" as const,
    color: "#FFB347",
  },
  {
    title: "Customize\nYour Maumi",
    subtitle: "80+ Items to Express Yourself",
    bullets: [
      "Hats, glasses, clothes, wings, pets, and more.",
      "Earn Soul Coins through wellness activities.",
      "Make your companion uniquely yours.",
    ],
    icon: "color-palette" as const,
    color: "#FF9A8B",
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem("onboarding_completed", "true");
      router.replace("/(tabs)");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
      style={[styles.container, { paddingTop: topInset }]}
    >
      <View style={styles.topBar}>
        {currentSlide > 0 ? (
          <TouchableOpacity onPress={() => setCurrentSlide((p) => p - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: slide.color + "25" }]}>
          <Ionicons name={slide.icon} size={56} color={slide.color} />
        </View>

        <Text style={styles.title}>{slide.title}</Text>

        <View style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </View>

        <View style={styles.bulletCard}>
          {slide.bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: slide.color }]} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.bottomArea, { paddingBottom: bottomInset + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentSlide && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          <Ionicons
            name={isLast ? "checkmark-circle" : "chevron-forward"}
            size={20}
            color="#5B7AE8"
          />
        </TouchableOpacity>

        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>{currentSlide + 1} / {SLIDES.length}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitleWrap: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bulletCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    gap: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "500",
  },
  bottomArea: {
    paddingHorizontal: 32,
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FFFFFF",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#5B7AE8",
  },
  pageCounter: {
    alignItems: "center",
  },
  pageCounterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
