import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

/* ─────────────────────────────────────────────
   All icons use a single emoji glyph approach.
   Emoji scale cleanly and look sharp on both
   LDPI and HDPI screens without custom SVGs.
   Active state: slight size bump + orange tint via wrapper.
   ───────────────────────────────────────────── */

const ICONS = {
  HomeTab:        { emoji: '🏠', label: 'Home' },
  CollectionsTab: { emoji: '🚩', label: 'Collections' },
  ChatTab:        { emoji: '💬', label: 'Chat' },
  MoreTab:        { emoji: '☰', label: 'More' },
};

function TabIcon({ emoji, isFocused }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, isFocused && styles.emojiFocused]}>
        {emoji}
      </Text>
    </View>
  );
}

export function HomeIcon({ isFocused }) {
  return <TabIcon emoji="🏠" isFocused={isFocused} />;
}

export function CollectionsIcon({ isFocused }) {
  return <TabIcon emoji="🚩" isFocused={isFocused} />;
}

export function ExpensesIcon({ isFocused }) {
  return <TabIcon emoji="💸" isFocused={isFocused} />;
}

export function ReceiptsIcon({ isFocused }) {
  return <TabIcon emoji="🧾" isFocused={isFocused} />;
}

export function MandalIcon({ isFocused }) {
  return <TabIcon emoji="🏛️" isFocused={isFocused} />;
}

export function ChatIcon({ isFocused }) {
  return <TabIcon emoji="💬" isFocused={isFocused} />;
}

export function MoreIcon({ isFocused }) {
  return <TabIcon emoji="☰" isFocused={isFocused} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 19,
    opacity: 0.6,
  },
  emojiFocused: {
    fontSize: 21,
    opacity: 1,
  },
});
