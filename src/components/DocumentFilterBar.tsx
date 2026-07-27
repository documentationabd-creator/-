import React, { useState, useEffect } from 'react';
import { Search, Filter, History, X, RotateCcw, ChevronDown, Zap, Plus, AlertTriangle, Clock, CheckCircle2, FileCheck, Building2, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { DocumentRecord, FilterState } from '../types/document';

interface Props {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  documents?: DocumentRecord[];
  onOpenNewDocumentModal?: () => void;
  onSelectTab?: (tabId: number) => void;
}

const LINE_OPTIONS = [
  'ALL',
  'A',
  'B',
  'C',
  'D',
  'E',
  'ບໍ່ມີສາຍ',
  'ຕ່າງແຂວງ',
  'ກຸ່ມບໍລິສັດສືບສຸລິນຄຳ',
];

export const DocumentFilterBar: React.FC<Props> = ({
  filters,
  onFilterChange,
  onResetFilters,
  documents = [],
  onOpenNewDocumentModal,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);

  // Counts for Quick Shortcuts
  const urgentCount = documents.filter((d) => d.urgency === 'URGENT').length;
  const pendingCount = documents.filter((d) => d.operationStatus === 'IN_PROGRESS' || (!d.isCompleted && d.operationStatus !== 'COMPLETED')).length;
  const completedCount = documents.filter((d) => d.isCompleted || d.operationStatus === 'COMPLETED').length;
  const stampedCount = documents.filter((d) => d.isStamped).length;
  const newCompanyCount = documents.filter((d) => d.isNewCompany).length;
  const renew2026Count = documents.filter((d) => d.softwareInstallation?.renew2026).length;

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lao_doc_search_history');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveSearchQueryToHistory = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...searchHistory.filter((q) => q !== clean)].slice(0, 8);
    setSearchHistory(updated);
    try {
      localStorage.setItem('lao_doc_search_history', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSearchQueryToHistory(searchQuery);
    onFilterChange({ ...filters, searchQuery });
    setShowHistoryPopover(false);
  };

  const handleApplyHistoryQuery = (query: string) => {
    setSearchQuery(query);
    onFilterChange({ ...filters, searchQuery: query });
    setShowHistoryPopover(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('lao_doc_search_history');
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-3">
      
      {/* ທາງລັດໜ້າວຽກ (Task Shortcuts Bar) */}
      <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 bg-amber-500 text-white rounded-lg shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              ທາງລັດໜ້າວຽກ (Task Shortcuts)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            ກົດທາງລັດເພື່ອຕອງຂໍ້ມູນ ຫຼື ເພີ່ມວຽກໄດ້ທັນທີ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. All Tasks */}
          <button
            type="button"
            onClick={onResetFilters}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.urgency === 'ALL' && filters.status === 'ALL' && filters.workflowStep === 'ALL' && !filters.renewal2026Only && filters.companyType === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>ທັງໝົດ ({documents.length})</span>
          </button>

          {/* 2. Urgent Tasks */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, urgency: filters.urgency === 'URGENT' ? 'ALL' : 'URGENT' })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.urgency === 'URGENT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500 fill-rose-100 dark:fill-rose-900" />
            <span>ວຽກດ່ວນ ({urgentCount})</span>
          </button>

          {/* 3. Pending / In Progress */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, status: filters.status === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS' })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.status === 'IN_PROGRESS'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>ຍັງຄ້າງ ({pendingCount})</span>
          </button>

          {/* 4. Completed */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, status: filters.status === 'COMPLETED' ? 'ALL' : 'COMPLETED' })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.status === 'COMPLETED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>ສຳເລັດ ({completedCount})</span>
          </button>

          {/* 5. Stamped */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, workflowStep: filters.workflowStep === 'STAMPED' ? 'ALL' : 'STAMPED' })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.workflowStep === 'STAMPED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            <span>ຈ້ຳກາແລ້ວ ({stampedCount})</span>
          </button>

          {/* 6. New Companies */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, companyType: filters.companyType === 'NEW_ONLY' ? 'ALL' : 'NEW_ONLY' })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.companyType === 'NEW_ONLY'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-300'
                : 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>ບໍລິສັດໃໝ່ ({newCompanyCount})</span>
          </button>

          {/* 7. Renew 2026 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, renewal2026Only: !filters.renewal2026Only })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
              filters.renewal2026Only
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                : 'bg-amber-100/80 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>ຕໍ່ 2026 ({renew2026Count})</span>
          </button>

          {/* 8. Add New Document Shortcut */}
          {onOpenNewDocumentModal && (
            <button
              type="button"
              onClick={onOpenNewDocumentModal}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ເພີ່ມເອກະສານ</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Search Bar & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowHistoryPopover(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onFilterChange({ ...filters, searchQuery: e.target.value });
              }}
              placeholder="ຄົ້ນຫາບໍລິສັດ, TIN, ເລກຂາເຂົ້າ, ຜູ້ປະສານງານ, ພິກັດ..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange({ ...filters, searchQuery: '' });
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHistoryPopover(!showHistoryPopover)}
              title="ປະຫວັດການຄົ້ນຫາ"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg"
            >
              <History className="w-4 h-4" />
            </button>
          </form>

          {/* Search History Dropdown */}
          {showHistoryPopover && searchHistory.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                <span className="flex items-center space-x-1">
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>ປະຫວັດການຄົ້ນຫາລ່າສຸດ</span>
                </span>
                <button
                  onClick={clearSearchHistory}
                  className="text-rose-500 hover:underline text-[11px]"
                >
                  ລົບປະຫວັດ
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {searchHistory.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyHistoryQuery(q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                  >
                    🔍 {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={onResetFilters}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium transition shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ລ້າງຕົວກອງ</span>
        </button>
      </div>

      {/* Filter Select Controls Grid (1. Line, 2. Urgency, 3. Status, 4. Payment, 5. Software, 6. Company Type, 7. Workflow Step, 8. Renewal) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1 text-xs">
        
        {/* 1. Line */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            1. ສາຍວຽກ
          </label>
          <select
            value={filters.line}
            onChange={(e) => onFilterChange({ ...filters, line: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກສາຍວຽກ</option>
            {LINE_OPTIONS.filter((l) => l !== 'ALL').map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </div>

        {/* 2. Task Urgency */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            2. ຄວາມສຳຄັນ
          </label>
          <select
            value={filters.urgency}
            onChange={(e) => onFilterChange({ ...filters, urgency: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກຄວາມສຳຄັນ</option>
            <option value="NORMAL">ປົກກະຕິ</option>
            <option value="URGENT">ດ່ວນ ⚡</option>
          </select>
        </div>

        {/* 3. Operation Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            3. ສະຖານະການດຳເນີນ
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກສະຖານະ</option>
            <option value="COMPLETED">ສຳເລັດ</option>
            <option value="WAITING_ISSUE">ລໍຖ້າເອກະສານອອກ</option>
            <option value="WAITING_DOCS">ລໍຖ້າສະໜອງເອກະສານ</option>
            <option value="SUSPENDED">ໂຈະການດຳເນີນ</option>
            <option value="CANCELLED">ຍົກເລີກ</option>
          </select>
        </div>

        {/* 4. Payment Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            4. ສະຖານະຊຳລະ
          </label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange({ ...filters, paymentStatus: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກສະຖານະຊຳລະ</option>
            <option value="PAID">ລູກຄ້າຊຳລະແລ້ວ</option>
            <option value="UNPAID">ລູກຄ້າຄ້າງຊຳລະ</option>
            <option value="PAID_50">ລູກຄ້າຊຳລະ 50%</option>
            <option value="PAID_ON_COMPLETION">ຊຳລະເມື່ອສຳເລັດ</option>
          </select>
        </div>

        {/* 5. Program Installation */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            5. ຕິດຕັ້ງໂປຣແກຣມ
          </label>
          <select
            value={filters.software}
            onChange={(e) => onFilterChange({ ...filters, software: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກໂປຣແກຣມ</option>
            <option value="APIS">APIS</option>
            <option value="TSD">TSD</option>
            <option value="PKT">ປະກາຍທິບ (PKT)</option>
            <option value="RENEW_2026">ຕໍ່ 2026</option>
            <option value="OTHER">ອື່ນໆ</option>
          </select>
        </div>

        {/* 6. Company Type (New vs Existing) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            6. ປະເພດບໍລິສັດ
          </label>
          <select
            value={filters.companyType || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, companyType: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກບໍລິສັດ</option>
            <option value="NEW_ONLY">ບໍລິສັດເຂົ້າໃໝ່ 🆕</option>
            <option value="EXISTING_ONLY">ບໍລິສັດເກົ່າ</option>
          </select>
        </div>

        {/* 7. Workflow Step (4 ຂັ້ນຕອນ) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            7. ຂັ້ນຕອນວຽກ
          </label>
          <select
            value={filters.workflowStep || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, workflowStep: e.target.value })}
            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
          >
            <option value="ALL">ທຸກຂັ້ນຕອນ</option>
            <option value="STAMPED">✓ ຈ້ຳກາແລ້ວ</option>
            <option value="UNSTAMPED">⏳ ຍັງບໍ່ຈ້ຳກາ</option>
            <option value="ASSEMBLED">✓ ປະກອບແລ້ວ</option>
            <option value="UNASSEMBLED">⏳ ຍັງບໍ່ປະກອບ</option>
            <option value="SUBMITTED">✓ ຍື່ນແລ້ວ</option>
            <option value="UNSUBMITTED">⏳ ຍັງບໍ່ຍື່ນ</option>
            <option value="TRACKED">✓ ຕິດຕາມແລ້ວ</option>
            <option value="UNTRACKED">⏳ ຍັງບໍ່ຕິດຕາມ</option>
          </select>
        </div>

        {/* 8. Renewal 2026 Filter Checkbox */}
        <div className="flex items-end pb-1">
          <label className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold cursor-pointer w-full justify-center">
            <input
              type="checkbox"
              checked={filters.renewal2026Only}
              onChange={(e) => onFilterChange({ ...filters, renewal2026Only: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span className="text-[11px]">8. ຕໍ່ 2026 ຢ່າງດຽວ</span>
          </label>
        </div>

      </div>
    </div>
  );
};
