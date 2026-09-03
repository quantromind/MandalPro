import { useState, useEffect } from 'react';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const QUICK_AMOUNTS = [101, 251, 501, 1001, 2100, 5100];
const MODES = [
  { key: 'cash', labelEn: 'Cash', labelMr: 'रोख (Cash)', icon: '💵' },
  { key: 'upi', labelEn: 'UPI / QR', labelMr: 'युपीआय (UPI)', icon: '📱' },
  { key: 'card', labelEn: 'Card / Cheque', labelMr: 'कार्ड / चेक', icon: '💳' },
  { key: 'netbanking', labelEn: 'Net Banking', labelMr: 'नेट बँकिंग', icon: '🏦' }
];

export default function DonationModal({ visible, onClose, onSuccess, initialData = null }) {
  const { t, language } = useLanguage();
  const isMr = language === 'mr';

  const [contributor, setContributor] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Donation');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setContributor(initialData.contributor || initialData.donorName || '');
      setTitle(initialData.title || initialData.purpose || '');
      setAmount(String(initialData.amount || ''));
      setCategory(initialData.category || 'Donation');
      setPaymentMode((initialData.paymentMode || 'cash').toLowerCase());
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : initialData.createdAt
          ? new Date(initialData.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setMobile(initialData.mobile || initialData.donorMobile || '');
      setDescription(initialData.description || '');
      setFormErrors({});
    } else {
      setContributor('');
      setTitle('');
      setAmount('501');
      setCategory('Donation');
      setPaymentMode('cash');
      setDate(new Date().toISOString().split('T')[0]);
      setMobile('');
      setDescription('');
      setFormErrors({});
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const validate = () => {
    const errs = {};
    if (!contributor.trim()) {
      errs.contributor = isMr ? 'कृपया देणगीदाराचे नाव टाका' : 'Donor name is required';
    }
    if (!amount || Number(amount) <= 0) {
      errs.amount = isMr ? 'रक्कम ० पेक्षा जास्त असणे आवश्यक आहे' : 'Amount must be greater than 0';
    }
    if (mobile.trim() && !/^\d{10}$/.test(mobile.trim().replace(/[^0-9]/g, ''))) {
      errs.mobile = isMr ? 'कृपया वैध १० अंकी मोबाईल नंबर टाका' : 'Enter a valid 10-digit mobile number';
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
        title: title.trim() || (isMr ? 'गणपती उत्सव वर्गणी' : 'Ganpati Vargani'),
        purpose: title.trim() || (isMr ? 'गणपती उत्सव वर्गणी' : 'Ganpati Vargani'),
        amount: Number(amount),
        category: category || 'Donation',
        paymentMode,
        date,
        mobile: mobile.trim(),
        description: description.trim(),
        idempotencyKey: initialData ? undefined : `web-col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };

      let savedRecord;
      if (initialData?._id) {
        const { data } = await client.patch(`/donations/${initialData._id}`, payload);
        savedRecord = data;
      } else {
        const { data } = await client.post('/donations', payload);
        savedRecord = data;
      }

      onClose();
      if (onSuccess) {
        onSuccess(savedRecord);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving donation';
      if (msg.includes('E11000') || msg.includes('duplicate key')) {
        alert(isMr ? 'नोंद आधीच झालेली दिसते किंवा डुप्लिकेट की आढळली. कृपया पुन्हा प्रयत्न करा.' : 'Duplicate entry detected. Please try again.');
      } else {
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-h2" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>✨ ✨</span>
            <span>{initialData ? (isMr ? 'देणगी संपादित करा' : 'Edit Donation') : (isMr ? 'नवीन देणगी नोंदवा' : 'Record New Donation')}</span>
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Quick Amount Selector */}
          <div className="form-group">
            <label className="form-label">{isMr ? 'जलद रक्कम निवडा:' : 'Quick Select Amount:'}</label>
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
            <label className="form-label">{isMr ? 'देणगी रक्कम (₹) *' : 'Donation Amount (₹) *'}</label>
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
            <label className="form-label">{isMr ? 'देणगीदाराचे पूर्ण नाव *' : 'Donor Full Name *'}</label>
            <input
              type="text"
              className={`form-control ${formErrors.contributor ? 'is-invalid' : ''}`}
              placeholder={isMr ? 'उदा. रमेश पाटील' : 'e.g. Ramesh Patil'}
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
            />
            {formErrors.contributor && <div className="form-error">{formErrors.contributor}</div>}
          </div>

          {/* WhatsApp Mobile */}
          <div className="form-group">
            <label className="form-label">{isMr ? 'व्हॉट्सअ‍ॅप / मोबाइल (पर्यायी)' : 'WhatsApp / Mobile (Optional)'}</label>
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
              <label className="form-label">{isMr ? 'हेतू / उत्सव (पर्यायी)' : 'Purpose / Event (Optional)'}</label>
              <input
                type="text"
                className="form-control"
                placeholder={isMr ? 'उदा. गणपती उत्सव वर्गणी' : 'e.g. Ganpati Utsav Vargani'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isMr ? 'दिनांक' : 'Date'}</label>
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
            <label className="form-label">{isMr ? 'देयक पद्धत' : 'Payment Mode'}</label>
            <div className="payment-modes-grid">
              {MODES.map((m) => (
                <div
                  key={m.key}
                  className={`payment-mode-card ${paymentMode === m.key ? 'mode-active' : ''}`}
                  onClick={() => setPaymentMode(m.key)}
                >
                  <span className="mode-icon">{m.icon}</span>
                  <span className="mode-name">{isMr ? m.labelMr : m.labelEn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">{isMr ? 'तपशील / टीप (पर्यायी)' : 'Description / Note (Optional)'}</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder={isMr ? 'काही विशेष नोंद असल्यास...' : 'Any additional note...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', margin: 0, border: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {isMr ? 'रद्द करा' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (isMr ? 'जतन करत आहे...' : 'Saving...') : (initialData ? (isMr ? 'जतन करा' : 'Save Changes') : (isMr ? 'पावती तयार करा' : 'Record & Generate Receipt'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
