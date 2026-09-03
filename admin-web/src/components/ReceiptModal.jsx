import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ReceiptModal({ visible, receipt, mandal, collectorName, onClose }) {
  if (!visible || !receipt) return null;

  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const mandalName = mandal?.name || receipt.mandal?.name || receipt.mandalName || 'श्री गणेश मित्र मंडळ';
  const logoUri = mandal?.logoBase64 || mandal?.logoUrl || receipt?.mandal?.logoUrl || receipt?.mandalLogo;
  const receiptNo = receipt.receiptNumber || receipt._id?.slice(-6)?.toUpperCase() || 'RCPT-001';
  const amount = Number(receipt.amount || 0);
  const donorName = receipt.donorName || receipt.contributor || receipt.donor || 'देणगीदार';
  const donorMobile = receipt.donorMobile || receipt.mobile || '';
  const purpose = receipt.purpose || receipt.title || receipt.category || 'गणेशोत्सव वर्गणी';
  const paymentMode = (receipt.paymentMode || 'cash').toLowerCase();

  const d = receipt.createdAt || receipt.date ? new Date(receipt.createdAt || receipt.date) : new Date();
  const dateFormatted = `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;

  const messageText = `॥ गणपती बाप्पा मोरया ॥
🚩 *${mandalName}* 🚩
*॥ देणगी पावती (DONATION RECEIPT) ॥*
━━━━━━━━━━━━━━━━━━━━
🧾 *पावती क्र. / Receipt No.:* #${receiptNo}
📅 *दिनांक / Date:* ${dateFormatted}
👤 *श्री/श्रीमती (Donor):* ${donorName}
📱 *मोबाइल क्र. (Mobile):* ${donorMobile || 'N/A'}
💰 *देणगी रक्कम (Amount):* ₹${amount.toLocaleString('en-IN')}/-
💳 *देयक पद्धत (Mode):* ${paymentMode === 'cash' ? 'ROKH / CASH' : 'UPI / ONLINE'}
🎯 *हेतू (Purpose):* ${purpose}
${collectorName ? `✍️ *संकलक (Issued By):* ${collectorName}\n` : ''}━━━━━━━━━━━━━━━━━━━━
❖ *आपल्या मोलाच्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!* ❖
*Thank you for your generous contribution!*`;

  const handleWhatsApp = () => {
    let cleanMobile = donorMobile.replace(/[^0-9]/g, '');
    let phoneParam = '';
    if (cleanMobile) {
      if (!cleanMobile.startsWith('91') || cleanMobile.length === 10) {
        cleanMobile = '91' + cleanMobile;
      }
      phoneParam = cleanMobile;
    }
    const encoded = encodeURIComponent(messageText);
    const url = phoneParam ? `https://wa.me/${phoneParam}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="receipt-modal-header">
          <div className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🧾</span> {t('receipts.receiptGeneratedSuccess')}
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '4px 10px' }}>
            ✕ {t('common.close')}
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-receipt-paper" id="printable-receipt">
          {/* Top border decoration & Mandal Custom Logo */}
          <div className="receipt-ornament-header">
            <div className="receipt-om">॥ श्री गणेशाय नमः ॥</div>
            <div className="receipt-logo-wrapper">
              <img
                src={logoUri || '/logo.png'}
                alt={mandalName}
                className="receipt-mandal-logo"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + '/logo.png') {
                    e.target.src = '/logo.png';
                  }
                }}
              />
            </div>
            <div className="receipt-mandal-title">{mandalName}</div>
            <div className="receipt-tagline">॥ देणगी व वर्गणी अधिकृत डिजिटल पावती ॥</div>
          </div>

          <div className="receipt-body">
            <div className="receipt-meta-row">
              <div className="receipt-badge-no">
                <span>{t('receipts.receiptNo', { no: receiptNo })}</span>
              </div>
              <div className="receipt-date-text">
                📅 <strong>{t('receipts.date')}:</strong> {dateFormatted}
              </div>
            </div>

            <div className="receipt-field-grid">
              <div className="receipt-field">
                <span className="field-label">{t('receipts.donor')}:</span>
                <span className="field-value highlight">{donorName}</span>
              </div>
              {donorMobile && (
                <div className="receipt-field">
                  <span className="field-label">{t('receipts.mobile')}:</span>
                  <span className="field-value">+91 {donorMobile}</span>
                </div>
              )}
              <div className="receipt-field">
                <span className="field-label">{t('receipts.purpose')}:</span>
                <span className="field-value">{purpose}</span>
              </div>
              <div className="receipt-field">
                <span className="field-label">{t('receipts.paymentMode')}:</span>
                <span className="field-value payment-tag">
                  {paymentMode === 'cash' ? '💵 Cash / रोख' : '📱 UPI / Online'}
                </span>
              </div>
            </div>

            {/* Amount Callout */}
            <div className="receipt-amount-box">
              <div className="amount-label">{t('receipts.amount')}</div>
              <div className="amount-val">₹{amount.toLocaleString('en-IN')}/-</div>
            </div>

            {/* Seal & Signature */}
            <div className="receipt-footer-row">
              <div className="receipt-stamp">
                <div className="stamp-circle">
                  <span>✓ VERIFIED</span>
                  <small>MANDAL PRO</small>
                </div>
              </div>
              <div className="receipt-sign">
                <div className="sign-line"></div>
                <div>{collectorName ? `${collectorName} (अधिकृत संकलक)` : 'अधिकृत स्वाक्षरी / Authorized Sign'}</div>
              </div>
            </div>

            <div className="receipt-blessing-text">
              ❖ {t('receipts.thankYouContribution')} ❖
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-modal-actions">
          <button className="btn btn-whatsapp" onClick={handleWhatsApp}>
            <span>📲</span> {t('receipts.sendWhatsApp') || 'WhatsApp'}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <span>🖨️</span> {t('receipts.printReceipt') || 'Print / PDF'}
          </button>
          <button className="btn btn-done" onClick={onClose}>
            <span>✓</span> {language === 'mr' ? 'पूर्ण झाले (Done)' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
