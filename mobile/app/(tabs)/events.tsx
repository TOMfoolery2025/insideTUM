import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type TumEvent = {
  title: string;
  date?: string;
  url?: string;
  image?: string;
};

export default function EventsScreen() {
  const router = useRouter();
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({ light: '#475569', dark: '#94a3b8' }, 'text');
  const text = useThemeColor({}, 'text');
  const accent = useThemeColor({}, 'tint');

  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [events, setEvents] = useState<TumEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('tum-mock-token');
      setHasToken(Boolean(saved));
      setTokenChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/tum-events`);
        if (!response.ok) {
          const textResp = await response.text();
          throw new Error(textResp || `HTTP ${response.status}`);
        }
        const data = (await response.json()) as { events: TumEvent[] };
        setEvents(data.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [hasToken]);

  const onOpen = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      return;
    }
  };

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
          <ThemedText style={{ color: muted }}>Sign in to see events for TUM students.</ThemedText>
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
        <ThemedText type="title">Events</ThemedText>
        <ThemedText style={{ color: muted }}>Closest events pulled from TUM.</ThemedText>
        {loadingEvents ? (
          <View style={styles.loading}>
            <ActivityIndicator color={accent} />
            <ThemedText style={{ color: muted }}>Loading events…</ThemedText>
          </View>
        ) : error ? (
          <View style={[styles.card, { borderColor: border }]}>
            <ThemedText style={{ color: '#b91c1c' }}>Error: {error}</ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.title}
                style={[styles.card, { borderColor: border }]}
                onPress={() => onOpen(event.url)}
                activeOpacity={event.url ? 0.7 : 1}
              >
                {event.image ? (
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: event.image }} style={styles.bgImage} contentFit="cover" />
                    <View style={styles.overlay} />
                    <View style={styles.imageText}>
                      <ThemedText type="defaultSemiBold" style={{ color: '#f8fafc' }}>
                        {event.title}
                      </ThemedText>
                      {event.date ? <ThemedText style={{ color: '#e2e8f0' }}>{event.date}</ThemedText> : null}
                    </View>
                  </View>
                ) : (
                  <>
                    <ThemedText type="defaultSemiBold">{event.title}</ThemedText>
                    {event.date ? <ThemedText style={{ color: muted }}>{event.date}</ThemedText> : null}
                  </>
                )}
              </TouchableOpacity>
            ))}
            {events.length === 0 ? (
              <ThemedText style={{ color: muted }}>No events found.</ThemedText>
            ) : null}
          </View>
        )}
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
    padding: 0,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  imageText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
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
