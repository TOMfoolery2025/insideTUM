import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeColor } from '@/hooks/use-theme-color';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'tum-mock-token';

type ScrapeResponse = {
  url: string;
  status?: number;
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  textPreview?: string;
  headings?: string[];
  links?: string[];
  error?: string;
};

type User = {
  id: string;
  tumId: string | null;
  email: string;
  fullName: string;
  faculty: string | null;
  semester?: number | null;
  profileSlug: string;
  authProvider: 'mock' | 'tum';
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  token: string;
  user: User;
};

export default function ScrapeScreen() {
  const [health, setHealth] = useState<'loading' | 'ok' | 'error'>('loading');
  const [healthMsg, setHealthMsg] = useState('Checking backend…');
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tumId, setTumId] = useState('');
  const [faculty, setFaculty] = useState('');

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResponse | null>(null);

  const accent = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({ light: '#475569', dark: '#94a3b8' }, 'text');
  const error = '#ef4444';

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHealth('ok');
        setHealthMsg(data.message ?? 'Backend OK');
      })
      .catch((err) => {
        setHealth('error');
        setHealthMsg(err instanceof Error ? err.message : 'Failed to reach backend');
      });
  }, []);

  const fetchProfile = async (authToken: string) => {
    setProfileLoading(true);
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { user: User };
      setProfile(data.user);
      setAuthError(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        fetchProfile(saved);
      }
    })();
  }, []);

  const onLogin = async () => {
    const safeEmail = email.trim();
    const safeName = fullName.trim();
    if (!safeEmail || !safeName) {
      setAuthError('Enter your TUM email and full name.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_URL}/auth/mock-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: safeEmail,
          fullName: safeName,
          tumId: tumId.trim() || null,
          faculty: faculty.trim() || null,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as AuthResponse;
      setToken(data.token);
      setProfile(data.user);
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const onRefreshProfile = () => {
    if (token) {
      fetchProfile(token);
    }
  };

  const onLogout = async () => {
    setToken(null);
    setProfile(null);
    setAuthError(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      return;
    }
  };

  const onScrape = async () => {
    const target = scrapeUrl.trim() || 'https://example.com';
    setScrapeLoading(true);
    setScrapeError(null);
    setScrapeResult(null);
    try {
      const response = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as ScrapeResponse;
      setScrapeResult(data);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Scrape failed');
    } finally {
      setScrapeLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <ThemeToggle />
          <View style={[styles.statusBar, { borderColor: border }]}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  health === 'ok' ? styles.dotOk : styles.dotError,
                  health === 'loading' ? styles.dotLoading : null,
                ]}
              />
              <ThemedText style={{ fontWeight: '600' }}>{healthMsg}</ThemedText>
            </View>
            <ThemedText style={{ color: muted, fontSize: 13 }}>API: {API_URL}</ThemedText>
          </View>

          <View style={[styles.card, { borderColor: border }]}>
            <ThemedText type="subtitle">Login with TUM (Prototype)</ThemedText>
            <ThemedText style={{ color: muted }}>
              Mock login issues a JWT and student profile. Ready to swap with real OIDC later.
            </ThemedText>
            <View style={styles.inputRow}>
              <View style={styles.field}>
                <ThemedText type="defaultSemiBold">Full name</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: border, color: text }]}
                  placeholder="Mia Schmidt"
                  placeholderTextColor={muted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="defaultSemiBold">TUM email</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: border, color: text }]}
                  placeholder="mia.schmidt@tum.de"
                  placeholderTextColor={muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.field}>
                <ThemedText type="defaultSemiBold">TUM ID (optional)</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: border, color: text }]}
                  placeholder="ga12abc"
                  placeholderTextColor={muted}
                  value={tumId}
                  onChangeText={setTumId}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="defaultSemiBold">Faculty (optional)</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: border, color: text }]}
                  placeholder="CIT, SOM, MW, EDU…"
                  placeholderTextColor={muted}
                  value={faculty}
                  onChangeText={setFaculty}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <View style={styles.authActions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: accent }]}
                onPress={onLogin}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#f8fafc" />
                ) : (
                  <ThemedText style={styles.buttonText}>Login with TUM (Prototype)</ThemedText>
                )}
              </TouchableOpacity>
              {token ? (
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: border }]}
                  onPress={onRefreshProfile}
                  disabled={profileLoading}
                >
                  <ThemedText style={[styles.outlineText, { color: text }]}>
                    {profileLoading ? 'Refreshing…' : 'Refresh /me'}
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
              {token ? (
                <TouchableOpacity style={styles.dangerButton} onPress={onLogout}>
                  <ThemedText style={styles.dangerText}>Log out</ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
            {authError ? (
              <ThemedText style={[styles.error, { color: error }]}>Auth error: {authError}</ThemedText>
            ) : null}
            <View style={[styles.resultCard, { borderColor: border }]}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: token ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                      borderColor: token ? 'rgba(34, 197, 94, 0.45)' : border,
                    },
                  ]}
                >
                  <View style={[styles.dotSmall, token ? styles.dotOk : styles.dotError]} />
                  <ThemedText style={{ fontWeight: '700', color: token ? '#0f172a' : muted }}>
                    {token ? 'JWT stored' : 'No session'}
                  </ThemedText>
                </View>
                {token ? (
                  <ThemedText style={{ color: muted, fontSize: 12 }}>
                    {token.slice(0, 26)}…
                  </ThemedText>
                ) : null}
              </View>
              {profileLoading ? (
                <ThemedText style={{ color: muted }}>Loading profile…</ThemedText>
              ) : profile ? (
                <View style={styles.profileGrid}>
                  <View>
                    <ThemedText style={styles.label}>Name</ThemedText>
                    <ThemedText type="defaultSemiBold">{profile.fullName}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.label}>Email</ThemedText>
                    <ThemedText>{profile.email}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.label}>Faculty</ThemedText>
                    <ThemedText>{profile.faculty || '—'}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.label}>Profile slug</ThemedText>
                    <ThemedText>{profile.profileSlug}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.label}>Provider</ThemedText>
                    <ThemedText style={{ fontWeight: '700' }}>{profile.authProvider}</ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.label}>Created</ThemedText>
                    <ThemedText>{new Date(profile.createdAt).toLocaleString()}</ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText style={{ color: muted }}>Sign in to load /me payload.</ThemedText>
              )}
            </View>
          </View>

          <View style={[styles.card, { borderColor: border }]}>
            <ThemedText type="subtitle">Scrape a Page</ThemedText>
            <ThemedText style={{ color: muted }}>
              Get title, meta, headings, preview, and links.
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: border, color: text }]}
              placeholder="https://example.com"
              placeholderTextColor={muted}
              value={scrapeUrl}
              onChangeText={setScrapeUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accent }]}
              onPress={onScrape}
              disabled={scrapeLoading}
            >
              {scrapeLoading ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <ThemedText style={styles.buttonText}>Scrape</ThemedText>
              )}
            </TouchableOpacity>
            {scrapeError ? (
              <ThemedText style={[styles.error, { color: error }]}>Error: {scrapeError}</ThemedText>
            ) : null}
            {scrapeResult ? (
              <View style={[styles.resultCard, { borderColor: border }]}>
                <ThemedText style={styles.url}>{scrapeResult.url}</ThemedText>
                <ThemedText style={{ color: muted }}>HTTP {scrapeResult.status ?? 'n/a'}</ThemedText>
                {scrapeResult.title ? <ThemedText type="subtitle">{scrapeResult.title}</ThemedText> : null}
                {scrapeResult.description ? (
                  <ThemedText style={{ color: muted }}>{scrapeResult.description}</ThemedText>
                ) : null}
                {scrapeResult.ogTitle ? (
                  <ThemedText style={{ color: muted }}>OG: {scrapeResult.ogTitle}</ThemedText>
                ) : null}
                {scrapeResult.ogDescription ? (
                  <ThemedText style={{ color: muted }}>OG Desc: {scrapeResult.ogDescription}</ThemedText>
                ) : null}
                {scrapeResult.textPreview ? (
                  <ThemedText style={{ color: muted }}>Preview: {scrapeResult.textPreview}</ThemedText>
                ) : null}
                {scrapeResult.headings?.length ? (
                  <View style={styles.section}>
                    <ThemedText type="defaultSemiBold">Headings</ThemedText>
                    {scrapeResult.headings.slice(0, 8).map((h) => (
                      <ThemedText key={h}>• {h}</ThemedText>
                    ))}
                    {scrapeResult.headings.length > 8 ? (
                      <ThemedText style={{ color: muted }}>
                        +{scrapeResult.headings.length - 8} more
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}
                {scrapeResult.links?.length ? (
                  <View style={styles.section}>
                    <ThemedText type="defaultSemiBold">Links</ThemedText>
                    <View style={styles.chipList}>
                      {scrapeResult.links.slice(0, 8).map((l) => (
                        <TouchableOpacity key={l} onPress={() => openLink(l)}>
                          <ThemedText style={styles.chip}>{l}</ThemedText>
                        </TouchableOpacity>
                      ))}
                      {scrapeResult.links.length > 8 ? (
                        <ThemedText style={{ color: muted }}>
                          +{scrapeResult.links.length - 8} more
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: { flex: 1 },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  statusBar: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOk: {
    backgroundColor: '#22c55e',
  },
  dotError: {
    backgroundColor: '#ef4444',
  },
  dotLoading: {
    backgroundColor: '#fbbf24',
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  authActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1.2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  outlineText: {
    fontWeight: '700',
  },
  dangerButton: {
    borderWidth: 1.2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderColor: '#fecdd3',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  dangerText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  error: {
    fontWeight: '600',
  },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  url: {
    fontWeight: '700',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(226, 232, 240, 0.15)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  section: {
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 13,
  },
});
