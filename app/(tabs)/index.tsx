import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { AdBanner } from "@/components/AdBanner";
import { ACCESSORY_IMAGES, ACCESSORY_POSITIONS } from "@/constants/accessories";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHARACTER_IMAGES: Record<string, any> = {
  cloud: require("@/assets/characters/cloud.png"),
  star: require("@/assets/characters/star.png"),
  drop: require("@/assets/characters/drop.png"),
  flame: require("@/assets/characters/flame.png"),
  leaf: require("@/assets/characters/leaf.png"),
  egg: require("@/assets/characters/egg.png"),
};

const EVOLUTION_IMAGES: Record<string, Record<number, any>> = {
  cloud: {
    1: require("@/assets/characters/cloud_1.png"),
    2: require("@/assets/characters/cloud_2.png"),
    3: require("@/assets/characters/cloud_3.png"),
    4: require("@/assets/characters/cloud_4.png"),
    5: require("@/assets/characters/cloud_5.png"),
    6: require("@/assets/characters/cloud_6.png"),
    7: require("@/assets/characters/cloud_7.png"),
  },
  star: {
    1: require("@/assets/characters/star_1.png"),
    2: require("@/assets/characters/star_2.png"),
    3: require("@/assets/characters/star_3.png"),
    4: require("@/assets/characters/star_4.png"),
    5: require("@/assets/characters/star_5.png"),
    6: require("@/assets/characters/star_6.png"),
    7: require("@/assets/characters/star_7.png"),
  },
  drop: {
    1: require("@/assets/characters/drop_1.png"),
    2: require("@/assets/characters/drop_2.png"),
    3: require("@/assets/characters/drop_3.png"),
    4: require("@/assets/characters/drop_4.png"),
    5: require("@/assets/characters/drop_5.png"),
    6: require("@/assets/characters/drop_6.png"),
    7: require("@/assets/characters/drop_7.png"),
  },
  flame: {
    1: require("@/assets/characters/flame_1.png"),
    2: require("@/assets/characters/flame_2.png"),
    3: require("@/assets/characters/flame_3.png"),
    4: require("@/assets/characters/flame_4.png"),
    5: require("@/assets/characters/flame_5.png"),
    6: require("@/assets/characters/flame_6.png"),
    7: require("@/assets/characters/flame_7.png"),
  },
  leaf: {
    1: require("@/assets/characters/leaf_1.png"),
    2: require("@/assets/characters/leaf_2.png"),
    3: require("@/assets/characters/leaf_3.png"),
    4: require("@/assets/characters/leaf_4.png"),
    5: require("@/assets/characters/leaf_5.png"),
    6: require("@/assets/characters/leaf_6.png"),
    7: require("@/assets/characters/leaf_7.png"),
  },
};

function getEvolutionStage(level: number): number {
  if (level < 5) return 1;
  if (level < 10) return 2;
  if (level < 15) return 3;
  if (level < 20) return 4;
  if (level < 25) return 5;
  if (level < 30) return 6;
  return 7;
}

function getCharacterImage(species: string, level: number): any {
  const stage = getEvolutionStage(level);
  const speciesImages = EVOLUTION_IMAGES[species];
  if (speciesImages && speciesImages[stage]) {
    return speciesImages[stage];
  }
  return CHARACTER_IMAGES[species] || CHARACTER_IMAGES.egg;
}

const EMOTIONS = [
  { key: "joy", label: "Joy", emoji: "😊", color: Colors.emotions.joy },
  { key: "sadness", label: "Sadness", emoji: "😢", color: Colors.emotions.sadness },
  { key: "anger", label: "Anger", emoji: "😠", color: Colors.emotions.anger },
  { key: "anxiety", label: "Anxiety", emoji: "😰", color: Colors.emotions.anxiety },
  { key: "calm", label: "Calm", emoji: "😌", color: Colors.emotions.calm },
  { key: "disgust", label: "Disgust", emoji: "🤢", color: Colors.emotions.disgust },
  { key: "surprise", label: "Surprise", emoji: "😲", color: Colors.emotions.surprise },
];

