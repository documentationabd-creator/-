import React, { useState, useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { DocumentRecord, ExchangeRates, UrgencyType, OperationStatusType, PaymentStatusType } from '../types/document';
import {
  convertToTotalLAK,
  formatCurrencyLAK,
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

  // Aggregated totals across filtered documents
  const aggregates = useMemo(() => {
    return filteredDocs.reduce(
      (acc, doc) => {
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
              ສະແດງຂໍ້ມູນທຸກຢ່າງໃນຕາຕະລາງດຽວ: ລາຍການເອກະສານ, ໂປຣແກຣມຕິດຕັ້ງ, ຂັ້ນຕອນ, ລາຍຮັບ-ລາຍຈ່າຍ ແລະ ກຳໄລສຸດທິ
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

      {/* Top Key Financial Summary Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ລວມລາຍຮັບທັງໝົດ</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrencyLAK(aggregates.totalRevenue)}
          </p>
          <p className="text-[10px] text-slate-400">
            ມູນຄ່າລວມຕາມສັນຍາ/ເອກະສານ
          </p>
        </div>

        {/* Total Paid / Received */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ຮັບຊຳລະແລ້ວ</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-lg font-black text-teal-600 dark:text-teal-400 truncate">
            {formatCurrencyLAK(aggregates.totalPaid)}
          </p>
          <p className="text-[10px] text-slate-400">
            ຈຳນວນເງິນທີ່ລູກຄ້າຊຳລະແລ້ວ
          </p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ລວມຄ້າງຊຳລະ</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 truncate">
            {formatCurrencyLAK(aggregates.totalOutstanding)}
          </p>
          <p className="text-[10px] text-slate-400">
            ຈຳນວນເງິນທີ່ຍັງບໍ່ທັນເກັບ
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ລວມລາຍຈ່າຍທັງໝົດ</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 truncate">
            {formatCurrencyLAK(aggregates.totalExpenses)}
          </p>
          <p className="text-[10px] text-slate-400">
            ຄ່າຕິດຕັ້ງ + ຄ່າທຳນຽມ + ຄ່າໃບອະນຸຍາດ
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ກຳໄລ / ລາຍຮັບສຸດທິ</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className={`text-lg font-black truncate ${aggregates.totalNetProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrencyLAK(aggregates.totalNetProfit)}
          </p>
          <p className="text-[10px] text-slate-400">
            ລາຍຮັບລວມ - ລາຍຈ່າຍລວມ
          </p>
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
        
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            
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
                <th colSpan={4} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  4. ລາຍຮັບ (INCOME & REVENUE)
                </th>
                <th colSpan={5} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  5. ລາຍຈ່າຍ (EXPENSES)
                </th>
                <th colSpan={2} className="px-3 py-2 text-center bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                  6. ກຳໄລ/ລາຍຮັບສຸດທິ & ຈັດການ
                </th>
              </tr>

              {/* Column Detail Row */}
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 min-w-[180px]">ຊື່ບໍລິສັດ / TIN / ສາຍ</th>
                
                <th className="px-3 py-2.5 min-w-[120px]">ສະຖານະວຽກ</th>
                <th className="px-3 py-2.5 min-w-[120px]">ວັນທີເປີດ-ໝົດອາຍຸ</th>
                
                <th className="px-3 py-2.5 min-w-[110px]">ໂປຣແກຣມ</th>
                <th className="px-3 py-2.5 min-w-[110px]">4 ຂັ້ນຕອນ</th>
                
                {/* Income Columns */}
                <th className="px-3 py-2.5 min-w-[110px] text-right bg-emerald-50/50 dark:bg-emerald-950/20">ມູນຄ່າລວມ LAK</th>
                <th className="px-3 py-2.5 min-w-[100px] text-right bg-emerald-50/50 dark:bg-emerald-950/20">ຮັບແລ້ວ LAK</th>
                <th className="px-3 py-2.5 min-w-[100px] text-right bg-emerald-50/50 dark:bg-emerald-950/20">ຄ້າງຊຳລະ LAK</th>
                <th className="px-3 py-2.5 min-w-[110px] text-center bg-emerald-50/50 dark:bg-emerald-950/20">ສະຖານະຊຳລະ</th>
                
                {/* Expense Columns */}
                <th className="px-3 py-2.5 min-w-[90px] text-right bg-rose-50/50 dark:bg-rose-950/20">ຄ່າຕິດຕັ້ງ</th>
                <th className="px-3 py-2.5 min-w-[90px] text-right bg-rose-50/50 dark:bg-rose-950/20">ຄ່າທຳນຽມ</th>
                <th className="px-3 py-2.5 min-w-[90px] text-right bg-rose-50/50 dark:bg-rose-950/20">ຄ່າໃບອະນຸຍາດ</th>
                <th className="px-3 py-2.5 min-w-[90px] text-right bg-rose-50/50 dark:bg-rose-950/20">ຄ່າຊ່ວຍເຫຼືອ</th>
                <th className="px-3 py-2.5 min-w-[110px] text-right font-black bg-rose-100/60 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">ລວມລາຍຈ່າຍ LAK</th>
                
                {/* Net Profit Column */}
                <th className="px-3 py-2.5 min-w-[120px] text-right font-black bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">ກຳໄລສຸດທິ LAK</th>
                <th className="px-3 py-2.5 w-16 text-center">ຈັດການ</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-slate-400 italic">
                    ບໍ່ພົບຂໍ້ມູນເອກະສານຕາມຕົວກັ່ນກອງ
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const fin = calculateDocFinancials(doc);
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
                      <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Company Name & TIN */}
                      <td className="px-3 py-2.5 font-medium">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                          <span className="truncate max-w-[180px]">{doc.companyName}</span>
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

                      {/* INCOME: Revenue LAK */}
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {formatCurrencyLAK(fin.totalRevLAK)}
                      </td>

                      {/* INCOME: Paid LAK */}
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {formatCurrencyLAK(fin.paidLAK)}
                      </td>

                      {/* INCOME: Outstanding Balance LAK */}
                      <td className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {formatCurrencyLAK(fin.outstandingLAK)}
                      </td>

                      {/* INCOME: Payment Status Badge */}
                      <td className="px-3 py-2.5 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${paymentObj.bg} ${paymentObj.color}`}>
                          {paymentObj.label}
                        </span>
                      </td>

                      {/* EXPENSES: Install Cost */}
                      <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {fin.installLAK > 0 ? formatCurrencyLAK(fin.installLAK) : '-'}
                      </td>

                      {/* EXPENSES: Fee Cost */}
                      <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {fin.feeLAK > 0 ? formatCurrencyLAK(fin.feeLAK) : '-'}
                      </td>

                      {/* EXPENSES: Urgent License Fee */}
                      <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {fin.urgentFeeLAK > 0 ? formatCurrencyLAK(fin.urgentFeeLAK) : '-'}
                      </td>

                      {/* EXPENSES: Support Fee */}
                      <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {fin.supportFeeLAK > 0 ? formatCurrencyLAK(fin.supportFeeLAK) : '-'}
                      </td>

                      {/* EXPENSES: Total Expense LAK */}
                      <td className="px-3 py-2.5 text-right font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100/40 dark:bg-rose-950/40">
                        {formatCurrencyLAK(fin.totalExpenseLAK)}
                      </td>

                      {/* NET PROFIT LAK */}
                      <td className={`px-3 py-2.5 text-right font-black bg-blue-50/60 dark:bg-blue-950/40 ${fin.netProfitLAK >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrencyLAK(fin.netProfitLAK)}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center">
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
                  
                  {/* Income Totals */}
                  <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60">
                    {formatCurrencyLAK(aggregates.totalRevenue)}
                  </td>
                  <td className="px-3 py-3 text-right text-teal-700 dark:text-teal-300 bg-emerald-100/60 dark:bg-emerald-950/60">
                    {formatCurrencyLAK(aggregates.totalPaid)}
                  </td>
                  <td className="px-3 py-3 text-right text-amber-700 dark:text-amber-300 bg-emerald-100/60 dark:bg-emerald-950/60">
                    {formatCurrencyLAK(aggregates.totalOutstanding)}
                  </td>
                  <td className="px-3 py-3 bg-emerald-100/60 dark:bg-emerald-950/60"></td>

                  {/* Expense Breakdown Totals */}
                  <td className="px-3 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60">
                    {formatCurrencyLAK(aggregates.totalInstallExp)}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60">
                    {formatCurrencyLAK(aggregates.totalFeeExp)}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60">
                    {formatCurrencyLAK(aggregates.totalUrgentExp)}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60">
                    {formatCurrencyLAK(aggregates.totalSupportExp)}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-800 dark:text-rose-200 bg-rose-200/80 dark:bg-rose-900/80 text-sm">
                    {formatCurrencyLAK(aggregates.totalExpenses)}
                  </td>

                  {/* Grand Net Profit */}
                  <td className={`px-3 py-3 text-right text-sm bg-blue-100/80 dark:bg-blue-950/80 ${aggregates.totalNetProfit >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrencyLAK(aggregates.totalNetProfit)}
                  </td>

                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            💡 <strong>ໝາຍເຫດ:</strong> ຂໍ້ມູນທັງໝົດໃນຕາຕະລາງນີ້ຖືກຄິດໄລ່ປ່ຽນເປັນສະກຸນເງິນກີບ (LAK) ຕາມອັດຕາແລກປ່ຽນປະຈຳມື້ auto-conversion.
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            ອັດຕາແລກປ່ຽນ: $1 = {formatCurrencyLAK(rates.USD_TO_LAK)} | ¥1 = {formatCurrencyLAK(rates.CNY_TO_LAK)}
          </span>
        </div>

      </div>

    </div>
  );
};
