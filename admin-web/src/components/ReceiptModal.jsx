import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { numberToWordsMr, toMarathiDigits } from '../utils/numberToMarathi';

export default function ReceiptModal({ visible, receipt, mandal, collectorName, onClose }) {
  if (!visible || !receipt) return null;

  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const mandalName = mandal?.name || receipt.mandal?.name || receipt.mandalName || 'श्री राम मित्र मंडळ';
  const mandalLocation = mandal?.address || mandal?.city || receipt?.mandal?.address || 'सार्वजनिक उत्सव परिसर';
  const establishedYear = mandal?.establishedYear || '२०२३';
  const logoUri = mandal?.logoBase64 || mandal?.logoUrl || receipt?.mandal?.logoUrl || receipt?.mandalLogo;
  
  const receiptNo = receipt.receiptNumber || receipt._id?.slice(-6)?.toUpperCase() || 'MB-1-0122';
  const amount = Number(receipt.amount || 0);
  const donorName = receipt.donorName || receipt.contributor || receipt.donor || 'देणगीदार';
  const donorMobile = receipt.donorMobile || receipt.mobile || '';
  const purpose = receipt.purpose || receipt.title || receipt.category || 'सार्वजनिक गणेशोत्सव';
  const paymentMode = (receipt.paymentMode || 'upi').toLowerCase();

  const d = receipt.createdAt || receipt.date ? new Date(receipt.createdAt || receipt.date) : new Date();
  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
  const yearStr = String(d.getFullYear());
  const dateFormattedEng = `${dayStr}/${monthStr}/${yearStr}`;
  const dateFormattedMr = `${toMarathiDigits(dayStr)}/${toMarathiDigits(monthStr)}/${toMarathiDigits(yearStr)}`;
  const currentYearMr = toMarathiDigits(yearStr);

  const marathiWords = numberToWordsMr(amount);

  const messageText = `॥ गणपती बाप्पा मोरया ॥
🚩 *${mandalName}* 🚩
*॥ अधिकृत देणगी पावती ॥*
━━━━━━━━━━━━━━━━━━━━
🧾 *पावती क्र.:* #${receiptNo}
📅 *दिनांक:* ${dateFormattedMr} (${dateFormattedEng})
👤 *श्री/श्रीमती:* ${donorName}
${donorMobile ? `📱 *मोबाइल:* +91 ${donorMobile}\n` : ''}💰 *देणगी रक्कम:* ₹${amount.toLocaleString('en-IN')}/- (अक्षरी: ${marathiWords})
💳 *देयक पद्धत:* ${paymentMode === 'cash' ? 'रोख (Cash)' : 'UPI / Online'}
🎯 *हेतू:* ${purpose}
${collectorName ? `✍️ *संकलक:* ${collectorName}\n` : ''}━━━━━━━━━━━━━━━━━━━━
❖ *आपल्या मोलाच्या देणगीबद्दल मनःपूर्वक धन्यवाद!* ❖
॥ गणपती बाप्पा मोरया ॥`;

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
    const card = document.getElementById('printable-receipt-card');
    if (!card) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=750,height=850');
    if (!printWindow) {
      // Fallback if popup blocker is active
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>&nbsp;</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: portrait;
            margin: 0; /* Removes browser default headers (date, title) and footers (URL, page numbers) */
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            font-family: 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 16px;
          }
          .receipt-print-wrapper {
            width: 100%;
            max-width: 560px;
            margin: 0 auto;
          }
          .print-toolbar {
            width: 100%;
            max-width: 560px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 16px;
          }
          .btn-print {
            background: #2563EB;
            color: #FFF;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-close {
            background: #F1F5F9;
            color: #334155;
            border: 1px solid #CBD5E1;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 13.5px;
            cursor: pointer;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0 !important;
              margin: 0 !important;
            }
            .receipt-print-wrapper {
              padding: 12mm 10mm !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar no-print">
          <button class="btn-print" onclick="window.print()">🖨️ ${language === 'mr' ? 'प्रिंट करा / PDF सेव्ह करा' : 'Print / Save PDF'}</button>
          <button class="btn-close" onclick="window.close()">✕ ${language === 'mr' ? 'बंद करा' : 'Close'}</button>
        </div>
        <div class="receipt-print-wrapper">
          ${card.outerHTML}
        </div>
        <script>
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="receipt-modal-box"
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          className="receipt-modal-header no-print"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
            <span>🧾</span> {language === 'mr' ? 'अधिकृत देणगी पावती' : 'Donation Receipt'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px 8px',
              borderRadius: 6
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Receipt Container */}
        <div className="receipt-modal-scroll" style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#F1F5F9' }}>
          
          {/* ════════════ AUTHENTIC MARATHI RECEIPT PAPER ════════════ */}
          <div
            id="printable-receipt-card"
            style={{
              background: '#FFFDF9',
              border: '3px double #C2410C',
              borderRadius: 16,
              padding: '24px 22px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(194, 65, 12, 0.08)',
              fontFamily: "'Noto Sans Devanagari', 'Yatra One', 'Mukta', 'Inter', sans-serif",
              color: '#1E293B'
            }}
          >
            {/* Inner Decorative Golden Line */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                border: '1px solid #FED7AA',
                borderRadius: 12,
                pointerEvents: 'none'
              }}
            />

            {/* Subtle Watermark */}
            <div
              style={{
                position: 'absolute',
                top: '52%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-10deg)',
                opacity: 0.04,
                pointerEvents: 'none',
                userSelect: 'none',
                fontSize: 68,
                fontWeight: 900,
                color: '#C2410C',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {mandalName}
            </div>

            {/* 1. Top Auspicious & Est. Row */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                padding: '0 4px',
                minHeight: 22
              }}
            >
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 900,
                  color: '#9A3412',
                  textAlign: 'center',
                  letterSpacing: '0.5px'
                }}
              >
                ॥ श्री गणेश ॥
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 4,
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#9A3412'
                }}
              >
                स्थापना {toMarathiDigits(establishedYear)}
              </div>
            </div>

            {/* 2. Mandal Grand Header - All Centered */}
            <div
              style={{
                position: 'relative',
                textAlign: 'center',
                marginBottom: 14,
                padding: '2px 48px 4px'
              }}
            >
              {/* Logo / Ganesha Icon Badge on Left */}
              <div
                style={{
                  position: 'absolute',
                  left: 2,
                  top: 2,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: '2px solid #EA580C',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFF',
                  boxShadow: '0 4px 10px rgba(234, 88, 12, 0.15)',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={logoUri || '/logo.png'}
                  alt={mandalName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span style="font-size: 28px">🪔</span>';
                  }}
                />
              </div>

              {/* Title & Subtitle - Centered */}
              <div>
                <h2
                  style={{
                    margin: '0 0 3px',
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#831843',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    letterSpacing: '0.3px'
                  }}
                >
                  {mandalName}
                </h2>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#C2410C',
                    textAlign: 'center',
                    marginTop: 2
                  }}
                >
                  आयोजित सार्वजनिक गणेशोत्सव {currentYearMr}
                </div>
                {mandalLocation && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#64748B',
                      textAlign: 'center',
                      marginTop: 3,
                      fontWeight: 600
                    }}
                  >
                    {mandalLocation}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Section Title Divider: ◆ देणगी पावती ◆ */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '10px 0 16px',
                gap: 12
              }}
            >
              <div style={{ flex: 1, height: 1.5, background: '#FDBA74' }} />
              <div
                style={{
                  color: '#9A3412',
                  fontWeight: 900,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>◆</span> देणगी पावती <span>◆</span>
              </div>
              <div style={{ flex: 1, height: 1.5, background: '#FDBA74' }} />
            </div>

            {/* 4. Receipt Number & Date */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
                marginBottom: 16,
                fontWeight: 700,
                color: '#334155'
              }}
            >
              <div>
                पावती क्र. <span style={{ color: '#0F172A', fontWeight: 900 }}>{receiptNo}</span>
              </div>
              <div>
                दिनांक: <span style={{ color: '#0F172A', fontWeight: 900 }}>{dateFormattedMr}</span>
              </div>
            </div>

            {/* 5. Donor Info with Dotted Underline */}
            <div style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 14, color: '#334155' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>श्री./श्रीमती/मेसर्स</span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 160,
                    fontWeight: 900,
                    fontSize: 16,
                    color: '#0F172A',
                    borderBottom: '1.5px dashed #94A3B8',
                    padding: '0 6px',
                    display: 'inline-block'
                  }}
                >
                  {donorName}
                </span>
                <span style={{ fontWeight: 700 }}>यांजकडून</span>
              </div>
            </div>

            {/* 6. Contribution Purpose */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 10 }}>
              वर्गणी / देणगी रु.
            </div>

            {/* 7. Highlight Amount Card */}
            <div
              style={{
                border: '2.5px solid #EA580C',
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '12px 20px',
                maxWidth: 260,
                margin: '8px auto 10px',
                textAlign: 'center',
                boxShadow: '0 6px 18px rgba(234, 88, 12, 0.1)'
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#9A3412',
                  letterSpacing: '1px'
                }}
              >
                ₹ {toMarathiDigits(amount.toLocaleString('en-IN'))}
              </div>
            </div>

            {/* 8. Amount in Marathi Words */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 14.5,
                fontWeight: 700,
                color: '#475569',
                marginBottom: 12
              }}
            >
              {marathiWords}
            </div>

            {/* 9. Payment Mode Ack */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#1E293B',
                marginBottom: 16
              }}
            >
              {paymentMode === 'cash' ? 'रोख (Cash) द्वारे मिळाले, धन्यवाद !' : 'UPI द्वारे मिळाले, धन्यवाद !'}
            </div>

            {/* Decorative Bottom Line */}
            <div style={{ borderTop: '1px dashed #FED7AA', margin: '14px 0 12px' }} />

            {/* 10. Sacred Slogan */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 17,
                fontWeight: 900,
                color: '#9A3412',
                letterSpacing: '1px'
              }}
            >
              ॥ गणपती बाप्पा मोरया ॥
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div
          className="receipt-modal-actions no-print"
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              minWidth: 140,
              background: '#25D366',
              color: '#FFF',
              border: 'none',
              borderRadius: 10,
              padding: '11px 16px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
            }}
          >
            <span>📲</span> {language === 'mr' ? 'WhatsApp वर पाठवा' : 'Send WhatsApp'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              minWidth: 120,
              background: '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: 10,
              padding: '11px 16px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <span>🖨️</span> {language === 'mr' ? 'प्रिंट / PDF' : 'Print / PDF'}
          </button>

          <button
            onClick={handleCopy}
            style={{
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: 10,
              padding: '11px 14px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
