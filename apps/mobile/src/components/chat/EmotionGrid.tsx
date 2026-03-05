import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { Emotion, EMOTION_LABELS } from '../../types';
import { useCharacterStore } from '../../stores/characterStore';

interface EmotionGridProps {
  onEmotionSelect: (emotion: Emotion) => void;
}

const QUICK_EMOTIONS: Emotion[] = ['happy', 'stressed', 'anxious', 'sad', 'tired', 'confused'];

export const EmotionGrid: React.FC<EmotionGridProps> = ({ onEmotionSelect }) => {
  const lang = useCharacterStore((s) => s.lang);

  return (
    <View style={styles.container}>
      {QUICK_EMOTIONS.map((emotion) => (
        <TouchableOpacity
          key={emotion}
          style={styles.emotionButton}
          onPress={() => onEmotionSelect(emotion)}
        >
          <Text style={styles.emotionText}>{EMOTION_LABELS[emotion][lang]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 16,
  },
  emotionButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: '30%',
    alignItems: 'center',
    minHeight: theme.minTouchTarget,
    justifyContent: 'center',
  },
  emotionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});
