import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorSchemeControls } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export function ThemeToggle() {
  const { colorScheme, setColorScheme, useSystem, source } = useColorSchemeControls();
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={styles.themeRow}>
      <ThemedText style={styles.label}>Theme</ThemedText>
      <View style={styles.pills}>
        <TouchableOpacity
          style={[
            styles.pill,
            { borderColor: border, backgroundColor: colorScheme === 'light' ? tint : 'transparent' },
          ]}
          onPress={() => setColorScheme('light')}
        >
          <ThemedText style={[styles.pillText, { color: colorScheme === 'light' ? '#f8fafc' : text }]}>
            Light
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.pill,
            { borderColor: border, backgroundColor: colorScheme === 'dark' ? tint : 'transparent' },
          ]}
          onPress={() => setColorScheme('dark')}
        >
          <ThemedText style={[styles.pillText, { color: colorScheme === 'dark' ? '#f8fafc' : text }]}>
            Dark
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.pill,
            { borderColor: border, backgroundColor: source === 'system' ? tint : 'transparent' },
          ]}
          onPress={() => useSystem()}
        >
          <ThemedText style={[styles.pillText, { color: source === 'system' ? '#f8fafc' : text }]}>
            System
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillText: {
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
  },
});
