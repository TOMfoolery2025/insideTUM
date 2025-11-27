import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const inspiration = [
  { title: 'Try a scrape', desc: 'See what your homepage exposes in meta and headings.' },
  { title: 'Crawl ideas', desc: 'Follow links on a blog or docs to map the structure.' },
  { title: 'Link hygiene', desc: 'Check for duplicate or broken links across a site.' },
];

const quickLinks = [
  { label: 'example.com', url: 'https://example.com' },
  { label: 'Wikipedia JS', url: 'https://en.wikipedia.org/wiki/JavaScript' },
  { label: 'HN', url: 'https://news.ycombinator.com' },
];

export default function DiscoverScreen() {
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({ light: '#475569', dark: '#94a3b8' }, 'text');
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[tint, '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ThemedText type="title" style={styles.heroTitle}>
            Tomfoolery Tools
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: '#e2e8f0' }]}>Scrape, crawl, and explore.</ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: '#e2e8f0' }]}>Pick a tool from the tabs.</ThemedText>
        </LinearGradient>

        <ThemedView style={[styles.card, { borderColor: border }]}>
          <ThemedText type="subtitle">Quick links</ThemedText>
          <View style={styles.chipRow}>
            {quickLinks.map((item) => (
              <ThemedText key={item.url} style={styles.chip}>
                {item.label}
              </ThemedText>
            ))}
          </View>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            Use these in Scrape or Crawl to get a feel for results.
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor: border }]}>
          <ThemedText type="subtitle">Ideas</ThemedText>
          <View style={styles.list}>
            {inspiration.map((item) => (
              <View key={item.title} style={styles.listItem}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={{ color: muted }}>{item.desc}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor: border }]}>
          <ThemedText type="subtitle">Shortcuts</ThemedText>
          <View style={styles.shortcuts}>
            <TouchableOpacity style={[styles.shortcut, { borderColor: border }]}
              onPress={() => router.push('/')}
            >
              <ThemedText type="defaultSemiBold">Scrape</ThemedText>
              <ThemedText style={{ color: muted, fontSize: 12 }}>Check meta & links</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcut, { borderColor: border }]}
              onPress={() => router.push('/crawl')}
            >
              <ThemedText type="defaultSemiBold">Crawl</ThemedText>
              <ThemedText style={{ color: muted, fontSize: 12 }}>Follow internal links</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  hero: {
    borderRadius: 14,
    padding: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroTitle: {
    color: '#f8fafc',
  },
  heroSubtitle: {
    color: '#e2e8f0',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  list: {
    gap: 10,
  },
  listItem: {
    gap: 4,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcut: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
});
