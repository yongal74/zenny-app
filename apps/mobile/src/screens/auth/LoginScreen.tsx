import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { useCharacterStore } from '../../stores/characterStore';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE } from '../../utils/api';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setLang, lang } = useCharacterStore();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const authUser = params.get('auth_user');
    if (authToken && authUser) {
      window.history.replaceState({}, '', '/');
      setAuth(authToken, authUser);
      return;
    }
    const authError = params.get('auth_error');
    if (authError) {
      window.history.replaceState({}, '', '/');
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }, []);

  const handleSocialLogin = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/api/login';
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.lang) setLang(data.lang);
      setAuth(data.token, data.userId);
    } catch (err: any) {
      console.error('[Zenny] Guest login error:', err);
      setError(err?.message || '다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0C0C14', '#151520', '#1A1A2E', '#151520', '#0C0C14']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={s.container}
      >
        <View style={s.header}>
          <View style={s.ringContainer}>
            <View style={s.ringOuter} />
            <View style={s.ringMid} />
            <View style={s.ringInner} />
            <View style={s.logoCircle}>
              <Text style={s.logo}>✿</Text>
            </View>
          </View>
          <Text style={s.title}>Zenny</Text>
          <Text style={s.subtitle}>마음을 돌보는 나만의 친구</Text>
        </View>

        <View style={s.buttons}>
          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <LinearGradient
            colors={['#22223A', '#2A2A48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.socialBtnGradient}
          >
            <TouchableOpacity style={s.socialBtn} onPress={handleSocialLogin} activeOpacity={0.85}>
              <Text style={s.socialIcon}>🔐</Text>
              <Text style={s.socialText}>소셜 로그인으로 시작하기</Text>
            </TouchableOpacity>
          </LinearGradient>

          <Text style={s.socialHint}>Google, Apple, GitHub 등 지원</Text>

          <View style={s.dividerRow}>
            <LinearGradient
              colors={['transparent', COLORS.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.dividerLine}
            />
            <Text style={s.dividerText}>또는</Text>
            <LinearGradient
              colors={[COLORS.border, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.dividerLine}
            />
          </View>

          <TouchableOpacity style={s.guestBtn} onPress={handleGuestLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={COLORS.text2} />
            ) : (
              <Text style={s.guestText}>게스트로 시작하기</Text>
            )}
          </TouchableOpacity>

          <View style={s.langRow}>
            {(['ko', 'en'] as const).map((l) => (
              <TouchableOpacity key={l} style={[s.langBtn, lang === l && s.langBtnActive]} onPress={() => setLang(l)}>
                <Text style={[s.langBtnText, lang === l && s.langBtnTextActive]}>{l === 'ko' ? '한국어' : 'EN'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={s.footer}>로그인하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 32 },

  header: { alignItems: 'center', paddingTop: 60, gap: 8 },

  ringContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ringOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(200,200,240,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.06)',
  },
  ringMid: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(200,200,240,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.08)',
  },
  ringInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(200,200,240,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.12)',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(200,200,240,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { fontSize: 32, color: '#FFFFFF' },
  title: { fontSize: 36, fontWeight: '700', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: COLORS.text2, letterSpacing: 0.5 },

  buttons: { gap: 12 },

  errorText: { fontSize: 13, color: '#E55555', textAlign: 'center', marginBottom: 4 },

  socialBtnGradient: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.12)',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 20,
    gap: 10,
  },
  socialIcon: { fontSize: 18 },
  socialText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  socialHint: { fontSize: 12, color: COLORS.text3, textAlign: 'center' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, color: COLORS.text3 },

  guestBtn: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,200,240,0.10)',
  },
  guestText: { fontSize: 14, color: COLORS.text2 },

  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: COLORS.surface, borderRadius: 10 },
  langBtnActive: { backgroundColor: COLORS.primary },
  langBtnText: { fontSize: 12, color: COLORS.text3, fontWeight: '600' },
  langBtnTextActive: { color: COLORS.text },

  footer: { fontSize: 11, color: COLORS.text3, textAlign: 'center', paddingBottom: 20 },
});
