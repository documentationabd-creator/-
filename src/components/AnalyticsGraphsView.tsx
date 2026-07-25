import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Layers } from 'lucide-react';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { convertToTotalLAK, formatCurrencyLAK, getOperationStatusLabel, getPaymentStatusLabel } from '../utils/formatters';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
}

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#EC4899', '#64748B'];

export const AnalyticsGraphsView: React.FC<Props> = ({ documents, rates }) => {
  
  // 1. Status Distribution Data
  const statusCounts: Record<string, number> = {};
  documents.forEach((d) => {
    const label = getOperationStatusLabel(d.operationStatus).label;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const statusPieData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  // 2. Line Distribution Data
  const lineCounts: Record<string, number> = {};
  documents.forEach((d) => {
    const lineKey = d.line || 'ບໍ່ມີສາຍ';
    lineCounts[lineKey] = (lineCounts[lineKey] || 0) + 1;
  });

  const lineBarData = Object.keys(lineCounts).map((key) => ({
    name: key,
    ຈຳນວນເອກະສານ: lineCounts[key],
  }));

  // 3. Payment Status Distribution Data
  const paymentCounts: Record<string, number> = {};
  documents.forEach((d) => {
    const label = getPaymentStatusLabel(d.customerPayment.paymentStatus).label;
    paymentCounts[label] = (paymentCounts[label] || 0) + 1;
  });

  const paymentPieData = Object.keys(paymentCounts).map((key) => ({
    name: key,
    value: paymentCounts[key],
  }));

  // 4. Urgency Comparison Data
  const normalCount = documents.filter((d) => d.urgency === 'NORMAL').length;
  const urgentCount = documents.filter((d) => d.urgency === 'URGENT').length;
  const urgencyBarData = [
    { name: 'ປົກກະຕິ (Normal)', ຈຳນວນ: normalCount },
    { name: 'ດ່ວນ (Urgent ⚡)', ຈຳນວນ: urgentCount },
  ];

  // 5. Monthly Financial Trend (simulated/aggregated by month)
  const monthlyFinancials: Record<string, { revenue: number; expense: number; net: number }> = {};
  
  documents.forEach((d) => {
    const dateStr = d.workOpenDate || new Date().toISOString().split('T')[0];
    const monthYear = dateStr.substring(0, 7); // e.g. "2026-06"
    
    if (!monthlyFinancials[monthYear]) {
      monthlyFinancials[monthYear] = { revenue: 0, expense: 0, net: 0 };
    }

    const revLAK = convertToTotalLAK(d.totalValue, rates);
    const expLAK = (d.installationExpense.lakCost || 0) + 
      (d.documentProcessingExpense.feeCostLAK || 0) + 
      (d.documentProcessingExpense.urgentLicenseFeeLAK || 0) + 
      (d.documentProcessingExpense.supportFeeLAK || 0);

    monthlyFinancials[monthYear].revenue += revLAK;
    monthlyFinancials[monthYear].expense += expLAK;
    monthlyFinancials[monthYear].net += (revLAK - expLAK);
  });

  const monthlyChartData = Object.keys(monthlyFinancials)
    .sort()
    .map((m) => ({
      month: m,
      ລາຍຮັບ: monthlyFinancials[m].revenue,
      ລາຍຈ່າຍ: monthlyFinancials[m].expense,
      ກຳໄລ: monthlyFinancials[m].net,
    }));

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center space-x-3">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl dark:bg-blue-950/60 dark:text-blue-300">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xl">
            ສັງລວມ Dashboard ແລະ Graph ສະຖິຕິທັງໝົດ (Page 4)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ວິເຄາະຂໍ້ມູນເອກະສານດ້ວຍກຣາຟສະຖິຕິ Recharts
          </p>
        </div>
      </div>

      {/* Chart 1: Monthly Financial Trend */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            1. ກຣາຟແນວໂນ້ມ ລາຍຮັບ - ລາຍຈ່າຍ - ກຳໄລສຸດທິ ປະຈຳເດືອນ (LAK)
          </h3>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickFormatter={(val) => `${val / 1000000}M`}
              />
              <Tooltip
                formatter={(val: any) => formatCurrencyLAK(Number(val))}
                contentStyle={{ borderRadius: '12px', background: '#1E293B', color: '#FFF' }}
              />
              <Legend />
              <Bar dataKey="ລາຍຮັບ" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ລາຍຈ່າຍ" fill="#EF4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ກຳໄລ" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Pie & Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 2: Status Distribution Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              2. ສັດສ່ວນສະຖານະການດຳເນີນງານ
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#1E293B', color: '#FFF' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Line Workload Distribution Bar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              3. ຈຳນວນເອກະສານ ແຍກຕາມສາຍ (Line)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineBarData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#1E293B', color: '#FFF' }} />
                <Bar dataKey="ຈຳນວນເອກະສານ" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Payment Status Breakdown Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <PieIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              4. ສັດສ່ວນສະຖານະການຊຳລະເງິນ
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {paymentPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#1E293B', color: '#FFF' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Normal vs Urgent Comparison Bar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              5. ປຽບທຽບ ວຽກປົກກະຕິ vs ວຽກດ່ວນ
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyBarData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#1E293B', color: '#FFF' }} />
                <Bar dataKey="ຈຳນວນ" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
