import { ExchangeRates, MultiCurrencyAmount, OperationStatusType, PaymentStatusType, UrgencyType } from '../types/document';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD_TO_LAK: 21800,
  CNY_TO_LAK: 3050,
};

export function formatCurrencyLAK(val: number): string {
  if (isNaN(val) || val === undefined) return '0 LAK';
  return new Intl.NumberFormat('lo-LA', {
    maximumFractionDigits: 0,
  }).format(val) + ' LAK';
}

export function formatCurrencyUSD(val: number): string {
  if (isNaN(val) || val === undefined) return '$0';
  return '$' + new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatCurrencyCNY(val: number): string {
  if (isNaN(val) || val === undefined) return '¥0';
  return '¥' + new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(val);
}

// Convert any multi-currency object to total equivalent LAK using daily rates
export function convertToTotalLAK(
  amount: MultiCurrencyAmount | undefined,
  rates: ExchangeRates
): number {
  if (!amount) return 0;
  const usdLAK = (amount.usd || 0) * (rates.USD_TO_LAK || DEFAULT_EXCHANGE_RATES.USD_TO_LAK);
  const cnyLAK = (amount.cny || 0) * (rates.CNY_TO_LAK || DEFAULT_EXCHANGE_RATES.CNY_TO_LAK);
  const lak = amount.lak || 0;
  const other = amount.otherValue || 0; // Assume in LAK or face value if non-specified
  return usdLAK + cnyLAK + lak + other;
}

// Format multi currency for table display
export function formatMultiCurrencySummary(amount: MultiCurrencyAmount | undefined, rates: ExchangeRates): string {
  if (!amount) return '0 LAK';
  const parts: string[] = [];
  if (amount.lak > 0) parts.push(`${formatCurrencyLAK(amount.lak)}`);
  if (amount.usd > 0) parts.push(`${formatCurrencyUSD(amount.usd)}`);
  if (amount.cny > 0) parts.push(`${formatCurrencyCNY(amount.cny)}`);
  if (amount.otherValue > 0) parts.push(`${amount.otherValue} ${amount.otherCurrency || ''}`);
  
  if (parts.length === 0) return '0 LAK';
  
  const totalLAK = convertToTotalLAK(amount, rates);
  if (parts.length > 1) {
    return `${parts.join(' + ')} (≈ ${formatCurrencyLAK(totalLAK)})`;
  }
  return parts[0];
}

// Compute processing days between work open date and completion or today
export function calculateProcessingDays(workOpenDate: string, completionDate?: string): number {
  if (!workOpenDate) return 0;
  const start = new Date(workOpenDate);
  if (isNaN(start.getTime())) return 0;
  
  const end = completionDate ? new Date(completionDate) : new Date();
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
}

// Calculate default expiry date (+10 months after completion date)
export function calculateDefaultExpiryDate(completionDate: string): string {
  if (!completionDate) return '';
  const comp = new Date(completionDate);
  if (isNaN(comp.getTime())) return '';
  
  comp.setMonth(comp.getMonth() + 10);
  return comp.toISOString().split('T')[0];
}

// Format date to Lao/International display (e.g. 25/07/2026)
export function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getUrgencyLabel(urgency: UrgencyType): { label: string; color: string; bg: string } {
  switch (urgency) {
    case 'URGENT':
      return { label: 'ດ່ວນ ⚡', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800' };
    case 'NORMAL':
    default:
      return { label: 'ປົກກະຕິ', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800' };
  }
}

export function getOperationStatusLabel(status: OperationStatusType): { label: string; color: string; bg: string } {
  switch (status) {
    case 'COMPLETED':
      return { label: 'ສຳເລັດ', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300' };
    case 'WAITING_ISSUE':
      return { label: 'ລໍຖ້າເອກະສານອອກ', color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300' };
    case 'WAITING_DOCS':
      return { label: 'ລໍຖ້າສະໜອງເອກະສານ', color: 'text-sky-800 dark:text-sky-300', bg: 'bg-sky-100 dark:bg-sky-950/60 border-sky-300' };
    case 'SUSPENDED':
      return { label: 'ໂຈະການດຳເນີນ', color: 'text-purple-800 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300' };
    case 'CANCELLED':
      return { label: 'ຍົກເລີກ', color: 'text-rose-800 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300' };
    default:
      return { label: 'ກຳລັງດຳເນີນ', color: 'text-gray-800 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300' };
  }
}

export function getPaymentStatusLabel(status: PaymentStatusType): { label: string; color: string; bg: string } {
  switch (status) {
    case 'PAID':
      return { label: 'ລູກຄ້າຊຳລະແລ້ວ 100%', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300' };
    case 'PAID_50':
      return { label: 'ລູກຄ້າຊຳລະ 50%', color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300' };
    case 'PAID_ON_COMPLETION':
      return { label: 'ຊຳລະເມື່ອເອກະສານສຳເລັດ', color: 'text-indigo-800 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300' };
    case 'UNPAID':
    default:
      return { label: 'ລູກຄ້າຄ້າງຊຳລະ', color: 'text-rose-800 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300' };
  }
}
