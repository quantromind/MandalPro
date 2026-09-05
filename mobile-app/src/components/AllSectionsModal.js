import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AllSectionsModal({ visible, onClose, navigation, currentRoute }) {
  const { mandal, user } = useAuth();
  const { language } = useLanguage();

  const sections = [
    {
      id: 'finance',
      title: language === 'mr' ? 'वित्त (FINANCE)' : 'FINANCE',
      items: [
        {
          id: 'collections',
          label: language === 'mr' ? 'वर्गणी / संकलन' : 'Collections',
          icon: '🚩',
          route: 'CollectionsTab',
          isStack: false,
        },
        {
          id: 'donations',
          label: language === 'mr' ? 'देणग्या' : 'Donations',
          icon: '💰',
          route: 'Collection',
          isStack: true,
        },
        {
          id: 'expenses',
          label: language === 'mr' ? 'खर्च' : 'Expenses',
          icon: '💸',
          route: 'Expenses',
          isStack: true,
        },
        {
          id: 'budgets',
          label: language === 'mr' ? 'अंदाजपत्रक व उत्सव' : 'Budgets',
          icon: '📈',
          route: 'Events',
          isStack: true,
        },
      ],
    },
    {
      id: 'communication',
      title: language === 'mr' ? 'संवाद (COMMUNICATION)' : 'COMMUNICATION',
      items: [
        {
          id: 'chat',
          label: language === 'mr' ? 'समिती संवाद' : 'Committee Chat',
          icon: '💬',
          route: 'ChatTab',
          isStack: false,
        },
        {
          id: 'approvals',
          label: language === 'mr' ? 'मंजुऱ्या' : 'Approvals',
          icon: '⏳',
          route: 'Approvals',
          isStack: true,
        },
      ],
    },
    {
      id: 'growth',
      title: language === 'mr' ? 'वाढ व अहवाल (GROWTH)' : 'GROWTH',
      items: [
        {
          id: 'subscription',
          label: language === 'mr' ? 'सदस्यता' : 'Subscription',
          icon: '💎',
          route: 'Subscription',
          isStack: true,
        },
        {
          id: 'reports',
          label: language === 'mr' ? 'अहवाल व पावत्या' : 'Reports & Receipts',
          icon: '📑',
          route: 'Receipts',
          isStack: true,
        },
      ],
    },
    {
      id: 'account',
      title: language === 'mr' ? 'खाते (ACCOUNT)' : 'ACCOUNT',
      items: [
        {
          id: 'profile',
          label: language === 'mr' ? 'मंडळ प्रोफाइल' : 'Mandal Profile',
          icon: '🏛️',
          route: 'ProfileTab',
          isStack: false,
        },
        {
          id: 'settings',
          label: language === 'mr' ? 'सेटिंग्ज' : 'Settings',
          icon: '⚙️',
          route: 'ProfileTab',
          isStack: false,
        },
      ],
    },
  ];

  const handleNavigate = (item) => {
    onClose();
    if (!navigation) return;
    if (item.isStack) {
      navigation.navigate(item.route);
    } else {
      navigation.navigate(item.route);
    }
  };

  const isItemActive = (item) => {
    if (item.id === 'chat' && (currentRoute === 'ChatTab' || currentRoute === 'Chat')) return true;
    if (item.id === 'collections' && currentRoute === 'CollectionsTab') return true;
    if (item.id === 'profile' && currentRoute === 'ProfileTab') return true;
    return false;
  };

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
              {/* Top Drag Handle */}
              <View style={styles.grabHandle} />

              {/* Header: Title, Subtitle, Close Button */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {language === 'mr' ? 'सर्व विभाग' : 'All Sections'}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {mandal?.name || 'Sakhee Mitra Mandal'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Section List */}
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {sections.map((section) => (
                  <View key={section.id} style={styles.sectionGroup}>
                    <Text style={styles.sectionCategoryTitle}>{section.title}</Text>
                    {section.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.sectionCard, active && styles.sectionCardActive]}
                          onPress={() => handleNavigate(item)}
                          activeOpacity={0.78}
                        >
                          <Text style={styles.sectionIcon}>{item.icon}</Text>
                          <Text style={[styles.sectionLabel, active && styles.sectionLabelActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.85,
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
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  scrollList: {
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },
  sectionGroup: {
    marginBottom: 6,
  },
  sectionCategoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionCardActive: {
    borderColor: '#F97316',
    borderWidth: 1.5,
    backgroundColor: '#FFF7ED',
  },
  sectionIcon: {
    fontSize: 19,
    marginRight: 14,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
});
