import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { mandal, user, setMandal } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Form State for updating mandal
  const [mandalName, setMandalName] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [saving, setSaving] = useState(false);
  const logoInputRef = React.useRef(null);

  // Default permission presets
  const ROLE_DEFAULTS = {
    volunteer: { canCollect: true, canManageExpenses: false, canAddMembers: false, canChat: true, canViewReports: false },
    treasurer: { canCollect: true, canManageExpenses: true, canAddMembers: false, canChat: true, canViewReports: true },
    secretary: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true },
    president: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true }
  };

  // Add member modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [memberRole, setMemberRole] = useState('volunteer');
  const [memberPermissions, setMemberPermissions] = useState(ROLE_DEFAULTS.volunteer);
  const [addingMember, setAddingMember] = useState(false);

  // Edit member modal state
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState('volunteer');
  const [editPermissions, setEditPermissions] = useState(ROLE_DEFAULTS.volunteer);
  const [updatingMember, setUpdatingMember] = useState(false);

  useEffect(() => {
    if (mandal) {
      setMandalName(mandal.name || '');
      setAddress(mandal.address || '');
      setUpiId(mandal.upiId || '');
      setLogoPreview(mandal.logoBase64 || mandal.logoUrl || '');
      setLogoBase64(mandal.logoBase64 || '');
    }
    loadMembers();
  }, [mandal]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const { data } = await client.get('/members');
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'mr' ? 'कृपया २MB पेक्षा लहान फोटो निवडा' : 'Please select an image smaller than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result);
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await client.patch('/mandal', {
        name: mandalName,
        address,
        upiId,
        logoBase64
      });
      if (setMandal) setMandal(data);
      alert(language === 'mr' ? 'मंडळ माहिती व लोगो अद्ययावत केला! ✅' : 'Profile & logo updated successfully! ✅');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) {
      alert('Please provide member name and email');
      return;
    }
    try {
      setAddingMember(true);
      await client.post('/members', {
        name: memberName.trim(),
        email: memberEmail.trim(),
        mobile: memberMobile.trim(),
        role: memberRole,
        permissions: memberPermissions
      });
      setShowAddMember(false);
      setMemberName('');
      setMemberEmail('');
      setMemberMobile('');
      setMemberRole('volunteer');
      setMemberPermissions(ROLE_DEFAULTS.volunteer);
      await loadMembers();
      alert(t('profile.memberAdded'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleOpenEditMember = (member) => {
    setEditingMember(member);
    setEditName(member.name || '');
    setEditMobile(member.mobile || '');
    setEditRole(member.role || 'volunteer');
    setEditPermissions(member.permissions || ROLE_DEFAULTS[member.role] || ROLE_DEFAULTS.volunteer);
  };

  const handleSaveEditMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      setUpdatingMember(true);
      await client.patch(`/members/${editingMember._id}`, {
        name: editName.trim(),
        mobile: editMobile.trim(),
        role: editRole,
        permissions: editPermissions
      });
      setEditingMember(null);
      await loadMembers();
      alert(language === 'mr' ? 'सदस्य माहिती व परवानग्या अद्ययावत झाल्या! ✅' : 'Member updated successfully! ✅');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member');
    } finally {
      setUpdatingMember(false);
    }
  };

  const handleRemoveMember = async (id, name) => {
    const confirmMsg = language === 'mr'
      ? `तुम्हाला खात्री आहे का की तुम्ही ${name} यांना मंडळातून काढू इच्छिता?`
      : `Are you sure you want to remove ${name} from this Mandal?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await client.delete(`/members/${id}`);
      await loadMembers();
      alert(language === 'mr' ? 'सदस्य काढण्यात आला. ✓' : 'Member removed successfully. ✓');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const openCardGenerator = (member) => {
    setSelectedMemberForCard(member);
    setShowIdCardModal(true);
  };

  const upiQrUrl = upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(mandalName || 'Mandal')}&cu=INR`)}`
    : null;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="text-h1" style={{ margin: 0 }}>
          🚩 {t('profile.title')} (मंडळ प्रोफाइल)
        </h1>
        <p className="text-muted" style={{ marginTop: 4 }}>
          {t('profile.brandingAndDetails')} & Digital ID Cards
        </p>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        {/* Left Column: Mandal Information & QR Code */}
        <div>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: 16 }}>
              🏛️ {t('profile.mandalDetails')}
            </h3>

            <form onSubmit={handleUpdateProfile}>
              {/* Mandal Official Logo Upload */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🚩 {language === 'mr' ? 'मंडळ अधिकृत लोगो (पावतीवर दिसेल)' : 'Official Mandal Logo (Printed on receipts)'}</span>
                  {logoPreview && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', fontSize: 11, padding: '2px 6px' }}
                      onClick={() => { setLogoPreview(''); setLogoBase64(''); }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </label>
                <div
                  className="logo-upload-box"
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img
                    src={logoPreview || '/logo.png'}
                    alt="Mandal Logo"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      objectFit: 'contain',
                      background: '#fff',
                      padding: 4,
                      border: '2px solid var(--primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                      {logoPreview ? (language === 'mr' ? 'लोगो निवडला आहे ✓' : 'Custom logo selected ✓') : (language === 'mr' ? 'लोगो अपलोड करा' : 'Upload custom logo')}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {language === 'mr' ? 'PNG, JPG किंवा WEBP निवडा (क्लिक करा)' : 'Click to select PNG, JPG or WEBP'}
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline" style={{ pointerEvents: 'none' }}>
                    📁 {language === 'mr' ? 'बदला' : 'Browse'}
                  </button>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.mandalName')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={mandalName}
                  onChange={(e) => setMandalName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.address')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Shivaji Chowk, Pune"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.upiId')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. mandal@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t('common.loading') : `💾 ${t('common.save')}`}
              </button>
            </form>
          </div>

          {/* Donation QR Code Generator */}
          <div className="card" style={{ marginTop: 20, textAlign: 'center' }}>
            <h3 className="text-h3">📱 {language === 'mr' ? 'थेट देणगी QR कोड' : 'Official Donation QR Code'}</h3>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              {language === 'mr'
                ? 'भक्त किंवा देणगीदार हा QR स्कॅन करून थेट मंडळाच्या खात्यात देणगी जमा करू शकतात.'
                : 'Devotees can scan this QR code to donate directly to your Mandal UPI ID.'}
            </p>

            {upiQrUrl ? (
              <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 16, border: '2px dashed #F97316' }}>
                <img src={upiQrUrl} alt="UPI QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--text-main)', fontSize: 13 }}>
                  {upiId}
                </div>
              </div>
            ) : (
              <div style={{ padding: 24, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                <p className="text-muted">Enter Mandal UPI ID above to generate donation QR code.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Committee Directory & ID Cards */}
        <div>
          {/* Language Switcher Card */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: 12 }}>
              🌐 {t('profile.appPreferences')}
            </h3>
            <p className="text-muted" style={{ fontSize: 13.5 }}>
              {t('language.languageDescription')}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className={`btn ${language === 'mr' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setLanguage('mr')}
                style={{ flex: 1 }}
              >
                🚩 मराठी (Marathi)
              </button>
              <button
                className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setLanguage('en')}
                style={{ flex: 1 }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Committee Members & ID Cards */}
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>
                  👥 {t('profile.teamMembers')}
                </h3>
                <span className="badge badge-success" style={{ marginTop: 6, fontSize: 11, display: 'inline-block' }}>
                  {t('profile.unlimitedMembersBadge')}
                </span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setMemberPermissions(ROLE_DEFAULTS.volunteer);
                  setShowAddMember(true);
                }}
              >
                + {t('profile.addMember')}
              </button>
            </div>

            {loadingMembers ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner"></div>
              </div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }} className="text-muted">
                {t('profile.noMembersYet')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {members.map((m) => {
                  const perms = m.permissions || ROLE_DEFAULTS[m.role] || ROLE_DEFAULTS.volunteer;
                  return (
                    <div
                      key={m._id || m.email}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle, #f8f9fa)',
                        borderRadius: 12,
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-main)' }}>{m.name}</span>
                            <span className="badge badge-light" style={{ textTransform: 'capitalize', fontSize: 11, fontWeight: 600 }}>
                              {m.role === 'president' ? '👑 President' : m.role === 'secretary' ? '📝 Secretary' : m.role === 'treasurer' ? '💰 Treasurer' : '🛡️ Volunteer'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {m.email} {m.mobile ? `• 📞 ${m.mobile}` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openCardGenerator(m)}
                            title="Generate Official Member ID Card"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            🪪 ID Card
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenEditMember(m)}
                            title="Edit Role & Permissions"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                          >
                            ✏️
                          </button>
                          {m.role !== 'president' && (
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleRemoveMember(m._id, m.name)}
                              title="Remove Member"
                              style={{ color: 'var(--danger)', padding: '4px 8px', fontSize: 12 }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Permissions Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {perms.canCollect && (
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            🪙 {language === 'mr' ? 'पावती कापणे' : 'Receipts'}
                          </span>
                        )}
                        {perms.canManageExpenses && (
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                            💸 {language === 'mr' ? 'खर्च' : 'Expenses'}
                          </span>
                        )}
                        {perms.canAddMembers && (
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                            👥 {language === 'mr' ? 'सदस्य जोडणे' : 'Add Members'}
                          </span>
                        )}
                        {perms.canChat && (
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                            💬 {language === 'mr' ? 'चॅट' : 'Chat'}
                          </span>
                        )}
                        {perms.canViewReports && (
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
                            📊 {language === 'mr' ? 'हिशोब' : 'Reports'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
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

            <form onSubmit={handleAddMember} id="add-member-form" style={{ display: 'contents' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.memberFullName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rahul Shinde"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                    style={{ height: 42 }}
                  />
                </div>

                {/* Email & Mobile */}
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.memberEmailForOtp')}</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="member@gmail.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
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
                      value={memberMobile}
                      onChange={(e) => setMemberMobile(e.target.value)}
                      style={{ height: 42 }}
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.role')}</label>
                  <select
                    className="form-control"
                    value={memberRole}
                    onChange={(e) => {
                      const r = e.target.value;
                      setMemberRole(r);
                      setMemberPermissions(ROLE_DEFAULTS[r] || ROLE_DEFAULTS.volunteer);
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

                  {/* Permission Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* 1. Collect */}
                    <div
                      className={`permission-card ${memberPermissions.canCollect ? 'active' : ''}`}
                      onClick={() => setMemberPermissions({ ...memberPermissions, canCollect: !memberPermissions.canCollect })}
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
                      <div className={`switch-toggle ${memberPermissions.canCollect ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 2. Expenses */}
                    <div
                      className={`permission-card ${memberPermissions.canManageExpenses ? 'active' : ''}`}
                      onClick={() => setMemberPermissions({ ...memberPermissions, canManageExpenses: !memberPermissions.canManageExpenses })}
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
                      <div className={`switch-toggle ${memberPermissions.canManageExpenses ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 3. Add Members */}
                    <div
                      className={`permission-card ${memberPermissions.canAddMembers ? 'active' : ''}`}
                      onClick={() => setMemberPermissions({ ...memberPermissions, canAddMembers: !memberPermissions.canAddMembers })}
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
                      <div className={`switch-toggle ${memberPermissions.canAddMembers ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 4. Chat */}
                    <div
                      className={`permission-card ${memberPermissions.canChat ? 'active' : ''}`}
                      onClick={() => setMemberPermissions({ ...memberPermissions, canChat: !memberPermissions.canChat })}
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
                      <div className={`switch-toggle ${memberPermissions.canChat ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 5. Reports */}
                    <div
                      className={`permission-card ${memberPermissions.canViewReports ? 'active' : ''}`}
                      onClick={() => setMemberPermissions({ ...memberPermissions, canViewReports: !memberPermissions.canViewReports })}
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
                      <div className={`switch-toggle ${memberPermissions.canViewReports ? 'checked' : ''}`}>
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
                  {addingMember ? t('common.loading') : `${t('profile.addMemberToMandal')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="modal-backdrop" onClick={() => setEditingMember(null)}>
          <div className="modal-content modal-md modal-flex" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✏️</span> {t('profile.editMember')}
              </h3>
              <button className="btn-close" onClick={() => setEditingMember(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditMember} id="edit-member-form" style={{ display: 'contents' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.memberFullName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{ height: 42 }}
                  />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingMember.email}
                      disabled
                      style={{ background: 'var(--bg-subtle)', height: 42, color: 'var(--text-muted)' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>{language === 'mr' ? 'मोबाईल क्रमांक' : 'Mobile'}</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      style={{ height: 42 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('profile.role')}</label>
                  <select
                    className="form-control"
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value;
                      setEditRole(r);
                      setEditPermissions(ROLE_DEFAULTS[r] || ROLE_DEFAULTS.volunteer);
                    }}
                    style={{ height: 42 }}
                  >
                    <option value="volunteer">🛡️ {t('profile.roles.volunteer')}</option>
                    <option value="treasurer">💰 {t('profile.roles.treasurer')}</option>
                    <option value="secretary">📝 {t('profile.roles.secretary')}</option>
                    <option value="president">👑 {t('profile.roles.president')}</option>
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

                  {/* Permission Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* 1. Collect */}
                    <div
                      className={`permission-card ${editPermissions.canCollect ? 'active' : ''}`}
                      onClick={() => setEditPermissions({ ...editPermissions, canCollect: !editPermissions.canCollect })}
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
                      <div className={`switch-toggle ${editPermissions.canCollect ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 2. Expenses */}
                    <div
                      className={`permission-card ${editPermissions.canManageExpenses ? 'active' : ''}`}
                      onClick={() => setEditPermissions({ ...editPermissions, canManageExpenses: !editPermissions.canManageExpenses })}
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
                      <div className={`switch-toggle ${editPermissions.canManageExpenses ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 3. Add Members */}
                    <div
                      className={`permission-card ${editPermissions.canAddMembers ? 'active' : ''}`}
                      onClick={() => setEditPermissions({ ...editPermissions, canAddMembers: !editPermissions.canAddMembers })}
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
                      <div className={`switch-toggle ${editPermissions.canAddMembers ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 4. Chat */}
                    <div
                      className={`permission-card ${editPermissions.canChat ? 'active' : ''}`}
                      onClick={() => setEditPermissions({ ...editPermissions, canChat: !editPermissions.canChat })}
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
                      <div className={`switch-toggle ${editPermissions.canChat ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>

                    {/* 5. Reports */}
                    <div
                      className={`permission-card ${editPermissions.canViewReports ? 'active' : ''}`}
                      onClick={() => setEditPermissions({ ...editPermissions, canViewReports: !editPermissions.canViewReports })}
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
                      <div className={`switch-toggle ${editPermissions.canViewReports ? 'checked' : ''}`}>
                        <div className="switch-toggle-thumb"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingMember(null)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingMember} style={{ padding: '8px 18px', fontWeight: 600 }}>
                  {updatingMember ? t('common.loading') : `💾 ${t('common.save')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Digital ID Card Modal */}
      {showIdCardModal && selectedMemberForCard && (
        <div className="modal-backdrop" onClick={() => setShowIdCardModal(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-h3" style={{ margin: 0 }}>🪪 {t('idCard.title')}</h3>
              <button className="btn-close" onClick={() => setShowIdCardModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '20px 10px' }}>
              {/* The Printable ID Card */}
              <div className="digital-id-card" id="printable-id-card">
                <div className="id-card-top">
                  <div className="id-om">॥ श्री गणेशाय नमः ॥</div>
                  <div className="id-mandal-name">{mandalName || 'श्री गणेश मित्र मंडळ'}</div>
                  <div className="id-tagline">{t('idCard.volunteerCard')}</div>
                </div>

                <div className="id-card-body">
                  <div className="id-avatar-circle">
                    {selectedMemberForCard.name?.[0]?.toUpperCase() || 'M'}
                  </div>

                  <div className="id-member-name">{selectedMemberForCard.name}</div>
                  <div className="id-member-role">
                    {selectedMemberForCard.role ? selectedMemberForCard.role.toUpperCase() : 'COMMITTEE MEMBER'}
                  </div>

                  <div className="id-info-grid">
                    <div className="id-info-item">
                      <span>Email:</span>
                      <strong>{selectedMemberForCard.email}</strong>
                    </div>
                    <div className="id-info-item">
                      <span>{t('idCard.validUpto')}</span>
                      <strong>2026 - 2027</strong>
                    </div>
                  </div>

                  <div className="id-card-footer">
                    <div className="id-seal">✓ OFFICIAL</div>
                    <div className="id-sign">
                      <div className="id-sign-line"></div>
                      <span>{t('idCard.authorizedSign')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowIdCardModal(false)}>
                {t('common.close')}
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                🖨️ {t('idCard.printCard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
