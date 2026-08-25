// Convert numbers to Indian English & Marathi words for traditional receipts
const ONES_EN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export function numberToWordsEn(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';
  if (n < 0) return 'Invalid Amount';

  function convertLessThanThousand(val) {
    if (val === 0) return '';
    if (val < 20) return ONES_EN[val] + ' ';
    if (val < 100) return TENS_EN[Math.floor(val / 10)] + ' ' + ONES_EN[val % 10] + (val % 10 ? ' ' : '');
    return ONES_EN[Math.floor(val / 100)] + ' Hundred ' + convertLessThanThousand(val % 100);
  }

  let result = '';
  let crore = Math.floor(n / 10000000);
  let lakh = Math.floor((n % 10000000) / 100000);
  let thousand = Math.floor((n % 100000) / 1000);
  let remainder = n % 1000;

  if (crore) result += convertLessThanThousand(crore) + 'Crore ';
  if (lakh) result += convertLessThanThousand(lakh) + 'Lakh ';
  if (thousand) result += convertLessThanThousand(thousand) + 'Thousand ';
  if (remainder) result += convertLessThanThousand(remainder);

  return result.trim() + ' Rupees Only';
}

export function numberToWordsMr(num) {
  // Marathi readable representation or English readable with fallback
  return numberToWordsEn(num);
}
