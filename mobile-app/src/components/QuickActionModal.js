import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2; // 2 columns with padding and gap

export default function QuickActionModal({ visible, onClose, navigation }) {
  const actions = [
    {
      id: 'new_collection',
      label: 'New Collection',
      icon: '🚩',
      iconBg: '#FFEDD5',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Collection');
      },
    },
    {
      id: 'receipts',
      label: 'Receipts',
      icon: '🧾',
      iconBg: '#E0F2FE',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Receipts');
      },
    },
    {
      id: 'donation',
      label: 'Donation',
      icon: '💰',
      iconBg: '#FEF3C7',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Collection');
      },
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: '💸',
      iconBg: '#DCFCE7',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Expenses');
      },
    },
    {
      id: 'chat',
      label: 'Committee Chat',
      icon: '💬',
      iconBg: '#EDE9FE',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Chat');
      },
    },
    {
      id: 'events',
      label: 'Events & Tasks',
      icon: '🎪',
      iconBg: '#FCE7F3',
      onPress: () => {
        onClose();
        navigation?.navigate?.('Events');
      },
    },
    {
      id: 'add_member',
      label: '+ Add Member',
      icon: '👥',
      iconBg: '#DBEAFE',
      onPress: () => {
        onClose();
        navigation?.navigate?.('MainTabs', { screen: 'ProfileTab' });
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Grab handle */}
              <View style={styles.grabHandle} />

              {/* Title & Subtitle */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Text style={styles.boltIcon}>⚡</Text>
                  <Text style={styles.title}>What would you like to add?</Text>
                </View>
                <Text style={styles.subtitle}>Select a quick action</Text>
              </View>

              {/* 2-Column Action Cards Grid */}
              <View style={styles.grid}>
                {actions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={item.onPress}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.cardLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 42 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  grabHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boltIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
});
