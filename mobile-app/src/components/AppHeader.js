import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AppHeader({
  navigation,
  onOpenQuickAction,
  onOpenLanguage,
}) {
  const { mandal, user, logout } = useAuth();
  const { language } = useLanguage();

  const mandalName = mandal?.name || 'Sakhee Mitra Mandal';
  // Truncate to ~8-10 chars with ellipsis as shown in the screenshot ("Sakhe...")
  const truncatedName =
    mandalName.length > 7 ? `${mandalName.slice(0, 6)}...` : mandalName;

  const userInitial = (user?.name || user?.mobile || 'S')[0].toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      language === 'mr' ? 'बाहेर पडा' : 'Log Out',
      language === 'mr'
        ? 'तुम्हाला खरंच ॲपमधून बाहेर पडायचे आहे का?'
        : 'Are you sure you want to log out?',
      [
        { text: language === 'mr' ? 'रद्द करा' : 'Cancel', style: 'cancel' },
        {
          text: language === 'mr' ? 'बाहेर पडा' : 'Log Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.safeContainer}>
      <View style={styles.headerRow}>
        {/* Left: Logo + Mandal Name */}
        <TouchableOpacity
          style={styles.mandalBox}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('ProfileTab')}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.mandalText} numberOfLines={1}>
            {truncatedName}
          </Text>
        </TouchableOpacity>

        {/* Right Controls: Language Pill + "+ New" Button + Avatar + Door Icon */}
        <View style={styles.rightActions}>
          {/* Language Toggle Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={onOpenLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.langIcon}>🌐</Text>
            <Text style={styles.langText}>
              {language === 'mr' ? 'मराठी' : 'English'}
            </Text>
          </TouchableOpacity>

          {/* "+ New" Orange Button */}
          <TouchableOpacity
            style={styles.newBtn}
            onPress={onOpenQuickAction}
            activeOpacity={0.85}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>

          {/* User Initial Circle Avatar */}
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate?.('ProfileTab')}
          >
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </TouchableOpacity>

          {/* Door / Logout Icon */}
          <TouchableOpacity
            style={styles.doorBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.doorIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 48,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mandalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  mandalText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langIcon: {
    fontSize: 13,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  newBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  doorBtn: {
    paddingLeft: 2,
  },
  doorIcon: {
    fontSize: 18,
  },
});
