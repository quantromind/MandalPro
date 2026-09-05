import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { language, setLanguage } = useLanguage();
  const isMr = language === 'mr';
  const [openFaq, setOpenFaq] = useState(null);

  const toggleLanguage = () => {
    setLanguage(isMr ? 'en' : 'mr');
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const stats = [
    { num: isMr ? '१००+' : '100+', label: isMr ? 'नोंदणीकृत मंडळे व समित्या' : 'Registered Mandals', icon: '🏛️' },
    { num: isMr ? '२,०००+' : '2,000+', label: isMr ? 'WhatsApp डिजिटल पावत्या' : 'WhatsApp Receipts', icon: '🧾' },
    { num: isMr ? '₹१ कोटी+' : '₹1 Cr+', label: isMr ? 'सुरक्षित जमा-खर्च हिशोब' : 'Managed Funds', icon: '💰' },
    { num: '100%', label: isMr ? 'पारदर्शक व ऑडिट-रेडी' : 'Secure & Audited', icon: '🛡️' },
  ];

  const festivals = [
    { icon: '🐘', name: isMr ? 'गणेशोत्सव मंडळे' : 'Ganesh Mandals' },
    { icon: '🪔', name: isMr ? 'नवरात्री व गरबा मंडळे' : 'Navratri Groups' },
    { icon: '🚩', name: isMr ? 'शिवजयंती समित्या' : 'Shiv Jayanti' },
    { icon: '✨', name: isMr ? 'दिवाळी समित्या' : 'Diwali & Social' },
    { icon: '🏢', name: isMr ? 'गृहनिर्माण संस्था' : 'Housing Societies' },
    { icon: '🤝', name: isMr ? 'धार्मिक चॅरिटेबल ट्रस्ट' : 'NGO Trusts' },
  ];

  const features = [
    {
      icon: '🧾',
      color: '#F97316',
      title: isMr ? 'WhatsApp डिजिटल देणगी पावत्या' : 'Instant WhatsApp Receipts',
      desc: isMr
        ? 'वर्गणी मिळताच देणगीदाराला मंडळाच्या अधिकृत लोगो, शिक्का व क्यूआर कोडसह थेट WhatsApp वर पावती पाठवा.'
        : 'Instant receipts with custom Mandal logo, seal & QR code sent directly via WhatsApp.',
    },
    {
      icon: '💸',
      color: '#EF4444',
      title: isMr ? 'पारदर्शक खर्च व ऑनलाइन मंजुऱ्या' : 'Expense & Approval Workflows',
      desc: isMr
        ? 'खर्चाच्या बिलांचे फोटो जोडा. खजिनदार व अध्यक्षांकडून डिजिटल मंजुरी घेऊन प्रत्येक पैशाचा पारदर्शक हिशोब ठेवा.'
        : 'Upload bills, get instant digital approvals from President & Treasurer, and prevent audit leaks.',
    },
    {
      icon: '👥',
      color: '#3B82F6',
      title: isMr ? 'कार्यकारिणी व डिजिटल आयडी कार्ड' : 'Team Directory & Digital ID Cards',
      desc: isMr
        ? 'मंडळाचे पदाधिकारी व स्वयंसेवकांची यादी सांभाळा. एका क्लिकवर फोटोसहित अधिकृत डिजिटल ओळखपत्रे तयार करा.'
        : 'Manage committee members & volunteers. Generate printable digital photo ID badges in one click.',
    },
    {
      icon: '🎪',
      color: '#8B5CF6',
      title: isMr ? 'उत्सव, कार्यक्रम व साहित्य साठा' : 'Events & Asset Inventory',
      desc: isMr
        ? 'गणेशोत्सव, नवरात्रीचे नियोजन करा. मंडप, ध्वनिक्षेपक व पूजा साहित्याची नोंद ठेवून व्यवस्थापन सोपे करा.'
        : 'Plan festival schedules and track sound, lighting and decoration assets seamlessly.',
    },
    {
      icon: '💬',
      color: '#10B981',
      title: isMr ? 'समिती थेट संवाद व तातडीच्या सूचना' : 'Committee Chat & Notices',
      desc: isMr
        ? 'पदाधिकाऱ्यांशी थेट अ‍ॅपमध्ये चर्चा करा. बैठकीचे इतिवृत्त व महत्त्वाचे अपडेट्स सुरक्षितपणे शेअर करा.'
        : 'Secure group chatroom for committee members to share notices and festival announcements.',
    },
    {
      icon: '📑',
      color: '#0EA5E9',
      title: isMr ? 'सीए व ऑडिट-रेडी आर्थिक अहवाल' : 'CA & Audit-Ready Reports',
      desc: isMr
        ? 'धर्मादाय आयुक्त व सीए साठी आवश्यक असलेले जमा-खर्च पत्रक एका क्लिकवर PDF व Excel मध्ये डाऊनलोड करा.'
        : 'One-click export of Income-Expenditure balance sheets and donor registers in PDF & Excel.',
    },
  ];

  const plans = [
    {
      id: 'silver',
      name: isMr ? 'सिल्व्हर योजना (Silver Plan)' : 'Silver Plan',
      badge: isMr ? '⚡ परवडणारी योजना' : '⚡ AFFORDABLE',
      price: isMr ? '₹१९९' : '₹199',
      period: isMr ? '/महिना' : '/month',
      popular: false,
      features: [
        isMr ? '१ मंडळ संपूर्ण व्यवस्थापन' : '1 Mandal Management',
        isMr ? '१५ समिती सदस्य व स्वयंसेवक' : '15 Committee Members',
        isMr ? 'अमर्यादित WhatsApp डिजिटल पावत्या' : 'Unlimited WhatsApp Receipts',
        isMr ? 'खर्च आणि अंदाजपत्रक ट्रॅकिंग' : 'Expense & Budget Tracking',
        isMr ? 'समिती लाइव्ह ग्रुप चॅट' : 'Committee Live Chat',
        isMr ? 'डिजिटल सदस्य ओळखपत्रे (ID Cards)' : 'Digital ID Cards',
      ],
      cta: isMr ? 'सिल्व्हर योजना निवडा (₹199)' : 'Choose Silver Plan (₹199)',
    },
    {
      id: 'gold',
      name: isMr ? 'गोल्ड मेंबरशिप (Gold Membership)' : 'Gold Membership',
      badge: isMr ? '🔥 सर्वाधिक पसंती' : '🔥 MOST POPULAR',
      price: isMr ? '₹२९९' : '₹299',
      period: isMr ? '/महिना' : '/month',
      popular: true,
      features: [
        isMr ? '२ मंडळे / शाखा व्यवस्थापन' : '2 Mandals Management',
        isMr ? '२५ समिती सदस्य व स्वयंसेवक' : '25 Committee Members',
        isMr ? 'अधिकृत शिक्का व लोगो असलेली WhatsApp पावती' : 'Official Logo & Seal Receipts',
        isMr ? 'खर्च मंजुरी वर्कफ्लो व बिलांचे फोटो' : 'Bill Photo Approval Workflow',
        isMr ? 'सीए ऑडिट-रेडी Excel व PDF अहवाल' : 'CA Audit-Ready Exports',
        isMr ? 'व्हेरिफाइड मंडळ ट्रस्ट बॅज' : 'Verified Trust Badge',
        isMr ? '२४/७ प्राधान्य WhatsApp सहाय्य' : '24/7 Priority Support',
      ],
      cta: isMr ? 'गोल्ड मेंबरशिप निवडा (₹299)' : 'Choose Gold Membership (₹299)',
    },
  ];

  const faqs = [
    {
      q: isMr ? '१. हे अ‍ॅप वापरण्यासाठी संगणकाची गरज आहे का?' : '1. Do I need a computer to use this app?',
      a: isMr
        ? 'नाही! आपले मंडळ अ‍ॅप पूर्णपणे स्मार्टफोनवर चालते. अध्यक्ष, खजिनदार किंवा स्वयंसेवक कुठूनही फोनवरून वर्गणी पावती देऊ शकतात.'
        : 'No! The app runs seamlessly on smartphones. Committee members can record donations and issue receipts directly from their phones.',
    },
    {
      q: isMr ? '२. WhatsApp पावती कशी पाठवली जाते?' : '2. How is the WhatsApp receipt sent?',
      a: isMr
        ? 'वर्गणी नोंदवताच एका क्लिकवर देणगीदाराच्या WhatsApp नंबरवर मंडळाचा लोगो, शिक्का, रक्कम व पावती क्रमांकासह पीडीएफ व मेसेज जातो.'
        : 'Instantly upon recording a donation, a branded receipt with your Mandal logo, seal, and details is sent directly via WhatsApp.',
    },
    {
      q: isMr ? '३. मंडळाचा आर्थिक हिशोब सुरक्षित राहील का?' : '3. Is our Mandal financial data secure?',
      a: isMr
        ? 'होय, १००% सुरक्षित! बँक-ग्रेड एन्क्रिप्शन आणि क्लाउड बॅकअपमुळे आपला हिशोब कायमस्वरूपी सुरक्षित व ऑडिटसाठी तयार राहतो.'
        : 'Yes, 100% secure! Bank-grade cloud encryption ensures all records and balance sheets are protected and audit-ready.',
    },
    {
      q: isMr ? '४. समिती सदस्यांना वेगवेगळे अधिकार देता येतात का?' : '4. Can different roles be assigned to members?',
      a: isMr
        ? 'होय! अध्यक्ष, खजिनदार, सचिव आणि स्वयंसेवक अशा भूमिका ठरवून खर्चाची मंजुरी व पावती देण्याचे अधिकार नियंत्रित करता येतात.'
        : 'Yes! You can assign roles such as President, Treasurer, and Volunteer with custom permission levels.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* ── Top Header matching aplamandal.quantromind.com ── */}
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
              🚩 {isMr ? 'महाराष्ट्रातील गणेशोत्सव व सार्वजनिक मंडळांचे #१ डिजिटल प्लॅटफॉर्म' : "Maharashtra's #1 Digital Mandal Platform"}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {isMr ? (
              <>
                गणेशोत्सव व सार्वजनिक मंडळांचे{'\n'}
                <Text style={styles.heroHighlight}>पारदर्शक, डिजिटल व आधुनिक</Text> व्यवस्थापन
              </>
            ) : (
              <>
                Transparent, Digital & Modern{'\n'}
                <Text style={styles.heroHighlight}>Management for Community Mandals</Text>
              </>
            )}
          </Text>

          <Text style={styles.heroSubtitle}>
            {isMr
              ? 'WhatsApp डिजिटल पावत्या, पारदर्शक जमा-खर्च हिशोब, ऑनलाइन मंजुऱ्या, कार्यकारिणी आयडी कार्ड्स व सीए ऑडिट-रेडी अहवाल. आता प्रत्येक मंडळासाठी डिजिटल तंत्रज्ञान.'
              : 'Instant WhatsApp receipts, transparent accounts, digital approvals, photo ID cards, and CA balance sheets — all in one powerful mobile app.'}
          </Text>

          {/* CTA Buttons */}
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

        {/* ── Impact Statistics Grid (2x2 Glass Cards) ── */}
        <View style={styles.statsGrid}>
          {stats.map((s, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Supported Festivals Carousel ── */}
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

        {/* ── Powerful Digital Features ── */}
        <View style={styles.sectionHeaderBox}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>✨ {isMr ? 'शक्तिशाली डिजिटल सुविधा' : 'POWERFUL FEATURES'}</Text>
          </View>
          <Text style={styles.sectionHeading}>
            {isMr ? 'मंडळाच्या प्रत्येक गरजांसाठी एकच परिपूर्ण अ‍ॅप' : 'Complete App for Every Mandal Need'}
          </Text>
          <Text style={styles.sectionSub}>
            {isMr
              ? 'पारदर्शकता वाढवा, सदस्यांचा विश्वास जिंका आणि वेळेची बचत करा'
              : 'Increase transparency, build trust, and save valuable time'}
          </Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((feat, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: `${feat.color}20` }]}>
                <Text style={styles.featureEmoji}>{feat.icon}</Text>
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Pricing Plans Section matching website ── */}
        <View style={styles.sectionHeaderBox}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>💎 {isMr ? 'सदस्यत्व योजना' : 'MEMBERSHIP PLANS'}</Text>
          </View>
          <Text style={styles.sectionHeading}>
            {isMr ? 'परवडणाऱ्या पारदर्शक सदस्यत्व योजना' : 'Affordable & Transparent Pricing'}
          </Text>
          <Text style={styles.sectionSub}>
            {isMr ? 'कोणताही छुपा खर्च नाही. मंडळाच्या आकाराप्रमाणे निवडा.' : 'No hidden fees. Designed for community groups.'}
          </Text>
        </View>

        <View style={styles.pricingContainer}>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[styles.pricingCard, plan.popular && styles.pricingCardPopular]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                </View>
              )}
              {!plan.popular && (
                <View style={styles.standardBadge}>
                  <Text style={styles.standardBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{plan.price}</Text>
                <Text style={styles.pricePeriod}>{plan.period}</Text>
              </View>

              <View style={styles.planDivider} />

              <View style={styles.planFeaturesList}>
                {plan.features.map((item, fIdx) => (
                  <View key={fIdx} style={styles.planFeatureItem}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.planFeatureText}>{item}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.planCtaBtn, plan.popular && styles.planCtaBtnPopular]}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.88}
              >
                <Text style={[styles.planCtaText, plan.popular && styles.planCtaTextPopular]}>
                  {plan.cta}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── FAQ Accordion Section ── */}
        <View style={styles.sectionHeaderBox}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>❓ {isMr ? 'वारंवार विचारले जाणारे प्रश्न' : 'FAQ'}</Text>
          </View>
          <Text style={styles.sectionHeading}>
            {isMr ? 'प्रश्नोत्तरे (FAQ)' : 'Frequently Asked Questions'}
          </Text>
        </View>

        <View style={styles.faqContainer}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqCard}
                onPress={() => toggleFaq(idx)}
                activeOpacity={0.85}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqToggle}>{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Bottom CTA Banner ── */}
        <View style={styles.finalCtaBox}>
          <Text style={styles.finalCtaTitle}>
            {isMr ? 'आजच आपल्या मंडळाला डिजिटल करा!' : 'Digitize Your Mandal Today!'}
          </Text>
          <Text style={styles.finalCtaSub}>
            {isMr
              ? 'हजारो भाविक व कार्यकर्त्यांचा विश्वास जिंका. २ मिनिटांत नोंदणी करा.'
              : 'Build trust with thousands of donors and members. Takes only 2 minutes.'}
          </Text>
          <TouchableOpacity
            style={styles.finalCtaBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.88}
          >
            <Text style={styles.finalCtaBtnText}>
              🚀 {isMr ? 'मंडळाची मोफत नोंदणी करा' : 'Register Mandal Free'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Legal Footer ── */}
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
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 34,
    height: 34,
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
    paddingBottom: 40,
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
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  heroHighlight: {
    color: '#F97316',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
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

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 46) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBBF24',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },

  /* Festivals Carousel */
  festivalRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 20,
  },
  festivalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  festivalIcon: {
    fontSize: 14,
  },
  festivalText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },

  /* Section Headers */
  sectionHeaderBox: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  sectionBadgeText: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Features List */
  featuresList: {
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    gap: 14,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },

  /* Pricing Cards */
  pricingContainer: {
    paddingHorizontal: 18,
    gap: 16,
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 22,
    padding: 20,
  },
  pricingCardPopular: {
    borderColor: '#F97316',
    borderWidth: 2,
    backgroundColor: 'rgba(249, 115, 22, 0.03)',
  },
  popularBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  standardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  standardBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 14,
  },
  priceAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  planDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  planFeaturesList: {
    gap: 8,
    marginBottom: 18,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '800',
  },
  planFeatureText: {
    fontSize: 13,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 18,
  },
  planCtaBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planCtaBtnPopular: {
    backgroundColor: '#F97316',
  },
  planCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  planCtaTextPopular: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* FAQs */
  faqContainer: {
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  faqToggle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },

  /* Final CTA Box */
  finalCtaBox: {
    marginHorizontal: 18,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  finalCtaTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  finalCtaSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  finalCtaBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  finalCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 18,
  },
  footerBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLinkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  legalDot: {
    fontSize: 12,
    color: '#64748B',
  },
});
