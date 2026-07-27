import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Table as TableIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Clock,
  Layers,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowLeftRight
} from 'lucide-react';
import { DocumentRecord, ExchangeRates, UrgencyType, OperationStatusType, PaymentStatusType } from '../types/document';
import {
  convertToTotalLAK,
  formatCurrencyLAK,
  formatCurrencyUSD,
  formatCurrencyCNY,
  formatDateDisplay,
  getUrgencyLabel,
  getOperationStatusLabel,
  getPaymentStatusLabel
} from '../utils/formatters';
import { printPDFReport, exportDocumentsToExcel } from '../utils/exportUtils';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
  onViewDetails: (doc: DocumentRecord) => void;
  onEditDocument: (doc: DocumentRecord) => void;
}

export const ConsolidatedAllInOneView: React.FC<Props> = ({
  documents,
  rates,
  onViewDetails,
  onEditDocument,
}) => {
  // Local filter states for Page 5 master table
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('ALL');
  const [stepFilter, setStepFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scrollbar synchronization refs & state
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const masterTableRef = useRef<HTMLTableElement>(null);
  const [masterTableWidth, setMasterTableWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (masterTableRef.current) {
        setMasterTableWidth(masterTableRef.current.scrollWidth);
      } else if (bottomScrollRef.current) {
        setMasterTableWidth(bottomScrollRef.current.scrollWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    if (bottomScrollRef.current) {
      observer.observe(bottomScrollRef.current);
    }
    if (masterTableRef.current) {
      observer.observe(masterTableRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, [documents]);

  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  const handleTopScroll = () => {
    if (isSyncingTop.current) {
      isSyncingTop.current = false;
      return;
    }
    if (topScrollRef.current && bottomScrollRef.current) {
      isSyncingBottom.current = true;
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (isSyncingBottom.current) {
      isSyncingBottom.current = false;
      return;
    }
    if (topScrollRef.current && bottomScrollRef.current) {
      isSyncingTop.current = true;
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Extract unique lines for filter dropdown
  const uniqueLines = useMemo(() => {
    const lines = new Set<string>();
    documents.forEach((d) => {
      if (d.line) lines.add(d.line);
    });
    return Array.from(lines);
  }, [documents]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (lineFilter !== 'ALL' && doc.line !== lineFilter) return false;
      if (statusFilter !== 'ALL' && doc.operationStatus !== statusFilter) return false;
      if (paymentFilter !== 'ALL' && doc.customerPayment.paymentStatus !== paymentFilter) return false;
      if (urgencyFilter !== 'ALL' && doc.urgency !== urgencyFilter) return false;
      
      if (companyTypeFilter !== 'ALL') {
        if (companyTypeFilter === 'NEW_ONLY' && !doc.isNewCompany) return false;
        if (companyTypeFilter === 'EXISTING_ONLY' && doc.isNewCompany) return false;
      }

      if (stepFilter !== 'ALL') {
        if (stepFilter === 'STAMPED' && !doc.isStamped) return false;
        if (stepFilter === 'UNSTAMPED' && doc.isStamped) return false;
        if (stepFilter === 'ASSEMBLED' && !doc.isAssembled) return false;
        if (stepFilter === 'UNASSEMBLED' && doc.isAssembled) return false;
        if (stepFilter === 'SUBMITTED' && !doc.isSubmitted) return false;
        if (stepFilter === 'UNSUBMITTED' && doc.isSubmitted) return false;
        if (stepFilter === 'TRACKED' && !doc.isTracked) return false;
        if (stepFilter === 'UNTRACKED' && doc.isTracked) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = doc.companyName.toLowerCase().includes(q);
        const matchTin = doc.tinNo.toLowerCase().includes(q);
        const matchIncoming = doc.incomingNo.toLowerCase().includes(q);
        const matchCoord = doc.coordinatorName.toLowerCase().includes(q);
        const matchLocation = doc.submissionLocation.toLowerCase().includes(q);

        if (!matchName && !matchTin && !matchIncoming && !matchCoord && !matchLocation) {
          return false;
        }
      }

      return true;
    });
  }, [documents, lineFilter, statusFilter, paymentFilter, urgencyFilter, companyTypeFilter, stepFilter, searchQuery]);

  // Format multi-currency values directly without applying exchange rates
  const formatDirectMultiCurrency = (
    val?: { lak?: number; usd?: number; cny?: number; otherValue?: number; otherCurrencyName?: string }
  ): string => {
    if (!val) return '0 LAK';
    const parts: string[] = [];
    if (val.lak !== undefined && val.lak !== 0) parts.push(formatCurrencyLAK(val.lak));
    if (val.usd !== undefined && val.usd !== 0) parts.push(formatCurrencyUSD(val.usd));
    if (val.cny !== undefined && val.cny !== 0) parts.push(formatCurrencyCNY(val.cny));
    if (val.otherValue !== undefined && val.otherValue !== 0) {
      parts.push(`${val.otherValue.toLocaleString()} ${val.otherCurrencyName || 'ອື່ນໆ'}`);
    }
    if (parts.length === 0) return '0 LAK';
    return parts.join(' + ');
  };

  // Financial calculations helper for a single document
  const calculateDocFinancials = (doc: DocumentRecord) => {
    // 1. Revenue (ລາຍຮັບ)
    const totalRevLAK = convertToTotalLAK(doc.totalValue, rates);
    const paidLAK = convertToTotalLAK(doc.customerPayment.paidAmount, rates);
    const outstandingLAK = convertToTotalLAK(doc.customerPayment.outstandingBalance, rates);

    // 2. Expenses (ລາຍຈ່າຍ)
    // - Installation expense
    const installLAK = (doc.installationExpense.lakCost || 0) + ((doc.installationExpense.usdCost || 0) * rates.USD_TO_LAK);
    
    // - Document fee expense
    const feeLAK = doc.documentProcessingExpense.feeCostLAK || 0;

    // - Urgent license fee expense
    const urgentFeeLAK = doc.documentProcessingExpense.urgentLicenseFeeLAK || 0;

    // - Support fee expense
    const supportFeeLAK = doc.documentProcessingExpense.supportFeeLAK || 0;

    const totalExpenseLAK = installLAK + feeLAK + urgentFeeLAK + supportFeeLAK;

    // 3. Net Profit / Balance (ກຳໄລ/ລາຍຮັບສຸດທິ)
    const netProfitLAK = totalRevLAK - totalExpenseLAK;

    return {
      totalRevLAK,
      paidLAK,
      outstandingLAK,
      installLAK,
      feeLAK,
      urgentFeeLAK,
      supportFeeLAK,
      totalExpenseLAK,
      netProfitLAK,
    };
  };

  // Aggregated totals across filtered documents (direct 4-currency totals + converted totals)
  const aggregates = useMemo(() => {
    return filteredDocs.reduce(
      (acc, doc) => {
        // 1. Revenue per currency
        const revLAK = doc.totalValue?.lak || 0;
        const revUSD = doc.totalValue?.usd || 0;
        const revCNY = doc.totalValue?.cny || 0;
        const revOther = doc.totalValue?.otherValue || 0;

        acc.revenue.lak += revLAK;
        acc.revenue.usd += revUSD;
        acc.revenue.cny += revCNY;
        acc.revenue.other += revOther;

        // 2. Paid / Received per currency
        const paidLAK = doc.customerPayment?.paidAmount?.lak || 0;
        const paidUSD = doc.customerPayment?.paidAmount?.usd || 0;
        const paidCNY = doc.customerPayment?.paidAmount?.cny || 0;
        const paidOther = doc.customerPayment?.paidAmount?.otherValue || 0;

        acc.paid.lak += paidLAK;
        acc.paid.usd += paidUSD;
        acc.paid.cny += paidCNY;
        acc.paid.other += paidOther;

        // 3. Outstanding Balance per currency
        const outLAK = doc.customerPayment?.outstandingBalance?.lak || 0;
        const outUSD = doc.customerPayment?.outstandingBalance?.usd || 0;
        const outCNY = doc.customerPayment?.outstandingBalance?.cny || 0;
        const outOther = doc.customerPayment?.outstandingBalance?.otherValue || 0;

        acc.outstanding.lak += outLAK;
        acc.outstanding.usd += outUSD;
        acc.outstanding.cny += outCNY;
        acc.outstanding.other += outOther;

        // 4. Expenses per currency
        const expLAK = (doc.installationExpense?.lakCost || 0) +
          (doc.documentProcessingExpense?.feeCostLAK || 0) +
          (doc.documentProcessingExpense?.urgentLicenseFeeLAK || 0) +
          (doc.documentProcessingExpense?.supportFeeLAK || 0);
        const expUSD = doc.installationExpense?.usdCost || 0;
        const expCNY = 0;
        const expOther = 0;

        acc.expenses.lak += expLAK;
        acc.expenses.usd += expUSD;
        acc.expenses.cny += expCNY;
        acc.expenses.other += expOther;

        // 5. Net Profit per currency (Revenue - Expenses)
        acc.netProfit.lak += (revLAK - expLAK);
        acc.netProfit.usd += (revUSD - expUSD);
        acc.netProfit.cny += (revCNY - expCNY);
        acc.netProfit.other += (revOther - expOther);

        // Converted values reference
        const fin = calculateDocFinancials(doc);
        acc.totalRevenue += fin.totalRevLAK;
        acc.totalPaid += fin.paidLAK;
        acc.totalOutstanding += fin.outstandingLAK;
        acc.totalInstallExp += fin.installLAK;
        acc.totalFeeExp += fin.feeLAK;
        acc.totalUrgentExp += fin.urgentFeeLAK;
        acc.totalSupportExp += fin.supportFeeLAK;
        acc.totalExpenses += fin.totalExpenseLAK;
        acc.totalNetProfit += fin.netProfitLAK;

        return acc;
      },
      {
        revenue: { lak: 0, usd: 0, cny: 0, other: 0 },
        paid: { lak: 0, usd: 0, cny: 0, other: 0 },
        outstanding: { lak: 0, usd: 0, cny: 0, other: 0 },
        expenses: { lak: 0, usd: 0, cny: 0, other: 0 },
        netProfit: { lak: 0, usd: 0, cny: 0, other: 0 },
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalInstallExp: 0,
        totalFeeExp: 0,
        totalUrgentExp: 0,
        totalSupportExp: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
      }
    );
  }, [filteredDocs, rates]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
            <TableIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-xl">
                ໜ້າທີ 5: ຕາຕະລາງລວມຂໍ້ມູນທັງໝົດ & ລາຍຮັບ-ລາຍຈ່າຍ
              </h2>
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Consolidated Master View
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ສະແດງຂໍ້ມູນທຸກຢ່າງໃນຕາຕະລາງດຽວ: ລາຍການເອກະສານ, ໂປຣແກຣມຕິດຕັ້ງ, ຂັ້ນຕອນ, ລາຍຮັບ-ລາຍຈ່າຍ ແລະ ກຳໄລສຸດທິ (ແຍກ 4 ສະກຸນເງິນ)
            </p>
          </div>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportDocumentsToExcel(filteredDocs, rates)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ດຶງ Excel</span>
          </button>
          <button
            onClick={() => printPDFReport('consolidated-master-table-container', 'ຕາຕະລາງລວມຂໍ້ມູນທັງໝົດ ແລະ ລາຍຮັບລາຍຈ່າຍ')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>ພິມ PDF</span>
          </button>
        </div>
      </div>

      {/* Top Key Financial Summary Cards Bar (5 Metrics x 4 Currencies) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Total Revenue (ລວມລາຍຮັບທັງໝົດ) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              1. ລວມລາຍຮັບທັງໝົດ
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">LAK:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrencyLAK(aggregates.revenue.lak)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">USD ($):</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrencyUSD(aggregates.revenue.usd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">CNY (¥):</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatCurrencyCNY(aggregates.revenue.cny)}</span>
            </div>
            {aggregates.revenue.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">ອື່ນໆ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{aggregates.revenue.other.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
            ລວມມູນຄ່າທັງໝົດຕາມ 4 ສະກຸນເງິນ
          </div>
        </div>

        {/* 2. Total Paid / Received (ຮັບຊຳລະແລ້ວ) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400">
              2. ຮັບຊຳລະແລ້ວ
            </span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">LAK:</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">{formatCurrencyLAK(aggregates.paid.lak)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">USD ($):</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrencyUSD(aggregates.paid.usd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">CNY (¥):</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatCurrencyCNY(aggregates.paid.cny)}</span>
            </div>
            {aggregates.paid.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">ອື່ນໆ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{aggregates.paid.other.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
            ຍອດເງິນທີ່ລູກຄ້າຊຳລະເຂົ້າມາແລ້ວ
          </div>
        </div>

        {/* 3. Total Outstanding (ຍອດຄ້າງຊຳລະ) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
              3. ຍອດຄ້າງຊຳລະ
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">LAK:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">{formatCurrencyLAK(aggregates.outstanding.lak)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">USD ($):</span>
              <span className="font-bold text-orange-700 dark:text-orange-300">{formatCurrencyUSD(aggregates.outstanding.usd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">CNY (¥):</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatCurrencyCNY(aggregates.outstanding.cny)}</span>
            </div>
            {aggregates.outstanding.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">ອື່ນໆ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{aggregates.outstanding.other.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
            ຍອດເງິນທີ່ລູກຄ້າຍັງບໍ່ທັນຊຳລະ
          </div>
        </div>

        {/* 4. Total Expenses (ລວມລາຍຈ່າຍທັງໝົດ) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400">
              4. ລວມລາຍຈ່າຍທັງໝົດ
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">LAK:</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatCurrencyLAK(aggregates.expenses.lak)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">USD ($):</span>
              <span className="font-bold text-orange-700 dark:text-orange-300">{formatCurrencyUSD(aggregates.expenses.usd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">CNY (¥):</span>
              <span className="font-bold text-slate-500 dark:text-slate-400">{formatCurrencyCNY(aggregates.expenses.cny)}</span>
            </div>
            {aggregates.expenses.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">ອື່ນໆ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{aggregates.expenses.other.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
            ລາຍຈ່າຍຄ່າຕິດຕັ້ງ, ທຳນຽມ ແລະ ໃບອະນຸຍາດ
          </div>
        </div>

        {/* 5. Net Profit (ກຳໄລ / ລາຍຮັບສຸດທິ) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
              5. ກຳໄລ / ລາຍຮັບສຸດທິ
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">LAK:</span>
              <span className={`font-bold ${aggregates.netProfit.lak >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600'}`}>
                {formatCurrencyLAK(aggregates.netProfit.lak)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">USD ($):</span>
              <span className={`font-bold ${aggregates.netProfit.usd >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600'}`}>
                {formatCurrencyUSD(aggregates.netProfit.usd)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">CNY (¥):</span>
              <span className={`font-bold ${aggregates.netProfit.cny >= 0 ? 'text-rose-700 dark:text-rose-300' : 'text-rose-600'}`}>
                {formatCurrencyCNY(aggregates.netProfit.cny)}
              </span>
            </div>
            {aggregates.netProfit.other !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">ອື່ນໆ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{aggregates.netProfit.other.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
            ຄິດໄລ່: ລາຍຮັບ - ລາຍຈ່າຍ ແຍກຕາມສະກຸນເງິນ
          </div>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>ຕົວກັ່ນກອງ & ຄົ້ນຫາຂໍ້ມູນຕາຕະລາງລວມ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ບໍລິສັດ, TIN, ຂາເຂົ້າ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Line Filter */}
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກສາຍ/ທຸກກຸ່ມ (ALL)</option>
            {uniqueLines.map((l) => (
              <option key={l} value={l}>
                ສາຍ: {l}
              </option>
            ))}
          </select>

          {/* Company Type Filter (New vs Existing) */}
          <select
            value={companyTypeFilter}
            onChange={(e) => setCompanyTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກປະເພດບໍລິສັດ (ALL)</option>
            <option value="NEW_ONLY">ບໍລິສັດເຂົ້າໃໝ່ 🆕 (New)</option>
            <option value="EXISTING_ONLY">ບໍລິສັດເກົ່າ (Existing)</option>
          </select>

          {/* Workflow Step Filter (4 ຂັ້ນຕອນ) */}
          <select
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກຂັ້ນຕອນ (ALL)</option>
            <option value="STAMPED">✓ ຈ້ຳກາແລ້ວ</option>
            <option value="UNSTAMPED">⏳ ຍັງບໍ່ຈ້ຳກາ</option>
            <option value="ASSEMBLED">✓ ປະກອບແລ້ວ</option>
            <option value="UNASSEMBLED">⏳ ຍັງບໍ່ປະກອບ</option>
            <option value="SUBMITTED">✓ ຍື່ນແລ້ວ</option>
            <option value="UNSUBMITTED">⏳ ຍັງບໍ່ຍື່ນ</option>
            <option value="TRACKED">✓ ຕິດຕາມແລ້ວ</option>
            <option value="UNTRACKED">⏳ ຍັງບໍ່ຕິດຕາມ</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກສະຖານະເອກະສານ (ALL)</option>
            <option value="COMPLETED">ສຳເລັດ</option>
            <option value="WAITING_ISSUE">ລໍຖ້າເອກະສານອອກ</option>
            <option value="WAITING_DOCS">ລໍຖ້າສະໜອງເອກະສານ</option>
            <option value="SUSPENDED">ໂຈະການດຳເນີນ</option>
            <option value="CANCELLED">ຍົກເລີກ</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກສະຖານະຊຳລະ (ALL)</option>
            <option value="PAID">ຊຳລະແລ້ວ 100%</option>
            <option value="PAID_50">ຊຳລະ 50%</option>
            <option value="PAID_ON_COMPLETION">ຊຳລະເມື່ອສຳເລັດ</option>
            <option value="UNPAID">ຄ້າງຊຳລະ</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">ທຸກລະດັບຄວາມດ່ວນ (ALL)</option>
            <option value="NORMAL">ປົກກະຕິ</option>
            <option value="URGENT">ດ່ວນ ⚡</option>
          </select>

        </div>

        {/* Counter Info */}
        <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
          <span>
            ສະແດງ: <strong>{filteredDocs.length}</strong> / {documents.length} ບໍລິສັດ
          </span>
          {(lineFilter !== 'ALL' || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || urgencyFilter !== 'ALL' || companyTypeFilter !== 'ALL' || stepFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setLineFilter('ALL');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setUrgencyFilter('ALL');
                setCompanyTypeFilter('ALL');
                setStepFilter('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              🔄 ລ້າງຕົວກັ່ນກອງທັງໝົດ
            </button>
          )}
        </div>
      </div>

      {/* Main Single Consolidated Master Table Container */}
      <div id="consolidated-master-table-container" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        
        {/* Top Scrollbar Bar Header */}
        <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ແຖບເລື່ອນຕາຕະລາງຢູ່ຫົວແຖວ (Top Scrollbar)</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            ເລື່ອນຕາຕະລາງຊ້າຍ-ຂວາ ຢູ່ຫົວແຖວໄດ້ທັນທີ
          </span>
        </div>

        {/* Top Horizontal Scrollbar Track */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto overflow-y-hidden bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-700/80"
          style={{ height: '16px' }}
        >
          <div style={{ width: `${masterTableWidth}px`, height: '1px' }} />
        </div>

        <div
          ref={bottomScrollRef}
          onScroll={handleBottomScroll}
          className="overflow-x-auto max-w-full"
        >
          <table ref={masterTableRef} className="w-full text-left border-collapse text-xs">
            
            {/* Table Header Row Groups */}
            <thead>
              {/* Category Group Row */}
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                <th colSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                  1. ຂໍ້ມູນບໍລິສັດ
                </th>
                <th colSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                  2. ສະຖານະ & ວັນທີ
                </th>
                <th colSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                  3. ໂປຣແກຣມ & ຂັ້ນຕອນ
                </th>
                <th colSpan={11} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  4. ລາຍຮັບ (INCOME & REVENUE)
                </th>
                <th colSpan={7} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  5. ລາຍຈ່າຍ (EXPENSES)
                </th>
                <th colSpan={4} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                  6. ກຳໄລສຸດທິ (NET PROFIT)
                </th>
                <th colSpan={1} className="px-3 py-2 text-center bg-slate-100 dark:bg-slate-800">
                  ຈັດການ
                </th>
              </tr>

              {/* Sub-Group Header Row */}
              <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-[10px]">
                <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center">ບໍລິສັດ / ສາຍງານ</th>
                <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center">ດຳເນີນງານ & ວັນທີ</th>
                <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center">ໂປຣແກຣມ & ຂັ້ນຕອນ</th>
                
                {/* Income Subgroups */}
                <th colSpan={4} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-100/50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200">4.1 ມູນຄ່າລວມ (4 ສະກຸນເງິນ)</th>
                <th colSpan={3} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-teal-100/50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200">4.2 ຮັບຊຳລະແລ້ວ (3 ສະກຸນເງິນ)</th>
                <th colSpan={3} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-amber-100/50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200">4.3 ຍອດຄ້າງຊຳລະ (3 ສະກຸນເງິນ)</th>
                <th colSpan={1} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-100/50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200">4.4 ສະຖານະ</th>

                {/* Expense Subgroups */}
                <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-rose-100/50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200">5.1 ຄ່າຕິດຕັ້ງ</th>
                <th colSpan={3} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-rose-100/50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200">5.2 ຄ່າບໍລິຫານ/ເອກະສານ LAK</th>
                <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-rose-200/60 dark:bg-rose-900/60 text-rose-950 dark:text-rose-100 font-black">5.3 ລວມລາຍຈ່າຍ</th>

                {/* Net Profit Subgroups */}
                <th colSpan={4} className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-100/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-black">6.1 ກຳໄລສຸດທິ (4 ສະກຸນເງິນ)</th>
                
                <th colSpan={1} className="px-2 py-1.5 text-center">ຈັດການ</th>
              </tr>

              {/* Column Detail Row */}
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px]">
                <th className="px-2.5 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 min-w-[170px]">ຊື່ບໍລິສັດ / TIN / ສາຍ</th>
                
                <th className="px-3 py-2 min-w-[110px]">ສະຖານະວຽກ</th>
                <th className="px-3 py-2 min-w-[110px]">ວັນທີເປີດ-ໝົດອາຍຸ</th>
                
                <th className="px-3 py-2 min-w-[100px]">ໂປຣແກຣມ</th>
                <th className="px-3 py-2 min-w-[100px]">4 ຂັ້ນຕອນ</th>
                
                {/* 4.1 Revenue breakdown */}
                <th className="px-2.5 py-2 text-right bg-emerald-50/50 dark:bg-emerald-950/20 font-bold min-w-[95px]">LAK</th>
                <th className="px-2.5 py-2 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-blue-700 dark:text-blue-400 font-bold min-w-[80px]">USD ($)</th>
                <th className="px-2.5 py-2 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-rose-700 dark:text-rose-400 font-bold min-w-[80px]">CNY (¥)</th>
                <th className="px-2.5 py-2 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-purple-700 dark:text-purple-400 font-bold min-w-[80px]">ອື່ນໆ</th>
                
                {/* 4.2 Paid breakdown */}
                <th className="px-2.5 py-2 text-right bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-bold min-w-[95px]">LAK</th>
                <th className="px-2.5 py-2 text-right bg-teal-50/50 dark:bg-teal-950/20 text-blue-700 dark:text-blue-400 font-bold min-w-[80px]">USD ($)</th>
                <th className="px-2.5 py-2 text-right bg-teal-50/50 dark:bg-teal-950/20 text-rose-700 dark:text-rose-400 font-bold min-w-[80px]">CNY (¥)</th>
                
                {/* 4.3 Outstanding breakdown */}
                <th className="px-2.5 py-2 text-right bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-bold min-w-[95px]">LAK</th>
                <th className="px-2.5 py-2 text-right bg-amber-50/50 dark:bg-amber-950/20 text-blue-700 dark:text-blue-400 font-bold min-w-[80px]">USD ($)</th>
                <th className="px-2.5 py-2 text-right bg-amber-50/50 dark:bg-amber-950/20 text-rose-700 dark:text-rose-400 font-bold min-w-[80px]">CNY (¥)</th>

                {/* 4.4 Payment Status */}
                <th className="px-2.5 py-2 text-center bg-emerald-50/50 dark:bg-emerald-950/20 min-w-[95px]">ສະຖານະຊຳລະ</th>
                
                {/* 5.1 Installation cost */}
                <th className="px-2.5 py-2 text-right bg-rose-50/50 dark:bg-rose-950/20 min-w-[85px]">LAK</th>
                <th className="px-2.5 py-2 text-right bg-rose-50/50 dark:bg-rose-950/20 text-blue-700 dark:text-blue-400 min-w-[75px]">USD ($)</th>

                {/* 5.2 Processing fees */}
                <th className="px-2.5 py-2 text-right bg-rose-50/50 dark:bg-rose-950/20 min-w-[85px]">ຄ່າທຳນຽມ</th>
                <th className="px-2.5 py-2 text-right bg-rose-50/50 dark:bg-rose-950/20 min-w-[85px]">ຄ່າໃບອະນຸຍາດ</th>
                <th className="px-2.5 py-2 text-right bg-rose-50/50 dark:bg-rose-950/20 min-w-[85px]">ຄ່າຊ່ວຍເຫຼືອ</th>

                {/* 5.3 Total Expenses */}
                <th className="px-2.5 py-2 text-right font-black bg-rose-100/60 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 min-w-[95px]">LAK</th>
                <th className="px-2.5 py-2 text-right font-black bg-rose-100/60 dark:bg-rose-950/60 text-blue-700 dark:text-blue-300 min-w-[80px]">USD ($)</th>
                
                {/* 6.1 Net Profit breakdown */}
                <th className="px-2.5 py-2 text-right font-black bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 min-w-[95px]">LAK</th>
                <th className="px-2.5 py-2 text-right font-black bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 min-w-[80px]">USD ($)</th>
                <th className="px-2.5 py-2 text-right font-black bg-blue-50 dark:bg-blue-950/50 text-rose-700 dark:text-rose-300 min-w-[80px]">CNY (¥)</th>
                <th className="px-2.5 py-2 text-right font-black bg-blue-50 dark:bg-blue-950/50 text-purple-700 dark:text-purple-300 min-w-[80px]">ອື່ນໆ</th>

                <th className="px-2.5 py-2 w-16 text-center">ຈັດການ</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={29} className="px-4 py-8 text-center text-slate-400 italic">
                    ບໍ່ພົບຂໍ້ມູນເອກະສານຕາມຕົວກັ່ນກອງ
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const urgencyObj = getUrgencyLabel(doc.urgency);
                  const statusObj = getOperationStatusLabel(doc.operationStatus);
                  const paymentObj = getPaymentStatusLabel(doc.customerPayment.paymentStatus);

                  const sw = doc.softwareInstallation;
                  const activeSoftwares: string[] = [];
                  if (sw.apis) activeSoftwares.push('APIS');
                  if (sw.tsd) activeSoftwares.push('TSD');
                  if (sw.pkt) activeSoftwares.push('PKT');
                  if (sw.renew2026) activeSoftwares.push('Renew 2026');

                  const isUrgent = doc.urgency === 'URGENT';

                  // Financial values
                  const revLAK = doc.totalValue?.lak || 0;
                  const revUSD = doc.totalValue?.usd || 0;
                  const revCNY = doc.totalValue?.cny || 0;
                  const revOther = doc.totalValue?.otherValue || 0;

                  const paidLAK = doc.customerPayment?.paidAmount?.lak || 0;
                  const paidUSD = doc.customerPayment?.paidAmount?.usd || 0;
                  const paidCNY = doc.customerPayment?.paidAmount?.cny || 0;

                  const outLAK = doc.customerPayment?.outstandingBalance?.lak || 0;
                  const outUSD = doc.customerPayment?.outstandingBalance?.usd || 0;
                  const outCNY = doc.customerPayment?.outstandingBalance?.cny || 0;

                  const installLAK = doc.installationExpense?.lakCost || 0;
                  const installUSD = doc.installationExpense?.usdCost || 0;
                  const feeLAK = doc.documentProcessingExpense?.feeCostLAK || 0;
                  const urgentLAK = doc.documentProcessingExpense?.urgentLicenseFeeLAK || 0;
                  const supportLAK = doc.documentProcessingExpense?.supportFeeLAK || 0;

                  const totalExpLAK = installLAK + feeLAK + urgentLAK + supportLAK;
                  const totalExpUSD = installUSD;

                  const netLAK = revLAK - totalExpLAK;
                  const netUSD = revUSD - totalExpUSD;
                  const netCNY = revCNY;
                  const netOther = revOther;

                  return (
                    <tr
                      key={doc.id}
                      className={`transition ${
                        isUrgent
                          ? 'bg-amber-100/90 dark:bg-amber-950/80 hover:bg-amber-200/80 dark:hover:bg-amber-900/90 border-l-4 border-l-amber-500 font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-amber-300 dark:ring-amber-700/80 shadow-xs'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {/* Seq */}
                      <td className="px-2.5 py-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Company Name & TIN */}
                      <td className="px-3 py-2.5 font-medium">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                          <span className="truncate max-w-[170px]">{doc.companyName}</span>
                          {doc.isNewCompany && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>TIN: {doc.tinNo || '-'}</span>
                          <span className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-semibold text-slate-600 dark:text-slate-300">
                            {doc.line || 'ບໍ່ມີສາຍ'}
                          </span>
                        </div>
                      </td>

                      {/* Status & Urgency */}
                      <td className="px-3 py-2.5">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${statusObj.bg} ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                          <div>
                            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${urgencyObj.bg} ${urgencyObj.color}`}>
                              {urgencyObj.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-3 py-2.5 text-[11px] space-y-0.5">
                        <div>
                          <span className="text-slate-400">ເປີດ: </span>
                          <span>{formatDateDisplay(doc.workOpenDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ໝົດອາຍຸ: </span>
                          <span className={doc.expiryDate ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                            {formatDateDisplay(doc.expiryDate)}
                          </span>
                        </div>
                      </td>

                      {/* Software Installed */}
                      <td className="px-3 py-2.5">
                        {activeSoftwares.length === 0 ? (
                          <span className="text-slate-400 italic text-[10px]">ບໍ່ມີ</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeSoftwares.map((swName) => (
                              <span
                                key={swName}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                {swName}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] mt-1 text-slate-400">
                          {sw.isInstalled ? (
                            <span className="text-emerald-600 font-bold">✓ ຕິດຕັ້ງແລ້ວ</span>
                          ) : (
                            <span className="text-amber-600">⏳ ຍັງບໍ່ຕິດຕັ້ງ</span>
                          )}
                        </div>
                      </td>

                      {/* 4 Checkbox Steps */}
                      <td className="px-3 py-2.5 text-[10px]">
                        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                          <span className={doc.isStamped ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {doc.isStamped ? '✓ ຈ້ຳກາ' : '✗ ຈ້ຳກາ'}
                          </span>
                          <span className={doc.isAssembled ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {doc.isAssembled ? '✓ ປະກອບ' : '✗ ປະກອບ'}
                          </span>
                          <span className={doc.isSubmitted ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {doc.isSubmitted ? '✓ ຍື່ນ' : '✗ ຍື່ນ'}
                          </span>
                          <span className={doc.isTracked ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {doc.isTracked ? '✓ ຕິດຕາມ' : '✗ ຕິດຕາມ'}
                          </span>
                        </div>
                      </td>

                      {/* 4.1 REVENUE BREAKDOWN */}
                      <td className="px-2.5 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {revLAK > 0 ? formatCurrencyLAK(revLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-bold text-blue-700 dark:text-blue-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {revUSD > 0 ? formatCurrencyUSD(revUSD) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-bold text-rose-700 dark:text-rose-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {revCNY > 0 ? formatCurrencyCNY(revCNY) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-bold text-purple-700 dark:text-purple-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {revOther > 0 ? `${revOther.toLocaleString()} ${doc.totalValue?.otherCurrencyName || ''}` : '-'}
                      </td>

                      {/* 4.2 PAID BREAKDOWN */}
                      <td className="px-2.5 py-2.5 text-right font-semibold text-teal-700 dark:text-teal-300 bg-teal-50/20 dark:bg-teal-950/10">
                        {paidLAK > 0 ? formatCurrencyLAK(paidLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-semibold text-blue-700 dark:text-blue-400 bg-teal-50/20 dark:bg-teal-950/10">
                        {paidUSD > 0 ? formatCurrencyUSD(paidUSD) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-semibold text-rose-700 dark:text-rose-400 bg-teal-50/20 dark:bg-teal-950/10">
                        {paidCNY > 0 ? formatCurrencyCNY(paidCNY) : '-'}
                      </td>

                      {/* 4.3 OUTSTANDING BREAKDOWN */}
                      <td className="px-2.5 py-2.5 text-right font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10">
                        {outLAK > 0 ? formatCurrencyLAK(outLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-semibold text-blue-700 dark:text-blue-400 bg-amber-50/20 dark:bg-amber-950/10">
                        {outUSD > 0 ? formatCurrencyUSD(outUSD) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-semibold text-rose-700 dark:text-rose-400 bg-amber-50/20 dark:bg-amber-950/10">
                        {outCNY > 0 ? formatCurrencyCNY(outCNY) : '-'}
                      </td>

                      {/* 4.4 Payment Status Badge */}
                      <td className="px-2.5 py-2.5 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${paymentObj.bg} ${paymentObj.color}`}>
                          {paymentObj.label}
                        </span>
                      </td>

                      {/* 5.1 INSTALLATION EXPENSES */}
                      <td className="px-2.5 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10 font-semibold">
                        {installLAK > 0 ? formatCurrencyLAK(installLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-blue-700 dark:text-blue-400 bg-rose-50/20 dark:bg-rose-950/10 font-semibold">
                        {installUSD > 0 ? formatCurrencyUSD(installUSD) : '-'}
                      </td>

                      {/* 5.2 PROCESSING FEES */}
                      <td className="px-2.5 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                        {feeLAK > 0 ? formatCurrencyLAK(feeLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                        {urgentLAK > 0 ? formatCurrencyLAK(urgentLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                        {supportLAK > 0 ? formatCurrencyLAK(supportLAK) : '-'}
                      </td>

                      {/* 5.3 TOTAL EXPENSES */}
                      <td className="px-2.5 py-2.5 text-right font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100/40 dark:bg-rose-950/40">
                        {totalExpLAK > 0 ? formatCurrencyLAK(totalExpLAK) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-extrabold text-blue-700 dark:text-blue-300 bg-rose-100/40 dark:bg-rose-950/40">
                        {totalExpUSD > 0 ? formatCurrencyUSD(totalExpUSD) : '-'}
                      </td>

                      {/* 6.1 NET PROFIT BREAKDOWN */}
                      <td className={`px-2.5 py-2.5 text-right font-black bg-blue-50/60 dark:bg-blue-950/40 ${netLAK >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrencyLAK(netLAK)}
                      </td>
                      <td className={`px-2.5 py-2.5 text-right font-black bg-blue-50/60 dark:bg-blue-950/40 ${netUSD >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {netUSD !== 0 ? formatCurrencyUSD(netUSD) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-black bg-blue-50/60 dark:bg-blue-950/40 text-rose-700 dark:text-rose-300">
                        {netCNY !== 0 ? formatCurrencyCNY(netCNY) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-black bg-blue-50/60 dark:bg-blue-950/40 text-purple-700 dark:text-purple-300">
                        {netOther !== 0 ? netOther.toLocaleString() : '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-2.5 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onViewDetails(doc)}
                            title="ເບິ່ງລາຍລະອຽດ"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditDocument(doc)}
                            title="ດັດແກ້"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Summary Row */}
            {filteredDocs.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200/90 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-600 font-black text-slate-900 dark:text-slate-100">
                  <td colSpan={6} className="px-3 py-3 text-right text-xs">
                    ລວມຍອດທັງໝົດ ({filteredDocs.length} ບໍລິສັດ):
                  </td>
                  
                  {/* Revenue Totals */}
                  <td className="px-2.5 py-3 text-right bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-black">
                    {formatCurrencyLAK(aggregates.revenue.lak)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-emerald-100/60 dark:bg-emerald-950/60 text-blue-800 dark:text-blue-300 font-black">
                    {formatCurrencyUSD(aggregates.revenue.usd)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-emerald-100/60 dark:bg-emerald-950/60 text-rose-800 dark:text-rose-300 font-black">
                    {formatCurrencyCNY(aggregates.revenue.cny)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-emerald-100/60 dark:bg-emerald-950/60 text-purple-800 dark:text-purple-300 font-black">
                    {aggregates.revenue.other ? aggregates.revenue.other.toLocaleString() : '-'}
                  </td>

                  {/* Paid Totals */}
                  <td className="px-2.5 py-3 text-right bg-teal-100/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-black">
                    {formatCurrencyLAK(aggregates.paid.lak)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-teal-100/60 dark:bg-teal-950/60 text-blue-800 dark:text-blue-300 font-black">
                    {formatCurrencyUSD(aggregates.paid.usd)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-teal-100/60 dark:bg-teal-950/60 text-rose-800 dark:text-rose-300 font-black">
                    {formatCurrencyCNY(aggregates.paid.cny)}
                  </td>

                  {/* Outstanding Totals */}
                  <td className="px-2.5 py-3 text-right bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-black">
                    {formatCurrencyLAK(aggregates.outstanding.lak)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-amber-100/60 dark:bg-amber-950/60 text-blue-800 dark:text-blue-300 font-black">
                    {formatCurrencyUSD(aggregates.outstanding.usd)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-amber-100/60 dark:bg-amber-950/60 text-rose-800 dark:text-rose-300 font-black">
                    {formatCurrencyCNY(aggregates.outstanding.cny)}
                  </td>

                  {/* Status column empty in footer */}
                  <td className="px-2 py-3 bg-emerald-100/60 dark:bg-emerald-950/60"></td>

                  {/* Expense Breakdown Totals */}
                  <td className="px-2.5 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 font-black">
                    {formatCurrencyLAK(aggregates.expenses.installLAK)}
                  </td>
                  <td className="px-2.5 py-3 text-right text-blue-700 dark:text-blue-300 bg-rose-100/60 dark:bg-rose-950/60 font-black">
                    {formatCurrencyUSD(aggregates.expenses.installUSD)}
                  </td>
                  <td className="px-2.5 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 font-black">
                    {formatCurrencyLAK(aggregates.expenses.feeLAK)}
                  </td>
                  <td className="px-2.5 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 font-black">
                    {formatCurrencyLAK(aggregates.expenses.urgentLAK)}
                  </td>
                  <td className="px-2.5 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 font-black">
                    {formatCurrencyLAK(aggregates.expenses.supportLAK)}
                  </td>

                  {/* Total Expense LAK & USD */}
                  <td className="px-2.5 py-3 text-right bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 font-black">
                    {formatCurrencyLAK(aggregates.expenses.totalLAK)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-rose-200/80 dark:bg-rose-900/80 text-blue-900 dark:text-blue-100 font-black">
                    {formatCurrencyUSD(aggregates.expenses.totalUSD)}
                  </td>

                  {/* Grand Net Profit Breakdown */}
                  <td className={`px-2.5 py-3 text-right bg-blue-100/80 dark:bg-blue-950/80 font-black ${aggregates.netProfit.lak >= 0 ? 'text-blue-900 dark:text-blue-200' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrencyLAK(aggregates.netProfit.lak)}
                  </td>
                  <td className={`px-2.5 py-3 text-right bg-blue-100/80 dark:bg-blue-950/80 font-black ${aggregates.netProfit.usd >= 0 ? 'text-blue-900 dark:text-blue-200' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrencyUSD(aggregates.netProfit.usd)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-blue-100/80 dark:bg-blue-950/80 text-rose-800 dark:text-rose-300 font-black">
                    {formatCurrencyCNY(aggregates.netProfit.cny)}
                  </td>
                  <td className="px-2.5 py-3 text-right bg-blue-100/80 dark:bg-blue-950/80 text-purple-800 dark:text-purple-300 font-black">
                    {aggregates.netProfit.other ? aggregates.netProfit.other.toLocaleString() : '-'}
                  </td>

                  <td className="px-2 py-3"></td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            💡 <strong>ໝາຍເຫດ:</strong> ຂໍ້ມູນການເງິນທຸກຢ່າງໃນຕາຕະລາງນີ້ຖືກແຍກສະແດງຕາມ 29 ຄໍລຳຈະແຈ້ງ ສຳລັບ 4 ສະກຸນເງິນ (LAK, USD, CNY, ອື່ນໆ) ໂດຍບໍ່ໄດ້ເອົາທຸກສະກຸນເງິນໄປລວມໃນຊ່ອງດຽວກັນ.
          </span>
        </div>

      </div>

    </div>
  );
};
