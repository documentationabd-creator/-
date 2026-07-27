import React, { useState } from 'react';
import { Building2, LayoutDashboard, Laptop, BarChart3, Bell, RefreshCw, Plus, FileSpreadsheet, RotateCcw, DollarSign, Coins, Table, FolderDown, AlertTriangle } from 'lucide-react';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { formatCurrencyLAK } from '../utils/formatters';
import { NotificationPopover } from './NotificationPopover';
import { QuickAlertsPopover } from './QuickAlertsPopover';

interface Props {
  activeTab: number; // 1, 2, 3, 4
  setActiveTab: (tab: number) => void;
  rates: ExchangeRates;
  onOpenExchangeRateModal: () => void;
  documents: DocumentRecord[];
  onSelectDocument: (docId: string) => void;
  onOpenNewDocumentModal: () => void;
  onExportExcel: () => void;
  onResetSeedData: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  rates,
  onOpenExchangeRateModal,
  documents,
  onSelectDocument,
  onOpenNewDocumentModal,
  onExportExcel,
  onResetSeedData,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickAlertsOpen, setIsQuickAlertsOpen] = useState(false);

  // Compute pending alert count for bell badge
  const pendingAlertsCount = documents.filter((d) => {
    const isUrgentPending = d.urgency === 'URGENT' && !d.isCompleted;
    const isWaitingDocs = d.operationStatus === 'WAITING_DOCS';
    const isUnpaid = d.customerPayment.paymentStatus === 'UNPAID';
    return isUrgentPending || isWaitingDocs || isUnpaid;
  }).length;

  // Compute expired or expiring in 7 days count for Quick Alerts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const quickAlertsCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const expDate = new Date(d.expiryDate);
    if (isNaN(expDate.getTime())) return false;
    expDate.setHours(0, 0, 0, 0);

    const diffMs = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          
          {/* Logo & Exchange Rate Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-tight">
                  ລະບົບຕິດຕາມເອກະສານ
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Document Tracking & Management System
                </p>
              </div>
            </div>

            {/* Daily Exchange Rate Trigger Pill */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onOpenExchangeRateModal}
                title="ຄິກເພື່ອປ່ຽນອັດຕາແລກປ່ຽນປະຈຳມື້"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
                <div className="text-left hidden sm:block">
                  <span className="text-[10px] text-slate-400 block leading-none">ອັດຕາແລກປ່ຽນ</span>
                  <span>$1 = {formatCurrencyLAK(rates.USD_TO_LAK)} | ¥1 = {formatCurrencyLAK(rates.CNY_TO_LAK)}</span>
                </div>
              </button>

              {/* Quick Alerts Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsQuickAlertsOpen(!isQuickAlertsOpen);
                    setIsNotificationOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition text-xs font-bold ${
                    quickAlertsCount > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                      : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                  }`}
                  title="Quick Alerts: ເອກະສານໝົດອາຍຸ ແລະ ໃກ້ໝົດອາຍຸໃນ 7 ວັນ"
                >
                  <AlertTriangle className={`w-4 h-4 ${quickAlertsCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">Quick Alerts</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    quickAlertsCount > 0 ? 'bg-rose-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                  }`}>
                    {quickAlertsCount}
                  </span>
                </button>

                <QuickAlertsPopover
                  isOpen={isQuickAlertsOpen}
                  onClose={() => setIsQuickAlertsOpen(false)}
                  documents={documents}
                  onSelectDocument={onSelectDocument}
                />
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsQuickAlertsOpen(false);
                  }}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl relative transition"
                  title="ການແຈ້ງເຕືອນ Real-time"
                >
                  <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  {pendingAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border-2 border-white dark:border-slate-800">
                      {pendingAlertsCount}
                    </span>
                  )}
                </button>

                <NotificationPopover
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  documents={documents}
                  onSelectDocument={onSelectDocument}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Add Record, Export Excel, Reset Data */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewDocumentModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ ເພີ່ມເອກະສານ</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ດຶງ Excel (.xlsx)</span>
            </button>

            <button
              onClick={onResetSeedData}
              title="ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* 4 Main View Navigation Tabs */}
        <div className="flex space-x-2 border-t border-slate-100 dark:border-slate-700/80 pt-2 pb-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ໜ້າທີ 1: ລາຍການເອກະສານ & ຟອມ</span>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ໜ້າທີ 2: ສະຫຼຸບ Dashboard (ຫົວຂໍ້ 4)</span>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>ໜ້າທີ 3: ສັງລວມຄ່າຕິດຕັ້ງໂປຣແກຣມ</span>
          </button>

          <button
            onClick={() => setActiveTab(4)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 4
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ໜ້າທີ 4: ກຣາຟສະຖິຕິ & Graph</span>
          </button>

          <button
            onClick={() => setActiveTab(5)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 5
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>ໜ້າທີ 5: ຕາຕະລາງລວມ & ລາຍຮັບ-ລາຍຈ່າຍ</span>
          </button>

          <button
            onClick={() => setActiveTab(6)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 6
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>ໜ້າທີ 6: ຄັງເກັບໄຟລ໌ແນບ & ດາວໂຫຼດ</span>
          </button>
        </div>

      </div>
    </header>
  );
};
