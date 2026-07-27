import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Eye, Edit, Copy, History, Trash2, CheckSquare, Square, MapPin, Laptop, ExternalLink, AlertTriangle, Building2, ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { formatDateDisplay, formatMultiCurrencySummary, getOperationStatusLabel, getPaymentStatusLabel, getUrgencyLabel } from '../utils/formatters';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
  onViewDetails: (doc: DocumentRecord) => void;
  onEditDocument: (doc: DocumentRecord) => void;
  onDuplicateDocument: (doc: DocumentRecord) => void;
  onViewHistory: (doc: DocumentRecord) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleCheckboxField: (
    docId: string,
    field: 'isStamped' | 'isAssembled' | 'isSubmitted' | 'isTracked'
  ) => void;
}

export const DocumentListTable: React.FC<Props> = ({
  documents,
  rates,
  onViewDetails,
  onEditDocument,
  onDuplicateDocument,
  onViewHistory,
  onDeleteDocument,
  onToggleCheckboxField,
}) => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0);

  // Sync scroll width dynamically
  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth);
      } else if (bottomScrollRef.current) {
        setTableScrollWidth(bottomScrollRef.current.scrollWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    if (bottomScrollRef.current) {
      observer.observe(bottomScrollRef.current);
    }
    if (tableRef.current) {
      observer.observe(tableRef.current);
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

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-base">
          ບໍ່ພົບເອກະສານຕາມຕົວກອງທີ່ເລືອກ
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          ລອງປ່ຽນຕົວກອງ ຫຼື ເພີ່ມເອກະສານໃໝ່ເຂົ້າໃນລະບົບ
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
      
      {/* Top Scrollbar Label Header */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 px-3.5 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1.5">
        <div className="flex items-center space-x-3 font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ແຖບເລື່ອນຕາຕະລາງຢູ່ຫົວແຖວ (Top Scrollbar)</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>ແຖບເລື່ອນດ້ານຂ້າງ (Side Vertical Scrollbar)</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          ເລື່ອນຕາຕະລາງ ຊ້າຍ-ຂວາ & ຂຶ້ນ-ລົງ ດ້ານຂ້າງໄດ້ທັນທີ
        </span>
      </div>

      {/* Top Horizontal Scrollbar Track */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="overflow-x-auto overflow-y-hidden bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-700/80"
        style={{ height: '16px' }}
      >
        <div style={{ width: `${tableScrollWidth}px`, height: '1px' }} />
      </div>

      {/* Main Bottom Table Scroll Container with Vertical Side Scrollbar */}
      <div
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        className="overflow-x-auto max-h-[680px] overflow-y-auto"
      >
        <table ref={tableRef} className="w-full text-left text-xs border-collapse">
          
          {/* Table Header Sticky for Vertical Scroll */}
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
            <tr>
              <th className="py-3.5 px-3 text-center w-12">ລຳດັບ</th>
              <th className="py-3.5 px-4 min-w-[220px]">ລາຍຊື່ບໍລິສັດ / ໜ້າວຽກ / ສາຍ</th>
              <th className="py-3.5 px-3 min-w-[130px]">ເລກຂາເຂົ້າ / TIN</th>
              <th className="py-3.5 px-3 text-center min-w-[100px]">ຄວາມດ່ວນ</th>
              <th className="py-3.5 px-3 text-center min-w-[110px]">ມື້ເປີດ / ວັນດຳເນີນ</th>
              <th className="py-3.5 px-3 text-center min-w-[180px]">ຂັ້ນຕອນ (ຈ້ຳ/ປະກອບ/ຍື່ນ/ຕາມ)</th>
              <th className="py-3.5 px-3 min-w-[140px]">ສະຖານະການດຳເນີນ</th>
              <th className="py-3.5 px-3 min-w-[140px]">ຕິດຕັ້ງໂປຣແກຣມ</th>
              <th className="py-3.5 px-3 text-right min-w-[160px]">ມູນຄ່າທັງໝົດ (ລາຍຮັບ)</th>
              <th className="py-3.5 px-3 text-center min-w-[130px]">ຊຳລະເງິນ</th>
              <th className="py-3.5 px-3 text-center w-20">ຈັດການ</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200 font-medium">
            {documents.map((doc, idx) => {
              const urgencyBadge = getUrgencyLabel(doc.urgency);
              const statusBadge = getOperationStatusLabel(doc.operationStatus);
              const paymentBadge = getPaymentStatusLabel(doc.customerPayment.paymentStatus);

              const isUrgent = doc.urgency === 'URGENT';

              return (
                <tr
                  key={doc.id}
                  className={`transition group ${
                    isUrgent
                      ? 'bg-amber-100/90 dark:bg-amber-950/80 hover:bg-amber-200/80 dark:hover:bg-amber-900/90 border-l-4 border-l-amber-500 font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-amber-300 dark:ring-amber-700/80 shadow-xs'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {/* Sequence */}
                  <td className="py-3 px-3 text-center font-bold text-slate-500">
                    {doc.seq !== undefined && doc.seq !== null ? doc.seq : idx + 1}
                  </td>

                  {/* Company Name, Task Type & Line */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        onClick={() => onViewDetails(doc)}
                        className="font-extrabold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-xs"
                      >
                        {doc.companyName}
                      </span>
                      {doc.taskType && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-950/90 dark:text-teal-200 font-bold border border-teal-300 dark:border-teal-700 text-[11px] shadow-2xs">
                          {doc.taskType}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                        ສາຍ: {doc.line || 'ບໍ່ມີສາຍ'}
                      </span>
                      {doc.brokerName && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 font-bold border border-amber-300/80 dark:border-amber-700">
                          ນາຍໜ້າ: {doc.brokerName}
                        </span>
                      )}
                      {doc.isNewCompany && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                          ບໍລິສັດໃໝ່
                        </span>
                      )}
                      {doc.isContractRenewal && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                          ຕໍ່ສັນຍາ
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Incoming No & TIN */}
                  <td className="py-3 px-3">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {doc.incomingNo || '-'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      TIN: {doc.tinNo || '-'}
                    </div>
                  </td>

                  {/* Urgency */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${urgencyBadge.bg} ${urgencyBadge.color}`}>
                      {urgencyBadge.label}
                    </span>
                  </td>

                  {/* Work Open & Processing Days */}
                  <td className="py-3 px-3 text-center">
                    <div className="text-xs">{formatDateDisplay(doc.workOpenDate)}</div>
                    <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {doc.processingDays} ວັນ
                    </div>
                  </td>

                  {/* 4 Checkboxes (ຈ້ຳກາ, ປະກອບ, ຍື່ນ, ຕິດຕາມ) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center space-x-1 text-[11px]">
                      <button
                        onClick={() => onToggleCheckboxField(doc.id, 'isStamped')}
                        title="ບໍລິສັດທີ່ຈ້ຳກາແລ້ວ"
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-0.5 ${
                          doc.isStamped ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {doc.isStamped ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>ຈ້ຳ</span>
                      </button>

                      <button
                        onClick={() => onToggleCheckboxField(doc.id, 'isAssembled')}
                        title="ບໍລິສັດທີ່ປະກອບແລ້ວ"
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-0.5 ${
                          doc.isAssembled ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {doc.isAssembled ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>ປະກອບ</span>
                      </button>

                      <button
                        onClick={() => onToggleCheckboxField(doc.id, 'isSubmitted')}
                        title="ຍື່ນແລ້ວ"
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-0.5 ${
                          doc.isSubmitted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {doc.isSubmitted ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>ຍື່ນ</span>
                      </button>

                      <button
                        onClick={() => onToggleCheckboxField(doc.id, 'isTracked')}
                        title="ຕິດຕາມແລ້ວ"
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-0.5 ${
                          doc.isTracked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {doc.isTracked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>ຕາມ</span>
                      </button>
                    </div>
                  </td>

                  {/* Operation Status */}
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    {doc.completionDate && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ອອກ: {formatDateDisplay(doc.completionDate)}
                      </div>
                    )}
                  </td>

                  {/* Software Installation */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.softwareInstallation.apis && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                          APIS
                        </span>
                      )}
                      {doc.softwareInstallation.tsd && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                          TSD
                        </span>
                      )}
                      {doc.softwareInstallation.pkt && (
                        <span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded">
                          PKT
                        </span>
                      )}
                      {doc.softwareInstallation.renew2026 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                          ຕໍ່2026
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {doc.softwareInstallation.isInstalled ? '✓ ຕິດຕັ້ງແລ້ວ' : '✗ ຍັງບໍ່ຕິດຕັ້ງ'}
                    </div>
                  </td>

                  {/* Total Value */}
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {formatMultiCurrencySummary(doc.totalValue, rates)}
                  </td>

                  {/* Customer Payment Status */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${paymentBadge.bg} ${paymentBadge.color}`}>
                      {paymentBadge.label}
                    </span>
                  </td>

                  {/* Actions Menu */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onViewDetails(doc)}
                        title="ເບິ່ງລາຍລະອຽດ"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditDocument(doc)}
                        title="ດັດແກ້"
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDuplicateDocument(doc)}
                        title="ສຳເນົາເອກະສານ"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewHistory(doc)}
                        title="ປະຫວັດການດັດແກ້"
                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບເອກະສານ "${doc.companyName}"?`)) {
                            onDeleteDocument(doc.id);
                          }
                        }}
                        title="ລົບເອກະສານ"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
        <span>ສະແດງທັງໝົດ: <strong className="text-slate-800 dark:text-slate-200">{documents.length}</strong> ເອກະສານ</span>
        <span>ຄິກທີ່ຊື່ບໍລິສັດ ຫຼື ປຸ່ມ <Eye className="w-3 h-3 inline text-blue-600" /> ເພື່ອເບິ່ງລາຍລະອຽດເຕັມ 35 ຫົວຂໍ້</span>
      </div>
    </div>
  );
};
