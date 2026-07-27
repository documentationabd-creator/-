import React from 'react';
import { X, Building2, FileText, DollarSign, Calendar, MapPin, CheckCircle2, AlertCircle, Clock, ShieldCheck, Download, History, Edit, ExternalLink, Laptop, FolderDown, Key } from 'lucide-react';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { convertToTotalLAK, formatCurrencyLAK, formatDateDisplay, formatMultiCurrencySummary, getOperationStatusLabel, getPaymentStatusLabel, getUrgencyLabel } from '../utils/formatters';
import { downloadAttachmentFile } from '../utils/fileDownloadUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  rates: ExchangeRates;
  onEdit: (doc: DocumentRecord) => void;
  onViewHistory: (doc: DocumentRecord) => void;
}

export const DocumentDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  document: doc,
  rates,
  onEdit,
  onViewHistory,
}) => {
  if (!isOpen || !doc) return null;

  const totalRevLAK = convertToTotalLAK(doc.totalValue, rates);
  const totalOutLAK = convertToTotalLAK(doc.customerPayment.outstandingBalance, rates);
  const totalExpensesLAK = (doc.installationExpense.lakCost || 0) + 
    (doc.documentProcessingExpense.feeCostLAK || 0) + 
    (doc.documentProcessingExpense.urgentLicenseFeeLAK || 0) + 
    (doc.documentProcessingExpense.supportFeeLAK || 0);
  const netProfitLAK = totalRevLAK - totalExpensesLAK;

  const urgencyBadge = getUrgencyLabel(doc.urgency);
  const statusBadge = getOperationStatusLabel(doc.operationStatus);
  const paymentBadge = getPaymentStatusLabel(doc.customerPayment.paymentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl dark:bg-blue-950/60 dark:text-blue-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  ລຳດັບ: #{doc.seq}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${urgencyBadge.bg} ${urgencyBadge.color}`}>
                  {urgencyBadge.label}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xl mt-1">
                {doc.companyName}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(doc);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-medium transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>ດັດແກ້</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onViewHistory(doc);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-medium transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>ປະຫວັດ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Quick Checkboxes Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/80">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${doc.isStamped ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">ບໍລິສັດຈ້ຳກາແລ້ວ</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${doc.isAssembled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">ປະກອບເອກະສານແລ້ວ</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${doc.isSubmitted ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">ຍື່ນເອກະສານແລ້ວ</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${doc.isTracked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">ຕິດຕາມເອກະສານແລ້ວ</span>
            </div>
          </div>

          {/* Section 1: ຂໍ້ມູນທົ່ວໄປ & ສາຍວຽກ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>1. ຂໍ້ມູນບໍລິສັດ, ສາຍວຽກ ແລະ ເອກະສານຂາເຂົ້າ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-slate-400 block">ໜ້າວຽກ (Task Type):</span>
                <span className="inline-block font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {doc.taskType || 'ຕິດຕັ້ງໂປຣແກຣມ'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ສາຍ (Line):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.line || 'ບໍ່ມີສາຍ'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ເລກທີ່ຂາເຂົ້າ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.incomingNo || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ມື້ເປີດວຽກ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateDisplay(doc.workOpenDate)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ເລກ TIN:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.tinNo || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ຜູ້ປະສານງານ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.coordinatorName || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ນາຍໜ້າ (Broker):</span>
                <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 inline-block text-xs">
                  {doc.brokerName || '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ຈຳນວນວັນດຳເນີນ (ນັບຈາກມື້ເປີດວຽກ):</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{doc.processingDays} ວັນ</span>
              </div>
            </div>
          </div>

          {/* Section 2: ວັນທີອອກ & ວັນທີໝົດອາຍຸ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>2. ວັນເດືອນປີສຳເລັດ ແລະ ວັນໝົດອາຍຸ (10 ເດືອນ)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">ວັນເດືອນປີສຳເລັດ (ມື້ເອກະສານອອກ):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatDateDisplay(doc.completionDate)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ວັນເດືອນປີໝົດອາຍຸ (+10 ເດືອນ):</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-base">{formatDateDisplay(doc.expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: ສະຖານທີ່ຍື່ນ & ມອບເອກະສານ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>3. ສະຖານທີ່ຍື່ນ, ພິກັດ ແລະ ການມອບເອກະສານອາກອນ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 block">ສະຖານທີ່ຍື່ນ:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{doc.submissionLocation || '-'}</span>
                {doc.submissionCoordinates && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(doc.submissionCoordinates)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:underline mt-1 space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>ເບິ່ງພິກັດ GPS ({doc.submissionCoordinates})</span>
                  </a>
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ມື້ຍື່ນຢູ່ອາກອນ & ເລກທີ່ຂາເຂົ້າ-ຍື່ນ:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDateDisplay(doc.taxSubmissionDate)} | {doc.submissionIncomingNo || '-'}
                </span>
              </div>
              <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ມອບເອກະສານສຳເລັດໃຫ້ຂາເຂົ້າອາກອນ:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {doc.taxDocumentHandover.isHandedOver ? '✓ ມອບເອກະສານສຳເລັດແລ້ວ' : '✗ ຍັງບໍ່ທັນມອບ'} | 
                  ວັນທີ: {formatDateDisplay(doc.taxDocumentHandover.handoverDate)} | 
                  ຜູ້ມອບ: {doc.taxDocumentHandover.handoverBy || '-'} | 
                  ຜູ້ຮັບ: {doc.taxDocumentHandover.receivedBy || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: ການຕິດຕັ້ງໂປຣແກຣມ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <Laptop className="w-4 h-4 text-purple-600" />
              <span>4. ການຕິດຕັ້ງໂປຣແກຣມ (APIS, TSD, ປະກາຍທິບ PKT, ຕໍ່ 2026)</span>
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl space-y-2">
              <div className="flex flex-wrap gap-2">
                {doc.softwareInstallation.apis && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">APIS</span>}
                {doc.softwareInstallation.tsd && <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">TSD</span>}
                {doc.softwareInstallation.pkt && <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-bold">PKT (ປະກາຍທິບ)</span>}
                {doc.softwareInstallation.renew2026 && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">ຕໍ່ 2026</span>}
                {doc.softwareInstallation.other && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">{doc.softwareInstallation.other}</span>}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ສະຖານະຕິດຕັ້ງ: <strong className="text-slate-800 dark:text-slate-200">{doc.softwareInstallation.isInstalled ? 'ຕິດຕັ້ງແລ້ວ' : 'ຍັງບໍ່ຕິດຕັ້ງ'}</strong> | 
                ຕິດຕັ້ງໃສ່: {doc.softwareInstallation.installTarget || '-'} | 
                ມື້ຮັບຄອມ: {formatDateDisplay(doc.softwareInstallation.pcReceiveDate)} | 
                ມື້ລູກຄ້າມາຮັບຄອມ: {formatDateDisplay(doc.softwareInstallation.clientPickupDate)}
              </p>
              {doc.softwareInstallation.remarks && (
                <p className="text-xs text-slate-500 italic">
                  ໝາຍເຫດ: {doc.softwareInstallation.remarks}
                </p>
              )}
            </div>
          </div>

          {/* Section 5: ການເງິນ - ລາຍຮັບ & ລາຍຈ່າຍ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>5. ລາຍຮັບ, ການຊຳລະເງິນ ແລະ ລາຍຈ່າຍຕົ້ນທຶນ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">ມູນຄ່າທັງໝົດ (ລາຍຮັບ)</span>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                  {formatMultiCurrencySummary(doc.totalValue, rates)}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">ຍອດຄ້າງຊຳລະ (4 ສະກຸນເງິນ)</span>
                <p className="text-base font-bold text-amber-800 dark:text-amber-200 mt-1">
                  {formatMultiCurrencySummary(doc.customerPayment.outstandingBalance, rates)}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  {paymentBadge.label} (ແປງເປັນ LAK: {formatCurrencyLAK(totalOutLAK)})
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">ກຳໄລສຸດທິ (LAK)</span>
                <p className="text-base font-bold text-indigo-800 dark:text-indigo-200 mt-1">
                  {formatCurrencyLAK(netProfitLAK)}
                </p>
                <p className="text-[11px] text-indigo-500 mt-0.5">
                  ລວມລາຍຈ່າຍ: {formatCurrencyLAK(totalExpensesLAK)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: USER ແລະ ລິ້ງອອກບິນ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>6. ຢູເຊີ້ (User Accounts) ແລະ ລິ້ງອອກບິນ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  USER ຫຼັກ:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  User: <strong className="text-slate-800 dark:text-slate-200">{doc.userAndInvoiceLink.primaryUser.user || '-'}</strong> | 
                  Pass: <strong className="text-slate-800 dark:text-slate-200">{doc.userAndInvoiceLink.primaryUser.pass || '-'}</strong>
                </p>
                {doc.userAndInvoiceLink.primaryUser.link && (
                  <a
                    href={doc.userAndInvoiceLink.primaryUser.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{doc.userAndInvoiceLink.primaryUser.link}</span>
                  </a>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  USER ສຳຮອງ:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  User: <strong className="text-slate-800 dark:text-slate-200">{doc.userAndInvoiceLink.secondaryUser.user || '-'}</strong> | 
                  Pass: <strong className="text-slate-800 dark:text-slate-200">{doc.userAndInvoiceLink.secondaryUser.pass || '-'}</strong>
                </p>
                {doc.userAndInvoiceLink.secondaryUser.link && (
                  <a
                    href={doc.userAndInvoiceLink.secondaryUser.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{doc.userAndInvoiceLink.secondaryUser.link}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section 8: ຂໍ້ມູນເຂົ້າລະບົບ TaxRIS & Accservice */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>8. ຂໍ້ມູນເຂົ້າລະບົບ TaxRIS & Accservice</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  1. TaxRIS:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ຢູເຊີ້ TaxRIS: <strong className="text-slate-800 dark:text-slate-200">{doc.taxRisUser || '-'}</strong>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  ລະຫັດ TaxRIS: <strong className="text-slate-800 dark:text-slate-200 font-mono">{doc.taxRisPass || '-'}</strong>
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  2. Accservice:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ຢູເຊີ້ Accservice: <strong className="text-slate-800 dark:text-slate-200">{doc.accServiceUser || '-'}</strong>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  ລະຫັດ Accservice: <strong className="text-slate-800 dark:text-slate-200 font-mono">{doc.accServicePass || '-'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: ໄຟລ໌ແນບເອກະສານ & ດາວໂຫຼດ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <FolderDown className="w-4 h-4 text-emerald-600" />
              <span>7. ໄຟລ໌ແນບເອກະສານ & ດາວໂຫຼດ (Attached Files)</span>
            </h3>

            {(() => {
              const fileEntries = [
                { label: '6. ໃບເປີດວຽກ', file: doc.workOpenAttachment },
                { label: '10. ໃບທະບຽນວິສາຫະກິດ', file: doc.registrationAttachment },
                { label: '11. ໃບສະເໜີ/ບົດບັນທຶກ', file: doc.memoAttachment },
                { label: 'ສະເຕດເມັ້ນ', file: doc.bankStatementAttachment },
                { label: 'ໃບຕິດຕາມຖືບັນຊີ', file: doc.accountingTrackingAttachment },
                { label: 'ສັນຍາຕິດຕັ້ງໂປຣແກຣມ', file: doc.contractAttachment },
                { label: 'ບົດສະຫຼຸບ', file: doc.summaryReportAttachment },
                { label: 'ບົດກວດກາໄລ່ລຽງ', file: doc.auditReportAttachment },
                { label: 'ເອກະສານອື່ນໆ', file: doc.otherDocsAttachment },
                { label: '12. ໃບອະນຸຍາດປີຜ່ານມາ', file: doc.prevYearLicenseAttachment },
                { label: '13. ໃບອມພ/ຢັ້ງຢືນອາກອນ', file: doc.taxCertAttachment },
                { label: '14. ໃບມອບພັນທະປີຜ່ານມາ', file: doc.prevYearObligationAttachment },
                { label: '24. ໃບຮັບຍື່ນອາກອນ', file: doc.submissionReceiptAttachment },
                { label: '27.3 ໃບອະນຸຍາດສຳເລັດ', file: doc.completedDocAttachment },
                { label: '31. ໃບເບີກຄ່າຕິດຕັ້ງ', file: doc.installationExpense?.paymentAttachment },
              ].filter((item) => item.file && item.file.name);

              if (fileEntries.length === 0) {
                return (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    ບໍ່ມີໄຟລ໌ແນບສຳລັບບໍລິສັດນີ້.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {fileEntries.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {item.file!.name}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadAttachmentFile(item.file!, doc.companyName, item.label)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition"
                        title="ດາວໂຫຼດໄຟລ໌ນີ້"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Section 8: ໝາຍເຫດ & ບັນທຶກເພີ່ມເຕີມ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>8. ໝາຍເຫດ & ບັນທຶກເພີ່ມເຕີມ (Remarks & Notes)</span>
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">ໝາຍເຫດທົ່ວໄປ: </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {doc.generalRemarks || 'ບໍ່ມີໝາຍເຫດທົ່ວໄປ'}
                </span>
              </div>
              {doc.softwareInstallation?.remarks && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">ໝາຍເຫດໂປຣແກຣມ: </span>
                  <span className="text-slate-600 dark:text-slate-300">{doc.softwareInstallation.remarks}</span>
                </div>
              )}
              {doc.postCompletion?.remarks && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">ໝາຍເຫດຫຼັງສຳເລັດ: </span>
                  <span className="text-slate-600 dark:text-slate-300">{doc.postCompletion.remarks}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            ອັບເດດລ່າສຸດ: {formatDateDisplay(doc.updatedAt)}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl transition"
          >
            ອັດໜ້າຕ່າງ
          </button>
        </div>
      </div>
    </div>
  );
};
