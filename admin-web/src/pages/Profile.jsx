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

  // Add member modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('volunteer');
  const [addingMember, setAddingMember] = useState(false);

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
        role: memberRole
      });
      setShowAddMember(false);
      setMemberName('');
      setMemberEmail('');
      await loadMembers();
      alert(t('profile.memberAdded'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>
                👥 {t('profile.teamMembers')}
              </h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowAddMember(true)}>
                {t('profile.addMember')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map((m) => (
                  <div
                    key={m._id || m.email}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle, #f8f9fa)',
                      borderRadius: 10
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {m.email} • <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>{m.role || 'Volunteer'}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openCardGenerator(m)}
                      title="Generate Official Member ID Card"
                    >
                      🪪 ID Card
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-backdrop" onClick={() => setShowAddMember(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-h3" style={{ margin: 0 }}>{t('profile.addTeamMember')}</h3>
              <button className="btn-close" onClick={() => setShowAddMember(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMember} className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('profile.memberFullName')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Shinde"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.memberEmailForOtp')}</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="member@gmail.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.role')}</label>
                <select
                  className="form-control"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="volunteer">{t('profile.roles.volunteer')}</option>
                  <option value="treasurer">{t('profile.roles.treasurer')}</option>
                  <option value="secretary">{t('profile.roles.secretary')}</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddMember(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingMember}>
                  {addingMember ? t('common.loading') : t('profile.addMemberToMandal')}
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
