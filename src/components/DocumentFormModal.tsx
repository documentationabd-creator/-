import React, { useState, useEffect } from 'react';
import { X, Save, Building2, FileText, Calendar, MapPin, Laptop, DollarSign, ShieldCheck, Check, AlertCircle, Plus, Upload, Trash2, Download, MessageSquare, Briefcase, CheckCircle2, Key } from 'lucide-react';
import { DocumentRecord, ExchangeRates, OperationStatusType, PaymentStatusType, ReimbursementStatusType, UrgencyType, TASK_OPTIONS } from '../types/document';
import { calculateDefaultExpiryDate, calculateProcessingDays, convertToTotalLAK, formatCurrencyLAK } from '../utils/formatters';
import { downloadAttachmentFile } from '../utils/fileDownloadUtils';

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
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'FILES' | 'SUBMISSION' | 'SOFTWARE' | 'FINANCIAL' | 'USERS' | 'REMARKS' | 'TAX_ACC'>('GENERAL');
  
  // Local state initialized with empty or edit object
  const [formData, setFormData] = useState<Partial<DocumentRecord>>({});
  const [customLine, setCustomLine] = useState('');
  const [customTaskType, setCustomTaskType] = useState('');

  useEffect(() => {
    if (documentToEdit) {
      const parsed = JSON.parse(JSON.stringify(documentToEdit));
      if (!parsed.documentExchangeRates) {
        parsed.documentExchangeRates = {
          USD_TO_LAK: rates?.USD_TO_LAK || 21800,
          CNY_TO_LAK: rates?.CNY_TO_LAK || 3050,
        };
      }
      setFormData(parsed);
      if (!LINE_OPTIONS.includes(documentToEdit.line || '')) {
        setCustomLine(documentToEdit.line || '');
      }
      if (documentToEdit.taskType && !TASK_OPTIONS.includes(documentToEdit.taskType as any)) {
        setCustomTaskType(documentToEdit.taskType);
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
        taskType: 'ຕິດຕັ້ງໂປຣແກຣມ',
        documentExchangeRates: {
          USD_TO_LAK: rates?.USD_TO_LAK || 21800,
          CNY_TO_LAK: rates?.CNY_TO_LAK || 3050,
        },
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
    const taskTypeToSave = formData.taskType === 'ໜ້າວຽກອື່ນໆ' 
      ? (customTaskType.trim() ? customTaskType.trim() : 'ໜ້າວຽກອື່ນໆ') 
      : (formData.taskType || 'ຕິດຕັ້ງໂປຣແກຣມ');

    onSave({
      ...formData,
      line: lineToSave,
      taskType: taskTypeToSave,
    });
    onClose();
  };

  // Helper file uploader
  const handleFileUpload = (fieldKey: keyof DocumentRecord, fileObjRaw: File) => {
    const sizeMB = (fileObjRaw.size / (1024 * 1024)).toFixed(1) + ' MB';
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const fileObj = {
        name: fileObjRaw.name,
        url: dataUrl || '#',
        size: sizeMB,
        uploadedAt: new Date().toLocaleDateString('lo-LA'),
      };
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: fileObj,
      }));
    };
    reader.readAsDataURL(fileObjRaw);
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

          <button
            type="button"
            onClick={() => setActiveTab('REMARKS')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'REMARKS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>7. ໝາຍເຫດ & ບັນທຶກ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TAX_ACC')}
            className={`px-4 py-3 border-b-2 font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === 'TAX_ACC'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>8. TaxRIS & Accservice</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          
          {/* TAB 1: GENERAL COMPANY INFO */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>ລຳດັບ (Seq No.) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">ກຳນົດເອງ</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.seq !== undefined ? formData.seq : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setFormData({ ...formData, seq: isNaN(val) ? undefined : val });
                    }}
                    placeholder="ລຳດັບ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                    required
                  />
                </div>

                <div className="sm:col-span-5">
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

                <div className="sm:col-span-4">
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

              {/* ຕົວເລືອກໜ້າວຽກ (Task Type / Service Selection) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>ເລືອກໜ້າວຽກ (Task Type) <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    ກົດເລືອກໜ້າວຽກ ຫຼື ເລືອກຈາກລາຍການ
                  </span>
                </div>

                {/* Quick Task Chips / Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {TASK_OPTIONS.map((task) => {
                    const isSelected = formData.taskType === task || (task === 'ໜ້າວຽກອື່ນໆ' && (formData.taskType === 'ໜ້າວຽກອື່ນໆ' || (formData.taskType && !TASK_OPTIONS.includes(formData.taskType as any))));
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, taskType: task });
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                        )}
                        <span>{task}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Select Dropdown & Custom Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <select
                      value={
                        TASK_OPTIONS.includes(formData.taskType as any)
                          ? formData.taskType
                          : (formData.taskType ? 'ໜ້າວຽກອື່ນໆ' : 'ຕິດຕັ້ງໂປຣແກຣມ')
                      }
                      onChange={(e) => {
                        setFormData({ ...formData, taskType: e.target.value });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                    >
                      {TASK_OPTIONS.map((task) => (
                        <option key={task} value={task}>
                          {task}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(formData.taskType === 'ໜ້າວຽກອື່ນໆ' || (formData.taskType && !TASK_OPTIONS.includes(formData.taskType as any))) && (
                    <div>
                      <input
                        type="text"
                        value={customTaskType}
                        onChange={(e) => setCustomTaskType(e.target.value)}
                        placeholder="ປ້ອນຊື່ໜ້າວຽກອື່ນໆ..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ລາຍຊື່ຜູ້ປະສານງານ
                  </label>
                  <input
                    type="text"
                    value={formData.coordinatorName || ''}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    placeholder="ປ້ອນຊື່ຜູ້ປະສານງານ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ນາຍໜ້າ (Broker / Agent)
                  </label>
                  <input
                    type="text"
                    value={formData.brokerName || ''}
                    onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                    placeholder="ປ້ອນຊື່ນາຍໜ້າ (ຖ້າມີ)..."
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
                  { key: 'bankStatementAttachment', label: 'ໄຟລ໌ແນບສະເຕດເມັ້ນ' },
                  { key: 'accountingTrackingAttachment', label: 'ໄຟລ໌ແນບໃບຕິດຕາມຖືບັນຊີ' },
                  { key: 'contractAttachment', label: 'ໄຟລ໌ແນບສັນຍາຕິດຕັ້ງໂປຣແກຣມ' },
                  { key: 'summaryReportAttachment', label: 'ໄຟລ໌ແນບບົດສະຫຼຸບ' },
                  { key: 'auditReportAttachment', label: 'ໄຟລ໌ແນບບົດກວດກາໄລ່ລຽງ' },
                  { key: 'otherDocsAttachment', label: 'ໄຟລ໌ແນບເອກະສານອື່ນໆ' },
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
                          <span className="truncate text-blue-600 font-medium max-w-[160px]">
                            {currentFile.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => downloadAttachmentFile(currentFile, formData.companyName || '', item.label)}
                              className="text-emerald-600 hover:text-emerald-700 p-1 flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/60 rounded px-1.5 py-0.5 text-[10px] font-bold"
                              title="ດາວໂຫຼດໄຟລ໌ນີ້"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, [item.key]: undefined })}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="ລຶບໄຟລ໌"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id={`file-${item.key}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(item.key as keyof DocumentRecord, e.target.files[0]);
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

              {/* Section 36: Document Exchange Rates */}
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs">
                    36. ອັດຕາແລກປ່ຽນປະຈຳບໍລິສັດ (Document Exchange Rates)
                  </h4>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-semibold">
                    ບັນທຶກປະຈຳບໍລິສັດນີ້
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                      💵 1 USD ＝ (LAK)
                    </label>
                    <input
                      type="number"
                      value={formData.documentExchangeRates?.USD_TO_LAK || 21800}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentExchangeRates: {
                            ...(formData.documentExchangeRates || { USD_TO_LAK: 21800, CNY_TO_LAK: 3050 }),
                            USD_TO_LAK: Number(e.target.value) || 21800,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs text-blue-800 dark:text-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                      💴 1 CNY ＝ (LAK)
                    </label>
                    <input
                      type="number"
                      value={formData.documentExchangeRates?.CNY_TO_LAK || 3050}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentExchangeRates: {
                            ...(formData.documentExchangeRates || { USD_TO_LAK: 21800, CNY_TO_LAK: 3050 }),
                            CNY_TO_LAK: Number(e.target.value) || 3050,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs text-rose-800 dark:text-rose-300"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  💡 ບໍລິສັດນີ້ຈະບັນທຶກ ແລະ ໃຊ້ອັດຕາແລກປ່ຽນນີ້ຕາມທີ່ກຳນົດໄວ້ເບື້ອງຕົ້ນ.
                </p>
              </div>

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
                  ລວມລາຍຮັບຄິດເປັນເງິນກີບ Auto: {formatCurrencyLAK(convertToTotalLAK(formData.totalValue as any, formData.documentExchangeRates || rates))}
                </p>
              </div>

              {/* Section 30: Customer Payment */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                  30. ການຊຳລະເງິນຂອງລູກຄ້າ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                      30.4.1 ຍອດຄ້າງຊຳລະ (LAK)
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

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      30.4.2 ຍອດຄ້າງຊຳລະ $ (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.customerPayment?.outstandingBalance?.usd || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPayment: {
                            ...formData.customerPayment!,
                            outstandingBalance: {
                              ...formData.customerPayment!.outstandingBalance!,
                              usd: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      30.4.3 ຍອດຄ້າງຊຳລະ Y (CNY)
                    </label>
                    <input
                      type="number"
                      value={formData.customerPayment?.outstandingBalance?.cny || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPayment: {
                            ...formData.customerPayment!,
                            outstandingBalance: {
                              ...formData.customerPayment!.outstandingBalance!,
                              cny: Number(e.target.value),
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">31.3 ຄ່າຕິດຕັ້ງ $ (USD)</label>
                    <input
                      type="number"
                      value={formData.installationExpense?.usdCost || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationExpense: {
                            ...formData.installationExpense!,
                            usdCost: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
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

          {/* TAB 7: REMARKS & NOTES */}
          {activeTab === 'REMARKS' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>7. ໝາຍເຫດ & ບັນທຶກທົ່ວໄປ (General Document Remarks)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ບັນທຶກຂໍ້ມູນເພີ່ມເຕີມ, ຂໍ້ສັງເກດ ຫຼື ເງື່ອນໄຂພິເສດສຳລັບບໍລິສັດຕິດຕາມນີ້
                </p>
                <textarea
                  rows={4}
                  value={formData.generalRemarks || ''}
                  onChange={(e) => setFormData({ ...formData, generalRemarks: e.target.value })}
                  placeholder="ປ້ອນໝາຍເຫດ ແລະ ບັນທຶກເພີ່ມເຕີມທົ່ວໄປ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Software Remarks */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ໝາຍເຫດການຕິດຕັ້ງໂປຣແກຣມ (Software Installation Remarks)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.softwareInstallation?.remarks || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        softwareInstallation: {
                          ...(formData.softwareInstallation || {
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
                          }),
                          remarks: e.target.value,
                        },
                      })
                    }
                    placeholder="ໝາຍເຫດໂປຣແກຣມ, PC..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Post Completion Remarks */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ໝາຍເຫດຫຼັງສຳເລັດເອກະສານ (Post Completion Remarks)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.postCompletion?.remarks || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postCompletion: {
                          ...(formData.postCompletion || {
                            inGolonoFolder: false,
                            hasLicenseNo: false,
                            licenseNo: '',
                            licenseDate: '',
                            sentToHeadAndCoord: false,
                            fileSentDate: '',
                            remarks: '',
                          }),
                          remarks: e.target.value,
                        },
                      })
                    }
                    placeholder="ໝາຍເຫດເລກໃບອະນຸຍາດ, ການສົ່ງໄຟລ໌..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Installation Expense Remarks */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ໝາຍເຫດຄ່າເບີກຕິດຕັ້ງ (Installation Expense Remarks)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.installationExpense?.remarks || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installationExpense: {
                          ...(formData.installationExpense || {
                            isReimbursed: false,
                            reimbursementStatus: 'NOT_REIMBURSED',
                            disbursementDate: '',
                            lakCost: 0,
                            usdCost: 0,
                            remarks: '',
                          }),
                          remarks: e.target.value,
                        },
                      })
                    }
                    placeholder="ໝາຍເຫດຄ່າໃຊ້ຈ່າຍຕິດຕັ້ງ..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Contract Remarks */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ໝາຍເຫດສັນຍາຕິດຕັ້ງ (Contract Remarks)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.installationContract?.remarks || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installationContract: {
                          ...(formData.installationContract || {
                            hasContract: false,
                            contractNo: '',
                            signingDate: '',
                            contractValueLAK: 0,
                            contractValueUSD: 0,
                            remarks: '',
                          }),
                          remarks: e.target.value,
                        },
                      })
                    }
                    placeholder="ໝາຍເຫດສັນຍາ, ເງື່ອນໄຂ..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TAXRIS & ACCSERVICE CREDENTIALS */}
          {activeTab === 'TAX_ACC' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>8. ຂໍ້ມູນເຂົ້າລະບົບ TaxRIS & Accservice</span>
              </div>

              {/* 1. TaxRIS Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    TaxRIS
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ຢູເຊີ້ TaxRIS (TaxRIS Username)
                    </label>
                    <input
                      type="text"
                      value={formData.taxRisUser || ''}
                      onChange={(e) => setFormData({ ...formData, taxRisUser: e.target.value })}
                      placeholder="ປ້ອນຢູເຊີ້ TaxRIS..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ລະຫັດ TaxRIS (TaxRIS Password)
                    </label>
                    <input
                      type="text"
                      value={formData.taxRisPass || ''}
                      onChange={(e) => setFormData({ ...formData, taxRisPass: e.target.value })}
                      placeholder="ປ້ອນລະຫັດ TaxRIS..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Accservice Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Accservice
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ຢູເຊີ້ Accservice (Accservice Username)
                    </label>
                    <input
                      type="text"
                      value={formData.accServiceUser || ''}
                      onChange={(e) => setFormData({ ...formData, accServiceUser: e.target.value })}
                      placeholder="ປ້ອນຢູເຊີ້ Accservice..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ລະຫັດ Accservice (Accservice Password)
                    </label>
                    <input
                      type="text"
                      value={formData.accServicePass || ''}
                      onChange={(e) => setFormData({ ...formData, accServicePass: e.target.value })}
                      placeholder="ປ້ອນລະຫັດ Accservice..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
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
