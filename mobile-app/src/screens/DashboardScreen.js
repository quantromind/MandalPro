import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageModal from '../components/LanguageModal';
import ChatSlideModal from '../components/ChatSlideModal';

export default function DashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { user, mandal, logout } = useAuth();
  const { t, language, setLanguage, showLanguageModal, setShowLanguageModal, dismissLanguageModal, promptFirstTime } = useLanguage();

  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';
  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const totalCollections = Number(summary?.totalCollections || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const netBalance = totalCollections - totalExpenses;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <TouchableOpacity
            style={styles.headerLangPill}
            onPress={() => setLanguage(language === 'mr' ? 'en' : 'mr')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerLangText}>🌐 {language === 'mr' ? 'मराठी' : 'EN'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerChatBtn}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t('nav.chat')}
          >
            <View style={styles.chatIconBox}>
              <Text style={styles.chatIconEmoji}>💬</Text>
              <View style={styles.chatDot} />
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, t, language, setLanguage]);

  const load = async () => {
    try {
      const { data } = await client.get('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      // ignore — likely offline
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
      promptFirstTime();
    }, [promptFirstTime])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
      >
        {/* Header Hero Banner (Image 2 matching) */}
        <View style={styles.headerCard}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'president' ? '👑 PRESIDENT WORKSPACE' : '👥 COMMITTEE WORKSPACE'}
            </Text>
          </View>

          <Text style={styles.greeting}>
            Namaste, {user?.name?.split(' ')[0] || 'Sakhee'} 🪔
          </Text>
          <Text style={styles.mandalSub}>
            🚩 {mandal?.name || 'Sakhee Mitra Mandal'} • {language === 'mr' ? 'लाइव्ह मंडळ आकडेवारी' : 'Live Mandal statistics'}
          </Text>

          {/* Quick Action CTA Buttons inside Hero Banner matching Image 2 */}
          <View style={styles.heroButtonContainer}>
            <TouchableOpacity
              style={styles.heroPrimaryBtnFull}
              onPress={() => navigation.navigate('Collection')}
              activeOpacity={0.88}
            >
              <Text style={styles.heroPrimaryBtnFullText}>
                ✨ ✨ {language === 'mr' ? 'नवीन देणगी नोंदवा' : 'Record New Donation'}
              </Text>
            </TouchableOpacity>

            <View style={styles.heroSecondaryRow}>
              <TouchableOpacity
                style={styles.heroExpenseBtn}
                onPress={() => navigation.navigate('Expenses')}
                activeOpacity={0.85}
              >
                <Text style={styles.heroExpenseBtnText}>
                  💸 {language === 'mr' ? 'खर्च जोडा' : 'Add Expense'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSyncBtn}
                onPress={onRefresh}
                activeOpacity={0.85}
                accessibilityLabel="Sync"
              >
                <Text style={styles.heroSyncIcon}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Metrics & Summary */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>{t('dashboard.financialOverview')}</Text>
          <Text style={styles.sectionSub}>{t('dashboard.liveMandalStats')}</Text>
        </View>

        {/* 4 Website-Aligned Stat Cards with Colored Top Accent Lines */}
        <View style={styles.statCardsGrid}>
          {/* Card 1: Net Balance */}
          <View style={styles.statCard}>
            <View style={[styles.statAccentLine, { backgroundColor: '#6366F1' }]} />
            <Text style={styles.statCardLabel}>🪙 {language === 'mr' ? 'शिल्लक रक्कम' : 'NET BALANCE - REMAINING'}</Text>
            <Text style={[styles.statCardAmount, { color: netBalance >= 0 ? '#1E3A8A' : '#DC2626' }]}>
              {inr(netBalance)}
            </Text>
            <Text style={styles.statCardSub}>{language === 'mr' ? 'उपलब्ध निधी' : 'Available funds'}</Text>
          </View>

          {/* Card 2: Inflow - Collections */}
          <View style={styles.statCard}>
            <View style={[styles.statAccentLine, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statCardLabel}>💰 {language === 'mr' ? 'जमा निधी' : 'INFLOW - COLLECTIONS'}</Text>
            <Text style={[styles.statCardAmount, { color: '#059669' }]}>
              {inr(summary?.totalCollections)}
            </Text>
            <Text style={styles.statCardSub}>{language === 'mr' ? 'एकूण जमा नोंदी' : 'Total collections recorded'}</Text>
          </View>
        </View>

        <View style={styles.statCardsGrid}>
          {/* Card 3: Outflow - Expenses */}
          <View style={styles.statCard}>
            <View style={[styles.statAccentLine, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statCardLabel}>💸 {language === 'mr' ? 'खर्च निधी' : 'OUTFLOW - EXPENSES'}</Text>
            <Text style={[styles.statCardAmount, { color: '#DC2626' }]}>
              {inr(summary?.totalExpenses)}
            </Text>
            <Text style={styles.statCardSub}>{language === 'mr' ? 'मंजूर खर्च' : '0 approved expenditures'}</Text>
          </View>

          {/* Card 4: Pending Approvals */}
          <View style={styles.statCard}>
            <View style={[styles.statAccentLine, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.statCardLabel}>⏳ {language === 'mr' ? 'प्रलंबित मंजुऱ्या' : 'PENDING APPROVALS'}</Text>
            <Text style={[styles.statCardAmount, { color: '#B45309' }]}>
              {summary?.pendingApprovals ?? 0}
            </Text>
            <Text style={styles.statCardSub}>
              {Number(summary?.pendingApprovals || 0) === 0
                ? (language === 'mr' ? 'सर्व मंजूर ✓' : 'All clear ✓')
                : (language === 'mr' ? `${summary?.pendingApprovals} प्रलंबित` : `${summary?.pendingApprovals} pending review`)}
            </Text>
          </View>
        </View>

        {/* Quick Action Tools (6 Tools matching Website Screenshot 1) */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>⚡ {t('dashboard.quickActions')}</Text>
          <Text style={styles.sectionSub}>{t('dashboard.frequentlyUsedTools')}</Text>
        </View>

        {/* Row 1: New Collection & View Receipts */}
        <View style={styles.actionGridRow}>
          {/* Tool 1: New Collection */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Collection')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.gridIcon}>🚩</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.arrowPillText, { color: '#DC2626' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>{t('dashboard.newCollection')}</Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'पावती तयार करा व WhatsApp वर पाठवा' : 'Record donation & generate WhatsApp receipt'}
            </Text>
          </TouchableOpacity>

          {/* Tool 2: View Receipts */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Receipts')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#CCFBF1' }]}>
                <Text style={styles.gridIcon}>🧾</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#CCFBF1' }]}>
                <Text style={[styles.arrowPillText, { color: '#0D9488' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>{t('dashboard.viewShareReceipts')}</Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'पावत्या शोधा आणि शेअर करा' : 'Search past receipts and share via WhatsApp'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Committee Chat & Expenses & Approvals */}
        <View style={styles.actionGridRow}>
          {/* Tool 3: Committee Chat */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Text style={styles.gridIcon}>💬</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.arrowPillText, { color: '#7C3AED' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>{language === 'mr' ? 'समिती संवाद' : 'Committee Chat'}</Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'अधिकृत समिती चॅनेल' : 'Official Committee Channel'}
            </Text>
          </TouchableOpacity>

          {/* Tool 4: Expenses & Approvals */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Expenses')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.gridIcon}>💸</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.arrowPillText, { color: '#15803D' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>
              {isPresident ? t('dashboard.expensesApprovals') : t('dashboard.requestExpense')}
            </Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'खर्च नोंदवा किंवा मंजुरी द्या' : 'Record expenses or approve member requests'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Events / Digital ID Cards & Subscription */}
        <View style={styles.actionGridRow}>
          {/* Tool 5: Events & Tasks */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Events')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.gridIcon}>🪪</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.arrowPillText, { color: '#2563EB' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>{language === 'mr' ? 'उत्सव व कार्यक्रम' : 'Events & ID Cards'}</Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'डिजिटल ओळखपत्रे व उत्सव नियोजन' : 'Generate ID cards and festival schedules'}
            </Text>
          </TouchableOpacity>

          {/* Tool 6: Subscription */}
          <TouchableOpacity
            style={styles.gridActionCard}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
          >
            <View style={styles.gridCardTop}>
              <View style={[styles.gridIconBox, { backgroundColor: '#E0E7FF' }]}>
                <Text style={styles.gridIcon}>💎</Text>
              </View>
              <View style={[styles.arrowPill, { backgroundColor: '#E0E7FF' }]}>
                <Text style={[styles.arrowPillText, { color: '#4F46E5' }]}>→</Text>
              </View>
            </View>
            <Text style={styles.gridActionTitle}>{language === 'mr' ? 'सदस्यता योजना' : 'Subscription'}</Text>
            <Text style={styles.gridActionSub} numberOfLines={2}>
              {language === 'mr' ? 'आपली योजना व मर्यादा व्यवस्थापित करा' : 'Manage your Apla Mandal subscription'}
            </Text>
          </TouchableOpacity>
        </View>


        {/* ════════ RECENT COLLECTIONS SECTION ════════ */}
        {((summary?.recentDonations && summary.recentDonations.length > 0)) && (
          <View style={styles.recentSection}>
            {/* Header Row */}
            <View style={styles.recentHeaderRow}>
              <View>
                <Text style={styles.recentTitle}>
                  {language === 'mr' ? '🧾 अलीकडील देणग्या' : '🧾 Recent Collections'}
                </Text>
                <Text style={styles.recentSub}>
                  {language === 'mr' ? 'ताज्या ५ नोंदी' : 'Latest 5 entries'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Receipts')}
                activeOpacity={0.75}
                style={styles.viewAllPill}
              >
                <Text style={styles.viewAllText}>
                  {language === 'mr' ? 'सर्व पहा →' : 'View All →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Donation Rows */}
            {(summary.recentDonations || []).slice(0, 5).map((item, idx) => {
              const donorInitial = (item.donorName || '?')[0].toUpperCase();
              const avatarColors = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
              const avatarBg = avatarColors[idx % avatarColors.length];
              const amtNum = Number(item.amount || 0);
              const amtStr = `+₹${amtNum.toLocaleString('en-IN')}`;
              const mode = (item.paymentMode || 'cash').toUpperCase();
              const purpose = item.purpose || item.title || (language === 'mr' ? 'देणगी' : 'Donation');
              const dateStr = item.createdAt || item.date
                ? new Date(item.createdAt || item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                : '';

              return (
                <TouchableOpacity
                  key={item._id || idx}
                  style={[styles.recentRow, idx < (summary.recentDonations.length < 5 ? summary.recentDonations.length : 5) - 1 && styles.recentRowBorder]}
                  activeOpacity={0.72}
                  onPress={() => navigation.navigate('Receipts')}
                >
                  {/* Avatar */}
                  <View style={[styles.recentAvatar, { backgroundColor: avatarBg }]}>
                    <Text style={styles.recentAvatarText}>{donorInitial}</Text>
                  </View>

                  {/* Middle: Name + purpose + mode */}
                  <View style={styles.recentMid}>
                    <Text style={styles.recentDonorName} numberOfLines={1}>
                      {item.donorName || (language === 'mr' ? 'देणगीदार' : 'Donor')}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {purpose} · {mode}
                    </Text>
                  </View>

                  {/* Right: Amount + date */}
                  <View style={styles.recentRight}>
                    <Text style={styles.recentAmount}>{amtStr}</Text>
                    {dateStr ? <Text style={styles.recentDate}>{dateStr}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Footer CTA */}
            <TouchableOpacity
              style={styles.recentFooterBtn}
              onPress={() => navigation.navigate('Collection')}
              activeOpacity={0.82}
            >
              <Text style={styles.recentFooterBtnText}>
                {language === 'mr' ? '➕ नवीन देणगी नोंदवा' : '➕ Record New Collection'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Banner for Members */}
        {!isPresident && (
          <View style={styles.memberInfoBox}>
            <Text style={styles.memberInfoIcon}>ℹ️</Text>
            <Text style={styles.memberInfoText}>
              {t('dashboard.memberInfoText')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Purple Chat Pill Button matching Image 2 */}
      <TouchableOpacity
        style={styles.floatingChatPill}
        onPress={() => navigation?.navigate('ChatTab')}
        activeOpacity={0.85}
        accessibilityLabel="Chat"
      >
        <Text style={styles.floatingChatIcon}>💬</Text>
        <Text style={styles.floatingChatText}>{language === 'mr' ? 'चॅट' : 'Chat'}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={dismissLanguageModal}
        canDismiss={true}
      />

      {/* Slide-Down Chat Modal */}
      <ChatSlideModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerChatBtn: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(249, 115, 22, 0.22)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  chatIconEmoji: {
    fontSize: 18,
  },
  chatDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFF1E7',
  },
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  contentContainer: { padding: 16, paddingBottom: 130 },
  topMandalPillContainer: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  topMandalPill: {
    backgroundColor: '#FFF1E7',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  topMandalPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(254, 243, 199, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(254, 243, 199, 0.25)',
  },
  roleBadgeText: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  mandalSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 4,
    fontWeight: '500',
  },
  heroButtonContainer: {
    marginTop: 16,
    gap: 10,
  },
  heroPrimaryBtnFull: {
    backgroundColor: '#F97316',
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  heroPrimaryBtnFullText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroExpenseBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  heroSyncBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  heroSyncIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  floatingChatPill: {
    position: 'absolute',
    bottom: 76,
    right: 16,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  floatingChatIcon: {
    fontSize: 16,
  },
  floatingChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitleRow: { marginTop: 18, marginBottom: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#172554', letterSpacing: -0.2 },
  sectionSub: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statCardsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  statAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
  statCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  statCardAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* 2 & 3. Responsive 2-Column Action Cards */
  actionGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  gridActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between'
  },
  cardBlueBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#3B82F6'
  },
  cardGreenBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#10B981'
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridIcon: { fontSize: 19 },
  arrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrowPillText: { fontSize: 14, fontWeight: '800' },
  gridActionTitle: {
    color: '#172554',
    fontWeight: '800',
    fontSize: 14.5,
    letterSpacing: -0.2,
    marginBottom: 4
  },
  gridActionSub: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500'
  },

  /* 4. Wide Action Card (Events & Tasks) */
  wideActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#6366F1',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  wideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wideIcon: { fontSize: 20 },
  wideActionTitle: {
    color: '#172554',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.2
  },
  wideActionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500'
  },
  wideActionPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  wideActionPillText: {
    color: '#4338CA',
    fontWeight: '800',
    fontSize: 11.5
  },

  memberInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 10,
    marginBottom: 20
  },
  memberInfoIcon: { fontSize: 18 },
  memberInfoText: { color: '#1E40AF', fontSize: 12.5, lineHeight: 18, flex: 1, fontWeight: '500' },

  headerLangPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  headerLangText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },

  netBalanceBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  netBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  netBalanceValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  netBalanceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  netBalanceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  cardPurpleBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#8B5CF6',
  },
  cardAmberBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#F59E0B',
  },

  /* ── Recent Collections ── */
  recentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172554',
    letterSpacing: -0.2,
  },
  recentSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  viewAllPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewAllText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '800',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  recentMid: {
    flex: 1,
  },
  recentDonorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172554',
    letterSpacing: -0.1,
  },
  recentMeta: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: -0.3,
  },
  recentDate: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  recentFooterBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },
  recentFooterBtnText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
