import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  FolderDown,
  FileCode,
  FileCheck,
  Building2,
  Plus,
  Eye,
  Trash2,
  Upload,
  RefreshCw,
  X,
  Copy,
  ExternalLink,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import { DocumentRecord, FileAttachment, ExchangeRates } from '../types/document';
import { downloadAttachmentFile, downloadMultipleAttachmentsReport } from '../utils/fileDownloadUtils';
import { formatDateDisplay } from '../utils/formatters';

interface AttachmentItem {
  id: string; // docId + categoryKey
  docId: string;
  companyName: string;
  line: string;
  tinNo: string;
  urgency: string;
  operationStatus: string;
  categoryKey: string;
  categoryLabel: string;
  categoryBadgeBg: string;
  attachment: FileAttachment;
}

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
  onViewDetails: (doc: DocumentRecord) => void;
  onUpdateDocument?: (doc: DocumentRecord) => void;
}

const CATEGORY_OPTIONS = [
  { key: 'ALL', label: 'ທຸກໝວດໄຟລ໌ແນບ (All Categories)' },
  { key: 'workOpenAttachment', label: '6. ໃບເປີດວຽກ (Work Open)' },
  { key: 'registrationAttachment', label: '10. ໃບທະບຽນວິສາຫະກິດ (Registration Cert)' },
  { key: 'memoAttachment', label: '11. ໃບສະເໜີ / ບົດບັນທຶກ (Memo & Proposal)' },
  { key: 'prevYearLicenseAttachment', label: '12. ໃບອະນຸຍາດປີຜ່ານມາ (Previous License)' },
  { key: 'taxCertAttachment', label: '13. ໃບອມພ / ຢັ້ງຢືນອາກອນ (Tax Certificate)' },
  { key: 'prevYearObligationAttachment', label: '14. ໃບມອບພັນທະປີຜ່ານມາ (Tax Obligation)' },
  { key: 'submissionReceiptAttachment', label: '24. ໃບຮັບຍື່ນ / ໃບຮັບເງິນອາກອນ (Tax Submission Receipt)' },
  { key: 'completedDocAttachment', label: '27.3 ໃບອະນຸຍາດສຳເລັດ (Completed License)' },
  { key: 'paymentAttachment', label: '31. ໃບເບີກ / ໃບຮັບເງິນຄ່າຕິດຕັ້ງ (Installation Payment)' },
];

