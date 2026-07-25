import React, { useState, useEffect } from 'react';
import { X, Save, Building2, FileText, Calendar, MapPin, Laptop, DollarSign, ShieldCheck, Check, AlertCircle, Plus, Upload, Trash2 } from 'lucide-react';
import { DocumentRecord, ExchangeRates, OperationStatusType, PaymentStatusType, ReimbursementStatusType, UrgencyType } from '../types/document';
import { calculateDefaultExpiryDate, calculateProcessingDays, convertToTotalLAK, formatCurrencyLAK } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentToEdit: DocumentRecord | null;
  rates: ExchangeRates;
  onSave: (doc: Partial<DocumentRecord>) => void;
  totalRecordsCount: number;
}

const LINE_OPTIONS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'ບໍ່ມີສາຍ',
  'ຕ່າງແຂວງ',
  'ກຸ່ມບໍລິສັດສືບສຸລິນຄຳ',
];

export const DocumentFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentToEdit,
  rates,
  onSave,
  totalRecordsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'FILES' | 'SUBMISSION' | 'SOFTWARE' | 'FINANCIAL' | 'USERS'>('GENERAL');
  
  // Local state initialized with empty or edit object
  const [formData, setFormData] = useState<Partial<DocumentRecord>>({});
  const [customLine, setCustomLine] = useState('');

  useEffect(() => {
    if (documentToEdit) {
      setFormData(JSON.parse(JSON.stringify(documentToEdit)));
      if (!LINE_OPTIONS.includes(documentToEdit.line || '')) {
        setCustomLine(documentToEdit.line || '');
      }
    } else {
      // Create new document template
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        seq: totalRecordsCount + 1,
        companyName: '',
        isNewCompany: false,
        isContractRenewal: false,
        line: 'A',
        incomingNo: `IN-${new Date().getFullYear()}-${String(totalRecordsCount + 1).padStart(4, '0')}`,
        workOpenDate: today,
        tinNo: '',
        coordinatorName: '',
        urgency: 'NORMAL',
        processingDays: 0,
        completionDate: '',
        expiryDate: '',
        isStamped: false,
        isAssembled: false,
        isSubmitted: false,
        isTracked: false,
        submissionLocation: '',
        submissionCoordinates: '',
        taxSubmissionDate: '',
        submissionIncomingNo: '',
        taxDocumentHandover: {
          isHandedOver: false,
          handoverDate: '',
          handoverBy: '',
          receivedBy: '',
        },
        softwareInstallation: {
          renew2026: false,
          apis: false,
          tsd: false,
          pkt: false,
          other: '',
          isInstalled: false,
          installTarget: '',
          pcReceiveDate: '',
          clientPickupDate: '',
          remarks: '',
        },
        operationStatus: 'WAITING_DOCS',
        isCompleted: false,
        postCompletion: {
          inGolonoFolder: false,
          hasLicenseNo: false,
          licenseNo: '',
          licenseDate: '',
          sentToHeadAndCoord: false,
          fileSentDate: '',
          remarks: '',
        },
        totalValue: {
          usd: 0,
          lak: 0,
          cny: 0,
          otherValue: 0,
          otherCurrency: '',
          remarks: '',
        },
        customerPayment: {
          isPaid: false,
          paymentStatus: 'UNPAID',
          paidAmount: { usd: 0, lak: 0, cny: 0, otherValue: 0, otherCurrency: '', remarks: '' },
          outstandingBalance: { usd: 0, lak: 0, cny: 0, otherValue: 0, otherCurrency: '', remarks: '' },
        },
        installationExpense: {
          isReimbursed: false,
          reimbursementStatus: 'NOT_REIMBURSED',
          disbursementDate: '',
          lakCost: 0,
          usdCost: 0,
          remarks: '',
        },
        documentProcessingExpense: {
          feeReimbursement: false,
          feeReimbursementStatus: 'NOT_REIMBURSED',
          feeReimbursementDate: '',
          feeCostLAK: 0,
          feeRemarks: '',
          urgentLicenseFeeClaimed: false,
          urgentLicenseFeeDate: '',
          urgentLicenseFeeLAK: 0,
          urgentLicenseFeePaidTo: '',
          urgentLicenseFeeRemarks: '',
          supportFeeClaimed: false,
          supportFeeDate: '',
          supportFeeLAK: 0,
          supportFeeRemarks: '',
        },
        installationContract: {
          hasContract: false,
          contractNo: '',
          signingDate: '',
          contractValueLAK: 0,
          contractValueUSD: 0,
          remarks: '',
        },
        userAndInvoiceLink: {
          primaryUser: { user: '', pass: '', link: '', remarks: '' },
          secondaryUser: { user: '', pass: '', link: '', remarks: '' },
        },
        masterDatabaseSync: true,
      });
    }
  }, [documentToEdit, isOpen, totalRecordsCount]);

  if (!isOpen) return null;

  // Auto calculate processing days on date changes
  const handleWorkOpenDateChange = (val: string) => {
    const days = calculateProcessingDays(val, formData.completionDate);
    setFormData((prev) => ({
      ...prev,
      workOpenDate: val,
      processingDays: days,
    }));
  };

  const handleCompletionDateChange = (val: string) => {
    const days = calculateProcessingDays(formData.workOpenDate || '', val);
    const autoExpiry = calculateDefaultExpiryDate(val);
    setFormData((prev) => ({
      ...prev,
      completionDate: val,
      expiryDate: prev.expiryDate || autoExpiry,
      processingDays: days,
      isCompleted: !!val,
      operationStatus: val ? 'COMPLETED' : prev.operationStatus,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) {
      alert('ກະລຸນາປ້ອນລາຍຊື່ບໍລິສັດ!');
      return;
    }

    const lineToSave = formData.line === 'OTHER' ? customLine : (formData.line || 'A');

    onSave({
      ...formData,
      line: lineToSave,
    });
    onClose();
  };

  // Helper file uploader simulation
  const handleFileUpload = (fieldKey: keyof DocumentRecord, fileName: string) => {
    const fileObj = {
      name: fileName,
      url: '#',
      size: '1.5MB',
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: fileObj,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl dark:bg-emerald-950/60 dark:text-emerald-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xl">
                {documentToEdit ? 'ດັດແກ້ຂໍ້ມູນເອກະສານ' : 'ເພີ່ມເອກະສານຕິດຕາມໃໝ່'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ກະລຸນາປ້ອນຂໍ້ມູນເອກະສານໃຫ້ຄົບຖ້ວນທຸກຫົວຂໍ້
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/30 px-4 text-xs font-medium space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('GENERAL')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'GENERAL'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. ຂໍ້ມູນບໍລິສັດ & ຂາເຂົ້າ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FILES')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'FILES'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. ໄຟລ໌ແນບເອກະສານ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUBMISSION')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'SUBMISSION'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>3. ສະຖານທີ່ຍື່ນ & ມອບຂາເຂົ້າ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SOFTWARE')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'SOFTWARE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>4. ຕິດຕັ້ງໂປຣແກຣມ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINANCIAL')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'FINANCIAL'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>5. ລາຍຮັບ/ການຊຳລະ/ລາຍຈ່າຍ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'USERS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>6. USER & ລິ້ງອອກບິນ</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          
          {/* TAB 1: GENERAL COMPANY INFO */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ລາຍຊື່ບໍລິສັດ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="ປ້ອນລາຍຊື່ບໍລິສັດ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isNewCompany}
                        onChange={(e) => setFormData({ ...formData, isNewCompany: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>ບໍລິສັດໃໝ່</span>
                    </label>
                    <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isContractRenewal}
                        onChange={(e) => setFormData({ ...formData, isContractRenewal: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>ບໍລິສັດທີ່ຕໍ່ສັນຍາ</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ສາຍວຽກ (Line)
                  </label>
                  <select
                    value={LINE_OPTIONS.includes(formData.line || '') ? formData.line : 'OTHER'}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setFormData({ ...formData, line: 'OTHER' });
                      } else {
                        setFormData({ ...formData, line: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {LINE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="OTHER">ອື່ນໆ (ພິມຂໍ້ມູນເອງ)</option>
                  </select>
                  {formData.line === 'OTHER' && (
                    <input
                      type="text"
                      value={customLine}
                      onChange={(e) => setCustomLine(e.target.value)}
                      placeholder="ປ້ອນຊື່ສາຍວຽກ..."
                      className="w-full mt-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ເລກທີ່ຂາເຂົ້າ
                  </label>
                  <input
                    type="text"
                    value={formData.incomingNo || ''}
                    onChange={(e) => setFormData({ ...formData, incomingNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ມື້ເປີດວຽກ
                  </label>
                  <input
                    type="date"
                    value={formData.workOpenDate || ''}
                    onChange={(e) => handleWorkOpenDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ເລກ TIN
                  </label>
                  <input
                    type="text"
                    value={formData.tinNo || ''}
                    onChange={(e) => setFormData({ ...formData, tinNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ລາຍຊື່ຜູ້ປະສານງານ
                  </label>
                  <input
                    type="text"
                    value={formData.coordinatorName || ''}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ລຳດັບຄວາມສຳຄັນໜ້າວຽກ (Urgency)
                  </label>
                  <select
                    value={formData.urgency || 'NORMAL'}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="NORMAL">1. ປົກກະຕິ (Normal)</option>
                    <option value="URGENT">2. ດ່ວນ (Urgent ⚡)</option>
                  </select>
                </div>
              </div>

              {/* Progress Dates & Status */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  ສະຖານະການດຳເນີນງານ & ວັນເດືອນປີສຳເລັດ/ໝົດອາຍຸ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      ມື້ເອກະສານອອກ (ວັນທີສຳເລັດ)
                    </label>
                    <input
                      type="date"
                      value={formData.completionDate || ''}
                      onChange={(e) => handleCompletionDateChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      ວັນໝົດອາຍຸ (ອັດໂຕ +10 ເດືອນ)
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate || ''}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      ຈຳນວນວັນດຳເນີນງານ (Auto)
                    </label>
                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-600 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-800">
                      {formData.processingDays || 0} ວັນ
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      ສະຖານະການດຳເນີນງານ
                    </label>
                    <select
                      value={formData.operationStatus || 'WAITING_DOCS'}
                      onChange={(e) => setFormData({ ...formData, operationStatus: e.target.value as OperationStatusType })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="WAITING_DOCS">ລໍຖ້າສະໜອງເອກະສານ</option>
                      <option value="WAITING_ISSUE">ລໍຖ້າເອກະສານອອກ</option>
                      <option value="COMPLETED">ສຳເລັດ</option>
                      <option value="SUSPENDED">ໂຈະການດຳເນີນ</option>
                      <option value="CANCELLED">ຍົກເລີກ</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <label className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isStamped}
                        onChange={(e) => setFormData({ ...formData, isStamped: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>ຈ້ຳກາແລ້ວ</span>
                    </label>

                    <label className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isAssembled}
                        onChange={(e) => setFormData({ ...formData, isAssembled: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>ປະກອບແລ້ວ</span>
                    </label>

                    <label className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isSubmitted}
                        onChange={(e) => setFormData({ ...formData, isSubmitted: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>ຍື່ນແລ້ວ</span>
                    </label>

                    <label className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.isTracked}
                        onChange={(e) => setFormData({ ...formData, isTracked: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>ຕິດຕາມແລ້ວ</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILE ATTACHMENTS */}
          {activeTab === 'FILES' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                ອັບໂຫຼດໄຟລ໌ແນບສຳຄັນທັງໝົດສຳລັບເອກະສານນີ້ (ສາມາດອັບໂຫຼດ PDF / Images)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'workOpenAttachment', label: '6. ໄຟລ໌ແນບໃບເປີດວຽກ' },
                  { key: 'registrationAttachment', label: '10. ໄຟລ໌ແນບໃບທະບຽນ' },
                  { key: 'memoAttachment', label: '11. ໄຟລ໌ແນບບົດບັນທຶກ' },
                  { key: 'prevYearLicenseAttachment', label: '12. ໃບອະນຸຍາດນຳໃຊ້ປີຜ່ານມາ' },
                  { key: 'taxCertAttachment', label: '13. ໃບອມພ (ອາກອນ)' },
                  { key: 'prevYearObligationAttachment', label: '14. ໃບມອບພັນທະປີຜ່ານມາ' },
                  { key: 'submissionReceiptAttachment', label: '24. ໄຟລ໌ເລກທີ່ຍື່ນ' },
                  { key: 'completedDocAttachment', label: '27.3 ແນບໄຟລ໌ເອກະສານສຳເລັດ' },
                ].map((item) => {
                  const currentFile = (formData as any)[item.key];
                  return (
                    <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {item.label}
                      </span>
                      {currentFile ? (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="truncate text-blue-600 font-medium max-w-[180px]">
                            {currentFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, [item.key]: undefined })}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id={`file-${item.key}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(item.key as keyof DocumentRecord, e.target.files[0].name);
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-${item.key}`}
                            className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>ເລືອກໄຟລ໌ອັບໂຫຼດ</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SUBMISSION LOCATION & TAX HANDOVER */}
          {activeTab === 'SUBMISSION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    21. ສະຖານທີ່ຍື່ນ
                  </label>
                  <input
                    type="text"
                    value={formData.submissionLocation || ''}
                    onChange={(e) => setFormData({ ...formData, submissionLocation: e.target.value })}
                    placeholder="ປ້ອນຊື່ສະຖານທີ່ຍື່ນ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ພິກັດ GPS (Lat, Long)
                  </label>
                  <input
                    type="text"
                    value={formData.submissionCoordinates || ''}
                    onChange={(e) => setFormData({ ...formData, submissionCoordinates: e.target.value })}
                    placeholder="ຕົວຢ່າງ: 17.9757, 102.6331"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    22. ມື້ຍື່ນຢູ່ອາກອນ
                  </label>
                  <input
                    type="date"
                    value={formData.taxSubmissionDate || ''}
                    onChange={(e) => setFormData({ ...formData, taxSubmissionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    23. ເລກທີ່ຂາເຂົ້າ-ຍື່ນ
                  </label>
                  <input
                    type="text"
                    value={formData.submissionIncomingNo || ''}
                    onChange={(e) => setFormData({ ...formData, submissionIncomingNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Section 25: Tax Document Handover */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  25. ເອກະສານສຳເລັດມອບໃຫ້ຂາເຂົ້າ (ອາກອນ)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.taxDocumentHandover?.isHandedOver}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxDocumentHandover: {
                              ...formData.taxDocumentHandover!,
                              isHandedOver: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>25.1 ມອບເອກະສານສຳເລັດແລ້ວ</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">25.2 ວັນທີມອບ</label>
                    <input
                      type="date"
                      value={formData.taxDocumentHandover?.handoverDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxDocumentHandover: {
                            ...formData.taxDocumentHandover!,
                            handoverDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">25.3 ຊື່ຜູ້ມອບ</label>
                    <input
                      type="text"
                      value={formData.taxDocumentHandover?.handoverBy || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxDocumentHandover: {
                            ...formData.taxDocumentHandover!,
                            handoverBy: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">25.4 ລາຍຊື່ຜູ້ຮັບ</label>
                    <input
                      type="text"
                      value={formData.taxDocumentHandover?.receivedBy || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxDocumentHandover: {
                            ...formData.taxDocumentHandover!,
                            receivedBy: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 28: Post Completion */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  28. ເມື່ອເອກະສານສຳເລັດ (ຈັດເກັບ & ເລກທີອະນຸຍາດ)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="inline-flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.postCompletion?.inGolonoFolder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postCompletion: { ...formData.postCompletion!, inGolonoFolder: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span>28.1 ຈັດເຂົ້າແຟ້ມໂກໂລໂນ້</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.postCompletion?.sentToHeadAndCoord}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postCompletion: { ...formData.postCompletion!, sentToHeadAndCoord: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span>28.5 ສົ່ງໃຫ້ຫົວໜ້າສາຍ ແລະ ຜູ້ປະສານງານ</span>
                  </label>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">28.3 ເລກທີ່ອະນຸຍາດ</label>
                    <input
                      type="text"
                      value={formData.postCompletion?.licenseNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postCompletion: { ...formData.postCompletion!, licenseNo: e.target.value, hasLicenseNo: true },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">28.4 ວັນທີ່ອະນຸຍາດ</label>
                    <input
                      type="date"
                      value={formData.postCompletion?.licenseDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postCompletion: { ...formData.postCompletion!, licenseDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOFTWARE INSTALLATION */}
          {activeTab === 'SOFTWARE' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  26. ການຕິດຕັ້ງໂປຣແກຣມ
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.softwareInstallation?.renew2026}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, renew2026: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span>1. ຕໍ່ 2026</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.softwareInstallation?.apis}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, apis: e.target.checked },
                        })
                      }
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    <span>2. APIS</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.softwareInstallation?.tsd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, tsd: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <span>3. TSD</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.softwareInstallation?.pkt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, pkt: e.target.checked },
                        })
                      }
                      className="rounded text-pink-600 w-4 h-4"
                    />
                    <span>4. PKT (ປະກາຍທິບ)</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.softwareInstallation?.isInstalled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, isInstalled: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span>6. ຕິດຕັ້ງແລ້ວ</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">5. ໂປຣແກຣມອື່ນໆ</label>
                    <input
                      type="text"
                      value={formData.softwareInstallation?.other || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, other: e.target.value },
                        })
                      }
                      placeholder="ປ້ອນຊື່ໂປຣແກຣມອື່ນໆ..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">7. ຕິດຕັ້ງໃສ່ (ຄອມພິວເຕີ)</label>
                    <input
                      type="text"
                      value={formData.softwareInstallation?.installTarget || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, installTarget: e.target.value },
                        })
                      }
                      placeholder="ເຊັ່ນ: PC Office, Laptop Staff..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">8. ວັນທີຮັບຄອມ</label>
                    <input
                      type="date"
                      value={formData.softwareInstallation?.pcReceiveDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, pcReceiveDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">9. ລູກຄ້າມາຮັບຄອມໄປເມື່ອວັນທີ</label>
                    <input
                      type="date"
                      value={formData.softwareInstallation?.clientPickupDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          softwareInstallation: { ...formData.softwareInstallation!, clientPickupDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 33: Software Installation Contract */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  33. ສັນຍາຕິດຕັ້ງໂປຣແກຣມ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.installationContract?.hasContract}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            installationContract: { ...formData.installationContract!, hasContract: e.target.checked },
                          })
                        }
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>33.1 ມີສັນຍາຕິດຕັ້ງ</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">33.2 ເລກທີ່ສັນຍາ</label>
                    <input
                      type="text"
                      value={formData.installationContract?.contractNo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationContract: { ...formData.installationContract!, contractNo: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">33.3 ວັນທີເຊັນສັນຍາ</label>
                    <input
                      type="date"
                      value={formData.installationContract?.signingDate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationContract: { ...formData.installationContract!, signingDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL & EXPENSES */}
          {activeTab === 'FINANCIAL' && (
            <div className="space-y-4">
              {/* Section 29: Total Revenue */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                  29. ມູນຄ່າທັງໝົດ (ລາຍຮັບ)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">29.1 ດອລລາ ($)</label>
                    <input
                      type="number"
                      value={formData.totalValue?.usd || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalValue: { ...formData.totalValue!, usd: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">29.2 ກີບ (LAK)</label>
                    <input
                      type="number"
                      value={formData.totalValue?.lak || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalValue: { ...formData.totalValue!, lak: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">29.3 ຢວນ (¥)</label>
                    <input
                      type="number"
                      value={formData.totalValue?.cny || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalValue: { ...formData.totalValue!, cny: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  ລວມລາຍຮັບຄິດເປັນເງິນກີບ Auto: {formatCurrencyLAK(convertToTotalLAK(formData.totalValue as any, rates))}
                </p>
              </div>

              {/* Section 30: Customer Payment */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                  30. ການຊຳລະເງິນຂອງລູກຄ້າ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      30.2 ສະຖານະຊຳລະເງິນ
                    </label>
                    <select
                      value={formData.customerPayment?.paymentStatus || 'UNPAID'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPayment: {
                            ...formData.customerPayment!,
                            paymentStatus: e.target.value as PaymentStatusType,
                            isPaid: e.target.value === 'PAID',
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="PAID">1. ລູກຄ້າຊຳລະແລ້ວ 100%</option>
                      <option value="UNPAID">2. ລູກຄ້າຄ້າງຊຳລະ</option>
                      <option value="PAID_50">3. ລູກຄ້າຊຳລະ 50%</option>
                      <option value="PAID_ON_COMPLETION">4. ລູກຄ້າຊຳລະເມື່ອເອກະສານສຳເລັດ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      30.4 ຍອດຄ້າງຊຳລະ (LAK)
                    </label>
                    <input
                      type="number"
                      value={formData.customerPayment?.outstandingBalance?.lak || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPayment: {
                            ...formData.customerPayment!,
                            outstandingBalance: {
                              ...formData.customerPayment!.outstandingBalance!,
                              lak: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 31 & 32: Expenses */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  31. ລາຍຈ່າຍ ຄ່າຕິດຕັ້ງໂປຣແກຣມ & 32. ຄ່າໃຊ້ຈ່າຍເອກະສານ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">31.2 ຄ່າຕິດຕັ້ງ LAK</label>
                    <input
                      type="number"
                      value={formData.installationExpense?.lakCost || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationExpense: {
                            ...formData.installationExpense!,
                            lakCost: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">32.1 ຄ່າທຳນຽມ LAK</label>
                    <input
                      type="number"
                      value={formData.documentProcessingExpense?.feeCostLAK || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentProcessingExpense: {
                            ...formData.documentProcessingExpense!,
                            feeCostLAK: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">32.2 ຄ່າດ່ວນໃບອະນຸຍາດ LAK</label>
                    <input
                      type="number"
                      value={formData.documentProcessingExpense?.urgentLicenseFeeLAK || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentProcessingExpense: {
                            ...formData.documentProcessingExpense!,
                            urgentLicenseFeeLAK: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USERS & ACCOUNTS */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  34.1 USER ຫຼັກ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">USER</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.primaryUser?.user || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            primaryUser: {
                              ...formData.userAndInvoiceLink!.primaryUser!,
                              user: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Password</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.primaryUser?.pass || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            primaryUser: {
                              ...formData.userAndInvoiceLink!.primaryUser!,
                              pass: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">LING (URL)</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.primaryUser?.link || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            primaryUser: {
                              ...formData.userAndInvoiceLink!.primaryUser!,
                              link: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  34.2 USER ສຳຮອງ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">USER</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.secondaryUser?.user || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            secondaryUser: {
                              ...formData.userAndInvoiceLink!.secondaryUser!,
                              user: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Password</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.secondaryUser?.pass || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            secondaryUser: {
                              ...formData.userAndInvoiceLink!.secondaryUser!,
                              pass: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">LING (URL)</label>
                    <input
                      type="text"
                      value={formData.userAndInvoiceLink?.secondaryUser?.link || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userAndInvoiceLink: {
                            ...formData.userAndInvoiceLink!,
                            secondaryUser: {
                              ...formData.userAndInvoiceLink!.secondaryUser!,
                              link: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              35. ຂໍ້ມູນຖານຂໍ້ມູນຫຼັກ (Master Database Enabled)
            </span>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-xs transition"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>ບັນທຶກເອກະສານ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
