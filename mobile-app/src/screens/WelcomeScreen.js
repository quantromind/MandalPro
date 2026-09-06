import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { language, setLanguage } = useLanguage();
  const isMr = language === 'mr';

  const toggleLanguage = () => {
    setLanguage(isMr ? 'en' : 'mr');
  };

  const highlights = [
    {
      icon: '🧾',
      color: '#F97316',
      title: isMr ? 'WhatsApp पावत्या' : 'WhatsApp Receipts',
      desc: isMr ? 'वर्गणी मिळताच डिजिटल पावती त्वरित WhatsApp वर' : 'Instant branded receipts on WhatsApp',
    },
    {
      icon: '💸',
      color: '#10B981',
      title: isMr ? 'पारदर्शक हिशोब' : 'Transparent Accounts',
      desc: isMr ? 'खर्च मंजुरी व जमा-खर्च ताळेबंद' : 'Expense approvals & balance sheets',
    },
    {
      icon: '👥',
      color: '#3B82F6',
      title: isMr ? 'डिजिटल ओळखपत्रे' : 'Digital ID Cards',
      desc: isMr ? 'पदाधिकारी व स्वयंसेवक आयडी कार्ड' : 'Official photo IDs for committee',
    },
    {
      icon: '📑',
      color: '#8B5CF6',
      title: isMr ? 'ऑडिट अहवाल' : 'Audit Reports',
      desc: isMr ? 'सीए व धर्मादाय आयुक्त रेडी अहवाल' : 'One-click CA & audit-ready reports',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandName}>
              Apla<Text style={{ color: '#F97316' }}>Mandal</Text>
            </Text>
            <Text style={styles.brandTag}>आपलं मंडळ • डिजिटल महाराष्ट्र</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.langPill} onPress={toggleLanguage} activeOpacity={0.8}>
            <Text style={styles.langIcon}>🌐</Text>
            <Text style={styles.langText}>{isMr ? 'मराठी' : 'EN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerLoginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.headerLoginText}>🔑 {isMr ? 'लॉगिन' : 'Login'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>
              🚩 {isMr ? 'सार्वजनिक व गणेशोत्सव मंडळांचे डिजिटल प्लॅटफॉर्म' : 'Digital Platform for Community Mandals'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {isMr ? (
              <>
                मंडळाचे पारदर्शक व आधुनिक{'\n'}
                <Text style={styles.heroHighlight}>डिजिटल व्यवस्थापन</Text>
              </>
            ) : (
              <>
                Modern, Transparent & Digital{'\n'}
                <Text style={styles.heroHighlight}>Mandal Management</Text>
              </>
            )}
          </Text>

          <Text style={styles.heroSubtitle}>
            {isMr
              ? 'WhatsApp देणगी पावत्या, पारदर्शक जमा-खर्च हिशोब आणि डिजिटल ओळखपत्रे एकाच अ‍ॅपमध्ये.'
              : 'Instant WhatsApp receipts, transparent accounts, and digital member ID cards in one app.'}
          </Text>

          {/* Primary Action Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                🚀 {isMr ? 'मंडळाची मोफत नोंदणी करा' : 'Register Mandal Free'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>
                🔑 {isMr ? 'थेट लॉगिन करा' : 'Sign In Directly'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trust / Security Pill ── */}
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>
            🔒 {isMr ? '१००% सुरक्षित क्लाउड डेटा • बँक-ग्रेड सुरक्षा' : '100% Secure Cloud Data • Bank-Grade Security'}
          </Text>
        </View>

        {/* ── Core Highlights (2x2 Compact Grid) ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeading}>
            {isMr ? 'प्रमुख डिजिटल सुविधा' : 'Core Features'}
          </Text>
        </View>

        <View style={styles.highlightsGrid}>
          {highlights.map((item, idx) => (
            <View key={idx} style={styles.highlightCard}>
              <View style={[styles.highlightIconWrap, { backgroundColor: `${item.color}20` }]}>
                <Text style={styles.highlightIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerBrandText}>
            Apla<Text style={{ color: '#F97316' }}>Mandal</Text>
          </Text>
          <Text style={styles.footerText}>
            {isMr
              ? 'प्रौढ व सुरक्षित तंत्रज्ञान • Quantromind Pvt. Ltd.'
              : 'Powered by Quantromind Pvt. Ltd.'}
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://aplamandal.quantromind.com/terms-and-conditions')}
            >
              <Text style={styles.legalLinkText}>{isMr ? 'नियम व अटी' : 'Terms'}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>•</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://aplamandal.quantromind.com/privacy-policy')}
            >
              <Text style={styles.legalLinkText}>{isMr ? 'गोपनीयता धोरण' : 'Privacy'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0B1120',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  langIcon: {
    fontSize: 12,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  headerLoginBtn: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#F97316',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerLoginText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F97316',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  /* Hero Section */
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    marginBottom: 16,
  },
  badgePillText: {
    color: '#FED7AA',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  heroHighlight: {
    color: '#F97316',
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Trust Row */
  trustRow: {
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 20,
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },

  /* Section Headers */
  sectionHeaderBox: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  /* Highlights Grid */
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  highlightCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  highlightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  highlightIcon: {
    fontSize: 18,
  },
  highlightTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  highlightDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginTop: 10,
  },
  footerBrandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLinkText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  legalDot: {
    fontSize: 11,
    color: '#64748B',
  },
});
