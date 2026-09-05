import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const QUICK_PROMPTS = [
  '🚩 गणपती बाप्पा मोरया!',
  '📢 उद्या संध्याकाळी ७ वा. बैठक आहे',
  '📊 आजचे वर्गणी संकलन किती झाले?',
  '🙏 सर्वांचे मनापासून आभार!',
];

const AVATAR_COLORS = [
  { bg: '#EFF6FF', text: '#2563EB' },
  { bg: '#F0FDF4', text: '#16A34A' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FAF5FF', text: '#9333EA' },
  { bg: '#FFF1F2', text: '#E11D48' },
  { bg: '#ECFEFF', text: '#0891B2' },
];

export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // Safe margin so input bar sits comfortably above the floating bottom tab bar
  const bottomMargin = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10) + 78;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const { user, mandal } = useAuth();
  const { t, language } = useLanguage();
  const isMr = language === 'mr';

  const currentUserId = user?._id || user?.id;

  const loadMessages = async () => {
    try {
      const { data } = await client.get('/chat');
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      // ignore
    } finally {
      setInitialLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  // Poll for new messages every 3 seconds while screen is open
  useFocusEffect(
    useCallback(() => {
      loadMessages();
      const interval = setInterval(() => {
        loadMessages();
      }, 3000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic message append
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: currentUserId,
      senderName: user?.name || (isMr ? 'मी' : 'Me'),
      senderRole: user?.role || 'volunteer',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const { data } = await client.post('/chat', { text: trimmed });
      setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
    } catch (err) {
      loadMessages();
    } finally {
      setSending(false);
    }
  };

  const formatDateDivider = (dateStr) => {
    if (!dateStr) return isMr ? 'आज' : 'Today';
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return isMr ? 'आज' : 'Today';
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return isMr ? 'काल' : 'Yesterday';
    }
    return msgDate.toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'president':
        return { label: `👑 ${t('chat.president') || (isMr ? 'अध्यक्ष' : 'President')}`, color: '#B45309', bg: '#FEF3C7' };
      case 'treasurer':
        return { label: `💰 ${t('chat.treasurer') || (isMr ? 'खजिनदार' : 'Treasurer')}`, color: '#047857', bg: '#D1FAE5' };
      case 'secretary':
        return { label: `📝 ${t('chat.secretary') || (isMr ? 'कार्यवाह' : 'Secretary')}`, color: '#4338CA', bg: '#E0E7FF' };
      default:
        return { label: `🛡️ ${t('chat.volunteer') || (isMr ? 'कार्यकर्ता' : 'Volunteer')}`, color: '#475569', bg: '#F1F5F9' };
    }
  };

  const getAvatarStyle = (name) => {
    const code = (name || 'M').charCodeAt(0);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Aesthetic Top Channel Header ── */}
        <View style={styles.channelBar}>
          <View style={styles.channelLeft}>
            <View style={styles.mandalAvatarBox}>
              <Text style={styles.mandalAvatarEmoji}>🚩</Text>
            </View>
            <View style={styles.channelMeta}>
              <Text style={styles.channelTitle} numberOfLines={1}>
                {mandal?.name || (isMr ? 'मंडळ समिती चॅनेल' : 'Mandal Committee')}
              </Text>
              <View style={styles.channelStatusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.channelStatusText}>
                  {messages.length > 0
                    ? `${messages.length} ${isMr ? 'संदेश' : 'messages'} • ${isMr ? 'सक्रिय समिती' : 'Active Channel'}`
                    : (isMr ? 'अधिकृत समिती चॅनेल' : 'Official Committee Channel')}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.membersPill}
            onPress={() => navigation?.navigate('ProfileTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.membersPillText}>👥 {isMr ? 'सदस्य' : 'Members'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Chat Feed ── */}
        {initialLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>
              {isMr ? 'चॅट लोड होत आहे...' : 'Loading messages...'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#F97316']}
                tintColor="#F97316"
              />
            }
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const isMe = String(item.senderId) === String(currentUserId);
              const roleBadge = getRoleBadge(item.senderRole);

              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDateDivider =
                !prevMsg ||
                new Date(prevMsg.createdAt).toDateString() !==
                  new Date(item.createdAt).toDateString();

              const isSameSenderAsPrev =
                prevMsg &&
                String(prevMsg.senderId) === String(item.senderId) &&
                !showDateDivider;

              const avatarStyle = getAvatarStyle(item.senderName);

              return (
                <View style={[styles.messageWrapper, isSameSenderAsPrev && { marginTop: 3 }]}>
                  {showDateDivider && (
                    <View style={styles.dateDividerContainer}>
                      <View style={styles.dateDividerBadge}>
                        <Text style={styles.dateDividerText}>
                          {formatDateDivider(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {isMe ? (
                    <View style={styles.myMessageRow}>
                      <View style={styles.myBubble}>
                        <Text style={styles.myMessageText} selectable>
                          {item.text}
                        </Text>
                        <View style={styles.myMetaRow}>
                          <Text style={styles.myMessageTime}>
                            {formatTime(item.createdAt)}
                          </Text>
                          <Text style={styles.readCheckmark}>✓✓</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.otherMessageRow}>
                      {!isSameSenderAsPrev ? (
                        <View
                          style={[
                            styles.otherAvatar,
                            { backgroundColor: avatarStyle.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.otherAvatarText,
                              { color: avatarStyle.text },
                            ]}
                          >
                            {(item.senderName?.[0] || 'M').toUpperCase()}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.avatarSpacer} />
                      )}

                      <View style={styles.otherBubble}>
                        {!isSameSenderAsPrev && (
                          <View style={styles.otherHeaderRow}>
                            <Text style={styles.otherSenderName}>
                              {item.senderName}
                            </Text>
                            <View
                              style={[
                                styles.roleBadge,
                                { backgroundColor: roleBadge.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: roleBadge.color },
                                ]}
                              >
                                {roleBadge.label}
                              </Text>
                            </View>
                          </View>
                        )}
                        <Text style={styles.otherMessageText} selectable>
                          {item.text}
                        </Text>
                        <Text style={styles.otherMessageTime}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIconText}>🪔</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {isMr ? 'मंडळ समिती चॅट' : 'Mandal Committee Chat'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isMr
                    ? 'येथे मंडळाचे सर्व पदाधिकारी व कार्यकर्त्यांशी थेट चर्चा करा.'
                    : 'Collaborate and communicate directly with all committee members.'}
                </Text>

                <View style={styles.emptyChipsBox}>
                  <Text style={styles.emptyChipsTitle}>
                    {isMr ? '💡 त्वरित संदेश पर्याय:' : '💡 Quick greetings:'}
                  </Text>
                  <View style={styles.emptyChipsWrap}>
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.emptyPromptChip}
                        onPress={() => setInputText(prompt)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.emptyPromptText}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            }
          />
        )}

        {/* ── Quick Greeting Chips (above composer when few messages exist) ── */}
        {messages.length > 0 && messages.length < 5 && (
          <View style={styles.quickChipsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsScroll}
            >
              {QUICK_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => setInputText(prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Modern Floating Input Dock ── */}
        <View style={[styles.inputDockContainer, { marginBottom: bottomMargin }]}>
          <View style={styles.inputDock}>
            <TouchableOpacity
              style={styles.emojiBtn}
              onPress={() => setInputText((prev) => (prev ? `${prev} 🚩` : '🚩 '))}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiBtnIcon}>🚩</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder={
                isMr
                  ? 'समितीसाठी संदेश लिहा...'
                  : 'Type a message to committee...'
              }
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => {
                setTimeout(
                  () => flatListRef.current?.scrollToEnd({ animated: true }),
                  150
                );
              }}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendCircleBtn,
                !inputText.trim() && styles.sendCircleDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.sendArrowIcon,
                    !inputText.trim() && styles.sendArrowDisabled,
                  ]}
                >
                  ↑
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ── Header ── */
  channelBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 10,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  mandalAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mandalAvatarEmoji: {
    fontSize: 18,
  },
  channelMeta: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  channelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  channelStatusText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  membersPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.6)',
  },
  membersPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  /* ── Loader ── */
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  /* ── Messages List ── */
  messagesList: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 8,
  },

  /* ── Date Divider ── */
  dateDividerContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateDividerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateDividerText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },

  /* ── My Message Bubble (Right) ── */
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  myBubble: {
    backgroundColor: '#F97316',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '82%',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  myMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '600',
  },
  readCheckmark: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '800',
  },

  /* ── Other Message Bubble (Left) ── */
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  otherAvatarText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  avatarSpacer: {
    width: 32,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  otherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  otherSenderName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  otherMessageText: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  otherMessageTime: {
    color: '#94A3B8',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 3,
    fontWeight: '500',
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
    marginBottom: 20,
  },
  emptyChipsBox: {
    width: '100%',
    alignItems: 'center',
  },
  emptyChipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 10,
  },
  emptyChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPromptChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  /* ── Quick Chips Bar (Above input) ── */
  quickChipsBar: {
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  quickChipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },

  /* ── Modern Floating Input Dock ── */
  inputDockContainer: {
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 6,
  },
  emojiBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    maxHeight: 90,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sendCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  sendCircleDisabled: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendArrowIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2,
  },
  sendArrowDisabled: {
    color: '#CBD5E1',
  },
});
