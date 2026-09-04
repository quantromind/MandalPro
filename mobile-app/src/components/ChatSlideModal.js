import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  RefreshControl, Modal, Animated, Dimensions, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatSlideModal({ visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const { user, mandal } = useAuth();
  const { t } = useLanguage();

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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

  // Animation handling when visible changes
  useEffect(() => {
    if (visible) {
      loadMessages();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 68,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_WIDTH);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  // Polling every 3.5s while visible
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      loadMessages();
    }, 3500);
    return () => clearInterval(interval);
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

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
      senderName: user?.name || 'Me',
      senderRole: user?.role || 'volunteer',
      text: trimmed,
      createdAt: new Date().toISOString()
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
    if (!dateStr) return t('common.today');
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return t('common.today');
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday');
    }
    return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'president':
        return { label: `👑 ${t('chat.president')}`, color: '#B45309', bg: '#FEF3C7' };
      case 'treasurer':
        return { label: `💰 ${t('chat.treasurer')}`, color: '#047857', bg: '#D1FAE5' };
      case 'secretary':
        return { label: `📝 ${t('chat.secretary')}`, color: '#4338CA', bg: '#E0E7FF' };
      default:
        return { label: `🛡️ ${t('chat.volunteer')}`, color: '#4B5563', bg: '#F3F4F6' };
    }
  };

  // Guard must be after all hook calls (React Rules of Hooks)
  if (!visible) return null;


  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Dimmed Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
      </Animated.View>

      {/* Full-Screen Right-Side Slide Panel */}
      <Animated.View
        style={[
          styles.panelContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContentRow}>
                {/* Back Button on Left */}
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Back"
                >
                  <Text style={styles.backBtnIcon}>←</Text>
                </TouchableOpacity>

                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarIcon}>💬</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {mandal?.name || t('chat.title')}
                  </Text>
                  <View style={styles.onlineRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.headerSub}>{t('chat.groupSub')}</Text>
                  </View>
                </View>

                {/* Close Button on Right */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Close"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Body */}
            {initialLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>{t('chat.loadingChat')}</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item._id || `msg-${index}`}
                contentContainerStyle={styles.messagesList}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
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
                    new Date(prevMsg.createdAt).toDateString() !== new Date(item.createdAt).toDateString();

                  return (
                    <View>
                      {showDateDivider && (
                        <View style={styles.dateDividerContainer}>
                          <View style={styles.dateDividerBadge}>
                            <Text style={styles.dateDividerText}>{formatDateDivider(item.createdAt)}</Text>
                          </View>
                        </View>
                      )}

                      {isMe ? (
                        <View style={styles.myMessageRow}>
                          <View style={styles.myBubble}>
                            <Text style={styles.myMessageText} selectable>{item.text}</Text>
                            <Text style={styles.myMessageTime}>{formatTime(item.createdAt)}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.otherMessageRow}>
                          <View style={styles.otherAvatar}>
                            <Text style={styles.otherAvatarText}>
                              {(item.senderName?.[0] || 'M').toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.otherBubble}>
                            <View style={styles.otherHeaderRow}>
                              <Text style={styles.otherSenderName}>{item.senderName}</Text>
                              <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                                <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                                  {roleBadge.label}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.otherMessageText} selectable>{item.text}</Text>
                            <Text style={styles.otherMessageTime}>{formatTime(item.createdAt)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>💬</Text>
                    <Text style={styles.emptyTitle}>{t('chat.title')}</Text>
                    <Text style={styles.emptySubtitle}>
                      {t('chat.emptyChatSubtitle')}
                    </Text>
                  </View>
                }
              />
            )}

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder={t('chat.typeMessage')}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => {
                  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
                }}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  panelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 25,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: Platform.OS === 'ios' ? -1 : -3,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarIcon: {
    fontSize: 19,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172554',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F7F4',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexGrow: 1,
    backgroundColor: '#F8F7F4',
  },
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  myBubble: {
    backgroundColor: '#F97316',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '82%',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
    fontWeight: '600',
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  otherAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(23, 37, 84, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#172554',
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
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
    fontSize: 12.5,
    fontWeight: '800',
    color: '#172554',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  otherMessageText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  otherMessageTime: {
    color: '#94A3B8',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.06)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14.5,
    color: '#172554',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 2,
  },
  dateDividerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerBadge: {
    backgroundColor: 'rgba(23, 37, 84, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
