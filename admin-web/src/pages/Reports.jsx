import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Reports() {
  const { mandal } = useAuth();
  const { language } = useLanguage();
  const isMr = language === 'mr';

  const [loading, setLoading] = useState({
    finPdf: false,
    finCsv: false,
    rcptPdf: false,
    rcptCsv: false,
    donorCsv: false,
    eventPdf: false
  });

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');

  useEffect(() => {
    client.get('/events')
      .then(res => setEvents(res.data || []))
      .catch(() => setEvents([]));
  }, []);

  // Format currency
  const formatInr = (num) => `₹${Number(num || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── CSV Generator Utility (with UTF-8 BOM for Marathi/Unicode support in Excel) ──
  const downloadCSV = (filename, headers, rows) => {
    const escapeCell = (cell) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Print / PDF Window Utility ──
  const openPrintWindow = (title, htmlBody) => {
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      alert(isMr ? 'कृपया ब्राउझर पॉपअप ब्लॉक अनब्लॉक करा' : 'Please allow popups to view and download PDF');
      return;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          body { margin: 0; padding: 32px 40px; color: #0F172A; background: #FFF; font-size: 13px; line-height: 1.5; }
          .report-header { border-bottom: 2px solid #EA580C; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .mandal-title { font-size: 22px; font-weight: 800; color: #EA580C; margin: 0 0 4px; }
          .report-meta { font-size: 12px; color: #64748B; margin: 0; }
          .badge-type { background: #FEF3C7; color: #B45309; padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
          .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 16px; border-radius: 10px; text-align: center; }
          .summary-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
          .summary-val { font-size: 20px; font-weight: 800; }
          .val-income { color: #059669; }
          .val-expense { color: #DC2626; }
          .val-net { color: #EA580C; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #F1F5F9; color: #334155; font-weight: 700; text-align: left; padding: 10px 12px; border-bottom: 2px solid #CBD5E1; }
          td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B; }
          tr:nth-child(even) td { background: #FAFAFA; }
          .table-total-row td { font-weight: 800; background: #F8FAFC; border-top: 2px solid #CBD5E1; color: #0F172A; }
          .section-title { font-size: 15px; font-weight: 700; margin: 18px 0 10px; color: #0F172A; border-left: 4px solid #EA580C; padding-left: 8px; }
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; padding-top: 36px; border-top: 1px dashed #CBD5E1; text-align: center; }
          .sig-line { border-top: 1px solid #475569; width: 80%; margin: 0 auto 6px; }
          .sig-label { font-size: 12px; font-weight: 700; color: #334155; }
          .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 12px; }
          .footer a { color: #EA580C; text-decoration: none; font-weight: 600; }
          .print-toolbar { position: fixed; top: 16px; right: 16px; background: #0F172A; padding: 10px 18px; border-radius: 99px; display: flex; gap: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 999; }
          .print-btn { background: #EA580C; color: #FFF; border: none; padding: 8px 16px; border-radius: 99px; font-weight: 700; cursor: pointer; font-size: 13px; }
          @media print {
            .print-toolbar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <button class="print-btn" onclick="window.print()">🖨️ ${isMr ? 'प्रिंट / PDF सेव्ह करा' : 'Print / Save PDF'}</button>
        </div>
        ${htmlBody}
        <script>
          setTimeout(() => {
            window.print();
          }, 400);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  // ─────────────────────────────────────────────────────────────
  // 1. FINANCIAL SUMMARY (PDF & CSV)
  // ─────────────────────────────────────────────────────────────
  const handleFinancialSummary = async (format) => {
    const key = format === 'pdf' ? 'finPdf' : 'finCsv';
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      const [donationsRes, expensesRes] = await Promise.all([
        client.get('/donations'),
        client.get('/expenses')
      ]);

      let donations = donationsRes.data || [];
      let expenses = expensesRes.data || [];

      if (selectedEventId !== 'all') {
        donations = donations.filter(d => String(d.eventId) === String(selectedEventId));
        expenses = expenses.filter(e => String(e.eventId) === String(selectedEventId));
      }

      const totalIncome = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const netBalance = totalIncome - totalExpense;

      if (format === 'csv') {
        const headers = ['Type', 'Date', 'Receipt No / ID', 'Name / Vendor', 'Category / Purpose', 'Payment Mode', 'Amount (₹)', 'Status'];
        const rows = [
          ...donations.map(d => [
            'Income (जमा)',
            formatDate(d.date || d.createdAt),
            d.receiptNumber || d._id,
            d.donorName || d.title,
            d.purpose || d.category || 'Donation',
            d.paymentMode || 'Cash',
            d.amount,
            d.status || 'Active'
          ]),
          ...expenses.map(e => [
            'Expense (खर्च)',
            formatDate(e.date || e.createdAt),
            e._id,
            e.vendor || e.title,
            e.category || 'Expense',
            'Cash / UPI',
            e.amount,
            e.status || 'Approved'
          ])
        ];
        downloadCSV(`Financial_Summary_${mandal?.name || 'Mandal'}_${Date.now()}.csv`, headers, rows);
      } else {
        // PDF Report View
        const mandalName = mandal?.name || 'Apla Mandal';
        const eventName = selectedEventId !== 'all' ? (events.find(ev => ev._id === selectedEventId)?.name || 'Event') : (isMr ? 'संपूर्ण कालावधी' : 'All Time');

        const html = `
          <div class="report-header">
            <div>
              <h1 class="mandal-title">🚩 ${mandalName}</h1>
              <p class="report-meta">${isMr ? 'आर्थिक ताळेबंद अहवाल (Financial Audit Summary)' : 'Financial Summary & Audit Report'} • ${eventName}</p>
            </div>
            <div style="text-align: right;">
              <span class="badge-type">${isMr ? 'अधिकृत अहवाल' : 'Official Audit'}</span>
              <p class="report-meta" style="margin-top: 4px;">${isMr ? 'दिनांक:' : 'Generated on:'} ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">${isMr ? 'एकूण जमा (Total Income)' : 'Total Collections'}</div>
              <div class="summary-val val-income">${formatInr(totalIncome)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">${isMr ? 'एकूण खर्च (Total Expenses)' : 'Total Expenses'}</div>
              <div class="summary-val val-expense">${formatInr(totalExpense)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">${isMr ? 'शिल्लक ताळेबंद (Net Balance)' : 'Net Balance'}</div>
              <div class="summary-val val-net">${formatInr(netBalance)}</div>
            </div>
          </div>

          <div class="section-title">🚩 ${isMr ? 'जमा तपशील (Donations & Collections Breakdown)' : 'Income Breakdown'}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isMr ? 'पावती क्र.' : 'Receipt No'}</th>
                <th>${isMr ? 'दिनांक' : 'Date'}</th>
                <th>${isMr ? 'देणगीदाराचे नाव' : 'Donor Name'}</th>
                <th>${isMr ? 'कारण' : 'Purpose'}</th>
                <th>${isMr ? 'मोड' : 'Mode'}</th>
                <th style="text-align: right;">${isMr ? 'रक्कम (₹)' : 'Amount (₹)'}</th>
              </tr>
            </thead>
            <tbody>
              ${donations.slice(0, 50).map((d, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${d.receiptNumber || '-'}</strong></td>
                  <td>${formatDate(d.date || d.createdAt)}</td>
                  <td>${d.donorName || d.title}</td>
                  <td>${d.purpose || d.category || '-'}</td>
                  <td>${d.paymentMode || 'Cash'}</td>
                  <td style="text-align: right; font-weight: 700;">${formatInr(d.amount)}</td>
                </tr>
              `).join('')}
              <tr class="table-total-row">
                <td colspan="6" style="text-align: right;">${isMr ? 'एकूण जमा:' : 'Total Income:'}</td>
                <td style="text-align: right; color: #059669;">${formatInr(totalIncome)}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">💸 ${isMr ? 'खर्च तपशील (Expenses Breakdown)' : 'Expenses Breakdown'}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isMr ? 'दिनांक' : 'Date'}</th>
                <th>${isMr ? 'खर्च बाब' : 'Item / Title'}</th>
                <th>${isMr ? 'वर्गवारी' : 'Category'}</th>
                <th>${isMr ? 'विक्रेता / बिल' : 'Vendor'}</th>
                <th style="text-align: right;">${isMr ? 'रक्कम (₹)' : 'Amount (₹)'}</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.slice(0, 50).map((e, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${formatDate(e.date || e.createdAt)}</td>
                  <td>${e.title || e.category}</td>
                  <td>${e.category || '-'}</td>
                  <td>${e.vendor || '-'}</td>
                  <td style="text-align: right; font-weight: 700;">${formatInr(e.amount)}</td>
                </tr>
              `).join('')}
              <tr class="table-total-row">
                <td colspan="5" style="text-align: right;">${isMr ? 'एकूण खर्च:' : 'Total Expenses:'}</td>
                <td style="text-align: right; color: #DC2626;">${formatInr(totalExpense)}</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'अध्यक्ष' : 'President'}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'कार्यवाह (सेक्रेटरी)' : 'Secretary'}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'खजिनदार' : 'Treasurer'}</div>
            </div>
          </div>

          <div class="footer">
            ${mandalName} • Generated via Apla Mandal Digital Management System • Verified & Audited
            <div style="font-size: 10px; color: #94A3B8; margin-top: 5px;">
              Powered by <a href="https://quantromind.com/" target="_blank" rel="noopener noreferrer">Quantromind Pvt Ltd</a>
            </div>
          </div>
        `;
        openPrintWindow(`Financial_Summary_${mandalName}`, html);
      }
    } catch (err) {
      alert(isMr ? 'अहवाल डाउनलोड करताना त्रुटी आली: ' + (err.message || '') : 'Error generating report: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. RECEIPT REGISTER (PDF & CSV)
  // ─────────────────────────────────────────────────────────────
  const handleReceiptRegister = async (format) => {
    const key = format === 'pdf' ? 'rcptPdf' : 'rcptCsv';
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      const res = await client.get('/donations');
      let donations = res.data || [];

      if (selectedEventId !== 'all') {
        donations = donations.filter(d => String(d.eventId) === String(selectedEventId));
      }

      if (format === 'csv') {
        const headers = ['Receipt No', 'Date', 'Donor Name', 'Donor Mobile', 'Purpose', 'Category', 'Payment Mode', 'Amount (₹)', 'Status'];
        const rows = donations.map(d => [
          d.receiptNumber || d._id,
          formatDate(d.date || d.createdAt),
          d.donorName || d.title,
          d.donorMobile || '',
          d.purpose || d.title,
          d.category || 'Donation',
          d.paymentMode || 'Cash',
          d.amount,
          d.status || 'Active'
        ]);
        downloadCSV(`Receipt_Register_${mandal?.name || 'Mandal'}_${Date.now()}.csv`, headers, rows);
      } else {
        const mandalName = mandal?.name || 'Apla Mandal';
        const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

        const html = `
          <div class="report-header">
            <div>
              <h1 class="mandal-title">📜 ${mandalName}</h1>
              <p class="report-meta">${isMr ? 'अधिकृत पावती नोंदवही (Official Receipt Register)' : 'Official Receipt Register'}</p>
            </div>
            <div style="text-align: right;">
              <span class="badge-type">${isMr ? 'एकूण पावत्या: ' : 'Total Receipts: '} ${donations.length}</span>
              <p class="report-meta" style="margin-top: 4px;">${isMr ? 'दिनांक:' : 'Date:'} ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div class="summary-grid" style="grid-template-columns: repeat(2, 1fr);">
            <div class="summary-card">
              <div class="summary-label">${isMr ? 'एकूण नोंदवलेल्या पावत्या' : 'Total Receipts Issued'}</div>
              <div class="summary-val">${donations.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">${isMr ? 'एकूण गोळा झालेली रक्कम' : 'Total Collections'}</div>
              <div class="summary-val val-income">${formatInr(totalAmount)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isMr ? 'पावती क्र.' : 'Receipt No.'}</th>
                <th>${isMr ? 'दिनांक' : 'Date'}</th>
                <th>${isMr ? 'देणगीदाराचे नाव' : 'Donor Name'}</th>
                <th>${isMr ? 'मोबाईल' : 'Mobile'}</th>
                <th>${isMr ? 'कारण / वर्गवारी' : 'Purpose'}</th>
                <th>${isMr ? 'पेमेंट मोड' : 'Mode'}</th>
                <th style="text-align: right;">${isMr ? 'रक्कम (₹)' : 'Amount (₹)'}</th>
              </tr>
            </thead>
            <tbody>
              ${donations.map((d, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${d.receiptNumber || '-'}</strong></td>
                  <td>${formatDate(d.date || d.createdAt)}</td>
                  <td>${d.donorName || d.title}</td>
                  <td>${d.donorMobile || '-'}</td>
                  <td>${d.purpose || d.category || '-'}</td>
                  <td>${d.paymentMode || 'Cash'}</td>
                  <td style="text-align: right; font-weight: 700; color: #059669;">${formatInr(d.amount)}</td>
                </tr>
              `).join('')}
              <tr class="table-total-row">
                <td colspan="7" style="text-align: right;">${isMr ? 'एकूण रक्कम:' : 'Grand Total:'}</td>
                <td style="text-align: right; color: #059669; font-size: 14px;">${formatInr(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'तपासनीस' : 'Verified By'}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'खजिनदार' : 'Treasurer'}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">${isMr ? 'अध्यक्ष' : 'President'}</div>
            </div>
          </div>

          <div class="footer">
            ${mandalName} • Generated via Apla Mandal Digital Management System • Official Records
            <div style="font-size: 10px; color: #94A3B8; margin-top: 5px;">
              Powered by <a href="https://quantromind.com/" target="_blank" rel="noopener noreferrer">Quantromind Pvt Ltd</a>
            </div>
          </div>
        `;
        openPrintWindow(`Receipt_Register_${mandalName}`, html);
      }
    } catch (err) {
      alert(isMr ? 'पावती नोंदवही डाउनलोड करताना त्रुटी: ' + (err.message || '') : 'Error: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. DONOR DATABASE (CSV)
  // ─────────────────────────────────────────────────────────────
  const handleDonorDatabase = async () => {
    try {
      setLoading(prev => ({ ...prev, donorCsv: true }));
      const res = await client.get('/donations');
      const donations = res.data || [];

      // Group donations by donor phone or name
      const donorMap = new Map();
      donations.forEach(d => {
        const key = (d.donorMobile && d.donorMobile.trim()) || d.donorName || 'Anonymous';
        if (!donorMap.has(key)) {
          donorMap.set(key, {
            name: d.donorName || d.title,
            mobile: d.donorMobile || '',
            totalAmount: 0,
            donationCount: 0,
            lastDate: d.date || d.createdAt,
            purposes: new Set()
          });
        }
        const item = donorMap.get(key);
        item.totalAmount += Number(d.amount) || 0;
        item.donationCount += 1;
        if (d.purpose) item.purposes.add(d.purpose);
        if (new Date(d.date || d.createdAt) > new Date(item.lastDate)) {
          item.lastDate = d.date || d.createdAt;
        }
      });

      const headers = ['Donor Name', 'Mobile Number', 'Total Donated (₹)', 'Donation Count', 'Last Donation Date', 'Categories/Purposes'];
      const rows = Array.from(donorMap.values()).map(donor => [
        donor.name,
        donor.mobile,
        donor.totalAmount,
        donor.donationCount,
        formatDate(donor.lastDate),
        Array.from(donor.purposes).join('; ')
      ]);

      downloadCSV(`Donor_Database_${mandal?.name || 'Mandal'}_${Date.now()}.csv`, headers, rows);
    } catch (err) {
      alert(isMr ? 'देणगीदार डेटा डाउनलोड करताना त्रुटी: ' + (err.message || '') : 'Error: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, donorCsv: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. EVENT CLOSURE BALANCE SHEET REPORT (PDF)
  // ─────────────────────────────────────────────────────────────
  const handleEventClosure = async () => {
    try {
      setLoading(prev => ({ ...prev, eventPdf: true }));
      const [donationsRes, expensesRes, budgetsRes] = await Promise.all([
        client.get('/donations'),
        client.get('/expenses'),
        client.get('/budgets')
      ]);

      let donations = donationsRes.data || [];
      let expenses = expensesRes.data || [];
      let budgets = budgetsRes.data || [];

      if (selectedEventId !== 'all') {
        donations = donations.filter(d => String(d.eventId) === String(selectedEventId));
        expenses = expenses.filter(e => String(e.eventId) === String(selectedEventId));
        budgets = budgets.filter(b => String(b.eventId) === String(selectedEventId));
      }

      const totalCollection = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const netSavings = totalCollection - totalExpense;

      const eventObj = events.find(ev => ev._id === selectedEventId);
      const eventName = eventObj?.name || (isMr ? 'सर्व उत्सव व कार्यक्रम' : 'All Events Combined');
      const mandalName = mandal?.name || 'Apla Mandal';

      const html = `
        <div class="report-header">
          <div>
            <h1 class="mandal-title">🎪 ${mandalName}</h1>
            <p class="report-meta">${isMr ? 'उत्सव सांगता व अंतिम ताळेबंद अहवाल (Event Closure & Audit Report)' : 'Event Closure & Final Balance Sheet'}</p>
          </div>
          <div style="text-align: right;">
            <span class="badge-type" style="background: #E0E7FF; color: #4338CA;">${eventName}</span>
            <p class="report-meta" style="margin-top: 4px;">${isMr ? 'दिनांक:' : 'Date:'} ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">${isMr ? 'एकूण जमा (वर्गणी/देणग्या)' : 'Total Collections'}</div>
            <div class="summary-val val-income">${formatInr(totalCollection)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${isMr ? 'उत्सवाचा एकूण खर्च' : 'Total Expenses'}</div>
            <div class="summary-val val-expense">${formatInr(totalExpense)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${isMr ? 'शिल्लक निधी (Net Surplus)' : 'Net Surplus / Deficit'}</div>
            <div class="summary-val val-net">${formatInr(netSavings)}</div>
          </div>
        </div>

        <div class="section-title">📊 ${isMr ? 'अंदाजपत्रक वि. प्रत्यक्ष खर्च (Budget vs Actual Spend)' : 'Budget vs Actual Spend'}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isMr ? 'वर्गवारी (Category)' : 'Category'}</th>
              <th style="text-align: right;">${isMr ? 'वाटप केलेले बजेट (Allocated)' : 'Allocated Budget'}</th>
              <th style="text-align: right;">${isMr ? 'झालेला खर्च (Spent)' : 'Actual Spent'}</th>
              <th style="text-align: right;">${isMr ? 'शिल्लक / तफावत (Remaining)' : 'Remaining'}</th>
            </tr>
          </thead>
          <tbody>
            ${budgets.length > 0 ? budgets.map((b, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${b.category}</strong></td>
                <td style="text-align: right;">${formatInr(b.allocatedAmount)}</td>
                <td style="text-align: right; color: #DC2626; font-weight: 700;">${formatInr(b.spent)}</td>
                <td style="text-align: right; font-weight: 700;">${formatInr(b.remaining)}</td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" style="text-align: center; color: #94A3B8;">${isMr ? 'या उत्सवासाठी स्वतंत्र बजेट नोंदवलेले नाही.' : 'No category budgets configured.'}</td></tr>
            `}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">${isMr ? 'उत्सव प्रमुख' : 'Event Head'}</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">${isMr ? 'खजिनदार' : 'Treasurer'}</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">${isMr ? 'अध्यक्ष' : 'President'}</div>
          </div>
        </div>

        <div class="footer">
          ${mandalName} • Officially Certified Event Closure Report • Apla Mandal
          <div style="font-size: 10px; color: #94A3B8; margin-top: 5px;">
            Powered by <a href="https://quantromind.com/" target="_blank" rel="noopener noreferrer">Quantromind Pvt Ltd</a>
          </div>
        </div>
      `;

      openPrintWindow(`Event_Closure_${eventName}`, html);
    } catch (err) {
      alert(isMr ? 'उत्सव अहवाल तयार करताना त्रुटी: ' + (err.message || '') : 'Error: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, eventPdf: false }));
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '10px 16px 40px' }}>
        
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 className="text-h1" style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
              📊 {isMr ? 'अहवाल आणि विश्लेषण' : 'Reports & Analytics'}
            </h1>
            <p className="text-sub" style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {isMr ? 'हिशोब, पावत्या व ताळेबंद एका क्लिकवर PDF आणि Excel (CSV) मध्ये डाउनलोड करा' : 'Export verified financial audits, receipts, and balance sheets instantly'}
            </p>
          </div>

          {/* Event Filter */}
          {events.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                🎪 {isMr ? 'उत्सव निवडा:' : 'Filter by Event:'}
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">{isMr ? 'सर्व उत्सव (All Events)' : 'All Events'}</option>
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── 4 Report Cards Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24
          }}
        >
          {/* Card 1: Financial Summary */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                {isMr ? 'आर्थिक ताळेबंद (Financial Summary)' : 'Financial Summary'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                {isMr
                  ? 'सीए ऑडिट व बैठकीसाठी जमा-खर्चाचा संपूर्ण ताळेबंद, तपशील व शिल्लक रक्कम.'
                  : 'Export detailed donation and expense records for committee auditing and meetings.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
                onClick={() => handleFinancialSummary('pdf')}
                disabled={loading.finPdf}
              >
                {loading.finPdf ? '⏳ तयार होत आहे...' : '📄 Download PDF'}
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
                onClick={() => handleFinancialSummary('csv')}
                disabled={loading.finCsv}
              >
                {loading.finCsv ? '⏳...' : '📊 Export CSV'}
              </button>
            </div>
          </div>

          {/* Card 2: Receipt Register */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                {isMr ? 'पावती नोंदवही (Receipt Register)' : 'Receipt Register'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                {isMr
                  ? 'तयार केलेल्या सर्व अधिकृत डिजिटल पावत्यांची संपूर्ण अनुक्रमांक यादी.'
                  : 'Complete list of all generated receipts with numbers, donors, and transaction modes.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
                onClick={() => handleReceiptRegister('pdf')}
                disabled={loading.rcptPdf}
              >
                {loading.rcptPdf ? '⏳ तयार होत आहे...' : '📄 Download PDF'}
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
                onClick={() => handleReceiptRegister('csv')}
                disabled={loading.rcptCsv}
              >
                {loading.rcptCsv ? '⏳...' : '📊 Export CSV'}
              </button>
            </div>
          </div>

          {/* Card 3: Donor Database */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                {isMr ? 'देणगीदार यादी (Donor Database)' : 'Donor Database'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                {isMr
                  ? 'सर्व देणगीदारांची नावे, मोबाईल नंबर व एकूण देणगी इतिहास एक्सेल फाईलमध्ये.'
                  : 'Export consolidated donor contact list, total contributions, and history for outreach.'}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
              onClick={handleDonorDatabase}
              disabled={loading.donorCsv}
            >
              {loading.donorCsv ? '⏳ एक्सेल तयार होत आहे...' : '📊 Export Excel (CSV)'}
            </button>
          </div>

          {/* Card 4: Event Closure Report */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎪</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                {isMr ? 'उत्सव सांगता ताळेबंद (Event Closure)' : 'Event Closure Report'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                {isMr
                  ? 'उत्सवानंतरचा अंतिम आर्थिक अहवाल व अंदाजपत्रक पडताळणी पत्रक.'
                  : 'Final audited balance sheet, budget variance, and summary for completed festival events.'}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}
              onClick={handleEventClosure}
              disabled={loading.eventPdf}
            >
              {loading.eventPdf ? '⏳ अहवाल तयार होत आहे...' : '📄 Generate & Print PDF'}
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
