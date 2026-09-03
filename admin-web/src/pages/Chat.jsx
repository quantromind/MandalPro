import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const { user, mandal } = useAuth();
  const { t, language } = useLanguage();

  const currentUserId = user?._id || user?.id;

  const loadMessages = async () => {
    try {
      const { data } = await client.get('/chat');
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      await client.post('/chat', { text });
      await loadMessages();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'president':
        return <span className="chat-role-badge badge-president">👑 {t('chat.president')}</span>;
      case 'treasurer':
        return <span className="chat-role-badge badge-treasurer">💰 {t('chat.treasurer')}</span>;
      case 'secretary':
        return <span className="chat-role-badge badge-secretary">📝 {t('chat.secretary')}</span>;
      default:
        return <span className="chat-role-badge badge-volunteer">🛡️ {t('chat.volunteer')}</span>;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="chat-page-container">
        {/* Chat Header */}
        <div className="chat-header-card">
          <div className="chat-header-left">
            <div className="chat-avatar-mandal">
              <span>🚩</span>
            </div>
            <div>
              <h2 className="text-h2" style={{ margin: 0, fontSize: 18 }}>
                {mandal?.name || 'Mandal Committee Chat'}
              </h2>
              <div className="chat-sub-text">
                <span className="online-dot"></span>
                <span>{t('chat.groupSubtitle')}</span>
              </div>
            </div>
          </div>
          <div className="chat-header-right">
            <button className="btn btn-sm btn-outline" onClick={loadMessages}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="chat-messages-area">
          {initialLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner"></div>
              <p className="text-muted" style={{ marginTop: 10 }}>{t('common.loading')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat-box">
              <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
              <h3 className="text-h3">{t('chat.emptyChat')}</h3>
              <p className="text-muted">
                {language === 'mr'
                  ? 'मंडळाच्या सर्व सदस्यांशी संवाद साधण्यासाठी येथे मेसेज पाठवा.'
                  : 'Start communicating with your Mandal committee members here.'}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = (msg.sender?._id || msg.sender?.id || msg.sender) === currentUserId;
              const senderName = msg.sender?.name || (isMe ? user?.name : 'Member');
              const senderRole = msg.sender?.role || (isMe ? user?.role : 'volunteer');

              return (
                <div key={msg._id || index} className={`chat-bubble-row ${isMe ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
                  {!isMe && (
                    <div className="chat-user-avatar">
                      {senderName?.[0]?.toUpperCase() || 'M'}
                    </div>
                  )}

                  <div className={`chat-bubble ${isMe ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                    {!isMe && (
                      <div className="chat-sender-header">
                        <span className="chat-sender-name">{senderName}</span>
                        {getRoleBadge(senderRole)}
                      </div>
                    )}

                    <div className="chat-text-content">{msg.text || msg.message}</div>

                    <div className="chat-time-stamp">
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="chat-input-bar">
          <input
            type="text"
            className="chat-input-field"
            placeholder={t('chat.typeMessage')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary chat-send-btn" disabled={sending || !inputText.trim()}>
            <span>✈️</span> {t('chat.send')}
          </button>
        </form>
      </div>
    </Layout>
  );
}
