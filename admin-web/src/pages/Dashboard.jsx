import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [activityTab, setActivityTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { user, mandal } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';
  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [sumRes, donRes, expRes] = await Promise.all([
        client.get('/dashboard/summary').catch(() => ({ data: {} })),
        client.get('/donations').catch(() => ({ data: [] })),
        client.get('/expenses').catch(() => ({ data: [] }))
      ]);

      const sumData = sumRes.data || {};
      setSummary(sumData);

      if (Array.isArray(donRes.data)) {
        setAllDonations(donRes.data);
        setRecentDonations(donRes.data.slice(0, 5));
      }

      if (Array.isArray(expRes.data)) {
        setAllExpenses(expRes.data);
        const pending = expRes.data.filter((e) => e.status === 'Submitted' || e.status === 'pending');
        setPendingExpenses(pending);

        const approvedOrPaid = expRes.data.filter((e) =>
          ['Approved', 'Paid', 'Reconciled', 'approved', 'paid'].includes(e.status)
        );
        setRecentExpenses(approvedOrPaid.slice(0, 5));

        // If there are pending approvals, default to that tab so admin notices it
        if (pending.length > 0) {
          setActivityTab('pending');
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Resilient calculation: prefer backend summary, fallback to sum of actual records
  const calculatedInflow = allDonations.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const calculatedOutflow = allExpenses
    .filter((e) => ['Approved', 'Paid', 'Reconciled', 'approved', 'paid'].includes(e.status))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const totalInflow = summary?.totalCollections !== undefined
    ? Number(summary.totalCollections)
    : (summary?.totalInflow !== undefined
      ? Number(summary.totalInflow)
      : (calculatedInflow > 0 ? calculatedInflow : recentDonations.reduce((s, d) => s + (Number(d.amount) || 0), 0)));

  const totalOutflow = (summary?.totalExpenses !== undefined && Number(summary.totalExpenses) > 0)
    ? Number(summary.totalExpenses)
    : (summary?.totalOutflow !== undefined && Number(summary.totalOutflow) > 0
      ? Number(summary.totalOutflow)
      : calculatedOutflow);

  const netBalance = totalInflow - totalOutflow;

  const approvedCount = allExpenses.filter((e) =>
    ['Approved', 'Paid', 'Reconciled', 'approved', 'paid'].includes(e.status)
  ).length;

  return (
    <Layout>
      {/* Top Welcome Banner */}
      <div className="festival-banner">
        <div className="festival-banner-content">
          <div className="badge badge-festive">
            {isPresident ? t('dashboard.presidentWorkspace') : t('dashboard.committeeMember')}
          </div>
          <h1 className="banner-greeting">
            {t('dashboard.greeting', { name: user?.name?.split(' ')[0] || 'Member' })}
          </h1>
          <p className="banner-sub">
            🚩 <strong>{mandal?.name || 'श्री गणेश मित्र मंडळ'}</strong> • {t('dashboard.liveMandalStats')}
          </p>
        </div>
        <div className="festival-banner-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/collections')} style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            ✨ {t('collection.recordNewDonation')}
          </button>
          <button
            className="btn"
            onClick={() => navigate('/expenses')}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(8px)',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}
          >
            💸 {language === 'mr' ? 'खर्च जोडा' : 'Add Expense'}
          </button>
          <button
            className="btn"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title={language === 'mr' ? 'रीफ्रेश करा' : 'Refresh Data'}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>
              🔄
            </span>
          </button>
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {/* ── Key Financial Overview Grid ── */}
      <div className="grid-4" style={{ marginTop: 24 }}>
        <div className="card stat-card stat-cash" onClick={() => navigate('/collections')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">💰 {t('common.inflow')}</div>
          <div className="stat-val" style={{ color: '#10B981' }}>{inr(totalInflow)}</div>
          <div className="stat-sub">{language === 'mr' ? 'एकूण जमा नोंदी' : 'Total collections recorded'}</div>
        </div>

        <div className="card stat-card" style={{ borderTop: '3px solid #EF4444', cursor: 'pointer' }} onClick={() => navigate('/expenses')}>
          <div className="stat-label">💸 {t('common.outflow')}</div>
          <div className="stat-val" style={{ color: '#EF4444' }}>{inr(totalOutflow)}</div>
          <div className="stat-sub">
            {language === 'mr'
              ? `${approvedCount} मंजूर खर्च`
              : `${approvedCount} approved expenditure${approvedCount === 1 ? '' : 's'}`}
          </div>
        </div>

        <div className="card stat-card stat-upi" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">⚖️ {language === 'mr' ? 'शिल्लक' : 'Net Balance'}</div>
          <div className="stat-val" style={{ color: netBalance >= 0 ? '#6366F1' : '#EF4444' }}>{inr(netBalance)}</div>
          <div className="stat-sub">
            {language === 'mr'
              ? (netBalance >= 0 ? 'उपलब्ध निधी' : 'तुटवडा / Deficit')
              : (netBalance >= 0 ? 'Available funds' : 'Deficit')}
          </div>
        </div>

        <div className="card stat-card" onClick={() => navigate('/approvals')} style={{ cursor: 'pointer', borderTop: '3px solid #F59E0B' }}>
          <div className="stat-label">⏳ {t('dashboard.pendingApprovals')}</div>
          <div className="stat-val" style={{ color: '#F59E0B' }}>{pendingExpenses.length}</div>
          <div className="stat-sub">{pendingExpenses.length > 0 ? (language === 'mr' ? 'कृती आवश्यक →' : 'Action required →') : (language === 'mr' ? 'सर्व ठीक ✓' : 'All clear ✓')}</div>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div style={{ marginTop: 28 }}>
        <div className="section-header">
          <h3 className="text-h3" style={{ margin: 0 }}>⚡ {t('dashboard.quickActions')}</h3>
          <span className="text-muted" style={{ fontSize: 13 }}>{t('dashboard.frequentlyUsedTools')}</span>
        </div>

        <div className="quick-tools-grid" style={{ marginTop: 14 }}>
          <div className="card tool-card" onClick={() => navigate('/collections')}>
            <div className="tool-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#F97316' }}>🚩</div>
            <div className="tool-body">
              <div className="tool-title">{t('dashboard.newCollection')}</div>
              <div className="tool-desc">{t('dashboard.newCollectionSub')}</div>
            </div>
          </div>

          <div className="card tool-card" onClick={() => navigate('/collections?tab=receipts')}>
            <div className="tool-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>🧾</div>
            <div className="tool-body">
              <div className="tool-title">{t('dashboard.viewShareReceipts')}</div>
              <div className="tool-desc">{t('dashboard.viewShareReceiptsSub')}</div>
            </div>
          </div>

          <div className="card tool-card" onClick={() => navigate('/chat')}>
            <div className="tool-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>💬</div>
            <div className="tool-body">
              <div className="tool-title">{t('chat.title')}</div>
              <div className="tool-desc">{t('chat.groupSubtitle')}</div>
            </div>
          </div>

          <div className="card tool-card" onClick={() => navigate('/expenses')}>
            <div className="tool-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>💸</div>
            <div className="tool-body">
              <div className="tool-title">{t('dashboard.expensesApprovals')}</div>
              <div className="tool-desc">{t('dashboard.expensesApprovalsSub')}</div>
            </div>
          </div>

          <div className="card tool-card" onClick={() => navigate('/profile')}>
            <div className="tool-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>🪪</div>
            <div className="tool-body">
              <div className="tool-title">{t('idCard.title')}</div>
              <div className="tool-desc">{t('idCard.subtitle')}</div>
            </div>
          </div>

          <div className="card tool-card" onClick={() => navigate('/subscription')}>
            <div className="tool-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}>💎</div>
            <div className="tool-body">
              <div className="tool-title">{t('subscription.title')}</div>
              <div className="tool-desc">{t('subscription.managePlan')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Vargani & Activities ── */}
      <div className="grid-2" style={{ marginTop: 28 }}>
        {/* Recent Collections */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>🚩 {language === 'mr' ? 'अलीकडील वर्गणी' : 'Recent Collections'}</h3>
            <Link to="/collections" className="text-primary" style={{ fontSize: 13, fontWeight: 700 }}>
              {language === 'mr' ? 'सर्व पहा →' : 'View All →'}
            </Link>
          </div>

          {recentDonations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28 }} className="text-muted">
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🧾</div>
              {t('collections.noCollectionsYet')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentDonations.map((d) => (
                <div key={d._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 10,
                  transition: 'all 0.15s',
                  cursor: 'pointer'
                }}
                  onClick={() => navigate('/collections')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: 'rgba(249, 115, 22, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: 'var(--primary)', flexShrink: 0
                    }}>
                      {(d.contributor || d.donorName || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 13.5 }}>
                        {d.contributor || d.donorName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {d.title || d.purpose || 'वर्गणी'} • {d.paymentMode || 'Cash'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                    +{inr(d.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses & Approvals Widget */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg-subtle)', padding: '3px', borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setActivityTab('expenses')}
                style={{
                  background: activityTab === 'expenses' ? 'var(--card-bg, #fff)' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activityTab === 'expenses' ? '#EF4444' : 'var(--text-muted)',
                  boxShadow: activityTab === 'expenses' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                💸 {language === 'mr' ? 'खर्च' : 'Expenses'}
                {recentExpenses.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1px 6px', borderRadius: 10 }}>
                    {recentExpenses.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('pending')}
                style={{
                  background: activityTab === 'pending' ? 'var(--card-bg, #fff)' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activityTab === 'pending' ? '#D97706' : 'var(--text-muted)',
                  boxShadow: activityTab === 'pending' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                ⏳ {language === 'mr' ? 'मंजूरी बाकी' : 'Approvals'}
                {pendingExpenses.length > 0 && (
                  <span style={{ marginLeft: 6, background: '#F59E0B', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
                    {pendingExpenses.length}
                  </span>
                )}
              </button>
            </div>
            {activityTab === 'expenses' ? (
              <Link to="/expenses" className="text-primary" style={{ fontSize: 13, fontWeight: 700 }}>
                {language === 'mr' ? 'सर्व खर्च →' : 'View All →'}
              </Link>
            ) : (
              <Link to="/approvals" className="text-primary" style={{ fontSize: 13, fontWeight: 700 }}>
                {language === 'mr' ? 'तपासा →' : 'Review →'}
              </Link>
            )}
          </div>

          {activityTab === 'expenses' ? (
            recentExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 28 }} className="text-muted">
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>💸</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{language === 'mr' ? 'कोणताही मंजूर खर्च आढळला नाही' : 'No recorded expenses yet'}</div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/expenses')}
                  style={{ marginTop: 12, fontSize: 12, padding: '6px 14px' }}
                >
                  + {language === 'mr' ? 'खर्च जोडा' : 'Add Expense'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentExpenses.map((e) => (
                  <div
                    key={e._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 10,
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                      borderLeft: '3px solid #EF4444'
                    }}
                    onClick={() => navigate('/expenses')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#EF4444', flexShrink: 0
                      }}>
                        💸
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 13.5 }}>
                          {e.title || e.category}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {e.category} {e.vendor ? `• ${e.vendor}` : ''} • <span style={{ color: '#10B981', fontWeight: 600 }}>✓ {e.status}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#EF4444', fontSize: 14 }}>
                      -{inr(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            pendingExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>{t('approvals.allCaughtUp')}</div>
                <p className="text-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>{t('approvals.noPendingSub')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingExpenses.slice(0, 5).map((e) => (
                  <div
                    key={e._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(245, 158, 11, 0.06)',
                      borderRadius: 10,
                      borderLeft: '3px solid #F59E0B',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/approvals')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#92400E', fontSize: 13.5 }}>{e.title || e.category}</div>
                      <div style={{ fontSize: 11.5, color: '#B45309' }}>{e.vendor || 'Vendor'} • ⏳ Pending</div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#EF4444', fontSize: 14 }}>
                      {inr(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
