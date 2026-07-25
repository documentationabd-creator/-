import React, { useState } from 'react';
import { DollarSign, Clock, Building2, Calendar, AlertTriangle, CheckCircle2, FileCheck, Send, Eye, ShieldCheck, Printer, ArrowUpRight, TrendingUp } from 'lucide-react';
import { DocumentRecord, ExchangeRates, TimeframeType } from '../types/document';
import { convertToTotalLAK, formatCurrencyLAK } from '../utils/formatters';
import { printPDFReport } from '../utils/exportUtils';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
}

export const DashboardOverview: React.FC<Props> = ({ documents, rates }) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('1_MONTH');

  // Filter documents by selected timeframe
  const getFilteredDocuments = () => {
    const now = new Date();
    return documents.filter((doc) => {
      if (!doc.workOpenDate) return true;
      const docDate = new Date(doc.workOpenDate);
      const diffTime = Math.abs(now.getTime() - docDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (timeframe) {
        case '1_WEEK':
          return diffDays <= 7;
        case '1_MONTH':
          return diffDays <= 30;
        case '3_MONTHS':
          return diffDays <= 90;
        case '6_MONTHS':
          return diffDays <= 180;
        case 'YEAR_END':
          return docDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const filteredDocs = getFilteredDocuments();

  // Compute 10 Key Metrics required
  // 1. Total Revenue in LAK
  const totalRevenueLAK = filteredDocs.reduce(
    (acc, doc) => acc + convertToTotalLAK(doc.totalValue, rates),
    0
  );

  // 2. Total Outstanding Balance in LAK
  const totalOutstandingLAK = filteredDocs.reduce(
    (acc, doc) => acc + convertToTotalLAK(doc.customerPayment.outstandingBalance, rates),
    0
  );

  // 3. Total Opened Companies in timeframe
  const totalOpenedCompanies = filteredDocs.length;

  // 4. Opened Companies in current month
  const now = new Date();
  const openedThisMonth = filteredDocs.filter((doc) => {
    if (!doc.workOpenDate) return false;
    const d = new Date(doc.workOpenDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // 5. Urgent Tasks breakdown (Total, Pending, Completed)
  const urgentTotal = filteredDocs.filter((doc) => doc.urgency === 'URGENT').length;
  const urgentPending = filteredDocs.filter((doc) => doc.urgency === 'URGENT' && !doc.isCompleted).length;
  const urgentCompleted = filteredDocs.filter((doc) => doc.urgency === 'URGENT' && doc.isCompleted).length;

  // 6. Total Stamped
  const totalStamped = filteredDocs.filter((doc) => doc.isStamped).length;

  // 7. Total Assembled
  const totalAssembled = filteredDocs.filter((doc) => doc.isAssembled).length;

  // 8. Total Submitted
  const totalSubmitted = filteredDocs.filter((doc) => doc.isSubmitted).length;

  // 9. Total Tracked
  const totalTracked = filteredDocs.filter((doc) => doc.isTracked).length;

  // 10. Total Completed
  const totalCompleted = filteredDocs.filter((doc) => doc.isCompleted || doc.operationStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      
      {/* Timeframe Filter Bar & PDF Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Dashboard ພາບລວມຜົນງານ ແລະ ສະຖິຕິເອກະສານ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ເລືອກໄລຍະເວລາເພື່ອສະແດງຜົນສະຖິຕິຕາມຄວາມຕ້ອງການ
          </p>
        </div>

        {/* Timeframe Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          {[
            { key: '1_WEEK', label: '1 ອາທິດ' },
            { key: '1_MONTH', label: '1 ເດືອນ' },
            { key: '3_MONTHS', label: '3 ເດືອນ' },
            { key: '6_MONTHS', label: '6 ເດືອນ' },
            { key: 'YEAR_END', label: 'ທ້າຍປີ' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key as TimeframeType)}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === t.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Print PDF Button */}
        <button
          onClick={() => printPDFReport('dashboard-pdf-container', 'ລາຍງານ Dashboard ສະຖິຕິເອກະສານ')}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>ດຶງ Report PDF</span>
        </button>
      </div>

      {/* Container to be printed as PDF */}
      <div id="dashboard-pdf-container" className="space-y-6">
        
        {/* Metric Cards Grid - Top Financials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Value (Revenue) */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute right-3 top-3 p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wide block">
              1. ມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ)
            </span>
            <div className="text-2xl font-black tracking-tight">
              {formatCurrencyLAK(totalRevenueLAK)}
            </div>
            <p className="text-[11px] text-emerald-100 opacity-90 pt-1">
              ຄິດໄລ່ລວມ USD, LAK, CNY ຕາມອັດຕາແລກປ່ຽນ
            </p>
          </div>

          {/* Card 2: Total Outstanding Balance */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute right-3 top-3 p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-amber-100 uppercase tracking-wide block">
              2. ຍອດຄ້າງຊຳລະ (Outstanding)
            </span>
            <div className="text-2xl font-black tracking-tight">
              {formatCurrencyLAK(totalOutstandingLAK)}
            </div>
            <p className="text-[11px] text-amber-100 opacity-90 pt-1">
              ຍອດລູກຄ້າທີ່ຍັງບໍ່ທັນຊຳລະ ຫຼື ຊຳລະບາງສ່ວນ
            </p>
          </div>

          {/* Card 3: Total Opened Companies */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                3. ບໍລິສັດເປີດວຽກທັງໝົດ
              </span>
              <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalOpenedCompanies} <span className="text-sm font-normal text-slate-500">ບໍລິສັດ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ຈຳນວນບໍລິສັດທີ່ເປີດວຽກໃນໄລຍະທີ່ເລືອກ
            </p>
          </div>

          {/* Card 4: Opened Companies in Current Month */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                4. ເປີດວຽກໃນເດືອນນີ້
              </span>
              <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {openedThisMonth} <span className="text-sm font-normal text-slate-500">ບໍລິສັດ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ວຽກເປີດໃໝ່ປະຈຳເດືອນປັດຈຸບັນ
            </p>
          </div>

        </div>

        {/* Card 5: Urgent Tasks Detailed Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  5. ສະຖິຕິໜ້າວຽກດ່ວນ (Urgent Tasks)
                </h3>
                <p className="text-xs text-slate-400">
                  ສະແດງຈຳນວນວຽກດ່ວນທັງໝົດ, ວຽກດ່ວນທີ່ຍັງຄ້າງ ແລະ ວຽກດ່ວນທີ່ດຳເນີນສຳເລັດ
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold text-xs rounded-full">
              ລວມວຽກດ່ວນ: {urgentTotal}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/40">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 block">
                ວຽກດ່ວນ ທັງໝົດ
              </span>
              <div className="text-2xl font-black text-rose-800 dark:text-rose-200 mt-1">
                {urgentTotal}
              </div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                100% ຂອງວຽກດ່ວນ
              </span>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block">
                ວຽກດ່ວນ ທີ່ຍັງຄ້າງ (Pending)
              </span>
              <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
                {urgentPending}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                ກຳລັງດຳເນີນງານ
              </span>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">
                ວຽກດ່ວນ ທີ່ສຳເລັດ (Completed)
              </span>
              <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {urgentCompleted}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                ສຳເລັດຮຽບຮ້ອຍ
              </span>
            </div>
          </div>
        </div>

        {/* Metrics 6-10 Progress Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          
          {/* 6. Total Stamped */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-1">
              {totalStamped}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              6. ຈ້ຳກາແລ້ວທັງໝົດ
            </span>
          </div>

          {/* 7. Total Assembled */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-1">
              {totalAssembled}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              7. ປະກອບແລ້ວທັງໝົດ
            </span>
          </div>

          {/* 8. Total Submitted */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-1">
              {totalSubmitted}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              8. ຍື່ນແລ້ວທັງໝົດ
            </span>
          </div>

          {/* 9. Total Tracked */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-1">
              {totalTracked}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              9. ຕິດຕາມແລ້ວ
            </span>
          </div>

          {/* 10. Total Completed */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1 col-span-2 sm:col-span-1">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
              {totalCompleted}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              10. ດຳເນີນສຳເລັດ
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
