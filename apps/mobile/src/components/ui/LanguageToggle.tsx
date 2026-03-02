import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Language } from '../../types';

interface LanguageToggleProps {
  currentLang: Language;
  onToggle: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onToggle }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onToggle('en')}>
        <Text style={[styles.langText, currentLang === 'en' && styles.activeLang]}>EN</Text>
      </TouchableOpacity>

      <Text style={styles.separator}>|</Text>

      <TouchableOpacity onPress={() => onToggle('ko')}>
        <Text style={[styles.langText, currentLang === 'ko' && styles.activeLang]}>KO</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text3,
  },
  activeLang: {
    color: COLORS.text,
  },
  separator: {
    fontSize: 14,
    color: COLORS.text3,
  },
});
