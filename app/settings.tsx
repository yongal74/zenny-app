import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Notifications: any = null;
let Device: any = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    Device = require("expo-device");
  } catch {}
}

const FREQUENCY_OPTIONS = [
  { key: "30min", label: "Every 30 min", minutes: 30 },
  { key: "1hr", label: "Every 1 hour", minutes: 60 },
  { key: "2hr", label: "Every 2 hours", minutes: 120 },
  { key: "4hr", label: "Every 4 hours", minutes: 240 },
  { key: "8hr", label: "Every 8 hours", minutes: 480 },
];

const PUSH_MESSAGES = [
  "Hey! How are you feeling right now? Take a moment to check in. 💜",
  "Your Maumi misses you! Come log how you're doing. 🌟",
  "Time for a quick wellness check-in. Your emotions matter! ✨",
  "Breathe in, breathe out. Ready for a quick check-in? 🌿",
  "Your Maumi is waiting! Earn Soul Coins by logging your feelings. 💎",
  "A moment of self-awareness can change your whole day. Check in now! 🌈",
  "Your emotional health matters. How's your body feeling? 💫",
  "Quick check-in time! Your Maumi grows when you reflect. 🌱",
];

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function registerForPushNotifications() {
  if (Platform.OS === "web" || !Notifications || !Device) return false;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  }
  return false;
}

async function scheduleNotifications(frequencyMinutes: number) {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const message = PUSH_MESSAGES[Math.floor(Math.random() * PUSH_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Maumi",
      body: message,
      data: { action: "check_in" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: frequencyMinutes * 60,
      repeats: true,
    },
  });
}

async function cancelAllNotifications() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [pushEnabled, setPushEnabled] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [doubleTapEnabled, setDoubleTapEnabled] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState("2hr");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const push = await AsyncStorage.getItem("push_enabled");
    const shake = await AsyncStorage.getItem("shake_enabled");
    const doubleTap = await AsyncStorage.getItem("double_tap_enabled");
    const freq = await AsyncStorage.getItem("push_frequency");
    if (push !== null) setPushEnabled(push === "true");
    if (shake !== null) setShakeEnabled(shake !== "false");
    if (doubleTap !== null) setDoubleTapEnabled(doubleTap !== "false");
    if (freq) setSelectedFrequency(freq);
  };

  const togglePush = async (value: boolean) => {
    if (value) {
      const granted = await registerForPushNotifications();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive Maumi check-in reminders."
        );
        return;
      }
      const freq = FREQUENCY_OPTIONS.find(f => f.key === selectedFrequency);
      await scheduleNotifications(freq?.minutes || 120);
    } else {
      await cancelAllNotifications();
    }
    setPushEnabled(value);
    await AsyncStorage.setItem("push_enabled", value.toString());
  };

  const toggleShake = async (value: boolean) => {
    setShakeEnabled(value);
    await AsyncStorage.setItem("shake_enabled", value.toString());
  };

  const toggleDoubleTap = async (value: boolean) => {
    setDoubleTapEnabled(value);
    await AsyncStorage.setItem("double_tap_enabled", value.toString());
  };

  const changeFrequency = async (key: string) => {
    setSelectedFrequency(key);
    await AsyncStorage.setItem("push_frequency", key);
    if (pushEnabled) {
      const freq = FREQUENCY_OPTIONS.find(f => f.key === key);
      await scheduleNotifications(freq?.minutes || 120);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F5F1FF" }]}>
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomInset + 20 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionDesc}>
            Get gentle reminders to check in with yourself. Earn Soul Coins when you respond!
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color="#7C6DC5" />
              <Text style={styles.settingLabel}>Enable Notifications</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ false: "#DDD", true: "#B8A9E8" }}
              thumbColor={pushEnabled ? "#7C6DC5" : "#CCC"}
            />
          </View>

          {pushEnabled && (
            <View style={styles.frequencySection}>
              <Text style={styles.frequencyTitle}>Reminder Frequency</Text>
              <View style={styles.frequencyGrid}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.frequencyChip,
                      selectedFrequency === opt.key && styles.frequencyChipActive,
                    ]}
                    onPress={() => changeFrequency(opt.key)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        selectedFrequency === opt.key && styles.frequencyTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shake to Check In</Text>
          <Text style={styles.sectionDesc}>
            Shake your phone anytime to quickly open the emotion/feeling check-in screen.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={22} color="#7C6DC5" />
              <Text style={styles.settingLabel}>Shake Detection</Text>
            </View>
            <Switch
              value={shakeEnabled}
              onValueChange={toggleShake}
              trackColor={{ false: "#DDD", true: "#B8A9E8" }}
              thumbColor={shakeEnabled ? "#7C6DC5" : "#CCC"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Double Tap Character</Text>
          <Text style={styles.sectionDesc}>
            Double tap your Maumi character on the Home screen to quickly open the check-in menu.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="hand-left" size={22} color="#7C6DC5" />
              <Text style={styles.settingLabel}>Double Tap to Check In</Text>
            </View>
            <Switch
              value={doubleTapEnabled}
              onValueChange={toggleDoubleTap}
              trackColor={{ false: "#DDD", true: "#B8A9E8" }}
              thumbColor={doubleTapEnabled ? "#7C6DC5" : "#CCC"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soul Coin Rewards</Text>
          <View style={styles.rewardRow}>
            <Ionicons name="diamond" size={16} color="#FFB347" />
            <Text style={styles.rewardText}>Emotion log: +5 coins</Text>
          </View>
          <View style={styles.rewardRow}>
            <Ionicons name="diamond" size={16} color="#FFB347" />
            <Text style={styles.rewardText}>Feeling log: +5 coins</Text>
          </View>
          <View style={styles.rewardRow}>
            <Ionicons name="diamond" size={16} color="#FFB347" />
            <Text style={styles.rewardText}>Push check-in: +10 coins</Text>
          </View>
          <View style={styles.rewardRow}>
            <Ionicons name="diamond" size={16} color="#FFB347" />
            <Text style={styles.rewardText}>Conversation: +2.5 coins</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#FFFFFF",
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FAFAFE",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0ECF8",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D2B3D",
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8E8AA0",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D2B3D",
  },
  frequencySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0ECF8",
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B5777",
    marginBottom: 10,
  },
  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  frequencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F1FF",
    borderWidth: 1.5,
    borderColor: "#EDE8F5",
  },
  frequencyChipActive: {
    backgroundColor: "#7C6DC5",
    borderColor: "#7C6DC5",
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C6DC5",
  },
  frequencyTextActive: {
    color: "#FFFFFF",
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  rewardText: {
    fontSize: 14,
    color: "#5B5777",
    fontWeight: "500",
  },
});
