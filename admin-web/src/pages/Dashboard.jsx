import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, mandal } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';
  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, donRes, expRes] = await Promise.all([
        client.get('/dashboard/summary').catch(() => ({ data: {} })),
        client.get('/donations').catch(() => ({ data: [] })),
        client.get('/expenses').catch(() => ({ data: [] }))
      ]);

      setSummary(sumRes.data || {});
      if (Array.isArray(donRes.data)) {
        setRecentDonations(donRes.data.slice(0, 5));
      }
      if (Array.isArray(expRes.data)) {
        const pending = expRes.data.filter((e) => e.status === 'Submitted' || e.status === 'pending');
        setPendingExpenses(pending);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInflow = summary?.totalInflow || recentDonations.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const totalOutflow = summary?.totalOutflow || 0;
  const netBalance = totalInflow - totalOutflow;

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
        <div className="festival-banner-actions">
          <button className="btn btn-primary" onClick={() => navigate('/collections')} style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            ✨ {t('collection.recordNewDonation')}
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

        <div className="card stat-card" style={{ borderTop: '3px solid #EF4444' }} onClick={() => navigate('/expenses')} style2={{ cursor: 'pointer' }}>
          <div className="stat-label">💸 {t('common.outflow')}</div>
          <div className="stat-val" style={{ color: '#EF4444' }}>{inr(totalOutflow)}</div>
          <div className="stat-sub">{language === 'mr' ? 'मंजूर खर्च' : 'Approved expenditures'}</div>
        </div>

        <div className="card stat-card stat-upi" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">⚖️ {language === 'mr' ? 'शिल्लक' : 'Net Balance'}</div>
          <div className="stat-val" style={{ color: '#6366F1' }}>{inr(netBalance)}</div>
          <div className="stat-sub">{language === 'mr' ? 'उपलब्ध निधी' : 'Available funds'}</div>
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

          <div className="card tool-card" onClick={() => navigate('/approvals')}>
            <div className="tool-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>⏳</div>
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

        {/* Pending Approvals Widget */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>⏳ {t('approvals.title')}</h3>
            <Link to="/approvals" className="text-primary" style={{ fontSize: 13, fontWeight: 700 }}>
              {language === 'mr' ? 'तपासा →' : 'Review →'}
            </Link>
          </div>

          {pendingExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>{t('approvals.allCaughtUp')}</div>
              <p className="text-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>{t('approvals.noPendingSub')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingExpenses.slice(0, 4).map((e) => (
                <div key={e._id} style={{
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
          )}
        </div>
      </div>
    </Layout>
  );
}
