import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const EXPENSE_CATEGORIES = [
  'Pooja & Aarti',
  'Decoration',
  'Sound & Lights',
  'Food & Prasad',
  'Visarjan / Procession',
  'Tent & Stage',
  'Security & Safety',
  'Misc / Other'
];

export default function Expenses() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Pooja & Aarti',
    amount: '',
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/expenses');
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      setError(t('expenses.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const canApprove = user?.role === 'president' || user?.role === 'treasurer' || user?.role === 'superadmin';

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/expenses', {
        ...form,
        title: form.title || form.category,
        amount: Number(form.amount)
      });
      setShowForm(false);
      setForm({
        title: '',
        category: 'Pooja & Aarti',
        amount: '',
        vendor: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const act = async (id, action, body = {}) => {
    try {
      await client.patch(`/expenses/${id}/${action}`, body);
      if (action === 'reject') {
        setRejectTarget(null);
        setRejectReason('');
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const totalSpent = expenses
    .filter((e) => e.status !== 'Rejected' && e.status !== 'rejected')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>
            💸 {t('expenses.title')}
          </h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            {t('expenses.recordOrApprove')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          {t('expenses.addExpense')}
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {/* Financial Overview Cards */}
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card stat-card stat-cash">
          <div className="stat-label">💸 {t('expenses.totalExpenses')}</div>
          <div className="stat-val" style={{ color: '#EF4444' }}>{inr(totalSpent)}</div>
          <div className="stat-sub">{expenses.length} {language === 'mr' ? 'नोंदवलेले व्हाउचर' : 'Recorded vouchers'}</div>
        </div>

        <div className="card stat-card stat-primary">
          <div className="stat-label">⏳ {t('approvals.title')}</div>
          <div className="stat-val" style={{ color: '#F59E0B' }}>
            {expenses.filter((e) => e.status === 'Submitted' || e.status === 'pending').length}
          </div>
          <div className="stat-sub">{language === 'mr' ? 'पडताळणी बाकी' : 'Awaiting verification'}</div>
        </div>

        <div className="card stat-card stat-upi">
          <div className="stat-label">✅ {t('common.approved')}</div>
          <div className="stat-val" style={{ color: '#10B981' }}>
            {expenses.filter((e) => e.status === 'Approved' || e.status === 'Paid').length}
          </div>
          <div className="stat-sub">{language === 'mr' ? 'मंजूर केलेले' : 'Cleared payments'}</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: 10 }}>{t('common.loading')}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <h3 className="text-h3">{t('expenses.noExpensesYet')}</h3>
            <p className="text-muted">{t('expenses.noExpensesSub')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('expenses.date')}</th>
                  <th>{t('expenses.expenseTitle')}</th>
                  <th>{t('expenses.category')}</th>
                  <th>{t('expenses.payeeVendor')}</th>
                  <th>{t('common.status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('expenses.expenseAmount')}</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((ex) => {
                  const d = ex.date || ex.createdAt ? new Date(ex.date || ex.createdAt) : new Date();
                  const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                  const isPending = ex.status === 'Submitted' || ex.status === 'pending';
                  const isApproved = ex.status === 'Approved' || ex.status === 'Paid';
                  const isRejected = ex.status === 'Rejected';

                  return (
                    <tr key={ex._id}>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>📅 {dateStr}</td>
                      <td>
                        <strong style={{ color: 'var(--text-main)', fontSize: 15 }}>
                          {ex.title || ex.category}
                        </strong>
                        {ex.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{ex.description}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-light">
                          {t(`expenses.categories.${ex.category}`) || ex.category}
                        </span>
                      </td>
                      <td>{ex.vendor || '-'}</td>
                      <td>
                        <span className={`badge ${isPending ? 'badge-warning' : isApproved ? 'badge-success' : 'badge-danger'}`}>
                          {isPending ? '⏳ ' + t('expenses.pendingApproval') : isApproved ? '✓ ' + t('expenses.approved') : '✕ ' + t('expenses.rejected')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#EF4444', fontSize: 16 }}>
                        -{inr(ex.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isPending && canApprove ? (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-sm btn-primary" style={{ background: '#10B981', borderColor: '#10B981' }} onClick={() => act(ex._id, 'approve')}>
                              ✓ Approve
                            </button>
                            <button className="btn btn-sm btn-outline btn-danger-outline" onClick={() => setRejectTarget(ex._id)}>
                              ✕ Reject
                            </button>
                          </div>
                        ) : isApproved && canApprove && ex.status !== 'Paid' ? (
                          <button className="btn btn-sm btn-outline" onClick={() => act(ex._id, 'mark-paid')}>
                            💵 Mark Paid
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-h2" style={{ margin: 0 }}>
                💸 {t('expenses.newExpense')}
              </h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('expenses.expenseTitle')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('expenses.titlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('expenses.category')}</label>
                  <select
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`expenses.categories.${cat}`) || cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('expenses.expenseAmount')}</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="₹ 1500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('expenses.payeeVendor')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('expenses.vendorPlaceholder')}
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('expenses.date')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('expenses.notesDescription')}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder={t('expenses.notesPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {canApprove ? t('expenses.saveExpense') : t('expenses.submitForApproval')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="modal-backdrop" onClick={() => setRejectTarget(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-h3" style={{ margin: 0, color: '#EF4444' }}>
                ✕ {language === 'mr' ? 'खर्च नाकारा' : 'Reject Expense'}
              </h3>
              <button className="btn-close" onClick={() => setRejectTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{language === 'mr' ? 'नाकारण्याचे कारण' : 'Reason for Rejection'}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('approvals.remarksPlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRejectTarget(null)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => act(rejectTarget, 'reject', { reason: rejectReason })}
                disabled={!rejectReason}
              >
                {language === 'mr' ? 'नकार द्या' : 'Reject Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
