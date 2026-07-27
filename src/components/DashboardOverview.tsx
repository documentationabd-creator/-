import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Building2, Calendar, AlertTriangle, CheckCircle2, FileCheck, Send, Eye, ShieldCheck, Printer, ArrowUpRight, TrendingUp, RefreshCw, BarChart3, Users, UserCheck, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { DocumentRecord, ExchangeRates, TimeframeType } from '../types/document';
import { convertToTotalLAK, formatCurrencyLAK, formatCurrencyUSD, formatCurrencyCNY } from '../utils/formatters';
import { printPDFReport } from '../utils/exportUtils';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
}

export const DashboardOverview: React.FC<Props> = ({ documents, rates }) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('1_MONTH');
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString('lo-LA'));

  // Update timestamp on data change
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('lo-LA'));
  }, [documents, rates, timeframe]);

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

  // 1. Total Revenue breakdown by currency
  const totalRevenueLAK_Sum = filteredDocs.reduce((acc, doc) => acc + (doc.totalValue?.lak || 0), 0);
  const totalRevenueUSD_Sum = filteredDocs.reduce((acc, doc) => acc + (doc.totalValue?.usd || 0), 0);
  const totalRevenueCNY_Sum = filteredDocs.reduce((acc, doc) => acc + (doc.totalValue?.cny || 0), 0);
  const totalRevenueOther_Sum = filteredDocs.reduce((acc, doc) => acc + (doc.totalValue?.otherValue || 0), 0);

  // Grand total converted into LAK
  const grandTotalRevenueLAK = filteredDocs.reduce(
    (acc, doc) => acc + convertToTotalLAK(doc.totalValue, rates),
    0
  );

  // 2. Outstanding Balance breakdown by currency (directly per currency)
  const totalOutstandingLAK_Sum = filteredDocs.reduce(
    (acc, doc) => acc + (doc.customerPayment?.outstandingBalance?.lak || 0),
    0
  );
  const totalOutstandingUSD_Sum = filteredDocs.reduce(
    (acc, doc) => acc + (doc.customerPayment?.outstandingBalance?.usd || 0),
    0
  );
  const totalOutstandingCNY_Sum = filteredDocs.reduce(
    (acc, doc) => acc + (doc.customerPayment?.outstandingBalance?.cny || 0),
    0
  );
  const totalOutstandingOther_Sum = filteredDocs.reduce(
    (acc, doc) => acc + (doc.customerPayment?.outstandingBalance?.otherValue || 0),
    0
  );

  // Grand total converted into LAK (reference)
  const grandTotalOutstandingLAK = filteredDocs.reduce(
    (acc, doc) => acc + convertToTotalLAK(doc.customerPayment?.outstandingBalance, rates),
    0
  );

  // 3. Total Opened Companies in main list (sequence count)
  const totalOpenedCompanies = documents.length;

  // 4. Opened Companies in current month (newly opened in month)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const openedThisMonth = documents.filter((doc) => {
    if (!doc.workOpenDate) return false;
    const d = new Date(doc.workOpenDate);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Monthly statistics data for newly opened documents in current year
  const monthNamesLao = [
    'ມັງກອນ (1)', 'ກຸມພາ (2)', 'ມີນາ (3)', 'ເມສາ (4)',
    'ພຶດສະພາ (5)', 'ມິຖຸນາ (6)', 'ກໍລະກົດ (7)', 'ສິງຫາ (8)',
    'ກັນຍາ (9)', 'ຕຸລາ (10)', 'ພະຈິກ (11)', 'ທັນວາ (12)'
  ];

  const monthShortLao = [
    'ເດືອນ 1', 'ເດືອນ 2', 'ເດືອນ 3', 'ເດືອນ 4',
    'ເດືອນ 5', 'ເດືອນ 6', 'ເດືອນ 7', 'ເດືອນ 8',
    'ເດືອນ 9', 'ເດືອນ 10', 'ເດືອນ 11', 'ເດືອນ 12'
  ];

  const monthlyOpenedCounts = Array(12).fill(0);

  documents.forEach((doc) => {
    if (!doc.workOpenDate) return;
    const d = new Date(doc.workOpenDate);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) {
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        monthlyOpenedCounts[m]++;
      }
    }
  });

  const monthlyOpenedData = monthShortLao.map((shortName, i) => ({
    month: shortName,
    fullName: monthNamesLao[i],
    openedCount: monthlyOpenedCounts[i],
    isCurrentMonth: i === currentMonth,
  }));

  const yearlyOpenedTotal = monthlyOpenedCounts.reduce((acc, c) => acc + c, 0);

  // 5. Urgent Tasks breakdown (Total, Pending, Completed) - Real Time Live from ALL documents
  const allUrgentDocs = documents.filter((doc) => doc.urgency === 'URGENT');
  const urgentTotal = allUrgentDocs.length;
  const urgentCompleted = allUrgentDocs.filter((doc) => doc.isCompleted || doc.operationStatus === 'COMPLETED').length;
  const urgentPending = allUrgentDocs.filter((doc) => !(doc.isCompleted || doc.operationStatus === 'COMPLETED')).length;

  // 6. Total Stamped (Real Time)
  const totalStamped = documents.filter((doc) => doc.isStamped).length;

  // 7. Total Assembled (Real Time)
  const totalAssembled = documents.filter((doc) => doc.isAssembled).length;

  // 8. Total Submitted (Real Time)
  const totalSubmitted = documents.filter((doc) => doc.isSubmitted).length;

  // 9. Total Tracked (Real Time)
  const totalTracked = documents.filter((doc) => doc.isTracked).length;

  // 10. Total Completed (Real Time)
  const totalCompleted = documents.filter((doc) => doc.isCompleted || doc.operationStatus === 'COMPLETED').length;

  // 11. Coordinator Statistics Breakdown
  const coordinatorMap: {
    [name: string]: {
      name: string;
      total: number;
      completed: number;
      pending: number;
      urgent: number;
    };
  } = {};

  documents.forEach((doc) => {
    const rawName = doc.coordinatorName ? doc.coordinatorName.trim() : '';
    const coordName = rawName || 'ບໍ່ລະບຸຜູ້ປະສານງານ';
    if (!coordinatorMap[coordName]) {
      coordinatorMap[coordName] = {
        name: coordName,
        total: 0,
        completed: 0,
        pending: 0,
        urgent: 0,
      };
    }
    const isComp = doc.isCompleted || doc.operationStatus === 'COMPLETED';
    coordinatorMap[coordName].total += 1;
    if (isComp) {
      coordinatorMap[coordName].completed += 1;
    } else {
      coordinatorMap[coordName].pending += 1;
    }
    if (doc.urgency === 'URGENT') {
      coordinatorMap[coordName].urgent += 1;
    }
  });

  const coordinatorStatsList = Object.values(coordinatorMap).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      
      {/* Timeframe Filter Bar & PDF Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Dashboard ພາບລວມຜົນງານ ແລະ ສະຖິຕິເອກະສານ</span>
            </h2>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Real-Time Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
            <span>ເລືອກໄລຍະເວລາເພື່ອສະແດງຜົນສະຖິຕິຕາມຄວາມຕ້ອງການ</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ອັບເດດ Real Time ຫຼ້າສຸດ: {lastUpdated}
            </span>
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
        
        {/* Section 1: Revenue Breakdown Cards (1. LAK, 2. $, 3. Y, 4. Other) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>ສະຫຼຸບມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ 4 ສະກຸນເງິນ)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto flex flex-wrap items-center gap-x-2">
              <span>ລວມມູນຄ່າທັງໝົດ:</span>
              <span className="text-emerald-800 dark:text-emerald-200 font-extrabold">{formatCurrencyLAK(totalRevenueLAK_Sum)}</span>
              <span>+</span>
              <span className="text-blue-800 dark:text-blue-300 font-extrabold">{formatCurrencyUSD(totalRevenueUSD_Sum)}</span>
              <span>+</span>
              <span className="text-rose-800 dark:text-rose-300 font-extrabold">{formatCurrencyCNY(totalRevenueCNY_Sum)}</span>
              {totalRevenueOther_Sum > 0 && (
                <>
                  <span>+</span>
                  <span className="text-purple-800 dark:text-purple-300 font-extrabold">{totalRevenueOther_Sum.toLocaleString()} (ອື່ນໆ)</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. LAK */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                LAK
              </div>
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wide block">
                1. ມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ) LAK
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyLAK(totalRevenueLAK_Sum)}
              </div>
              <p className="text-[11px] text-emerald-100/90 pt-1">
                ລາຍຮັບສະກຸນເງິນກີບ (LAK)
              </p>
            </div>

            {/* 2. USD ($) */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                USD ($)
              </div>
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">
                2. ມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ) $
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyUSD(totalRevenueUSD_Sum)}
              </div>
              <p className="text-[11px] text-blue-100/90 pt-1">
                ລາຍຮັບສະກຸນເງິນໂດລາ ($)
              </p>
            </div>

            {/* 3. CNY (Y) */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                CNY (¥)
              </div>
              <span className="text-xs font-semibold text-red-100 uppercase tracking-wide block">
                3. ມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ) Y
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyCNY(totalRevenueCNY_Sum)}
              </div>
              <p className="text-[11px] text-red-100/90 pt-1">
                ລາຍຮັບສະກຸນເງິນຢວນ (CNY)
              </p>
            </div>

            {/* 4. Other */}
            <div className="bg-gradient-to-br from-purple-600 to-violet-800 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                OTHER
              </div>
              <span className="text-xs font-semibold text-purple-100 uppercase tracking-wide block">
                4. ມູນຄ່າທັງໝົດ (ລາຍຮັບລວມ) ອື່ນໆ
              </span>
              <div className="text-2xl font-black tracking-tight">
                {totalRevenueOther_Sum > 0 ? totalRevenueOther_Sum.toLocaleString() : '0'}
              </div>
              <p className="text-[11px] text-purple-100/90 pt-1">
                ລາຍຮັບສະກຸນເງິນອື່ນໆ
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Outstanding Balance Breakdown Cards (1. LAK, 2. $, 3. Y, 4. Other) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>ສະຫຼຸບຍອດຄ້າງຊຳລະ (Outstanding 4 ສະກຸນເງິນ)</span>
            </h3>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 self-start sm:self-auto flex flex-wrap items-center gap-x-2">
              <span>ລວມຍອດຄ້າງຊຳລະ:</span>
              <span className="text-amber-900 dark:text-amber-200 font-extrabold">{formatCurrencyLAK(totalOutstandingLAK_Sum)}</span>
              <span>+</span>
              <span className="text-orange-900 dark:text-orange-300 font-extrabold">{formatCurrencyUSD(totalOutstandingUSD_Sum)}</span>
              <span>+</span>
              <span className="text-rose-900 dark:text-rose-300 font-extrabold">{formatCurrencyCNY(totalOutstandingCNY_Sum)}</span>
              {totalOutstandingOther_Sum > 0 && (
                <>
                  <span>+</span>
                  <span className="text-purple-900 dark:text-purple-300 font-extrabold">{totalOutstandingOther_Sum.toLocaleString()} (ອື່ນໆ)</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. LAK Outstanding */}
            <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                LAK
              </div>
              <span className="text-xs font-semibold text-amber-100 uppercase tracking-wide block">
                1. ຍອດຄ້າງຊຳລະ LAK
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyLAK(totalOutstandingLAK_Sum)}
              </div>
              <p className="text-[11px] text-amber-100/90 pt-1">
                ຍອດຄ້າງຊຳລະສະກຸນເງິນກີບ (LAK)
              </p>
            </div>

            {/* 2. USD ($) Outstanding */}
            <div className="bg-gradient-to-br from-orange-600 to-amber-700 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                USD ($)
              </div>
              <span className="text-xs font-semibold text-orange-100 uppercase tracking-wide block">
                2. ຍອດຄ້າງຊຳລະ $
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyUSD(totalOutstandingUSD_Sum)}
              </div>
              <p className="text-[11px] text-orange-100/90 pt-1">
                ຍອດຄ້າງຊຳລະສະກຸນເງິນໂດລາ ($)
              </p>
            </div>

            {/* 3. CNY (Y) Outstanding */}
            <div className="bg-gradient-to-br from-red-600 to-amber-800 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                CNY (¥)
              </div>
              <span className="text-xs font-semibold text-red-100 uppercase tracking-wide block">
                3. ຍອດຄ້າງຊຳລະ Y
              </span>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrencyCNY(totalOutstandingCNY_Sum)}
              </div>
              <p className="text-[11px] text-red-100/90 pt-1">
                ຍອດຄ້າງຊຳລະສະກຸນເງິນຢວນ (CNY)
              </p>
            </div>

            {/* 4. Other Outstanding */}
            <div className="bg-gradient-to-br from-purple-700 to-rose-800 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-3 top-3 p-2 bg-white/10 rounded-xl backdrop-blur-xs font-black text-xs">
                OTHER
              </div>
              <span className="text-xs font-semibold text-purple-100 uppercase tracking-wide block">
                4. ຍອດຄ້າງຊຳລະ ອື່ນໆ
              </span>
              <div className="text-2xl font-black tracking-tight">
                {totalOutstandingOther_Sum > 0 ? totalOutstandingOther_Sum.toLocaleString() : '0'}
              </div>
              <p className="text-[11px] text-purple-100/90 pt-1">
                ຍອດຄ້າງຊຳລະສະກຸນເງິນອື່ນໆ
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Company Activity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Total Opened Companies */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ບໍລິສັດເປີດວຽກທັງໝົດ
              </span>
              <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalOpenedCompanies} <span className="text-sm font-normal text-slate-500">ບໍລິສັດ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ນັບຕາມຈຳນວນລຳດັບບໍລິສັດທັງໝົດໃນໜ້າທຳອິດ
            </p>
          </div>

          {/* Opened Companies in Current Month */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ເປີດວຽກໃນເດືອນນີ້
              </span>
              <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {openedThisMonth} <span className="text-sm font-normal text-slate-500">ບໍລິສັດ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ບໍລິສັດທີ່ເປີດວຽກໃໝ່ປະຈຳເດືອນ ({currentMonth + 1}/{currentYear})
            </p>
          </div>

        </div>

        {/* Monthly Opened Work Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  ກາຟສະຖິຕິການເປີດວຽກໃໝ່ ລາຍເດືອນ (ປີ {currentYear})
                </h3>
                <p className="text-xs text-slate-400">
                  ປຽບທຽບຈຳນວນເອກະສານ/ບໍລິສັດ ທີ່ເປີດວຽກໃໝ່ໃນແຕ່ລະເດືອນ
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold text-xs rounded-full border border-indigo-200 dark:border-indigo-800">
                ລວມເປີດວຽກປີ {currentYear}: {yearlyOpenedTotal} ບໍລິສັດ
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyOpenedData} margin={{ top: 25, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.15} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-indigo-300">{data.fullName}</p>
                          <p className="text-slate-200">
                            ເປີດວຽກໃໝ່: <span className="font-bold text-emerald-400 text-sm">{data.openedCount}</span> ບໍລິສັດ
                          </p>
                          {data.isCurrentMonth && (
                            <span className="inline-block px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] rounded font-medium">
                              ເດືອນປັດຈຸບັນ
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="openedCount" name="ຈຳນວນເປີດວຽກ" radius={[6, 6, 0, 0]}>
                  {monthlyOpenedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrentMonth ? '#6366f1' : '#818cf8'} 
                      opacity={entry.openedCount > 0 ? (entry.isCurrentMonth ? 1 : 0.85) : 0.3}
                    />
                  ))}
                  <LabelList 
                    dataKey="openedCount" 
                    position="top" 
                    formatter={(val: any) => `${val}`}
                    style={{ fill: '#4f46e5', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgent Tasks Detailed Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    ສະຖິຕິໜ້າວຽກດ່ວນ (Urgent Tasks)
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                    <span>Real-Time</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ສະແດງຈຳນວນວຽກດ່ວນທັງໝົດ, ວຽກດ່ວນທີ່ຍັງຄ້າງ (Pending) ແລະ ວຽກດ່ວນທີ່ສຳເລັດ (Completed)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold text-xs rounded-full border border-rose-200 dark:border-rose-800 self-start sm:self-auto">
              ລວມວຽກດ່ວນ: {urgentTotal} ບໍລິສັດ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                  ວຽກດ່ວນ ທັງໝົດ
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
                  100%
                </span>
              </div>
              <div className="text-3xl font-black text-rose-800 dark:text-rose-200 mt-2">
                {urgentTotal} <span className="text-xs font-normal text-rose-600 dark:text-rose-400">ບໍລິສັດ</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                ເອກະສານທີ່ລະບົບກຳນົດເປັນວຽກດ່ວນ
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                  ວຽກດ່ວນ ທີ່ຍັງຄ້າງ (Pending)
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200">
                  {urgentTotal > 0 ? Math.round((urgentPending / urgentTotal) * 100) : 0}%
                </span>
              </div>
              <div className="text-3xl font-black text-amber-800 dark:text-amber-200 mt-2">
                {urgentPending} <span className="text-xs font-normal text-amber-600 dark:text-amber-400">ບໍລິສັດ</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                ກຳລັງດຳເນີນງານ / ຍັງບໍ່ທັນສຳເລັດ
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                  ວຽກດ່ວນ ທີ່ສຳເລັດ (Completed)
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                  {urgentTotal > 0 ? Math.round((urgentCompleted / urgentTotal) * 100) : 0}%
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mt-2">
                {urgentCompleted} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">ບໍລິສັດ</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                ດຳເນີນການສຳເລັດຮຽບຮ້ອຍແລ້ວ
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Progress Badges Grid */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    ສະຖິຕິຂັ້ນຕອນການດຳເນີນງານເອກະສານ (Workflow Progress)
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>Real-Time Live</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ອັບເດດສະຖິຕິການ ຈ້ຳກາ, ປະກອບ, ຍື່ນ, ຕິດຕາມ ແລະ ດຳເນີນສຳເລັດ ແບບ Real Time ທັນທີ
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-full">
              ລວມເອກະສານ: {documents.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            
            {/* Total Stamped */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-center space-y-1 hover:border-blue-300 transition">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 pt-1">
                {totalStamped}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                ຈ້ຳກາແລ້ວທັງໝົດ
              </span>
              <span className="text-[10px] text-slate-400 block pt-0.5">
                ({documents.length > 0 ? Math.round((totalStamped / documents.length) * 100) : 0}% ຂອງທັງໝົດ)
              </span>
            </div>

            {/* Total Assembled */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-center space-y-1 hover:border-indigo-300 transition">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 pt-1">
                {totalAssembled}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                ປະກອບແລ້ວທັງໝົດ
              </span>
              <span className="text-[10px] text-slate-400 block pt-0.5">
                ({documents.length > 0 ? Math.round((totalAssembled / documents.length) * 100) : 0}% ຂອງທັງໝົດ)
              </span>
            </div>

            {/* Total Submitted */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-center space-y-1 hover:border-purple-300 transition">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center shadow-2xs">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 pt-1">
                {totalSubmitted}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                ຍື່ນແລ້ວທັງໝົດ
              </span>
              <span className="text-[10px] text-slate-400 block pt-0.5">
                ({documents.length > 0 ? Math.round((totalSubmitted / documents.length) * 100) : 0}% ຂອງທັງໝົດ)
              </span>
            </div>

            {/* Total Tracked */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-center space-y-1 hover:border-sky-300 transition">
              <div className="p-2.5 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl w-10 h-10 mx-auto flex items-center justify-center shadow-2xs">
                <Eye className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 pt-1">
                {totalTracked}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                ຕິດຕາມແລ້ວ
              </span>
              <span className="text-[10px] text-slate-400 block pt-0.5">
                ({documents.length > 0 ? Math.round((totalTracked / documents.length) * 100) : 0}% ຂອງທັງໝົດ)
              </span>
            </div>

            {/* Total Completed */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-2xs text-center space-y-1 col-span-2 sm:col-span-1 hover:border-emerald-400 transition">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 rounded-xl w-10 h-10 mx-auto flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 pt-1">
                {totalCompleted}
              </div>
              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 block">
                ດຳເນີນສຳເລັດ
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block pt-0.5">
                ({documents.length > 0 ? Math.round((totalCompleted / documents.length) * 100) : 0}% ຂອງທັງໝົດ)
              </span>
            </div>

          </div>
        </div>

        {/* Coordinator Statistics Breakdown Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    ສະຖິຕິວຽກງານແຍກຕາມຜູ້ປະສານງານ (Coordinator Workload)
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                    </span>
                    <span>Real-Time Live</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ສະແດງຈຳນວນເອກະສານທີ່ຮັບຜິດຊອບ, ວຽກທີ່ສຳເລັດ, ວຽກທີ່ຍັງຄ້າງ ແລະ ວຽກດ່ວນຂອງແຕ່ລະຄົນ
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold text-xs rounded-full border border-purple-200 dark:border-purple-800 self-start sm:self-auto">
              ລວມຜູ້ປະສານງານ: {coordinatorStatsList.length} ທ່ານ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">ຜູ້ປະສານງານ (Coordinator)</th>
                  <th className="py-3 px-3 text-center">ເອກະສານທັງໝົດ</th>
                  <th className="py-3 px-3 text-center">ສຳເລັດແລ້ວ</th>
                  <th className="py-3 px-3 text-center">ຍັງຄ້າງ/ກຳລັງດຳເນີນ</th>
                  <th className="py-3 px-3 text-center">ວຽກດ່ວນ</th>
                  <th className="py-3 px-4">ຄວາມຄືບໜ້າ (Progress)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {coordinatorStatsList.map((item, index) => {
                  const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                  return (
                    <tr key={`coord-stat-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {item.name.charAt(0) || 'U'}
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">{item.name}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {item.total}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold rounded-full text-xs">
                          {item.completed}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold rounded-full text-xs">
                          {item.pending}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.urgent > 0 ? (
                          <span className="px-2.5 py-1 bg-rose-500 text-white font-bold rounded-full text-xs animate-pulse">
                            {item.urgent}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                percent === 100
                                  ? 'bg-emerald-500'
                                  : percent > 50
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-9 text-right">
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

