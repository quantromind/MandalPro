import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import ReceiptModal from '../components/ReceiptModal';

const QUICK_AMOUNTS = [101, 251, 501, 1001, 2100, 5100];
const MODES = [
  { key: 'cash', labelEn: 'Cash', labelMr: 'रोख (Cash)', icon: '💵' },
  { key: 'upi', labelEn: 'UPI / QR', labelMr: 'युपीआय (UPI)', icon: '📱' },
  { key: 'card', labelEn: 'Card / Cheque', labelMr: 'कार्ड / चेक', icon: '💳' },
  { key: 'netbanking', labelEn: 'Net Banking', labelMr: 'नेट बँकिंग', icon: '🏦' }
];

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Tab state - "records" or "receipts"
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'records';

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [contributor, setContributor] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Donation');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const { mandal, user } = useAuth();
  const { t, language } = useLanguage();

  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await client.get('/donations');
      if (Array.isArray(data)) {
        setCollections(data);
      }
    } catch (err) {
      setError(t('collections.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const switchTab = (tab) => {
    setSearchParams({ tab });
  };

  const openAddModal = () => {
    setEditingCollection(null);
    setContributor('');
    setTitle('');
    setAmount('');
    setCategory('Donation');
    setPaymentMode('cash');
    setDate(new Date().toISOString().split('T')[0]);
    setMobile('');
    setDescription('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (col) => {
    setEditingCollection(col);
    setContributor(col.contributor || col.donorName || '');
    setTitle(col.title || col.purpose || '');
    setAmount(String(col.amount || ''));
    setCategory(col.category || 'Donation');
    setPaymentMode(col.paymentMode || 'cash');
    setDate(col.date ? new Date(col.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setMobile(col.mobile || col.donorMobile || '');
    setDescription(col.description || '');
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!contributor.trim()) errs.contributor = t('collection.donorNameRequired');
    if (!amount || Number(amount) <= 0) errs.amount = t('collection.amountGreaterThanZero');
    if (mobile.trim() && !/^\d{10}$/.test(mobile.trim().replace(/[^0-9]/g, ''))) {
      errs.mobile = t('collection.mobileExact10');
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        contributor: contributor.trim(),
        donorName: contributor.trim(),
        donorMobile: mobile.trim(),
        title: title.trim() || 'Ganpati Vargani',
        purpose: title.trim() || 'Ganpati Vargani',
        amount: Number(amount),
        category: category || 'Donation',
        paymentMode,
        date,
        mobile: mobile.trim(),
        description: description.trim()
      };

      let savedRecord;
      if (editingCollection) {
        const { data } = await client.patch(`/donations/${editingCollection._id}`, payload);
        savedRecord = data;
      } else {
        const { data } = await client.post('/donations', payload);
        savedRecord = data;
      }

      setShowModal(false);
      await load();

      // Show receipt popup on creation
      if (!editingCollection && savedRecord) {
        setReceiptToShow(savedRecord);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('collections.deleteConfirm'))) return;
    try {
      await client.delete(`/donations/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete record');
    }
  };

  // Filtered list
  const filtered = collections.filter((c) => {
    const name = (c.contributor || c.donorName || '').toLowerCase();
    const purp = (c.title || c.purpose || '').toLowerCase();
    const mob = (c.mobile || c.donorMobile || '');
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || purp.includes(q) || mob.includes(q);
    const matchesMode = filterMode === 'all' || (c.paymentMode || 'cash').toLowerCase() === filterMode;
    return matchesSearch && matchesMode;
  });

  const totalAmount = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const cashTotal = collections.filter(c => (c.paymentMode || 'cash').toLowerCase() === 'cash').reduce((a, c) => a + (Number(c.amount) || 0), 0);
  const upiTotal = collections.filter(c => (c.paymentMode || '').toLowerCase() === 'upi').reduce((a, c) => a + (Number(c.amount) || 0), 0);

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>
            🚩 {t('collections.title')}
          </h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            {language === 'mr' ? 'वर्गणी नोंदवा, पावत्या तयार करा आणि WhatsApp वर शेअर करा' : 'Record collections, generate receipts & share via WhatsApp'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✨</span> {t('collection.recordNewDonation')}
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card stat-card stat-primary">
          <div className="stat-label">💰 {t('collections.totalCollections')}</div>
          <div className="stat-val">{inr(totalAmount)}</div>
          <div className="stat-sub">{collections.length} {language === 'mr' ? 'एकूण नोंदी' : 'total records'}</div>
        </div>

        <div className="card stat-card stat-cash">
          <div className="stat-label">💵 {language === 'mr' ? 'रोख जमा' : 'Cash Inflow'}</div>
          <div className="stat-val" style={{ color: '#10B981' }}>{inr(cashTotal)}</div>
          <div className="stat-sub">{language === 'mr' ? 'प्रत्यक्ष संकलन' : 'Hand-to-hand collections'}</div>
        </div>

        <div className="card stat-card stat-upi">
          <div className="stat-label">📱 {language === 'mr' ? 'ऑनलाइन / UPI' : 'Online / UPI'}</div>
          <div className="stat-val" style={{ color: '#6366F1' }}>{inr(upiTotal)}</div>
          <div className="stat-sub">{language === 'mr' ? 'QR व बँक ट्रान्सफर' : 'QR & Bank transfers'}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginTop: 24 }}>
        <div className="page-tabs">
          <button
            className={`page-tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => switchTab('records')}
          >
            📋 {language === 'mr' ? 'सर्व नोंदी' : 'All Records'}
            <span className="tab-count">{filtered.length}</span>
          </button>
          <button
            className={`page-tab ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => switchTab('receipts')}
          >
            🧾 {language === 'mr' ? 'पावत्या' : 'Receipts'}
            <span className="tab-count">{collections.length}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginTop: 4, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
            <div className="search-box" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder={language === 'mr' ? '🔍 नाव, मोबाइल, हेतू शोधा...' : '🔍 Search name, mobile, purpose...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
              />
            </div>
            <select
              className="form-control"
              style={{ width: 170 }}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="all">🌐 {t('common.all')} Modes</option>
              <option value="cash">💵 Cash (रोख)</option>
              <option value="upi">📱 UPI / QR</option>
              <option value="card">💳 Card / Cheque</option>
              <option value="netbanking">🏦 Net Banking</option>
            </select>
          </div>
          <div className="filter-chips">
            <span className="badge badge-info">{filtered.length} {language === 'mr' ? 'नोंदी' : 'Records found'}</span>
          </div>
        </div>
      </div>

      {/* ═══ TAB: All Records (Table View) ═══ */}
      {activeTab === 'records' && (
        <div className="card" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner"></div>
              <p className="text-muted" style={{ marginTop: 14 }}>{t('common.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.6 }}>🧾</div>
              <h3 className="text-h3" style={{ marginBottom: 6 }}>{t('collections.noCollectionsYet')}</h3>
              <p className="text-muted" style={{ marginBottom: 20 }}>{t('collections.noCollectionsSub')}</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                ✨ {t('collection.recordNewDonation')}
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t('receipts.date')}</th>
                    <th>{t('receipts.donor')}</th>
                    <th>{t('receipts.mobile')}</th>
                    <th>{t('receipts.purpose')}</th>
                    <th>{t('receipts.paymentMode')}</th>
                    <th style={{ textAlign: 'right' }}>{t('receipts.amount')}</th>
                    <th style={{ textAlign: 'center' }}>{language === 'mr' ? 'क्रिया' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const d = item.date || item.createdAt ? new Date(item.date || item.createdAt) : new Date();
                    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    const pMode = (item.paymentMode || 'cash').toLowerCase();

                    return (
                      <tr key={item._id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>📅 {dateStr}</td>
                        <td>
                          <strong style={{ color: 'var(--text-main)', fontSize: 14 }}>
                            {item.contributor || item.donorName}
                          </strong>
                        </td>
                        <td>
                          {item.mobile || item.donorMobile ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>+91 {item.mobile || item.donorMobile}</span>
                          ) : (
                            <span style={{ color: 'var(--text-disabled)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-light">{item.title || item.purpose || 'वर्गणी'}</span>
                        </td>
                        <td>
                          <span className={`badge ${pMode === 'cash' ? 'badge-cash' : 'badge-upi'}`}>
                            {pMode === 'cash' ? '💵 Cash' : pMode === 'upi' ? '📱 UPI' : pMode === 'card' ? '💳 Card' : '🏦 Bank'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                          {inr(item.amount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-sm btn-outline"
                              title="View / Print Digital Receipt"
                              onClick={() => setReceiptToShow(item)}
                            >
                              🧾 Receipt
                            </button>
                            {isPresident && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline"
                                  title={t('common.edit')}
                                  onClick={() => openEditModal(item)}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-sm btn-danger-outline"
                                  title={t('common.delete')}
                                  onClick={() => handleDelete(item._id)}
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Receipts Gallery View ═══ */}
      {activeTab === 'receipts' && (
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner"></div>
              <p className="text-muted" style={{ marginTop: 14 }}>{t('common.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🧾</div>
              <h3 className="text-h3">{t('receipts.noReceiptsYet') || 'No receipts yet'}</h3>
              <p className="text-muted">{t('receipts.noReceiptsSub') || 'Record a collection to generate your first receipt'}</p>
            </div>
          ) : (
            <div className="grid-1" style={{ gap: 10 }}>
              {filtered.map((r) => {
                const d = r.date || r.createdAt ? new Date(r.date || r.createdAt) : new Date();
                const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                const rNo = r.receiptNumber || r._id?.slice(-6)?.toUpperCase();
                const pMode = (r.paymentMode || 'cash').toLowerCase();

                return (
                  <div key={r._id} className="card receipt-row-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div className="receipt-icon-badge">🧾</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                          {r.contributor || r.donorName}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12.5, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                          <span>#{rNo}</span>
                          <span>📅 {dateStr}</span>
                          <span>{pMode === 'cash' ? '💵 Cash' : '📱 UPI'}</span>
                          {(r.mobile || r.donorMobile) && <span>📞 +91 {r.mobile || r.donorMobile}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>
                        {inr(r.amount)}
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setReceiptToShow(r)}
                      >
                        📲 {language === 'mr' ? 'शेअर' : 'Share'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Collection Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-h2" style={{ margin: 0 }}>
                {editingCollection ? `✏️ ${t('collections.editCollection')}` : `✨ ${t('collection.recordNewDonation')}`}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              {/* Quick Amount Selector */}
              <div className="form-group">
                <label className="form-label">{t('collection.quickSelect')}</label>
                <div className="quick-amount-chips">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`chip-btn ${Number(amount) === amt ? 'chip-active' : ''}`}
                      onClick={() => setAmount(String(amt))}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="form-group">
                <label className="form-label">{t('collection.donationAmount')}</label>
                <input
                  type="number"
                  className={`form-control form-control-lg ${formErrors.amount ? 'is-invalid' : ''}`}
                  placeholder="₹ 501"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                {formErrors.amount && <div className="form-error">{formErrors.amount}</div>}
              </div>

              {/* Contributor Name */}
              <div className="form-group">
                <label className="form-label">{t('collection.donorFullName')}</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.contributor ? 'is-invalid' : ''}`}
                  placeholder={t('collection.donorPlaceholder')}
                  value={contributor}
                  onChange={(e) => setContributor(e.target.value)}
                />
                {formErrors.contributor && <div className="form-error">{formErrors.contributor}</div>}
              </div>

              {/* WhatsApp Mobile */}
              <div className="form-group">
                <label className="form-label">{t('collection.whatsappMobile')}</label>
                <div className="input-group">
                  <span className="input-prefix">+91</span>
                  <input
                    type="tel"
                    className={`form-control ${formErrors.mobile ? 'is-invalid' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                {formErrors.mobile && <div className="form-error">{formErrors.mobile}</div>}
              </div>

              {/* Purpose & Date Grid */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('collection.purposeCategory')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('collection.purposePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('receipts.date')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="form-group">
                <label className="form-label">{t('collection.paymentMode')}</label>
                <div className="payment-modes-grid">
                  {MODES.map((m) => (
                    <div
                      key={m.key}
                      className={`payment-mode-card ${paymentMode === m.key ? 'mode-active' : ''}`}
                      onClick={() => setPaymentMode(m.key)}
                    >
                      <span className="mode-icon">{m.icon}</span>
                      <span className="mode-name">{language === 'mr' ? m.labelMr : m.labelEn}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">{t('collections.description')}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder={t('collections.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ padding: '16px 0 0', margin: 0, border: 'none' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('common.loading') : (editingCollection ? t('common.save') : t('collection.generateReceipt'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Receipt Modal with WhatsApp Sharing */}
      {receiptToShow && (
        <ReceiptModal
          visible={!!receiptToShow}
          receipt={receiptToShow}
          mandal={mandal}
          collectorName={user?.name}
          onClose={() => setReceiptToShow(null)}
        />
      )}
    </Layout>
  );
}
