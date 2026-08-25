import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const { user, mandal } = useAuth();

  const currentUserId = user?._id || user?.id;

  const loadMessages = async () => {
    try {
      const { data } = await client.get('/chat');
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.log('Error loading messages', err);
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
      console.log('Error sending message', err);
      loadMessages();
    } finally {
      setSending(false);
    }
  };

  const formatDateDivider = (dateStr) => {
    if (!dateStr) return 'Today';
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
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
        return { label: '👑 President', color: '#B45309', bg: '#FEF3C7' };
      case 'treasurer':
        return { label: '💰 Treasurer', color: '#047857', bg: '#D1FAE5' };
      case 'secretary':
        return { label: '📝 Secretary', color: '#4338CA', bg: '#E0E7FF' };
      default:
        return { label: '🛡️ Member', color: '#4B5563', bg: '#F3F4F6' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        {/* Header Info */}
        <View style={styles.topHeader}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarIcon}>🚩</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {mandal?.name || 'Mandal Group Chat'}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>Committee Group • All Members & President</Text>
            </View>
          </View>
        </View>

        {/* Chat Messages */}
        {initialLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Loading committee chat...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                <Text style={styles.emptyTitle}>Mandal Group Chat</Text>
                <Text style={styles.emptySubtitle}>
                  Say hello! All committee members and the President can discuss collections, arrangements, and festival updates here.
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar pinned above keyboard */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Message the Mandal team..."
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F6'
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerAvatarIcon: {
    fontSize: 20
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17233C'
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  headerSub: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280'
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexGrow: 1
  },
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  myBubble: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    borderBottomRightRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500'
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
    fontWeight: '500'
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  otherAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151'
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  otherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap'
  },
  otherSenderName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#17233C'
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '700'
  },
  otherMessageText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20
  },
  otherMessageTime: {
    color: '#9CA3AF',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 60
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17233C',
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14.5,
    color: '#17233C'
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 2
  },
  dateDividerContainer: {
    alignItems: 'center',
    marginVertical: 12
  },
  dateDividerBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 12
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563'
  }
});
