import React, { useState } from 'react';
import { AlertTriangle, Clock, ChevronRight, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DocumentRecord } from '../types/document';
import { formatDateDisplay } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentRecord[];
  onSelectDocument: (docId: string) => void;
}

export const QuickAlertsPopover: React.FC<Props> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'EXPIRED' | 'EXPIRING_7'>('ALL');

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute expired and 7-day expiring documents
  const expiredList: { doc: DocumentRecord; daysOverdue: number }[] = [];
  const expiring7List: { doc: DocumentRecord; daysRemaining: number }[] = [];

  documents.forEach((doc) => {
    if (!doc.expiryDate) return;
    const expDate = new Date(doc.expiryDate);
    if (isNaN(expDate.getTime())) return;
    expDate.setHours(0, 0, 0, 0);

    const diffMs = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expiredList.push({ doc, daysOverdue: Math.abs(diffDays) });
    } else if (diffDays <= 7) {
      expiring7List.push({ doc, daysRemaining: diffDays });
    }
  });

  const totalAlerts = expiredList.length + expiring7List.length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/90 border-b border-rose-100 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-500 text-white rounded-lg shadow-xs animate-bounce">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight flex items-center space-x-1.5">
              <span>Quick Alerts</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {totalAlerts}
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              ເອກະສານໝົດອາຍຸ ແລະ ໃກ້ໝົດອາຍຸໃນ 7 ວັນ
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs inside Popover */}
      <div className="flex border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold p-1 gap-1">
        <button
          onClick={() => setActiveSubTab('ALL')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeSubTab === 'ALL'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          ທັງໝົດ ({totalAlerts})
        </button>
        <button
          onClick={() => setActiveSubTab('EXPIRED')}
          className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
            activeSubTab === 'EXPIRED'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <span>ໝົດອາຍຸ ({expiredList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('EXPIRING_7')}
          className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
            activeSubTab === 'EXPIRING_7'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <span>ໃກ້ໝົດ 7 ວັນ ({expiring7List.length})</span>
        </button>
      </div>

      {/* Content List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-1">
        {totalAlerts === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700 dark:text-slate-200">
              ບໍ່ມີເອກະສານໝົດອາຍຸ ຫຼື ໃກ້ໝົດອາຍຸໃນ 7 ວັນ!
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              ເອກະສານທຸກຢ່າງຍັງມີອາຍຸນຳໃຊ້ປົກກາຕິ
            </p>
          </div>
        ) : (
          <>
            {/* Show Expired Items */}
            {(activeSubTab === 'ALL' || activeSubTab === 'EXPIRED') &&
              expiredList.map(({ doc, daysOverdue }) => (
                <div
                  key={`exp-alert-${doc.id}`}
                  onClick={() => {
                    onSelectDocument(doc.id);
                    onClose();
                  }}
                  className="p-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 cursor-pointer rounded-xl transition flex items-start space-x-3 group my-1 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                >
                  <div className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 rounded-xl shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {doc.companyName}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                        ໝົດອາຍຸແລ້ວ ({daysOverdue} ວັນ)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateDisplay(doc.expiryDate)}
                      </span>
                    </div>
                    {doc.coordinatorName && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                        ຜູ້ປະສານງານ: {doc.coordinatorName}
                      </p>
                    )}
                  </div>
                </div>
              ))}

            {/* Show Expiring in 7 Days Items */}
            {(activeSubTab === 'ALL' || activeSubTab === 'EXPIRING_7') &&
              expiring7List.map(({ doc, daysRemaining }) => (
                <div
                  key={`exp7-alert-${doc.id}`}
                  onClick={() => {
                    onSelectDocument(doc.id);
                    onClose();
                  }}
                  className="p-3 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 cursor-pointer rounded-xl transition flex items-start space-x-3 group my-1 border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                >
                  <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 rounded-xl shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {doc.companyName}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                        ໃກ້ໝົດອາຍຸ (ອີກ {daysRemaining === 0 ? 'ມື້ນີ້!' : `${daysRemaining} ວັນ`})
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateDisplay(doc.expiryDate)}
                      </span>
                    </div>
                    {doc.coordinatorName && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                        ຜູ້ປະສານງານ: {doc.coordinatorName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
        <p className="text-[10px] text-slate-400">
          ກົດໃສ່ລາຍການເພື່ອເບິ່ງ/ແກ້ໄຂ ລາຍລະອຽດເອກະສານໂດຍທັນທີ
        </p>
      </div>
    </div>
  );
};