const FEELINGS = [
  { key: "tight_chest", label: "Tight chest", emoji: "💔" },
  { key: "heavy_shoulders", label: "Heavy shoulders", emoji: "🏋️" },
  { key: "stomach_ache", label: "Stomach ache", emoji: "🤕" },
  { key: "shaky_hands", label: "Shaky hands", emoji: "🫨" },
  { key: "clear_head", label: "Clear head", emoji: "✨" },
  { key: "light_body", label: "Light body", emoji: "🪶" },
  { key: "tired_eyes", label: "Tired eyes", emoji: "😵" },
  { key: "stiff_neck", label: "Stiff neck", emoji: "🦴" },
];

const ACTIVITIES = [
  { key: "breath", label: "Breathing", emoji: "🌬️", exp: 30 },
  { key: "meditation", label: "Meditation", emoji: "🧘", exp: 25 },
  { key: "gratitude", label: "Gratitude", emoji: "📝", exp: 25 },
  { key: "water", label: "Drink Water", emoji: "💧", exp: 15 },
  { key: "stretch", label: "Stretch", emoji: "🙆", exp: 20 },
  { key: "etc", label: "Etc.", emoji: "✨", exp: 10 },
];

type ChatMsg = {
  id: string;
  role: "assistant" | "user";
  content: string;
  buttons?: { label: string; emoji?: string; action: string; data?: any }[];
  isMainMenu?: boolean;
};

type ConvoState =
  | "greeting"
  | "choose_type"
  | "pick_emotion"
  | "pick_feeling"
  | "write_note"
  | "suggest_activity"
  | "activity_offered"
  | "reward"
  | "free_chat";

const BASE_CHAR_SIZE = 170;
const LEVEL_SCALE_STEP = 0.04;
const MAX_SCALE = 2.0;

