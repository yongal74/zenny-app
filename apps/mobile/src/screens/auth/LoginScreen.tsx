import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE } from '../../utils/api';

// API_BASE에서 origin 추출 (예: http://172.30.1.29:5000/api → http://172.30.1.29:5000)
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

type LoadingState = 'google' | 'apple' | 'facebook' | 'twitter' | 'guest' | null;

export function LoginScreen() {
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  // Deep link 수신 (소셜 로그인 콜백: zenny://auth?token=xxx&userId=yyy)
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname === 'auth') {
          const token = parsed.searchParams.get('token');
          const userId = parsed.searchParams.get('userId');
          if (token && userId) {
            WebBrowser.dismissBrowser();
            setAuth(token, userId);
          } else {
            setError('Sign-in failed. Please try again.');
          }
        }
      } catch {
        // ignore non-auth deep links
      } finally {
        setLoading(null);
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  const openSocialAuth = async (provider: 'google' | 'apple' | 'facebook' | 'twitter') => {
    setLoading(provider);
    setError('');
    const redirectUri = encodeURIComponent('zenny://auth');
    const url = `${API_ORIGIN}/api/auth/${provider}/start?redirect=${redirectUri}`;
    try {
      const result = await WebBrowser.openAuthSessionAsync(url, 'zenny://auth');
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setLoading(null);
      }
      // 성공 케이스는 Linking 이벤트로 처리됨
    } catch (err: any) {
      setError('Sign-in failed. Please try again.');
      setLoading(null);
    }
  };

  const handleGuestLogin = async () => {
    setLoading('guest');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'en' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAuth(data.token, data.userId);
    } catch (err: any) {
      console.error('[Zenny] Guest login error:', err);
      setError(err?.message ?? "Cannot reach server. Make sure you're on the same network.");
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0C0C14', '#151520', '#1A1A2E', '#151520', '#0C0C14']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={s.container}
      >
        {/* Logo */}
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
          <Text style={s.subtitle}>Your mindful companion</Text>
        </View>

        {/* Buttons */}
        <View style={s.buttons}>
          {!!error && <Text style={s.errorText}>{error}</Text>}

          <SocialBtn label="Continue with Google"   icon="G"  iconColor="#4285F4"    onPress={() => openSocialAuth('google')}   loading={loading === 'google'}   disabled={busy} />
          <SocialBtn label="Continue with Apple"    icon=""  iconColor={theme.colors.text.primary} onPress={() => openSocialAuth('apple')}    loading={loading === 'apple'}    disabled={busy} />
          <SocialBtn label="Continue with Facebook" icon="f"  iconColor="#1877F2"                   onPress={() => openSocialAuth('facebook')} loading={loading === 'facebook'} disabled={busy} />
          <SocialBtn label="Continue with X"        icon="𝕏"  iconColor={theme.colors.text.primary} onPress={() => openSocialAuth('twitter')}  loading={loading === 'twitter'} disabled={busy} />

          <View style={s.dividerRow}>
            <LinearGradient colors={['transparent', theme.colors.border]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <LinearGradient colors={[theme.colors.border, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.guestBtn} onPress={handleGuestLogin} disabled={busy} activeOpacity={0.85}>
            {loading === 'guest'
              ? <ActivityIndicator color={theme.colors.text.secondary} />
              : <Text style={s.guestText}>Continue as Guest</Text>
            }
          </TouchableOpacity>

          <Text style={s.guestNote}>Guest progress can't be recovered if lost</Text>
        </View>

        <Text style={s.footer}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

function SocialBtn({ label, icon, iconColor, onPress, loading, disabled }: {
  label: string; icon: string; iconColor: string;
  onPress: () => void; loading: boolean; disabled: boolean;
}) {
  return (
    <LinearGradient colors={['#22223A', '#2A2A48']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.socialGradient}>
      <TouchableOpacity style={s.socialBtn} onPress={onPress} disabled={disabled} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color={theme.colors.text.primary} />
          : <>
              <Text style={[s.socialIcon, { color: iconColor }]}>{icon}</Text>
              <Text style={s.socialText}>{label}</Text>
            </>
        }
      </TouchableOpacity>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 32 },

  header: { alignItems: 'center', paddingTop: 60, gap: 8 },
  ringContainer: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ringOuter:  { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(200,200,240,0.03)', borderWidth: 1, borderColor: 'rgba(200,200,240,0.06)' },
  ringMid:    { position: 'absolute', width: 130, height: 130, borderRadius: 65,  backgroundColor: 'rgba(200,200,240,0.05)', borderWidth: 1, borderColor: 'rgba(200,200,240,0.08)' },
  ringInner:  { position: 'absolute', width: 90,  height: 90,  borderRadius: 45,  backgroundColor: 'rgba(200,200,240,0.08)', borderWidth: 1, borderColor: 'rgba(200,200,240,0.12)' },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(200,200,240,0.12)', justifyContent: 'center', alignItems: 'center' },
  logo:     { fontSize: 32, color: '#FFFFFF' },
  title:    { fontSize: 36, fontWeight: '700', color: theme.colors.text.primary, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: theme.colors.text.secondary, letterSpacing: 0.5 },

  buttons:   { gap: 10 },
  errorText: { fontSize: 13, color: '#E55555', textAlign: 'center', marginBottom: 4 },

  socialGradient: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,200,240,0.12)' },
  socialBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, paddingHorizontal: 20, gap: 10 },
  socialIcon: { fontSize: 17, fontWeight: '700', width: 22, textAlign: 'center' },
  socialText: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, color: theme.colors.text.tertiary },

  guestBtn:  { backgroundColor: 'transparent', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,200,240,0.10)' },
  guestText: { fontSize: 14, color: theme.colors.text.secondary },
  guestNote: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center' },

  footer: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center', paddingBottom: 20 },
});
