import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Drawer and modals
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Add Member form state
  const ROLE_DEFAULTS = {
    volunteer: { canCollect: true, canManageExpenses: false, canAddMembers: false, canChat: true, canViewReports: false },
    treasurer: { canCollect: true, canManageExpenses: true, canAddMembers: false, canChat: true, canViewReports: true },
    secretary: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true },
    president: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true }
  };

  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addMobile, setAddMobile] = useState('');
  const [addRole, setAddRole] = useState('volunteer');
  const [addPermissions, setAddPermissions] = useState(ROLE_DEFAULTS.volunteer);
  const [addingMember, setAddingMember] = useState(false);

  const messagesEndRef = useRef(null);
  const { user, mandal } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const currentUserId = user?._id || user?.id;
  const isPresident = user?.role === 'president';
  const canAdd = isPresident || user?.role === 'secretary' || user?.permissions?.canAddMembers;
  const canChat = user?.permissions?.canChat !== false;

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

  const loadMembers = async () => {
    try {
      const { data } = await client.get('/members');
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error('Error loading members in chat:', err);
    }
  };

  useEffect(() => {
    loadMessages();
    loadMembers();
    const interval = setInterval(() => {
      loadMessages();
      loadMembers();
    }, 3000);
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

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      alert('Please provide member name and email');
      return;
    }
    try {
      setAddingMember(true);
      await client.post('/members', {
        name: addName.trim(),
        email: addEmail.trim(),
        mobile: addMobile.trim(),
        role: addRole,
        permissions: addPermissions
      });
      setShowAddMember(false);
      setAddName('');
      setAddEmail('');
      setAddMobile('');
      setAddRole('volunteer');
      setAddPermissions(ROLE_DEFAULTS.volunteer);
      await loadMembers();
      await loadMessages();
      alert(language === 'mr' ? 'समिती सदस्य जोडला गेला व चॅटमध्ये सामील झाला! 🎉' : 'Member added to committee and joined chat! 🎉');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (id, name) => {
    const confirmMsg = language === 'mr'
      ? `${name} यांना कमिटी चॅटमधून काढायचे आहे का?`
      : `Are you sure you want to remove ${name} from this committee?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await client.delete(`/members/${id}`);
      await loadMembers();
      await loadMessages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveCommittee = async () => {
    try {
      setLeaving(true);
      await client.post('/members/leave');
      alert(language === 'mr' ? 'तुम्ही या मंडळ कमिटीमधून बाहेर पडला आहात.' : 'You have left the Mandal committee successfully.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave committee');
      setLeaving(false);
      setShowLeaveConfirm(false);
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
      <div className="chat-page-container" style={{ position: 'relative' }}>
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

          <div className="chat-header-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Committee Members Toggle Button */}
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowMembersDrawer(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>👥</span>
              <span>{members.length} {t('chat.committeeMembers')}</span>
            </button>

            {/* Quick Add Member button in Header for President & Admins */}
            {canAdd && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowAddMember(true)}
              >
                + {t('chat.addMember')}
              </button>
            )}

            {/* Leave Committee Button for Non-Presidents */}
            {!isPresident && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowLeaveConfirm(true)}
                style={{ color: 'var(--danger)', fontSize: 12 }}
                title="Leave this Mandal committee"
              >
                {t('chat.leaveGroup')}
              </button>
            )}

            <button className="btn btn-sm btn-ghost" onClick={loadMessages} title="Refresh Messages">
              🔄
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
              // System Message Announcement Rendering
              if (msg.isSystem) {
                return (
                  <div
                    key={msg._id || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '14px 0',
                      width: '100%'
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--bg-subtle, #f1f5f9)',
                        color: 'var(--text-muted, #475569)',
                        fontSize: '12px',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: '1px solid var(--border, #cbd5e1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 500,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <span>📢</span> {msg.text}
                    </div>
                  </div>
                );
              }

              const myId = String(user?._id || user?.id || '');
              const senderId = String(
                msg.sender?._id ||
                msg.sender?.id ||
                (typeof msg.sender === 'string' ? msg.sender : '') ||
                msg.senderId?._id ||
                msg.senderId?.id ||
                (typeof msg.senderId === 'string' ? msg.senderId : '') ||
                ''
              );

              const isMe = Boolean(myId && senderId && myId === senderId);

              const senderName = isMe
                ? (user?.name || msg.senderName || 'You')
                : (msg.senderName || msg.sender?.name || msg.senderId?.name || 'Member');

              const senderRole = isMe
                ? (user?.role || msg.senderRole || 'volunteer')
                : (msg.senderRole || msg.sender?.role || msg.senderId?.role || 'volunteer');

              // Distinct WhatsApp sender name color
              const getSenderColor = (name) => {
                const colors = ['#0284C7', '#059669', '#7C3AED', '#D97706', '#DB2777', '#EA580C', '#2563EB'];
                let hash = 0;
                for (let i = 0; i < (name || '').length; i++) {
                  hash = name.charCodeAt(i) + ((hash << 5) - hash);
                }
                return colors[Math.abs(hash) % colors.length];
              };

              const memberColor = getSenderColor(senderName);

              return (
                <div key={msg._id || index} className={`chat-bubble-row ${isMe ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
                  {!isMe && (
                    <div className="chat-user-avatar" style={{ background: memberColor }}>
                      {senderName?.[0]?.toUpperCase() || 'M'}
                    </div>
                  )}

                  <div className={`chat-bubble ${isMe ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                    {!isMe && (
                      <div className="chat-sender-header">
                        <span className="chat-sender-name" style={{ color: memberColor }}>
                          {senderName}
                        </span>
                        {getRoleBadge(senderRole)}
                      </div>
                    )}

                    <div className="chat-text-content">{msg.text || msg.message}</div>

                    <div className="chat-bubble-meta">
                      <span className="chat-time-stamp">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMe && <span className="chat-check-double" title="Sent">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        {canChat ? (
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
        ) : (
          <div style={{ padding: '12px 20px', textAlign: 'center', background: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            🔒 {t('chat.noChatPermission')}
          </div>
        )}

        {/* Committee Members Side Drawer / Modal */}
        {showMembersDrawer && (
          <div className="modal-backdrop" onClick={() => setShowMembersDrawer(false)}>
            <div
              className="modal-content modal-md"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="modal-header">
                <div>
                  <h3 className="text-h3" style={{ margin: 0 }}>
                    👥 {t('chat.committeeMembers')} ({members.length})
                  </h3>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {t('profile.unlimitedMembersBadge')}
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowMembersDrawer(false)}>✕</button>
              </div>

              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {canAdd && (
                  <button
                    className="btn btn-primary btn-sm w-full"
                    style={{ marginBottom: 14, padding: '10px' }}
                    onClick={() => {
                      setShowMembersDrawer(false);
                      setShowAddMember(true);
                    }}
                  >
                    + {t('chat.addMember')}
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {members.map((m) => {
                    const isSelf = (m._id || m.id) === currentUserId;
                    const perms = m.permissions || ROLE_DEFAULTS[m.role] || ROLE_DEFAULTS.volunteer;

                    return (
                      <div
                        key={m._id || m.email}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: isSelf ? '#FFFBEB' : 'var(--bg-subtle, #f8f9fa)',
                          border: isSelf ? '1px solid #FDE68A' : '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                              {m.name} {isSelf ? (language === 'mr' ? '(तुम्ही)' : '(You)') : ''}
                            </span>
                            {getRoleBadge(m.role)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {m.email} {m.mobile ? `• ${m.mobile}` : ''}
                          </div>
                          {/* Permissions summary */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {perms.canCollect && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>🪙 Receipts</span>}
                            {perms.canManageExpenses && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>💸 Expenses</span>}
                            {perms.canAddMembers && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#ECFDF5', color: '#047857' }}>👥 Add</span>}
                            {perms.canChat && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#F5F3FF', color: '#6D28D9' }}>💬 Chat</span>}
                          </div>
                        </div>

                        {/* President can remove members directly from chat */}
                        {isPresident && m.role !== 'president' && (
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }}
                            onClick={() => handleRemoveMember(m._id, m.name)}
                            title="Remove from Committee"
                          >
                            🗑️ {t('chat.removeMember')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leave Committee action in drawer for non-presidents */}
              {!isPresident && (
                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setShowMembersDrawer(false);
                      setShowLeaveConfirm(true);
                    }}
                    style={{ color: 'var(--danger)' }}
                  >
                    🚪 {t('chat.leaveGroup')}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setShowMembersDrawer(false)}>
                    {t('common.close')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Member Modal (From Chat) */}
        {showAddMember && (
          <div className="modal-backdrop" onClick={() => setShowAddMember(false)}>
            <div className="modal-content modal-md modal-flex" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>👥</span> {t('profile.addTeamMember')}
                  </h3>
                  <div style={{ marginTop: 4 }}>
                    <span className="badge badge-success" style={{ fontSize: 11, padding: '3px 8px' }}>
                      {t('profile.unlimitedMembersBadge')}
                    </span>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowAddMember(false)}>✕</button>
              </div>

              <form onSubmit={handleAddMemberSubmit} id="chat-add-member-form" style={{ display: 'contents' }}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.memberFullName')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Shinde"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      required
                      style={{ height: 42 }}
                    />
                  </div>

                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.memberEmailForOtp')}</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="member@gmail.com"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        required
                        style={{ height: 42 }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>{language === 'mr' ? 'मोबाईल क्रमांक (पर्यायी)' : 'Mobile (Optional)'}</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="9876543210"
                        value={addMobile}
                        onChange={(e) => setAddMobile(e.target.value)}
                        style={{ height: 42 }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.role')}</label>
                    <select
                      className="form-control"
                      value={addRole}
                      onChange={(e) => {
                        const r = e.target.value;
                        setAddRole(r);
                        setAddPermissions(ROLE_DEFAULTS[r] || ROLE_DEFAULTS.volunteer);
                      }}
                      style={{ height: 42 }}
                    >
                      <option value="volunteer">🛡️ {t('profile.roles.volunteer')}</option>
                      <option value="treasurer">💰 {t('profile.roles.treasurer')}</option>
                      <option value="secretary">📝 {t('profile.roles.secretary')}</option>
                    </select>
                  </div>

                  {/* Granular Permissions Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                        🔒 {t('profile.permissionsTitle')}
                      </span>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {language === 'mr' ? 'क्लिक करून ऑन/ऑफ करा' : 'Click to toggle'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* 1. Collect */}
                      <div
                        className={`permission-card ${addPermissions.canCollect ? 'active' : ''}`}
                        onClick={() => setAddPermissions({ ...addPermissions, canCollect: !addPermissions.canCollect })}
                      >
                        <div className="permission-card-left">
                          <div className="permission-card-icon">🪙</div>
                          <div>
                            <div className="permission-card-title">
                              {language === 'mr' ? 'देणगी संकलन व डिजिटल पावती' : 'Collect Donations & Receipts'}
                            </div>
                            <div className="permission-card-desc">
                              {language === 'mr' ? 'रोकड / UPI द्वारे देणगी स्वीकारणे व डिजिटल पावती तयार करणे' : 'Accept donations and generate official digital receipts'}
                            </div>
                          </div>
                        </div>
                        <div className={`switch-toggle ${addPermissions.canCollect ? 'checked' : ''}`}>
                          <div className="switch-toggle-thumb"></div>
                        </div>
                      </div>

                      {/* 2. Expenses */}
                      <div
                        className={`permission-card ${addPermissions.canManageExpenses ? 'active' : ''}`}
                        onClick={() => setAddPermissions({ ...addPermissions, canManageExpenses: !addPermissions.canManageExpenses })}
                      >
                        <div className="permission-card-left">
                          <div className="permission-card-icon">💸</div>
                          <div>
                            <div className="permission-card-title">
                              {language === 'mr' ? 'मंडळ खर्च नोंदवणे व व्यवस्थापन' : 'Record & Manage Expenses'}
                            </div>
                            <div className="permission-card-desc">
                              {language === 'mr' ? 'खर्च व्हाउचर नोंदवणे व बिलांचे व्यवस्थापन करणे' : 'Add expense vouchers and track vendor bills'}
                            </div>
                          </div>
                        </div>
                        <div className={`switch-toggle ${addPermissions.canManageExpenses ? 'checked' : ''}`}>
                          <div className="switch-toggle-thumb"></div>
                        </div>
                      </div>

                      {/* 3. Add Members */}
                      <div
                        className={`permission-card ${addPermissions.canAddMembers ? 'active' : ''}`}
                        onClick={() => setAddPermissions({ ...addPermissions, canAddMembers: !addPermissions.canAddMembers })}
                      >
                        <div className="permission-card-left">
                          <div className="permission-card-icon">👥</div>
                          <div>
                            <div className="permission-card-title">
                              {language === 'mr' ? 'नवीन समिती सदस्य जोडणे' : 'Add & Invite Members'}
                            </div>
                            <div className="permission-card-desc">
                              {language === 'mr' ? 'मंडळात इतर कार्यकर्त्यांना जोडण्याची परवानगी' : 'Permission to register new members to the Mandal'}
                            </div>
                          </div>
                        </div>
                        <div className={`switch-toggle ${addPermissions.canAddMembers ? 'checked' : ''}`}>
                          <div className="switch-toggle-thumb"></div>
                        </div>
                      </div>

                      {/* 4. Chat */}
                      <div
                        className={`permission-card ${addPermissions.canChat ? 'active' : ''}`}
                        onClick={() => setAddPermissions({ ...addPermissions, canChat: !addPermissions.canChat })}
                      >
                        <div className="permission-card-left">
                          <div className="permission-card-icon">💬</div>
                          <div>
                            <div className="permission-card-title">
                              {language === 'mr' ? 'कमिटी चॅटमध्ये सहभागी होणे' : 'Committee Chat Access'}
                            </div>
                            <div className="permission-card-desc">
                              {language === 'mr' ? 'मंडळाच्या अधिकृत ग्रुप चॅटमध्ये संदेश पाठवणे' : 'Send messages and discuss in the committee chat'}
                            </div>
                          </div>
                        </div>
                        <div className={`switch-toggle ${addPermissions.canChat ? 'checked' : ''}`}>
                          <div className="switch-toggle-thumb"></div>
                        </div>
                      </div>

                      {/* 5. Reports */}
                      <div
                        className={`permission-card ${addPermissions.canViewReports ? 'active' : ''}`}
                        onClick={() => setAddPermissions({ ...addPermissions, canViewReports: !addPermissions.canViewReports })}
                      >
                        <div className="permission-card-left">
                          <div className="permission-card-icon">📊</div>
                          <div>
                            <div className="permission-card-title">
                              {language === 'mr' ? 'हिशोब व आर्थिक अहवाल पाहणे' : 'View Financial Reports'}
                            </div>
                            <div className="permission-card-desc">
                              {language === 'mr' ? 'जमा-खर्च ताळेबंद व अहवाल पाहण्याची सुविधा' : 'Access collection summaries and financial sheets'}
                            </div>
                          </div>
                        </div>
                        <div className={`switch-toggle ${addPermissions.canViewReports ? 'checked' : ''}`}>
                          <div className="switch-toggle-thumb"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddMember(false)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addingMember} style={{ padding: '8px 18px', fontWeight: 600 }}>
                    {addingMember ? t('common.loading') : t('profile.addMemberToMandal')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leave Committee Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="modal-backdrop" onClick={() => setShowLeaveConfirm(false)}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="text-h3" style={{ margin: 0, color: 'var(--danger)' }}>
                  🚪 {t('chat.leaveGroup')}
                </h3>
                <button className="btn-close" onClick={() => setShowLeaveConfirm(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ padding: '20px 0' }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: 'var(--text-main)' }}>
                  {t('chat.leaveConfirm')}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={leaving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ background: 'var(--danger)', color: '#fff' }}
                  onClick={handleLeaveCommittee}
                  disabled={leaving}
                >
                  {leaving ? t('common.loading') : `🚪 ${t('chat.leaveGroup')}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
