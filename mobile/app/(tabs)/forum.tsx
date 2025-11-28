import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const threads = [
  { title: 'Best electives for AI track?', replies: 12 },
  { title: 'Looking for teammates for hackathon', replies: 8 },
  { title: 'Any tips for first semester at Garching?', replies: 21 },
];

export default function ForumScreen() {
  const router = useRouter();
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({ light: '#475569', dark: '#94a3b8' }, 'text');
  const text = useThemeColor({}, 'text');
  const accent = useThemeColor({}, 'tint');

  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('tum-mock-token');
      setHasToken(Boolean(saved));
      setTokenChecked(true);
    })();
  }, []);

  if (!tokenChecked) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loading}>
          <ActivityIndicator color={accent} />
          <ThemedText style={{ color: muted }}>Checking session…</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasToken) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.gateCard, { borderColor: border }]}>
          <ThemedText type="title">Login required</ThemedText>
          <ThemedText style={{ color: muted }}>Sign in to view forum threads.</ThemedText>
          <View style={[styles.loginButton, { backgroundColor: accent }]}>
            <ThemedText
              style={{ color: text, fontWeight: '700' }}
              onPress={() => router.push('/profile')}
            >
              Go to login
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">Forum</ThemedText>
        <ThemedText style={{ color: muted }}>Ask questions, get advice, find peers.</ThemedText>
        <View style={styles.list}>
          {threads.map((thread) => (
            <View key={thread.title} style={[styles.card, { borderColor: border }]}>
              <ThemedText type="defaultSemiBold">{thread.title}</ThemedText>
              <ThemedText style={{ color: muted }}>{thread.replies} replies</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  list: { gap: 10 },
  card: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  gateCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    margin: 16,
  },
  loginButton: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
