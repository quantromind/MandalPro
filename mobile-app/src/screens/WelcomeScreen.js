import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

export default function WelcomeScreen({ navigation }) {
  const { language, setLanguage } = useLanguage();
  const isMr = language === 'mr';

  const toggleLanguage = () => {
    setLanguage(isMr ? 'en' : 'mr');
  };

  const stats = [
    { num: isMr ? '१००+' : '100+', label: isMr ? 'नोंदणीकृत मंडळे' : 'Registered Mandals', icon: '🏛️' },
    { num: isMr ? '२,०००+' : '2,000+', label: isMr ? 'WhatsApp पावत्या' : 'WhatsApp Receipts', icon: '🧾' },
    { num: isMr ? '₹१ कोटी+' : '₹1 Cr+', label: isMr ? 'पारदर्शक निधी' : 'Managed Funds', icon: '💰' },
    { num: '100%', label: isMr ? 'सुरक्षित व ऑडिट-रेडी' : 'Secure & Audited', icon: '🛡️' }
  ];

  const features = [
    {
      icon: '🧾',
      color: '#F97316',
      title: isMr ? 'WhatsApp डिजिटल देणगी पावत्या' : 'Instant WhatsApp Receipts',
      desc: isMr
        ? 'वर्गणी मिळताच देणगीदाराला मंडळाच्या अधिकृत लोगो, शिक्का व क्यूआर कोडसह थेट WhatsApp वर पावती पाठवा.'
        : 'Instant receipts with custom Mandal logo, seal & QR code sent directly via WhatsApp.'
    },
    {
      icon: '💸',
      color: '#EF4444',
      title: isMr ? 'पारदर्शक खर्च व ऑनलाइन मंजुऱ्या' : 'Expense & Approval Workflows',
      desc: isMr
        ? 'खर्चाच्या बिलांचे फोटो जोडा. खजिनदार व अध्यक्षांकडून डिजिटल मंजुरी घेऊन प्रत्येक पैशाचा पारदर्शक हिशोब ठेवा.'
        : 'Upload bills, get instant digital approvals from President & Treasurer, and prevent audit leaks.'
    },
    {
      icon: '👥',
      color: '#3B82F6',
      title: isMr ? 'कार्यकारिणी व डिजिटल आयडी कार्ड' : 'Team Directory & Digital ID Cards',
      desc: isMr
        ? 'मंडळाचे पदाधिकारी व स्वयंसेवकांची यादी सांभाळा. एका क्लिकवर फोटोसहित अधिकृत डिजिटल ओळखपत्रे तयार करा.'
        : 'Manage committee members & volunteers. Generate printable digital photo ID badges in one click.'
    },
    {
      icon: '🎪',
      color: '#8B5CF6',
      title: isMr ? 'उत्सव, कार्यक्रम व साहित्य साठा' : 'Events & Asset Inventory',
      desc: isMr
        ? 'गणेशोत्सव, नवरात्रीचे नियोजन करा. मंडप, ध्वनिक्षेपक व पूजा साहित्याची नोंद ठेवून व्यवस्थापन सोपे करा.'
        : 'Plan festival schedules and track sound, lighting and decoration assets seamlessly.'
    },
    {
      icon: '💬',
      color: '#10B981',
      title: isMr ? 'समिती थेट संवाद व तातडीच्या सूचना' : 'Committee Chat & Notices',
      desc: isMr
        ? 'पदाधिकाऱ्यांशी थेट अ‍ॅपमध्ये चर्चा करा. बैठकीचे इतिवृत्त व महत्त्वाचे अपडेट्स सुरक्षितपणे शेअर करा.'
        : 'Secure group chatroom for committee members to share notices and festival announcements.'
    },
    {
      icon: '📑',
      color: '#0EA5E9',
      title: isMr ? 'सीए व ऑडिट-रेडी आर्थिक अहवाल' : 'CA & Audit-Ready Reports',
      desc: isMr
        ? 'धर्मादाय आयुक्त व सीए साठी आवश्यक असलेले जमा-खर्च पत्रक एका क्लिकवर PDF व Excel मध्ये डाऊनलोड करा.'
        : 'One-click export of Income-Expenditure balance sheets and donor registers in PDF & Excel.'
    }
  ];

  const festivals = [
    { icon: '🐘', name: isMr ? 'गणेशोत्सव' : 'Ganesh Utsav' },
    { icon: '🪔', name: isMr ? 'नवरात्री' : 'Navratri' },
    { icon: '🚩', name: isMr ? 'शिवजयंती' : 'Shiv Jayanti' },
    { icon: '✨', name: isMr ? 'दिवाळी' : 'Diwali' },
    { icon: '🏢', name: isMr ? 'गृहनिर्माण संस्था' : 'Societies' },
    { icon: '🤝', name: isMr ? 'चॅरिटेबल ट्रस्ट' : 'NGO Trusts' }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>
              Apla<Text style={{ color: '#F97316' }}>Mandal</Text>
            </Text>
            <Text style={styles.brandTag}>आपलं मंडळ • डिजिटल महाराष्ट्र</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.langPill} onPress={toggleLanguage} activeOpacity={0.8}>
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>{isMr ? 'मराठी' : 'English'}</Text>
          <Text style={styles.langSub}>{isMr ? 'EN' : 'मराठी'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Hero Banner ── */}
        <View style={styles.heroSection}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>
              🚩 {isMr ? 'महाराष्ट्रातील मंडळांचे #१ डिजिटल व्यासपीठ' : "Maharashtra's #1 Digital Mandal App"}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {isMr ? (
              <>
                मंडळ व्यवस्थापन.{'\n'}
                <Text style={styles.heroHighlight}>पारदर्शक, जलद व एकत्र.</Text>
              </>
            ) : (
              <>
                Manage your Mandal.{'\n'}
                <Text style={styles.heroHighlight}>Smarter. Together.</Text>
              </>
            )}
          </Text>

          <Text style={styles.heroSubtitle}>
            {isMr
              ? 'गणेशोत्सव, नवरात्री, वर्गणी पावत्या, खर्च मंजुऱ्या, कार्यकारिणी आयडी कार्ड्स व सीए रिपोर्टिंग आता तुमच्या बोटांवर.'
              : 'Everything you need to organize festivals, instant WhatsApp receipts, committee approvals, and CA balance sheets.'}
          </Text>
        </View>

        {/* ── Quick Action Callouts ── */}
        <View style={styles.ctaCard}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {isMr ? '🚀 लॉगिन करा (Sign In)' : '🚀 Sign In to Mandal'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.88}
          >
            <Text style={styles.secondaryBtnText}>
              {isMr ? '✨ नवीन मंडळ नोंदणी (Start Free)' : '✨ Register New Mandal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Impact Statistics ── */}
        <View style={styles.statsGrid}>
          {stats.map((s, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Supported Festivals ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeading}>
            {isMr ? 'सर्व सण व उत्सवांसाठी उपयुक्त' : 'Built for All Festivals & Trusts'}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.festivalRow}
        >
          {festivals.map((f, idx) => (
            <View key={idx} style={styles.festivalChip}>
              <Text style={styles.festivalIcon}>{f.icon}</Text>
              <Text style={styles.festivalText}>{f.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Feature Highlights ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeading}>
            {isMr ? 'अ‍ॅपमधील प्रमुख डिजिटल सुविधा' : 'Powerful Digital Features'}
          </Text>
          <Text style={styles.sectionSub}>
            {isMr
              ? 'मंडळाचा दैनंदिन कारभार सुलभ करणारी वैशिष्ट्ये'
              : 'Everything customized for community committees'}
          </Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((feat, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: `${feat.color}15` }]}>
                <Text style={styles.featureEmoji}>{feat.icon}</Text>
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isMr ? 'प्रौढ व सुरक्षित तंत्रज्ञान • Quantromind Pvt. Ltd.' : 'Powered by Quantromind Pvt. Ltd.'}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.06)',
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  langIcon: {
    fontSize: 12,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  langSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F97316',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: '#FFF1E7',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgePillText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#172554',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  heroHighlight: {
    color: '#F97316',
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: '92%',
  },
  ctaCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  secondaryBtnText: {
    color: '#F97316',
    fontSize: 15,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderBox: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172554',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  festivalRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  festivalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  festivalIcon: {
    fontSize: 15,
  },
  festivalText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#172554',
  },
  featuresList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    gap: 14,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.06)',
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  legalLinkText: {
    fontSize: 11.5,
    color: '#F97316',
    fontWeight: '700',
  },
  legalDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
});
