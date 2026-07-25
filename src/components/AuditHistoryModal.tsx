import React from 'react';
import { History, Trash2, X, Clock, User, ShieldAlert } from 'lucide-react';
import { AuditLogEntry } from '../types/document';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  auditTrail: AuditLogEntry[];
  onClearHistory: () => void;
  onDeleteHistoryEntry: (entryId: string) => void;
}

export const AuditHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  companyName,
  auditTrail,
  onClearHistory,
  onDeleteHistoryEntry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl dark:bg-indigo-950/60 dark:text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                ປະຫວັດການດັດແກ້ເອກະສານ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {auditTrail.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">ບໍ່ມີປະຫວັດການດັດແກ້ຖືກບັນທຶກ</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              {auditTrail.map((log) => (
                <div key={log.id} className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-800" />
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/80">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <User className="w-3 h-3 inline mr-1" />
                          {log.user}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {log.details}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {log.timestamp}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteHistoryEntry(log.id)}
                      title="ລົບປະຫວັດລາຍການນີ້"
                      className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 mr-1 text-amber-500" />
            <span>ທ່ານສາມາດລົບປະຫວັດການດັດແກ້ໄດ້ທຸກເວລາ</span>
          </div>
          <div className="flex space-x-2">
            {auditTrail.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ລົບປະຫວັດທັງໝົດ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
            >
              ອັດໜ້າຕ່າງ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
