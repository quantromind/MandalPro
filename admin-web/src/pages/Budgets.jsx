import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';

const STANDARD_CATEGORIES = [
  { id: 'Pooja & Aarti', labelMr: 'पूजा व आरती (Pooja & Aarti)', icon: '🪔' },
  { id: 'Decoration', labelMr: 'मंडप व डेकोरेशन (Decoration)', icon: '🌸' },
  { id: 'Sound & Lights', labelMr: 'साउंड व लायटिंग (Sound & Lights)', icon: '🔊' },
  { id: 'Food & Prasad', labelMr: 'भोजन व प्रसाद (Food & Prasad)', icon: '🍱' },
  { id: 'Visarjan / Procession', labelMr: 'विसर्जन व मिरवणूक (Visarjan / Procession)', icon: '🥁' },
  { id: 'Tent & Stage', labelMr: 'स्टेज व आसनव्यवस्था (Tent & Stage)', icon: '🎪' },
  { id: 'Security & Safety', labelMr: 'सुरक्षा व सीसीटीव्ही (Security & Safety)', icon: '🛡️' },
  { id: 'Misc / Other', labelMr: 'इतर किरकोळ खर्च (Misc / Other)', icon: '📦' }
];

const riskConfig = {
  'on-track': {
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    labelMr: 'सुरक्षित (On Track)',
    labelEn: 'On Track'
  },
  'at-risk': {
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    labelMr: 'सावधान (At Risk)',
    labelEn: 'At Risk'
  },
  'over': {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    labelMr: 'मर्यादा संपली (Over Budget)',
    labelEn: 'Over Budget'
  }
};

