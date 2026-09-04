import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout';
import DonationModal from '../components/DonationModal';
import ReceiptModal from '../components/ReceiptModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const statusColor = {
  Issued: 'badge-success',
  Draft: 'badge-muted',
  Cancelled: 'badge-danger',
  Reversed: 'badge-warning'
};

export default function Donations() {
  const { mandal, user } = useAuth();
  const { t, language } = useLanguage();
  const isMr = language === 'mr';

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      setLoading(true);
      const res = await client.get('/donations');
      setDonations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSuccess = (savedRecord) => {
    load();
    if (savedRecord) {
      setReceiptToShow(savedRecord);
    }
  };

  const handleCancel = async () => {
    try {
      await client.patch(`/donations/${cancelTarget}/cancel`, { reason: cancelReason });
      setCancelTarget(null);
      setCancelReason('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || (isMr ? 'रद्द करण्यात त्रुटी आली' : 'Failed to cancel'));
    }
  };

  // Filter & Search
  const filtered = donations.filter((d) => {
    const name = (d.donorName || d.contributor || '').toLowerCase();
    const mob = (d.donorMobile || d.mobile || '');
    const purp = (d.purpose || d.title || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || name.includes(q) || mob.includes(q) || purp.includes(q);

    if (!matchesSearch) return false;

    if (filter === 'Today') {
      const today = new Date().toISOString().split('T')[0];
      const itemDate = new Date(d.date || d.createdAt).toISOString().split('T')[0];
      return itemDate === today;
    }
    if (filter === 'Cash') {
      return (d.paymentMode || '').toLowerCase() === 'cash';
    }
    if (filter === 'UPI') {
      return (d.paymentMode || '').toLowerCase() === 'upi';
    }
    return true;
  });

  const total = donations
    .filter((d) => d.status !== 'Cancelled' && d.status !== 'Reversed')
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  return (
    <Layout>
      {/* ── Page Header ── */}
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💰</span>
            <span>{isMr ? 'देणग्या व पावत्या' : 'Donations & Receipts'}</span>
          </h1>
          <p className="text-sub" style={{ margin: '4px 0 0' }}>
            {isMr ? 'मंडळाला मिळालेल्या सर्व देणग्या आणि डिजिटल पावत्यांचा हिशोब' : 'Track and manage all Mandal donations & digital receipts'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 14 }}
        >
          <span>✨</span>
          <span>{isMr ? 'नवीन देणगी नोंदवा' : 'Record Donation'}</span>
        </button>
      </div>

      {/* ── Stats Highlight ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card stat-card" style={{ padding: 18 }}>
          <div className="text-sub" style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isMr ? 'एकूण जमा देणगी' : 'Total Donations Collected'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>
            {inr(total)}
          </div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {donations.length} {isMr ? 'एकूण नोंदणीकृत पावत्या' : 'total receipts issued'}
          </div>
        </div>

        <div className="card stat-card" style={{ padding: 18 }}>
          <div className="text-sub" style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isMr ? 'डिजिटल WhatsApp पावत्या' : 'WhatsApp Branded Receipts'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
            {donations.filter((d) => d.donorMobile || d.mobile).length}
          </div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {isMr ? 'मोबाईल नंबर असलेल्या नोंदी' : 'Entries with mobile number'}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card mb-3" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <input
              type="text"
              placeholder={isMr ? '🔍 नाव, मोबाइल किंवा हेतू शोधा...' : '🔍 Search name, mobile or purpose...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'All', mr: 'सर्व (All)' },
              { id: 'Today', mr: 'आज (Today)' },
              { id: 'Cash', mr: '💵 रोख' },
              { id: 'UPI', mr: '📱 UPI' }
            ].map((f) => (
              <button
                key={f.id}
                className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: 999, whiteSpace: 'nowrap', fontSize: 12.5 }}
                onClick={() => setFilter(f.id)}
              >
                {isMr ? f.mr : f.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Donations List ── */}
      <div className="grid">
        {loading ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: 14 }}>{isMr ? 'लोड होत आहे...' : 'Loading donations...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>💰</div>
            <h3 className="text-h3" style={{ marginBottom: 6 }}>
              {isMr ? 'कोणत्याही देणग्या आढळल्या नाहीत' : 'No donations found'}
            </h3>
            <p className="text-muted" style={{ marginBottom: 20 }}>
              {isMr ? 'नवीन देणगी नोंदवण्यासाठी खालील बटणावर क्लिक करा.' : 'Click below to record your first donation.'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ✨ {isMr ? 'नवीन देणगी नोंदवा' : 'Record New Donation'}
            </button>
          </div>
        ) : (
          filtered.map((d) => {
            const dateStr = new Date(d.date || d.createdAt).toLocaleDateString(isMr ? 'mr-IN' : 'en-IN');
            const pMode = (d.paymentMode || 'cash').toLowerCase();

            return (
              <div
                key={d._id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                  <div
                    className="avatar"
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 18,
                      fontWeight: 800,
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: 'var(--primary)',
                      flexShrink: 0
                    }}
                  >
                    {(d.donorName || d.contributor || 'M')[0]?.toUpperCase()}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', marginBottom: 3 }}>
                      {d.donorName || d.contributor}
                    </div>
                    <div className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>📅 {dateStr}</span>
                      {(d.donorMobile || d.mobile) && (
                        <span>📱 +91 {d.donorMobile || d.mobile}</span>
                      )}
                      <span className={`badge ${pMode === 'cash' ? 'badge-cash' : 'badge-upi'}`}>
                        {pMode === 'cash' ? '💵 Cash' : pMode === 'upi' ? '📱 UPI' : pMode.toUpperCase()}
                      </span>
                      {d.status && (
                        <span className={`badge ${statusColor[d.status] || 'badge-muted'}`}>
                          {d.status === 'Issued' ? (isMr ? 'पावती तयार ✓' : 'Issued ✓') : d.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--success)' }}>
                      {inr(d.amount)}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>
                      {d.purpose || d.title || (isMr ? 'गणपती वर्गणी' : 'Donation')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      title={isMr ? 'पावती पहा / शेअर करा' : 'View / Share Receipt'}
                      onClick={() => setReceiptToShow(d)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>🧾</span>
                      <span>{isMr ? 'पावती' : 'Receipt'}</span>
                    </button>

                    {d.status === 'Issued' && user?.role === 'president' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)', fontSize: 12 }}
                        onClick={() => setCancelTarget(d._id)}
                        title={isMr ? 'पावती मागे घ्या / रद्द करा' : 'Reverse receipt'}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODULAR NEW DONATION MODAL (✨ ✨ नवीन देणगी नोंदवा) ── */}
      <DonationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* ── RECEIPT MODAL (WhatsApp Share & Print) ── */}
      {receiptToShow && (
        <ReceiptModal
          visible={!!receiptToShow}
          receipt={receiptToShow}
          mandal={mandal}
          collectorName={user?.name}
          onClose={() => setReceiptToShow(null)}
        />
      )}

      {/* ── REVERSAL CONFIRMATION MODAL ── */}
      {cancelTarget && (
        <div className="modal-backdrop" onClick={() => setCancelTarget(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-h2" style={{ margin: 0 }}>
                ⚠️ {isMr ? 'पावती रद्द / मागे घ्या' : 'Reverse Donation'}
              </h2>
              <button className="btn-close" onClick={() => setCancelTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="text-sub" style={{ fontSize: 13.5, marginBottom: 16 }}>
                {isMr
                  ? 'कृपया ही पावती रद्द करण्याचे कारण लिहा. ही कृती ऑडिटसाठी नोंदवली जाते.'
                  : 'Please provide a reason for reversing this receipt. This action is logged for audit purposes.'}
              </p>

              <div className="form-group">
                <label className="form-label">{isMr ? 'रद्द करण्याचे कारण' : 'Cancellation Reason'}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={isMr ? 'उदा. चुकीची रक्कम नोंदवली गेली...' : 'e.g. Incorrect amount entered...'}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer" style={{ padding: '16px 0 0', margin: 0, border: 'none' }}>
                <button className="btn btn-outline" onClick={() => setCancelTarget(null)}>
                  {isMr ? 'रद्द करू नका' : 'Dismiss'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                >
                  {isMr ? 'रद्द करा' : 'Confirm Reversal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
