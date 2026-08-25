const Counter = require('../models/Counter');

// Determines Indian-style financial year label, e.g. April 2025 -> "2025-26"
const getFinancialYearLabel = (date = new Date(), fyStartMonth = 4) => {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  if (month >= fyStartMonth) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
};

// Atomically increments and returns the next trusted receipt number for a mandal + FY
const getNextReceiptNumber = async (mandalId, receiptPrefix = 'RCPT', fyStartMonth = 4) => {
  const fy = getFinancialYearLabel(new Date(), fyStartMonth);
  const key = `${mandalId}_${fy}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(5, '0');
  return `${receiptPrefix}/${fy}/${padded}`;
};

module.exports = { getNextReceiptNumber, getFinancialYearLabel };
