import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function HomeIcon({ color = '#64748B', size = 20, isFocused = false }) {
  return (
    <View style={styles.iconContainer}>
      {/* Roof */}
      <View
        style={[
          styles.roofTriangle,
          {
            borderBottomColor: color,
          },
        ]}
      />
      {/* House Body */}
      <View
        style={[
          styles.houseBody,
          {
            borderColor: color,
            backgroundColor: isFocused ? color : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.door,
            {
              backgroundColor: isFocused ? '#FFF1E7' : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function ReceiptsIcon({ color = '#64748B', size = 20, isFocused = false }) {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.receiptCard,
          {
            borderColor: color,
            backgroundColor: isFocused ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
          },
        ]}
      >
        <View style={[styles.receiptLine, { width: 7, backgroundColor: color }]} />
        <View style={[styles.receiptLine, { width: 8.5, backgroundColor: color }]} />
        <View style={[styles.receiptLine, { width: 5.5, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ChatIcon({ color = '#64748B', size = 20, isFocused = false }) {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.chatBubble,
          {
            borderColor: color,
            backgroundColor: isFocused ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
          },
        ]}
      >
        <View style={[styles.chatDot, { backgroundColor: color }]} />
        <View style={[styles.chatDot, { backgroundColor: color }]} />
        <View style={[styles.chatDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MandalIcon({ color = '#64748B', size = 20, isFocused = false }) {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.shieldContainer,
          {
            borderColor: color,
            backgroundColor: isFocused ? color : 'transparent',
          },
        ]}
      >
        <Text style={[styles.shieldCheck, { color: isFocused ? '#FFFFFF' : color }]}>
          ✓
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  /* Home */
  roofTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -0.5,
  },
  houseBody: {
    width: 13,
    height: 10,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    width: 4,
    height: 5,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },

  /* Receipts */
  receiptCard: {
    width: 14.5,
    height: 17,
    borderWidth: 1.8,
    borderRadius: 3.5,
    paddingHorizontal: 2,
    paddingVertical: 2.5,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  receiptLine: {
    height: 1.6,
    borderRadius: 1,
  },

  /* Chat */
  chatBubble: {
    width: 17.5,
    height: 14.5,
    borderWidth: 1.8,
    borderRadius: 7,
    borderBottomLeftRadius: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chatDot: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
  },

  /* Mandal / Shield */
  shieldContainer: {
    width: 15.5,
    height: 17.5,
    borderWidth: 1.8,
    borderTopLeftRadius: 7.5,
    borderTopRightRadius: 7.5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldCheck: {
    fontSize: 9.5,
    fontWeight: '900',
    marginTop: -1,
  },
});