function CharacterView({ character, onPress, onDoubleTap, showTooltip, equippedItems }: { character: any; onPress: () => void; onDoubleTap?: () => void; showTooltip?: boolean; equippedItems?: any[] }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (showTooltip) {
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(tooltipOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(tooltipOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [showTooltip]);

  const species = character?.species || "cloud";
  const stage = character?.evolutionStage || 1;
  const level = character?.level || 1;
  const charName = character?.name || "Maumi";
  const charImage = getCharacterImage(species, level);

  const growthScale = Math.min(1 + (level - 1) * LEVEL_SCALE_STEP, MAX_SCALE);
  const imgSize = BASE_CHAR_SIZE * growthScale;

  const xpForNext = 100;
  const currentXpInLevel = (character?.totalExp || 0) % 100;
  const xpProgress = currentXpInLevel / xpForNext;

  return (
    <TouchableOpacity onPress={() => {
      const now = Date.now();
      if (now - lastTapRef.current < 350 && onDoubleTap) {
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        setTimeout(() => {
          if (lastTapRef.current === now) {
            onPress();
          }
        }, 350);
      }
    }} activeOpacity={0.85} style={styles.characterContainer}>
      {showTooltip && (
        <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
          <Text style={styles.tooltipText}>Tap me to customize!</Text>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <View style={{ width: imgSize, height: imgSize, position: "relative" }}>
            {equippedItems?.filter(e => e.category === "wings").map((acc: any) => {
              const img = acc.imageAsset ? ACCESSORY_IMAGES[acc.imageAsset] : null;
              if (!img) return null;
              const pos = ACCESSORY_POSITIONS.wings;
              const s = pos.size * growthScale;
              return <Image key={acc.id} source={img} style={{ position: "absolute", width: s, height: s, top: pos.top * growthScale, left: (imgSize - s) / 2 + pos.left * growthScale, zIndex: 0 }} resizeMode="contain" />;
            })}
            <Image source={charImage} style={{ width: imgSize, height: imgSize, zIndex: 1 }} resizeMode="contain" />
            {equippedItems?.filter(e => e.category !== "wings" && e.category !== "pet").map((acc: any) => {
              const img = acc.imageAsset ? ACCESSORY_IMAGES[acc.imageAsset] : null;
              if (!img) return null;
              const pos = ACCESSORY_POSITIONS[acc.category] || { top: 0, left: 0, size: 40 };
              const s = pos.size * growthScale;
              return <Image key={acc.id} source={img} style={{ position: "absolute", width: s, height: s, top: pos.top * growthScale, left: (imgSize - s) / 2 + pos.left * growthScale, zIndex: 2 }} resizeMode="contain" />;
            })}
            {equippedItems?.filter(e => e.category === "pet").map((acc: any) => {
              const img = acc.imageAsset ? ACCESSORY_IMAGES[acc.imageAsset] : null;
              if (!img) return null;
              const pos = ACCESSORY_POSITIONS.pet;
              const s = pos.size * growthScale;
              return <Image key={acc.id} source={img} style={{ position: "absolute", width: s, height: s, top: pos.top * growthScale, left: (imgSize - s) / 2 + pos.left * growthScale, zIndex: 3 }} resizeMode="contain" />;
            })}
          </View>
        </Animated.View>
      </Animated.View>
      <Text style={styles.characterName}>{charName}</Text>
      <View style={styles.levelRow}>
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
        <View style={styles.xpBarOuter}>
          <View style={[styles.xpBarInner, { width: `${Math.max(xpProgress * 100, 4)}%` }]} />
        </View>
        <Text style={styles.xpLabel}>{currentXpInLevel}/{xpForNext}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabBarHeight = Platform.OS === "web" ? 84 : 56;
  const bottomInset = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [convoState, setConvoState] = useState<ConvoState>("greeting");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [doubleTapEnabled, setDoubleTapEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("double_tap_enabled").then((val) => {
      if (val !== null) setDoubleTapEnabled(val !== "false");
    });
  }, []);

  const handleShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMessages([]);
    setConvoState("greeting");
    setSelectedEmotion(null);
    setSelectedFeeling(null);
  }, []);

  useShakeDetection(handleShake);

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/character"));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: equippedItems = [] } = useQuery({
    queryKey: ["equippedItems"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/shop/equipped"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMsg = useCallback((msg: Omit<ChatMsg, "id">) => {
    const newMsg = { ...msg, id: Date.now().toString() + Math.random() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours();
      const charName = character?.name || "Maumi";

      const morningGreetings = [
        `Good morning! ${charName} is happy to see you. How are you today? 💜`,
        `Rise and shine! A new day, a new chance to grow. What's on your mind? 🌅`,
        `Morning! Your body and mind are refreshed. Let's check in together. ☀️`,
      ];
      const afternoonGreetings = [
        `Hey there! How's your afternoon going? ${charName} is here for you. 💜`,
        `Taking a break? Perfect time for a quick check-in with yourself. 🌤️`,
        `Good afternoon! Let's take a moment to pause and reflect. ✨`,
      ];
      const eveningGreetings = [
        `Good evening! How was your day? ${charName} wants to hear all about it. 🌙`,
        `Winding down? Let's reflect on today together. You did great. 💫`,
        `Evening time. A perfect moment to check in with your feelings. 🌃`,
      ];
      const nightGreetings = [
        `Still up? ${charName} is here to keep you company. How are you feeling? 🌌`,
        `Late night thoughts? Let's process them together. You're not alone. 💜`,
        `Can't sleep? A quick breathing exercise might help. I'm right here. 🌠`,
      ];

      let greetings;
      if (hour >= 5 && hour < 12) greetings = morningGreetings;
      else if (hour >= 12 && hour < 17) greetings = afternoonGreetings;
      else if (hour >= 17 && hour < 22) greetings = eveningGreetings;
      else greetings = nightGreetings;

      const greeting = greetings[Math.floor(Math.random() * greetings.length)];

      addMsg({
        role: "assistant",
        content: greeting,
        buttons: [
          { label: "My Emotions", action: "start_emotion" },
          { label: "My Feelings", action: "start_feeling" },
          { label: "Just Chat", action: "free_chat" },
          { label: "Meditation", action: "go_meditation" },
          { label: "Breathing", action: "go_breathing" },
        ],
        isMainMenu: true,
      });
      setConvoState("choose_type");
    }
  }, []);

  const handleButtonPress = useCallback(async (action: string, data?: any) => {
    switch (action) {
      case "start_emotion":
        addMsg({ role: "user", content: "I want to check in my emotions" });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: "Which emotions are you feeling right now? Take your time 🌈",
            buttons: EMOTIONS.map((e) => ({ label: e.label, emoji: e.emoji, action: "select_emotion", data: e.key })),
          });
          setConvoState("pick_emotion");
        }, 400);
        break;

      case "start_feeling":
        addMsg({ role: "user", content: "I want to check in my body feelings" });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: "What do you notice in your body right now? 🧘",
            buttons: FEELINGS.map((f) => ({ label: f.label, emoji: f.emoji, action: "select_feeling", data: f.key })),
          });
          setConvoState("pick_feeling");
        }, 400);
        break;

      case "select_emotion": {
        const emo = EMOTIONS.find((e) => e.key === data);
        setSelectedEmotion(data);
        addMsg({ role: "user", content: `${emo?.emoji} ${emo?.label}` });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: `${emo?.label} — got it. Want to share a bit more about what's going on?`,
          });
          setConvoState("write_note");
        }, 400);
        break;
      }

      case "select_feeling": {
        const feel = FEELINGS.find((f) => f.key === data);
        setSelectedFeeling(data);
        addMsg({ role: "user", content: `${feel?.emoji} ${feel?.label}` });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: `I hear you. Your body is telling you something important. Want to add a quick note?`,
          });
          setConvoState("write_note");
        }, 400);
        break;
      }

      case "skip_note":
        await saveLog("");
        break;

      case "do_activity":
        addMsg({ role: "user", content: `I'll try: ${data.label}` });
        setTimeout(() => {
          const reasons: Record<string, string> = {
            breath: "Deep breathing activates your parasympathetic nervous system, shifting your body from fight-or-flight to rest-and-digest mode.",
            meditation: "Meditation strengthens your prefrontal cortex, the part of the brain responsible for emotional regulation and self-awareness.",
            gratitude: "Gratitude journaling rewires neural pathways toward positive thinking. Psychologically, it shifts focus from scarcity to abundance.",
            water: "Dehydration increases cortisol. A glass of water helps your nervous system recalibrate.",
            gaze: "Looking at distant objects relaxes the ciliary muscles and reduces mental tension through the optic-vagal connection.",
            stretch: "Standing activates your vestibular system, resetting your body's relationship with gravity and reducing stress hormones.",
            neck: "Tension in the neck and shoulders stores unprocessed emotions. Releasing it is a form of somatic healing.",
            music: "Music activates the limbic system and releases dopamine, creating an immediate mood shift.",
            window: "Fresh air increases oxygen to the brain and shifts your sensory experience, grounding you in the present moment.",
          };
          const reason = reasons[data.key] || "This activity helps restore your mind-body balance.";
          addMsg({
            role: "assistant",
            content: `Great choice! Here's why this helps:\n\n✨ ${reason}\n\nLet me know when you're done!`,
            buttons: [
              { label: "Done! ✅", emoji: "✅", action: "complete_activity", data },
              { label: "Skip for now", emoji: "⏭️", action: "skip_activity" },
            ],
          });
          setConvoState("activity_offered");
        }, 400);
        break;

      case "complete_activity":
        addMsg({ role: "user", content: "Done! ✅" });
        try {
          await fetch(getApiUrl(`/api/quests/${data.key}/complete`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          queryClient.invalidateQueries({ queryKey: ["character"] });
        } catch {}
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: `Amazing! You earned +${data.exp} XP and +5 Soul Coins! 🎉\n\nYour Maumi grew a little from this. Keep it up! 💜`,
            buttons: [
              { label: "Check in again", emoji: "🔄", action: "restart" },
              { label: "Chat with Maumi", emoji: "💬", action: "free_chat" },
            ],
          });
          setConvoState("reward");
        }, 400);
        break;

      case "skip_activity":
        addMsg({ role: "user", content: "Skip for now" });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: "No worries at all! Remember, every small step counts. I'm always here 💜",
            buttons: [
              { label: "Check in again", emoji: "🔄", action: "restart" },
              { label: "Chat with Maumi", emoji: "💬", action: "free_chat" },
            ],
          });
        }, 400);
        break;

      case "free_chat":
        addMsg({ role: "user", content: "I want to chat" });
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: "I'm all ears! Type anything you want to share — no judgment here 😊",
          });
          setConvoState("free_chat");
        }, 400);
        break;

      case "go_meditation":
        router.push("/meditation");
        break;

      case "go_breathing":
        router.push("/breathing");
        break;

      case "restart":
        addMsg({ role: "user", content: "Let me check in again" });
        setSelectedEmotion(null);
        setSelectedFeeling(null);
        setTimeout(() => {
          addMsg({
            role: "assistant",
            content: "Sure! What would you like to do?",
            buttons: [
              { label: "My Emotions", action: "start_emotion" },
              { label: "My Feelings", action: "start_feeling" },
              { label: "Just Chat", action: "free_chat" },
              { label: "Meditation", action: "go_meditation" },
              { label: "Breathing", action: "go_breathing" },
            ],
            isMainMenu: true,
          });
          setConvoState("choose_type");
        }, 400);
        break;
    }
  }, [addMsg, queryClient]);

  const saveLog = useCallback(async (note: string) => {
    try {
      if (selectedEmotion) {
        await fetch(getApiUrl("/api/emotions"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotions: [{ type: selectedEmotion, intensity: 3 }], tags: [], note }),
        });
      } else if (selectedFeeling) {
        const feel = FEELINGS.find((f) => f.key === selectedFeeling);
        await fetch(getApiUrl("/api/feelings"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bodyParts: [], sensations: [feel?.label || ""], energyLevel: 3, freeText: note }),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["character"] });

      const suggested = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      addMsg({
        role: "assistant",
        content: `Logged! Your Maumi felt that 💜\n\nHere's something that might help:`,
        buttons: [
          { label: `${suggested.emoji} ${suggested.label}`, emoji: suggested.emoji, action: "do_activity", data: suggested },
          { label: "Show me more options", emoji: "📋", action: "show_all_activities" },
          { label: "I'm good for now", emoji: "👋", action: "restart" },
        ],
      });
      setConvoState("suggest_activity");
    } catch {
      addMsg({ role: "assistant", content: "Hmm, something went wrong saving that. Could you try again?" });
    }
  }, [selectedEmotion, selectedFeeling, addMsg, queryClient]);

  const handleShowAllActivities = useCallback(() => {
    addMsg({ role: "user", content: "Show me all options" });
    setTimeout(() => {
      addMsg({
        role: "assistant",
        content: "Here are all the refresh activities you can try:",
        buttons: ACTIVITIES.map((a) => ({ label: `${a.emoji} ${a.label}`, emoji: a.emoji, action: "do_activity", data: a })),
      });
    }, 300);
  }, [addMsg]);

  const sendFreeMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    addMsg({ role: "user", content: text });
    setInputText("");
    setIsLoading(true);

    if (convoState === "write_note") {
      await saveLog(text);
      setIsLoading(false);
      return;
    }

    try {
      let convId = conversationId;
      if (!convId) {
        const createRes = await fetch(getApiUrl("/api/conversations"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Chat", mode: "chat" }),
        });
        const conv = await createRes.json();
        convId = conv.id;
        setConversationId(convId);
      }

      const res = await fetch(getApiUrl(`/api/conversations/${convId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      addMsg({ role: "assistant", content: data.content });
      queryClient.invalidateQueries({ queryKey: ["character"] });
    } catch {
      addMsg({ role: "assistant", content: "Sorry, connection seems unstable. Try again?" });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, convoState, conversationId, saveLog, addMsg, queryClient]);

  const charSpecies = character?.species || "cloud";
  const charLevel = character?.level || 1;
  const avatarImg = getCharacterImage(charSpecies, charLevel);

  const renderMessage = ({ item }: { item: ChatMsg }) => {
    const isUser = item.role === "user";
    return (
      <View style={{ marginVertical: 4 }}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser && (
            <Image source={avatarImg} style={styles.botAvatar} resizeMode="contain" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
              {item.content || (isLoading ? "..." : "")}
            </Text>
          </View>
        </View>
        {item.buttons && item.buttons.length > 0 && (
          item.isMainMenu ? (
            <View style={styles.mainMenuWrap}>
              <View style={styles.mainMenuRow}>
                {item.buttons.filter(b => !["go_meditation","go_breathing"].includes(b.action)).map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.actionBtn, styles.mainMenuBtn]}
                    onPress={() => handleButtonPress(btn.action, btn.data)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionLabel, styles.mainMenuLabel]}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {item.buttons.filter(b => ["go_meditation","go_breathing"].includes(b.action)).map((btn, i) => (
                <TouchableOpacity
                  key={`full-${i}`}
                  style={[styles.actionBtn, styles.mainMenuBtnFull]}
                  onPress={() => handleButtonPress(btn.action, btn.data)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={btn.action === "go_meditation" ? "musical-notes" : "leaf"} size={16} color="#FFFFFF" />
                  <Text style={[styles.actionLabel, styles.mainMenuLabel]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.buttonsWrap}>
              {item.buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionBtn}
                  onPress={() => {
                    if (btn.action === "show_all_activities") {
                      handleShowAllActivities();
                    } else {
                      handleButtonPress(btn.action, btn.data);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {btn.emoji && <Text style={styles.actionEmoji}>{btn.emoji}</Text>}
                  <Text style={styles.actionLabel}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </View>
    );
  };

  const showTextInput = convoState === "write_note" || convoState === "free_chat";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <LinearGradient
        colors={["#5B7AE8", "#7B6BC5", "#9B7FD4"]}
        style={[styles.topArea, { paddingTop: topInset + 4 }]}
      >
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <CharacterView character={character} onPress={() => { setShowCharacterPicker(true); setShowTooltip(false); }} onDoubleTap={doubleTapEnabled ? handleShake : undefined} showTooltip={showTooltip} equippedItems={equippedItems} />
      </LinearGradient>

      <View style={styles.chatSection}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatArea}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, paddingTop: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        <View style={[styles.inputBar, { paddingBottom: tabBarHeight + 4 }]}>
          {showTextInput ? (
            <>
              {convoState === "write_note" && (
                <TouchableOpacity style={styles.skipBtn} onPress={() => saveLog("")}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.textInput}
                placeholder={convoState === "write_note" ? "Write a short note..." : "Type a message..."}
                placeholderTextColor="#A9A3C0"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendFreeMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? "#7C6DC5" : "#D8D2EA" }]}
                onPress={sendFreeMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.inputPlaceholder}>
              <Text style={styles.inputHint}>Tap a button above to get started</Text>
            </View>
          )}
        </View>
      </View>

      {showCharacterPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Choose Your Maumi</Text>
            <View style={styles.speciesRow}>
              {[
                { key: "cloud", label: "Cloud" },
                { key: "star", label: "Star" },
                { key: "drop", label: "Drop" },
                { key: "flame", label: "Flame" },
                { key: "leaf", label: "Leaf" },
              ].map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.speciesBtn, character?.species === s.key && styles.speciesSelected]}
                  onPress={async () => {
                    try {
                      await fetch(getApiUrl("/api/character/species"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ species: s.key }),
                      });
                      queryClient.invalidateQueries({ queryKey: ["character"] });
                      setShowCharacterPicker(false);
                    } catch {}
                  }}
                >
                  <Image source={CHARACTER_IMAGES[s.key]} style={{ width: 48, height: 48 }} resizeMode="contain" />
                  <Text style={styles.speciesLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowCharacterPicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topArea: {
    alignItems: "center",
    paddingBottom: 28,
  },
  characterContainer: { alignItems: "center", paddingVertical: 4, position: "relative" },
  tooltip: {
    position: "absolute",
    top: -8,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipText: { fontSize: 12, fontWeight: "700", color: "#5B7AE8" },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  characterName: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 6, letterSpacing: -0.3 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  levelPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  xpBarOuter: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  xpBarInner: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  xpLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  settingsIcon: {
    position: "absolute",
    top: 0,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -16,
    overflow: "hidden",
  },
  chatArea: { flex: 1 },
  bubble: { maxWidth: "82%", padding: 14, borderRadius: 20, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  userBubble: {
    alignSelf: "flex-end", backgroundColor: "#7C6DC5",
    borderBottomRightRadius: 6, marginLeft: "18%",
  },
  assistantBubble: {
    alignSelf: "flex-start", backgroundColor: "#F3F0FA",
    borderBottomLeftRadius: 6, marginRight: "18%",
  },
  botAvatar: { width: 24, height: 24, marginTop: 2 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: "#2D2B3D" },
  buttonsWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingLeft: 48, paddingTop: 8, paddingRight: 20,
  },
  mainMenuWrap: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 6,
    marginTop: 12,
  },
  mainMenuRow: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#EDE8F5",
  },
  mainMenuBtn: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#5B7AE8",
    borderColor: "#5B7AE8",
    borderWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 11,
    borderRadius: 20,
    marginHorizontal: 0,
  },
  mainMenuBtnFull: {
    justifyContent: "center",
    backgroundColor: "#7C6DC5",
    borderColor: "#7C6DC5",
    borderWidth: 0,
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionEmoji: { fontSize: 14 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#7C6DC5" },
  mainMenuLabel: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1, borderTopColor: "#F0ECF8",
  },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 22,
    backgroundColor: "#F5F1FF", paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: "#2D2B3D",
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", marginBottom: 1,
  },
  skipBtn: {
    paddingHorizontal: 12, paddingVertical: 10,
  },
  skipText: { color: "#9B97B0", fontSize: 14, fontWeight: "600" },
  inputPlaceholder: { flex: 1, alignItems: "center", paddingVertical: 14 },
  inputHint: { fontSize: 14, color: "#A9A3C0" },
  pickerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100,
    justifyContent: "center", alignItems: "center",
  },
  pickerCard: {
    backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24,
    width: "85%", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  pickerTitle: { fontSize: 20, fontWeight: "700", color: "#2D2B3D", marginBottom: 20 },
  speciesRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  speciesBtn: {
    alignItems: "center", padding: 12, borderRadius: 16,
    borderWidth: 2, borderColor: "#EDE8F5", gap: 4,
  },
  speciesSelected: { borderColor: "#7C6DC5", backgroundColor: "rgba(124,109,197,0.08)" },
  speciesLabel: { fontSize: 11, fontWeight: "600", color: "#2D2B3D" },
  pickerClose: { paddingVertical: 10, paddingHorizontal: 24 },
  pickerCloseText: { fontSize: 15, fontWeight: "600", color: "#9B97B0" },
});