export const DocumentAttachmentsView: React.FC<Props> = ({
  documents,
  rates,
  onViewDetails,
  onUpdateDocument,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState('ALL'); // ALL, PDF, IMG, DOC
  
  // Selection state for batch download
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal preview state
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null);

  // New attachment upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('registrationAttachment');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string>('');

  // Extract all attachment items from document records
  const allAttachments = useMemo(() => {
    const list: AttachmentItem[] = [];

    documents.forEach((doc) => {
      const add = (
        key: string,
        label: string,
        badgeBg: string,
        file?: FileAttachment
      ) => {
        if (file && file.name) {
          list.push({
            id: `${doc.id}-${key}`,
            docId: doc.id,
            companyName: doc.companyName,
            line: doc.line || 'A',
            tinNo: doc.tinNo || '',
            urgency: doc.urgency,
            operationStatus: doc.operationStatus,
            categoryKey: key,
            categoryLabel: label,
            categoryBadgeBg: badgeBg,
            attachment: file,
          });
        }
      };

      add('workOpenAttachment', '6. ໃບເປີດວຽກ', 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300', doc.workOpenAttachment);
      add('registrationAttachment', '10. ໃບທະບຽນວິສາຫະກິດ', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', doc.registrationAttachment);
      add('memoAttachment', '11. ໃບສະເໜີ/ບົດບັນທຶກ', 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', doc.memoAttachment);
      add('prevYearLicenseAttachment', '12. ໃບອະນຸຍາດປີຜ່ານມາ', 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300', doc.prevYearLicenseAttachment);
      add('taxCertAttachment', '13. ໃບອມພ/ຢັ້ງຢືນອາກອນ', 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300', doc.taxCertAttachment);
      add('prevYearObligationAttachment', '14. ໃບມອບພັນທະປີຜ່ານມາ', 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300', doc.prevYearObligationAttachment);
      add('submissionReceiptAttachment', '24. ໃບຮັບຍື່ນອາກອນ', 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300', doc.submissionReceiptAttachment);
      add('completedDocAttachment', '27.3 ໃບອະນຸຍາດສຳເລັດ', 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300', doc.completedDocAttachment);
      add('paymentAttachment', '31. ໃບເບີກຄ່າຕິດຕັ້ງ', 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300', doc.installationExpense?.paymentAttachment);
    });

    return list;
  }, [documents]);

  // Filter attachments list
  const filteredAttachments = useMemo(() => {
    return allAttachments.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCompany = item.companyName.toLowerCase().includes(q);
        const matchFile = item.attachment.name.toLowerCase().includes(q);
        const matchTin = item.tinNo.toLowerCase().includes(q);
        const matchCat = item.categoryLabel.toLowerCase().includes(q);
        if (!matchCompany && !matchFile && !matchTin && !matchCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && item.categoryKey !== selectedCategory) {
        return false;
      }

      // Line filter
      if (selectedLine !== 'ALL' && item.line !== selectedLine) {
        return false;
      }

      // File type filter (PDF / IMG / OTHER)
      if (selectedFileType !== 'ALL') {
        const name = item.attachment.name.toLowerCase();
        if (selectedFileType === 'PDF' && !name.endsWith('.pdf')) return false;
        if (selectedFileType === 'IMG' && !name.endsWith('.png') && !name.endsWith('.jpg') && !name.endsWith('.jpeg')) return false;
        if (selectedFileType === 'DOC' && !name.endsWith('.doc') && !name.endsWith('.docx') && !name.endsWith('.xls') && !name.endsWith('.xlsx')) return false;
      }

      return true;
    });
  }, [allAttachments, searchQuery, selectedCategory, selectedLine, selectedFileType]);

  // Unique lines
  const availableLines = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.line) set.add(d.line);
    });
    return Array.from(set);
  }, [documents]);

  // Total companies with attachments
  const companiesWithAttachmentsCount = useMemo(() => {
    const set = new Set<string>();
    allAttachments.forEach((item) => set.add(item.docId));
    return set.size;
  }, [allAttachments]);

  // Toggle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAttachments.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Download selected files
  const handleDownloadSelected = () => {
    const selectedItems = filteredAttachments.filter((i) => selectedIds.includes(i.id));
    if (selectedItems.length === 0) {
      alert('ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ໄຟລ໌ແນບ!');
      return;
    }

    // Trigger individual file downloads sequentially or combined report
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        downloadAttachmentFile(item.attachment, item.companyName, item.categoryLabel);
      }, index * 250);
    });
  };

  // Download all filtered
  const handleDownloadAllFiltered = () => {
    if (filteredAttachments.length === 0) {
      alert('ບໍ່ພົບໄຟລ໌ແນບໃນຕົວກັ່ນກອງ!');
      return;
    }
    downloadMultipleAttachmentsReport(
      filteredAttachments.map((item) => ({
        companyName: item.companyName,
        category: item.categoryLabel,
        attachment: item.attachment,
      }))
    );
  };

  // Handle uploading file to document from Page 6
  const handleFileUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocId) {
      alert('ກະລຸນາເລືອກບໍລິສັດ!');
      return;
    }
    if (!uploadFileName) {
      alert('ກະລຸນາປ້ອນຊື່ໄຟລ໌ ຫຼື ເລືອກໄຟລ໌ອັບໂຫຼດ!');
      return;
    }

    const docToUpdate = documents.find((d) => d.id === uploadDocId);
    if (!docToUpdate || !onUpdateDocument) return;

    const newAttachment: FileAttachment = {
      name: uploadFileName,
      url: uploadFileDataUrl || '#',
      size: '1.8 MB',
      uploadedAt: new Date().toLocaleDateString('lo-LA'),
    };

    let updatedDoc = { ...docToUpdate };

    if (uploadCategory === 'paymentAttachment') {
      updatedDoc.installationExpense = {
        ...updatedDoc.installationExpense,
        paymentAttachment: newAttachment,
      };
    } else {
      (updatedDoc as any)[uploadCategory] = newAttachment;
    }

    onUpdateDocument(updatedDoc);
    setIsUploadModalOpen(false);
    setUploadFileName('');
    setUploadFileDataUrl('');
    alert(`ອັບໂຫຼດໄຟລ໌ແນບ "${uploadFileName}" ສຳເລັດ!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold mb-2">
              <FolderDown className="w-4 h-4" />
              <span>ໜ້າທີ 6: ຄັງເກັບໄຟລ໌ແນບ & ດາວໂຫຼດ (Document Downloads)</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              ສູນກາງຮວບຮວມໄຟລ໌ແນບ ແລະ ດາວໂຫຼດເອກະສານ
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              ຮວບຮວມໄຟລ໌ແນບທັງໝົດ 8 ໝວດເອກະສານ (ໃບເປີດວຽກ, ໃບທະບຽນ, ໃບສະເໜີ, ໃບອະນຸຍາດ, ໃບຢັ້ງຢືນອາກອນ, ໃບຮັບຍື່ນ, ເອກະສານສຳເລັດ) ຈາກທຸກບໍລິສັດ ພ້ອມປຸ່ມ Download ໂດຍຕັ້ງ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              <span>+ ອັບໂຫຼດໄຟລ໌ແນບໃໝ່</span>
            </button>

            <button
              onClick={handleDownloadAllFiltered}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-xs border border-white/30 transition"
            >
              <FileCode className="w-4 h-4" />
              <span>ດາວໂຫຼດລາຍງານສັງລວມ (.txt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              ລວມໄຟລ໌ແນບທັງໝົດ
            </span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
              {allAttachments.length} <span className="text-sm font-normal text-slate-400">ໄຟລ໌</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              ຈາກ {documents.length} ບໍລິສັດໃນລະບົບ
            </span>
          </div>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 rounded-2xl">
            <FolderDown className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              ບໍລິສັດທີ່ມີໄຟລ໌ແນບ
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {companiesWithAttachmentsCount} <span className="text-sm font-normal text-slate-400">ບໍລິສັດ</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              ຄິດເປັນ {Math.round((companiesWithAttachmentsCount / (documents.length || 1)) * 100)}% ຂອງທັງໝົດ
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-2xl">
            <Building2 className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              ໝວດໄຟລ໌ແນບສຳຄັນ
            </span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              9 <span className="text-sm font-normal text-slate-400">ໝວດ</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              ໃບເປີດ, ໃບທະບຽນ, ໃບອະນຸຍາດ...
            </span>
          </div>
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-2xl">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              ປະມານຂະໜາດໄຟລ໌ລວມ
            </span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
              ~{(allAttachments.length * 1.8).toFixed(1)} <span className="text-sm font-normal text-slate-400">MB</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              ພ້ອມໃຫ້ດາວໂຫຼດຕະຫຼອດ 24h
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 rounded-2xl">
            <HardDrive className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຕາມລາຍຊື່ບໍລິສັດ, ຊື່ໄຟລ໌ແນບ, TIN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="min-w-[180px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Filter */}
            <div className="min-w-[120px]">
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="ALL">ທຸກສາຍວຽກ</option>
                {availableLines.map((line) => (
                  <option key={line} value={line}>
                    ສາຍ: {line}
                  </option>
                ))}
              </select>
            </div>

            {/* File Format Filter */}
            <div className="min-w-[110px]">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="ALL">ທຸກຟໍແມັດ</option>
                <option value="PDF">PDF (.pdf)</option>
                <option value="IMG">ຮູບພາບ (PNG/JPG)</option>
                <option value="DOC">Word / Excel</option>
              </select>
            </div>

            {/* Action Download Selected Button */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition animate-in fade-in"
              >
                <Download className="w-4 h-4" />
                <span>ດາວໂຫຼດ {selectedIds.length} ໄຟລ໌ທີ່ເລືອກ</span>
              </button>
            )}

            {/* Reset Filters */}
            {(searchQuery || selectedCategory !== 'ALL' || selectedLine !== 'ALL' || selectedFileType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedLine('ALL');
                  setSelectedFileType('ALL');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="ລ້າງຕົວກັ່ນກອງ"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>

        {/* Counter Info */}
        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span>
            ພົບໄຟລ໌ແນບ: <strong className="text-blue-600 dark:text-blue-400">{filteredAttachments.length}</strong> / {allAttachments.length} ໄຟລ໌
          </span>
          {selectedIds.length > 0 && (
            <span className="text-emerald-600 font-bold">
              ✓ ເລືອກແລ້ວ: {selectedIds.length} ໄຟລ໌
            </span>
          )}
        </div>
      </div>

      {/* Main Table of Attached Files */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredAttachments.length > 0 &&
                      selectedIds.length === filteredAttachments.length
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </th>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3 min-w-[200px]">ບໍລິສັດ / TIN / ສາຍ</th>
                <th className="px-3 py-3 min-w-[170px]">ໝວດເອກະສານແນບ</th>
                <th className="px-3 py-3 min-w-[220px]">ຊື່ໄຟລ໌ແນບ (File Name)</th>
                <th className="px-3 py-3 min-w-[100px] text-center">ຂະໜາດ & ວັນທີ</th>
                <th className="px-3 py-3 min-w-[180px] text-center">ປຸ່ມດາວໂຫຼດ (Download Action)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredAttachments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    <FolderDown className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    ບໍ່ພົບໄຟລ໌ແນບຕາມຕົວກັ່ນກອງ
                  </td>
                </tr>
              ) : (
                filteredAttachments.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isPdf = item.attachment.name.toLowerCase().endsWith('.pdf');
                  const docRecord = documents.find((d) => d.id === item.docId);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition ${
                        isSelected ? 'bg-blue-50/60 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </td>

                      {/* Index */}
                      <td className="px-3 py-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Company Name & Line */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.companyName}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                            ສາຍ {item.line}
                          </span>
                          {item.tinNo && <span>TIN: {item.tinNo}</span>}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-3 py-3">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg ${item.categoryBadgeBg}`}>
                          {item.categoryLabel}
                        </span>
                      </td>

                      {/* File Name */}
                      <td className="px-3 py-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${isPdf ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
                            {isPdf ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                            {item.attachment.name}
                          </span>
                        </div>
                      </td>

                      {/* File Size & Uploaded Date */}
                      <td className="px-3 py-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {item.attachment.size || '1.5 MB'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.attachment.uploadedAt || '10/06/2026'}
                        </div>
                      </td>

                      {/* Actions & DIRECT DOWNLOAD BUTTON */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          
                          {/* PRIMARY DIRECT DOWNLOAD BUTTON */}
                          <button
                            onClick={() => downloadAttachmentFile(item.attachment, item.companyName, item.categoryLabel)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition transform active:scale-95"
                            title="ຄິກເພື່ອດາວໂຫຼດໄຟລ໌ນີ້ອອກມາ"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download ໄຟລ໌</span>
                          </button>

                          {/* Preview Details Button */}
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition"
                            title="ເບິ່ງລາຍລະອຽດໄຟລ໌"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Company Details Button */}
                          {docRecord && (
                            <button
                              onClick={() => onViewDetails(docRecord)}
                              className="p-1.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-lg transition"
                              title="ເບິ່ງຂໍ້ມູນບໍລິສັດ"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            💡 <strong>ໝາຍເຫດ:</strong> ທຸກໄຟລ໌ແນບໃນຕາຕະລາງນີ້ສາມາດກົດປຸ່ມ <strong>"Download ໄຟລ໌"</strong> ເພື່ອດາວໂຫຼດອອກມາໃສ່ຄອມພິວເຕີຂອງທ່ານໄດ້ໂດຍຕັ້ງ.
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-300">
            ລວມ {filteredAttachments.length} ໄຟລ໌
          </span>
        </div>
      </div>

      {/* MODAL 1: FILE PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center space-x-2">
                <FolderDown className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  ລາຍລະອຽດໄຟລ໌ແນບ
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">ຊື່ໄຟລ໌ແນບ:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {previewItem.attachment.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ບໍລິສັດ / ຫົວໜ່ວຍ:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {previewItem.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ໝວດເອກະສານ:</span>
                  <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${previewItem.categoryBadgeBg}`}>
                    {previewItem.categoryLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ຂະໜາດ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {previewItem.attachment.size || '1.5 MB'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ວັນທີອັບໂຫຼດ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {previewItem.attachment.uploadedAt || '10/06/2026'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                <p className="text-[11px] font-medium">
                  ✓ ໄຟລ໌ນີ້ພ້ອມດາວໂຫຼດ. ເມື່ອກົດປຸ່ມ Download ລະບົບຈະສົ່ງໄຟລ໌ລົງເຄື່ອງຂອງທ່ານທັນທີ.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl"
              >
                ປິດ
              </button>
              <button
                onClick={() => {
                  downloadAttachmentFile(previewItem.attachment, previewItem.companyName, previewItem.categoryLabel);
                  setPreviewItem(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download ໄຟລ໌ນີ້</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD NEW ATTACHMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  ອັບໂຫຼດໄຟລ໌ແນບເພີ່ມເຕີມ
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUploadSubmit} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ເລືອກບໍລິສັດ / ຫົວໜ່ວຍ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadDocId}
                  onChange={(e) => setUploadDocId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                  required
                >
                  <option value="">-- ເລືອກບໍລິສັດ --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.seq} - {d.companyName} (ສາຍ {d.line})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ເລືອກໝວດເອກະສານແນບ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                >
                  <option value="workOpenAttachment">6. ໃບເປີດວຽກ</option>
                  <option value="registrationAttachment">10. ໃບທະບຽນວິສາຫະກິດ</option>
                  <option value="memoAttachment">11. ໃບສະເໜີ/ບົດບັນທຶກ</option>
                  <option value="prevYearLicenseAttachment">12. ໃບອະນຸຍາດປີຜ່ານມາ</option>
                  <option value="taxCertAttachment">13. ໃບອມພ (ອາກອນ)</option>
                  <option value="prevYearObligationAttachment">14. ໃບມອບພັນທະປີຜ່ານມາ</option>
                  <option value="submissionReceiptAttachment">24. ໃບຮັບຍື່ນ/ໃບຮັບເງິນອາກອນ</option>
                  <option value="completedDocAttachment">27.3 ໃບອະນຸຍາດສຳເລັດ</option>
                  <option value="paymentAttachment">31. ໃບເບີກຄ່າຕິດຕັ້ງ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ເລືອກໄຟລ໌ອັບໂຫຼດ (PDF, PNG, JPG, DOCX...) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setUploadFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setUploadFileDataUrl(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ຊື່ໄຟລ໌ແນບ
                </label>
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="ປ້ອນຊື່ໄຟລ໌..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>ບັນທຶກອັບໂຫຼດ</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
