import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

export default function Approvals() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'pending' | 'all'
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { user } = useAuth();
  const { t, language } = useLanguage();

  const canApprove = user?.role === 'president' || user?.role === 'treasurer' || user?.role === 'superadmin';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/expenses');
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm(language === 'mr' ? 'हा खर्च मंजूर करायचा आहे का?' : 'Are you sure you want to approve this expense?')) return;
    try {
      setActionLoading(id);
      await client.patch(`/expenses/${id}/approve`);
      await loadExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalItem) return;
    try {
      setActionLoading(rejectModalItem._id);
      await client.patch(`/expenses/${rejectModalItem._id}/reject`, { reason: rejectReason });
      setRejectModalItem(null);
      setRejectReason('');
      await loadExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingList = expenses.filter((e) => e.status === 'Submitted' || e.status === 'pending');
  const displayList = tab === 'pending' ? pendingList : expenses;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>
            ⏳ {t('approvals.title')} (प्रलंबित मंजुऱ्या)
          </h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {t('expenses.expensesAndApprovals')} & President Verification Center
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="tab-pill-group">
          <button
            className={`tab-pill ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            ⏳ {t('common.pending')} ({pendingList.length})
          </button>
          <button
            className={`tab-pill ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            📋 {t('common.all')} ({expenses.length})
          </button>
        </div>
      </div>

      {/* Approvals Overview */}
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card stat-card stat-primary">
          <div className="stat-label">⏳ {t('approvals.title')}</div>
          <div className="stat-val" style={{ color: '#F59E0B' }}>{pendingList.length}</div>
          <div className="stat-sub">Expenses awaiting review</div>
        </div>

        <div className="card stat-card stat-cash">
          <div className="stat-label">💰 {language === 'mr' ? 'प्रलंबित रक्कम' : 'Pending Amount'}</div>
          <div className="stat-val" style={{ color: '#EF4444' }}>
            {inr(pendingList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))}
          </div>
          <div className="stat-sub">Total amount requested</div>
        </div>

        <div className="card stat-card stat-upi">
          <div className="stat-label">🛡️ {language === 'mr' ? 'अधिकृत मंजुरीकर्ता' : 'Authorized Role'}</div>
          <div className="stat-val" style={{ fontSize: 20, color: '#10B981', textTransform: 'capitalize' }}>
            {user?.role || 'Member'}
          </div>
          <div className="stat-sub">{canApprove ? '✓ Can approve & reject' : '• Read-only access'}</div>
        </div>
      </div>

      {/* List / Cards */}
      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: 12 }}>{t('common.loading')}</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 className="text-h2">{t('approvals.allCaughtUp')}</h3>
            <p className="text-muted">{t('approvals.noPendingSub')}</p>
          </div>
        ) : (
          <div className="grid-1" style={{ gap: 16 }}>
            {displayList.map((item) => {
              const d = item.date || item.createdAt ? new Date(item.date || item.createdAt) : new Date();
              const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
              const isPending = item.status === 'Submitted' || item.status === 'pending';
              const isApproved = item.status === 'Approved' || item.status === 'approved' || item.status === 'Paid';
              const isRejected = item.status === 'Rejected' || item.status === 'rejected';

              return (
                <div key={item._id} className="card approval-card" style={{ borderLeft: isPending ? '4px solid #F59E0B' : isApproved ? '4px solid #10B981' : '4px solid #EF4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div className="approval-icon-box">
                        {isPending ? '⏳' : isApproved ? '✅' : '❌'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 className="text-h3" style={{ margin: 0 }}>{item.title || item.category}</h3>
                          <span className={`badge ${isPending ? 'badge-warning' : isApproved ? 'badge-success' : 'badge-danger'}`}>
                            {item.status || 'Pending'}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                          📅 {dateStr} • 🏷️ {item.category || 'General'} • 👤 {t('expenses.payee', { vendor: item.vendor || item.payee || 'Mandal Vendor' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444' }}>
                        {inr(item.amount)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Payment: {item.paymentMode || 'Cash'}
                      </div>
                    </div>
                  </div>

                  {/* Description / Note */}
                  {item.description && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', borderRadius: 8, fontSize: 13.5, fontStyle: 'italic', color: 'var(--text-main)' }}>
                      "{item.description}"
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {item.createdBy?.name ? `Submitted by: ${item.createdBy.name}` : ''}
                    </div>

                    {isPending && canApprove && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-outline btn-sm btn-danger-outline"
                          onClick={() => { setRejectModalItem(item); setRejectReason(''); }}
                          disabled={actionLoading === item._id}
                        >
                          ✕ {t('common.rejected')}
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: '#10B981', borderColor: '#10B981' }}
                          onClick={() => handleApprove(item._id)}
                          disabled={actionLoading === item._id}
                        >
                          {actionLoading === item._id ? t('common.loading') : `✓ ${t('expenses.approveBtn')}`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectModalItem && (
        <div className="modal-backdrop" onClick={() => setRejectModalItem(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-h3" style={{ margin: 0, color: '#EF4444' }}>
                ✕ {language === 'mr' ? 'खर्च नाकारण्याचे कारण' : 'Reject Expense'}
              </h3>
              <button className="btn-close" onClick={() => setRejectModalItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ fontSize: 14 }}>
                {rejectModalItem.title} - <strong>{inr(rejectModalItem.amount)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">{language === 'mr' ? 'कारण / टीप' : 'Reason / Remarks'}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={t('approvals.remarksPlaceholder')}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRejectModalItem(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleReject}>
                {language === 'mr' ? 'नकार निश्चित करा' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
