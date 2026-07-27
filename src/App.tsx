import React, { useState, useEffect } from 'react';
import { DocumentRecord, ExchangeRates, FilterState } from './types/document';
import { INITIAL_SEED_DATA } from './data/seedData';
import { DEFAULT_EXCHANGE_RATES, convertToTotalLAK } from './utils/formatters';
import { exportDocumentsToExcel, printPDFReport } from './utils/exportUtils';

import { Header } from './components/Header';
import { DocumentFilterBar } from './components/DocumentFilterBar';
import { DocumentListTable } from './components/DocumentListTable';
import { DocumentFormModal } from './components/DocumentFormModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { DashboardOverview } from './components/DashboardOverview';
import { SoftwareSummaryView } from './components/SoftwareSummaryView';
import { AnalyticsGraphsView } from './components/AnalyticsGraphsView';
import { ConsolidatedAllInOneView } from './components/ConsolidatedAllInOneView';
import { DocumentAttachmentsView } from './components/DocumentAttachmentsView';

export default function App() {
  // Main State
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('lao_doc_system_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_SEED_DATA;
  });

  const [rates, setRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem('lao_doc_system_rates');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_EXCHANGE_RATES;
  });

  const [activeTab, setActiveTab] = useState<number>(1);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    line: 'ALL',
    urgency: 'ALL',
    status: 'ALL',
    paymentStatus: 'ALL',
    software: 'ALL',
    renewal2026Only: false,
    companyType: 'ALL',
    workflowStep: 'ALL',
    searchQuery: '',
  });

  // Modal Control States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<DocumentRecord | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [docForDetail, setDocForDetail] = useState<DocumentRecord | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [docForHistory, setDocForHistory] = useState<DocumentRecord | null>(null);

  const [isExchangeRateModalOpen, setIsExchangeRateModalOpen] = useState(false);

  // Persist State Changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('lao_doc_system_docs', JSON.stringify(documents));
    } catch (e) {
      // ignore
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('lao_doc_system_rates', JSON.stringify(rates));
    } catch (e) {
      // ignore
    }
  }, [rates]);

  // Filter Logic for Page 1 Document Table
  const filteredDocuments = documents.filter((doc) => {
    // 1. Line filter
    if (filters.line !== 'ALL' && doc.line !== filters.line) return false;

    // 2. Urgency filter
    if (filters.urgency !== 'ALL' && doc.urgency !== filters.urgency) return false;

    // 3. Status filter
    if (filters.status !== 'ALL' && doc.operationStatus !== filters.status) return false;

    // 4. Payment status filter
    if (filters.paymentStatus !== 'ALL' && doc.customerPayment.paymentStatus !== filters.paymentStatus) return false;

    // 5. Software filter
    if (filters.software !== 'ALL') {
      const sw = doc.softwareInstallation;
      if (filters.software === 'APIS' && !sw.apis) return false;
      if (filters.software === 'TSD' && !sw.tsd) return false;
      if (filters.software === 'PKT' && !sw.pkt) return false;
      if (filters.software === 'RENEW_2026' && !sw.renew2026) return false;
      if (filters.software === 'OTHER' && !sw.other) return false;
    }

    // 6. Renewal 2026 filter
    if (filters.renewal2026Only && !doc.softwareInstallation.renew2026) return false;

    // 7. Company Type filter (New company vs Existing)
    if (filters.companyType && filters.companyType !== 'ALL') {
      if (filters.companyType === 'NEW_ONLY' && !doc.isNewCompany) return false;
      if (filters.companyType === 'EXISTING_ONLY' && doc.isNewCompany) return false;
    }

    // 8. Workflow Step filter (4 ຂັ້ນຕອນ: ຈ້ຳກາ, ປະກອບ, ຍື່ນ, ຕິດຕາມ)
    if (filters.workflowStep && filters.workflowStep !== 'ALL') {
      if (filters.workflowStep === 'STAMPED' && !doc.isStamped) return false;
      if (filters.workflowStep === 'UNSTAMPED' && doc.isStamped) return false;
      if (filters.workflowStep === 'ASSEMBLED' && !doc.isAssembled) return false;
      if (filters.workflowStep === 'UNASSEMBLED' && doc.isAssembled) return false;
      if (filters.workflowStep === 'SUBMITTED' && !doc.isSubmitted) return false;
      if (filters.workflowStep === 'UNSUBMITTED' && doc.isSubmitted) return false;
      if (filters.workflowStep === 'TRACKED' && !doc.isTracked) return false;
      if (filters.workflowStep === 'UNTRACKED' && doc.isTracked) return false;
    }

    // 9. Search query filter across all fields
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = doc.companyName.toLowerCase().includes(q);
      const matchTin = doc.tinNo.toLowerCase().includes(q);
      const matchIncoming = doc.incomingNo.toLowerCase().includes(q);
      const matchCoord = doc.coordinatorName.toLowerCase().includes(q);
      const matchLoc = doc.submissionLocation.toLowerCase().includes(q);
      const matchSubIncoming = doc.submissionIncomingNo.toLowerCase().includes(q);

      if (!matchName && !matchTin && !matchIncoming && !matchCoord && !matchLoc && !matchSubIncoming) {
        return false;
      }
    }

    return true;
  });

  // Handlers
  const handleSaveDocument = (docData: Partial<DocumentRecord>) => {
    const nowStr = new Date().toLocaleString('lo-LA');

    if (docData.id) {
      // Update existing document
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === docData.id) {
            const updatedAudit = [
              {
                id: `audit-${Date.now()}`,
                timestamp: nowStr,
                action: 'UPDATE' as const,
                user: 'Admin',
                details: 'ດັດແກ້ຂໍ້ມູນເອກະສານ',
              },
              ...(d.auditTrail || []),
            ];
            return {
              ...d,
              ...docData,
              auditTrail: updatedAudit,
              updatedAt: new Date().toISOString(),
            } as DocumentRecord;
          }
          return d;
        })
      );
    } else {
      // Create new document
      const newId = `doc-${Date.now()}`;
      const newRecord: DocumentRecord = {
        ...(docData as DocumentRecord),
        id: newId,
        seq: docData.seq || documents.length + 1,
        auditTrail: [
          {
            id: `audit-${Date.now()}`,
            timestamp: nowStr,
            action: 'CREATE' as const,
            user: 'Admin',
            details: 'ສ້າງເອກະສານໃໝ່',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [newRecord, ...prev]);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleDuplicateDocument = (doc: DocumentRecord) => {
    const clone: DocumentRecord = {
      ...JSON.parse(JSON.stringify(doc)),
      id: `doc-${Date.now()}`,
      seq: documents.length + 1,
      companyName: `${doc.companyName} (ສຳເນົາ)`,
      incomingNo: `${doc.incomingNo}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString('lo-LA'),
          action: 'CREATE',
          user: 'Admin',
          details: `ສຳເນົາຈາກເອກະສານ #${doc.seq}`,
        },
      ],
    };
    setDocuments((prev) => [clone, ...prev]);
  };

  const handleToggleCheckboxField = (
    docId: string,
    field: 'isStamped' | 'isAssembled' | 'isSubmitted' | 'isTracked'
  ) => {
    const fieldNamesLao = {
      isStamped: 'ຈ້ຳກາແລ້ວ',
      isAssembled: 'ປະກອບແລ້ວ',
      isSubmitted: 'ຍື່ນແລ້ວ',
      isTracked: 'ຕິດຕາມແລ້ວ',
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const newVal = !d[field];
          const auditEntry = {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toLocaleString('lo-LA'),
            action: 'STATUS_CHANGE' as const,
            user: 'Admin',
            details: `ປ່ຽນສະຖານະ ${fieldNamesLao[field]}: ${newVal ? '✓ ເຮັດແລ້ວ' : '✗ ຍົກເລີກ'}`,
          };
          return {
            ...d,
            [field]: newVal,
            auditTrail: [auditEntry, ...(d.auditTrail || [])],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );
  };

  const handleClearHistory = () => {
    if (!docForHistory) return;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docForHistory.id) {
          return { ...d, auditTrail: [] };
        }
        return d;
      })
    );
    setDocForHistory((prev) => (prev ? { ...prev, auditTrail: [] } : null));
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    if (!docForHistory) return;
    const updatedTrail = (docForHistory.auditTrail || []).filter((e) => e.id !== entryId);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docForHistory.id) {
          return { ...d, auditTrail: updatedTrail };
        }
        return d;
      })
    );
    setDocForHistory((prev) => (prev ? { ...prev, auditTrail: updatedTrail } : null));
  };

  const handleResetSeedData = () => {
    if (confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຣີເຊັດຂໍ້ມູນຕົວຢ່າງໃໝ່ທັງໝົດ?')) {
      setDocuments(INITIAL_SEED_DATA);
      setRates(DEFAULT_EXCHANGE_RATES);
      localStorage.removeItem('lao_doc_system_docs');
      localStorage.removeItem('lao_doc_system_rates');
    }
  };

  const handleSelectDocumentFromNotification = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setDocForDetail(doc);
      setIsDetailModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Top Main Navigation & Action Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rates={rates}
        onOpenExchangeRateModal={() => setIsExchangeRateModalOpen(true)}
        documents={documents}
        onSelectDocument={handleSelectDocumentFromNotification}
        onOpenNewDocumentModal={() => {
          setDocToEdit(null);
          setIsFormModalOpen(true);
        }}
        onExportExcel={() => exportDocumentsToExcel(filteredDocuments, rates)}
        onResetSeedData={handleResetSeedData}
      />

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* PAGE 1: DOCUMENT MANAGEMENT & TABLE VIEW */}
        {activeTab === 1 && (
          <div className="space-y-4">
            
            {/* Filter Bar with Search & Search History */}
            <DocumentFilterBar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={() =>
                setFilters({
                  line: 'ALL',
                  urgency: 'ALL',
                  status: 'ALL',
                  paymentStatus: 'ALL',
                  software: 'ALL',
                  renewal2026Only: false,
                  searchQuery: '',
                })
              }
            />

            {/* Print PDF / Quick Stats Header */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-slate-500">
                ພົບເອກະສານ: <strong className="text-blue-600 dark:text-blue-400">{filteredDocuments.length}</strong> / {documents.length} ບໍລິສັດ
              </span>
              <button
                onClick={() => printPDFReport('doc-table-print-container', 'ລາຍງານລາຍການເອກະສານຕິດຕາມ')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                🖨️ ພິມລາຍງານ PDF ໜ້ານີ້
              </button>
            </div>

            {/* Printable Document Table Container */}
            <div id="doc-table-print-container">
              <DocumentListTable
                documents={filteredDocuments}
                rates={rates}
                onViewDetails={(doc) => {
                  setDocForDetail(doc);
                  setIsDetailModalOpen(true);
                }}
                onEditDocument={(doc) => {
                  setDocToEdit(doc);
                  setIsFormModalOpen(true);
                }}
                onDuplicateDocument={handleDuplicateDocument}
                onViewHistory={(doc) => {
                  setDocForHistory(doc);
                  setIsHistoryModalOpen(true);
                }}
                onDeleteDocument={handleDeleteDocument}
                onToggleCheckboxField={handleToggleCheckboxField}
              />
            </div>
          </div>
        )}

        {/* PAGE 2: KEY METRICS DASHBOARD */}
        {activeTab === 2 && (
          <DashboardOverview documents={documents} rates={rates} />
        )}

        {/* PAGE 3: SOFTWARE INSTALLATION SUMMARY */}
        {activeTab === 3 && (
          <SoftwareSummaryView documents={documents} rates={rates} />
        )}

        {/* PAGE 4: ADVANCED GRAPH ANALYTICS */}
        {activeTab === 4 && (
          <AnalyticsGraphsView documents={documents} rates={rates} />
        )}

        {/* PAGE 5: CONSOLIDATED MASTER TABLE & REVENUE/EXPENSE */}
        {activeTab === 5 && (
          <ConsolidatedAllInOneView
            documents={documents}
            rates={rates}
            onViewDetails={(doc) => {
              setDocForDetail(doc);
              setIsDetailModalOpen(true);
            }}
            onEditDocument={(doc) => {
              setDocToEdit(doc);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {/* PAGE 6: DOCUMENT ATTACHMENTS & DOWNLOADS */}
        {activeTab === 6 && (
          <DocumentAttachmentsView
            documents={documents}
            rates={rates}
            onViewDetails={(doc) => {
              setDocForDetail(doc);
              setIsDetailModalOpen(true);
            }}
            onUpdateDocument={(updatedDoc) => {
              setDocuments((prev) =>
                prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
              );
            }}
          />
        )}

      </main>

      {/* ALL MODALS */}
      <ExchangeRateModal
        isOpen={isExchangeRateModalOpen}
        onClose={() => setIsExchangeRateModalOpen(false)}
        rates={rates}
        onSaveRates={(newRates) => setRates(newRates)}
      />

      <DocumentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        documentToEdit={docToEdit}
        rates={rates}
        onSave={handleSaveDocument}
        totalRecordsCount={documents.length}
      />

      <DocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        document={docForDetail}
        rates={rates}
        onEdit={(doc) => {
          setDocToEdit(doc);
          setIsFormModalOpen(true);
        }}
        onViewHistory={(doc) => {
          setDocForHistory(doc);
          setIsHistoryModalOpen(true);
        }}
      />

      <AuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        companyName={docForHistory?.companyName || ''}
        auditTrail={docForHistory?.auditTrail || []}
        onClearHistory={handleClearHistory}
        onDeleteHistoryEntry={handleDeleteHistoryEntry}
      />

    </div>
  );
}