const Budgets = () => {
  const { language } = useLanguage();
  const isMr = language === 'mr';

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Pooja & Aarti', customCategory: '', allocatedAmount: '' });
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/budgets')
      .then((res) => setBudgets(res.data || []))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleDelete = async (id, category) => {
    const confirmMsg = isMr
      ? `तुम्हाला '${category}' चे बजेट खरोखर हटवायचे आहे का?`
      : `Are you sure you want to delete the budget for '${category}'?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(id);
      await api.delete(`/budgets/${id}`);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || (isMr ? 'बजेट हटवण्यात त्रुटी आली' : 'Failed to delete budget'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (b) => {
    const standardMatch = STANDARD_CATEGORIES.find((c) => c.id === b.category);
    if (standardMatch) {
      setForm({ category: b.category, customCategory: '', allocatedAmount: b.allocatedAmount });
    } else {
      setForm({ category: 'CUSTOM', customCategory: b.category, allocatedAmount: b.allocatedAmount });
    }
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const finalCategory = form.category === 'CUSTOM' ? form.customCategory.trim() : form.category;
      if (!finalCategory) {
        setError(isMr ? 'कृपया वर्गवारी निवडा' : 'Please select a category');
        return;
      }

      await api.post('/budgets', {
        category: finalCategory,
        allocatedAmount: Number(form.allocatedAmount)
      });

      setShowForm(false);
      setForm({ category: 'Pooja & Aarti', customCategory: '', allocatedAmount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || (isMr ? 'बजेट सेव्ह करताना त्रुटी आली' : 'Failed to save budget'));
    }
  };

  // Aggregated totals
  const totalAllocated = budgets.reduce((acc, b) => acc + (Number(b.allocatedAmount) || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.spent) || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallPct = totalAllocated > 0 ? Math.min(Math.round((totalSpent / totalAllocated) * 100), 100) : 0;

  return (
    <Layout>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '10px 16px 40px' }}>
        
        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <h1 className="text-h1" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
              📈 {isMr ? 'अंदाजपत्रक व खर्च नियोजन' : 'Budgets & Expense Forecast'}
            </h1>
            <p className="text-sub" style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
              {isMr ? 'कामाच्या वर्गवारीनुसार बजेट मर्यादा ठरवा आणि प्रत्यक्ष खर्चाचा लाइव्ह मागोवा घ्या' : 'Set category-wise spend limits and track live expense burn'}
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ padding: '10px 18px', fontSize: 14, fontWeight: 700, borderRadius: 10 }}
          >
            + {isMr ? 'नवीन वर्गवारी बजेट जोडा' : 'Set Category Budget'}
          </button>
        </div>

        {/* ── Top Overview Banner ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 28,
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              {isMr ? 'एकूण मंजूर बजेट' : 'Total Allocated Budget'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{inr(totalAllocated)}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              {isMr ? 'प्रत्यक्ष खर्च (Expenses)' : 'Total Spent So Far'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#DC2626' }}>{inr(totalSpent)}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              {isMr ? 'शिल्लक निधी (Remaining)' : 'Remaining Balance'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: totalRemaining >= 0 ? '#059669' : '#DC2626' }}>
              {inr(totalRemaining)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              {isMr ? 'बजेट वापर' : 'Budget Utilized'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{overallPct}%</div>
              <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${overallPct}%`,
                    background: overallPct > 90 ? '#DC2626' : overallPct > 70 ? '#D97706' : '#059669',
                    borderRadius: 99
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Cards Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20
          }}
        >
          {budgets.map((b) => {
            const risk = riskConfig[b.risk] || riskConfig['on-track'];
            const pct = Math.min(Math.round((b.pctUsed || 0) * 100), 100);
            const iconObj = STANDARD_CATEGORIES.find(c => b.category?.toLowerCase().includes(c.id.toLowerCase().split(' ')[0])) || { icon: '🏷️' };

            return (
              <div
                className="card"
                key={b._id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '22px 20px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{iconObj.icon}</span>
                      <div>
                        <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>{b.category}</strong>
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          {isMr ? 'मंजूर मर्यादा:' : 'Allocated:'} {inr(b.allocatedAmount)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          background: risk.bg,
                          color: risk.color,
                          border: `1px solid ${risk.border}`,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 99
                        }}
                      >
                        {isMr ? risk.labelMr : risk.labelEn}
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(b)}
                        title={isMr ? 'बजेट संपादित करा' : 'Edit Budget'}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          padding: '5px 7px',
                          borderRadius: 8,
                          color: '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.background = '#EFF6FF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(b._id, b.category)}
                        disabled={deletingId === b._id}
                        title={isMr ? 'बजेट हटवा' : 'Delete Budget'}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          cursor: deletingId === b._id ? 'not-allowed' : 'pointer',
                          padding: '5px 7px',
                          borderRadius: 8,
                          color: '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                          opacity: deletingId === b._id ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => { if (deletingId !== b._id) { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.background = '#FEF2F2'; } }}
                        onMouseLeave={(e) => { if (deletingId !== b._id) { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; } }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Spend vs Budget Details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#334155' }}>
                    <span>{isMr ? 'झालेला खर्च:' : 'Spent:'} <strong>{inr(b.spent)}</strong></span>
                    <span>{pct}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: risk.color,
                        borderRadius: 99,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid #F1F5F9',
                    fontSize: 13
                  }}
                >
                  <span style={{ color: '#64748B' }}>{isMr ? 'शिल्लक बजेट:' : 'Remaining:'}</span>
                  <strong style={{ color: b.remaining >= 0 ? '#059669' : '#DC2626', fontSize: 14 }}>
                    {inr(b.remaining)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {budgets.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>📊</span>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
              {isMr ? 'अद्याप कोणतेही बजेट सेट केलेले नाही' : 'No Budgets Configured Yet'}
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748B', maxWidth: 440, margin: '0 auto 20px' }}>
              {isMr
                ? 'पूजा, डेकोरेशन, साउंड किंवा महाप्रसादासाठी ठराविक रक्कम वाटप करा आणि उधळपट्टी रोखा.'
                : 'Set category-wise spend limits to ensure expenses remain on track.'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + {isMr ? 'पहिले बजेट जोडा' : 'Set Your First Budget'}
            </button>
          </div>
        )}

        {/* ── Set Budget Modal ── */}
        {showForm && (
          <div className="modal-backdrop" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, borderRadius: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  📈 {isMr ? 'वर्गवारी बजेट ठरवा' : 'Set Category Budget'}
                </h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowForm(false)}
                  style={{ fontSize: 18, padding: '2px 8px' }}
                >
                  ✕
                </button>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {isMr ? 'खर्च वर्गवारी (Expense Category)' : 'Category'}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      background: '#FFF'
                    }}
                    required
                  >
                    {STANDARD_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {isMr ? cat.labelMr : cat.id}
                      </option>
                    ))}
                    <option value="CUSTOM">✏️ {isMr ? 'इतर कस्टम वर्गवारी (Custom)...' : 'Custom Category...'}</option>
                  </select>
                </div>

                {form.category === 'CUSTOM' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      {isMr ? 'कस्टम वर्गवारीचे नाव' : 'Custom Category Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={isMr ? 'उदा. रांगोळी स्पर्धा, बक्षीस वितरण' : 'e.g. Prize Distribution'}
                      value={form.customCategory}
                      onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {isMr ? 'मंजूर बजेट रक्कम (₹)' : 'Allocated Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="उदा. 5000"
                    value={form.allocatedAmount}
                    onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 700 }}
                  >
                    💾 {isMr ? 'बजेट सेव्ह करा' : 'Save Budget'}
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 600 }}
                  >
                    {isMr ? 'रद्द करा' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Budgets;
