import React from 'react';
import { Bell, AlertTriangle, Clock, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { DocumentRecord } from '../types/document';
import { formatDateDisplay } from '../utils/formatters';

interface NotificationItem {
  id: string;
  docId: string;
  type: 'EXPIRING' | 'URGENT_PENDING' | 'WAITING_DOCS' | 'UNPAID';
  title: string;
  description: string;
  dateStr?: string;
  companyName: string;
  severity: 'high' | 'medium' | 'info';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentRecord[];
  onSelectDocument: (docId: string) => void;
}

export const NotificationPopover: React.FC<Props> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
}) => {
  if (!isOpen) return null;

  // Compute notifications dynamically
  const notifications: NotificationItem[] = [];
  const today = new Date();

  documents.forEach((doc) => {
    // 1. Expiring documents check (expiryDate within 30 days or passed)
    if (doc.expiryDate) {
      const expDate = new Date(doc.expiryDate);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        notifications.push({
          id: `exp-${doc.id}`,
          docId: doc.id,
          type: 'EXPIRING',
          title: diffDays < 0 ? 'ເອກະສານໝົດອາຍຸແລ້ວ!' : `ເອກະສານໃກ້ໝົດອາຍຸ (ອີກ ${diffDays} ວັນ)`,
          description: `ໝົດອາຍຸວັນທີ: ${formatDateDisplay(doc.expiryDate)}`,
          companyName: doc.companyName,
          severity: diffDays <= 7 ? 'high' : 'medium',
        });
      }
    }

    // 2. Urgent Pending Tasks
    if (doc.urgency === 'URGENT' && !doc.isCompleted) {
      notifications.push({
        id: `urg-${doc.id}`,
        docId: doc.id,
        type: 'URGENT_PENDING',
        title: 'ວຽກດ່ວນທີ່ຍັງບໍ່ທັນສຳເລັດ! ⚡',
        description: `ດຳເນີນມາແລ້ວ ${doc.processingDays} ວັນ | ສະຖານະ: ${doc.operationStatus}`,
        companyName: doc.companyName,
        severity: 'high',
      });
    }

    // 3. Waiting Docs or Waiting Issue
    if (doc.operationStatus === 'WAITING_DOCS' || doc.operationStatus === 'WAITING_ISSUE') {
      notifications.push({
        id: `wait-${doc.id}`,
        docId: doc.id,
        type: 'WAITING_DOCS',
        title: doc.operationStatus === 'WAITING_DOCS' ? 'ລໍຖ້າສະໜອງເອກະສານ' : 'ລໍຖ້າເອກະສານອອກຈາກກົມ',
        description: `ຜູ້ປະສານງານ: ${doc.coordinatorName || 'ບໍ່ມີຂໍ້ມູນ'}`,
        companyName: doc.companyName,
        severity: 'medium',
      });
    }

    // 4. Unpaid balance alerts
    if (doc.customerPayment.paymentStatus === 'UNPAID' || doc.customerPayment.paymentStatus === 'PAID_50') {
      notifications.push({
        id: `pay-${doc.id}`,
        docId: doc.id,
        type: 'UNPAID',
        title: doc.customerPayment.paymentStatus === 'UNPAID' ? 'ລູກຄ້າຄ້າງຊຳລະເງິນ 100%' : 'ລູກຄ້າຄ້າງຊຳລະ 50%',
        description: `ໝາຍເຫດ: ${doc.customerPayment.outstandingBalance.remarks || 'ບໍ່ທັນຊຳລະຄົບ'}`,
        companyName: doc.companyName,
        severity: 'info',
      });
    }
  });

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            ການແຈ້ງເຕືອນ Real-time
          </h4>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium">ບໍ່ມີແຈ້ງເຕືອນຕົກຄ້າງ!</p>
            <p className="text-xs text-slate-400 mt-1">ເອກະສານທຸກຢ່າງດຳເນີນງານເປັນປົກກະຕິ</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectDocument(item.docId);
                onClose();
              }}
              className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition flex items-start space-x-3 group"
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  item.severity === 'high'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    : item.severity === 'medium'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                }`}
              >
                {item.type === 'EXPIRING' && <Clock className="w-4 h-4" />}
                {item.type === 'URGENT_PENDING' && <AlertTriangle className="w-4 h-4" />}
                {item.type === 'WAITING_DOCS' && <AlertCircle className="w-4 h-4" />}
                {item.type === 'UNPAID' && <Clock className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                    {item.companyName}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
        <p className="text-[11px] text-slate-400">
          ລະບົບກວດສອບ ແລະ ແຈ້ງເຕືອນອັດໂຕໂນມັດ 24/7
        </p>
      </div>
    </div>
  );
};
