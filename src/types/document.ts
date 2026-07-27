export type UrgencyType = 'NORMAL' | 'URGENT';

export type OperationStatusType =
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'WAITING_ISSUE'
  | 'WAITING_DOCS';

export type PaymentStatusType =
  | 'PAID'
  | 'UNPAID'
  | 'PAID_50'
  | 'PAID_ON_COMPLETION';

export type ReimbursementStatusType = 'REIMBURSED' | 'NOT_REIMBURSED';

export type TimeframeType = '1_WEEK' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR_END';

export interface FileAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
  uploadedAt?: string;
}

export interface MultiCurrencyAmount {
  usd: number;
  lak: number;
  cny: number;
  otherValue: number;
  otherCurrency: string;
  remarks: string;
}

export interface UserAccountInfo {
  user: string;
  pass: string;
  link: string;
  remarks: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE_HISTORY' | 'STATUS_CHANGE';
  user: string;
  details: string;
}

export interface DocumentRecord {
  id: string;
  seq: number;
  
  // Section 2: Company Info
  companyName: string;
  isNewCompany: boolean;
  isContractRenewal: boolean;
  
  // Section 3: Line
  line: string; // A, B, C, D, E, ບໍ່ມີສາຍ, ຕ່າງແຂວງ, ກຸ່ມບໍລິສັດສືບສຸລິນຄຳ, custom
  
  // Section 4-8
  incomingNo: string;
  workOpenDate: string; // YYYY-MM-DD
  workOpenAttachment?: FileAttachment;
  tinNo: string;
  coordinatorName: string;
  
  // Section 9
  urgency: UrgencyType; // NORMAL (ປົກກະຕິ), URGENT (ດ່ວນ)
  
  // Section 10-14: Attachments
  registrationAttachment?: FileAttachment;
  memoAttachment?: FileAttachment;
  prevYearLicenseAttachment?: FileAttachment;
  taxCertAttachment?: FileAttachment;
  prevYearObligationAttachment?: FileAttachment;
  
  // Section 15-16: Processing & Expiry
  processingDays: number; // calculated from workOpenDate
  completionDate: string; // ມື້ເອກະສານອອກ
  expiryDate: string; // ວັນເດືອນປີໝົດອາຍຸ
  
  // Section 17-20: Checkboxes
  isStamped: boolean; // ບໍລິສັດທີ່ຈ້ຳກາແລ້ວ
  isAssembled: boolean; // ບໍລິສັດທີ່ປະກອບແລ້ວ
  isSubmitted: boolean; // ຍື່ນແລ້ວ
  isTracked: boolean; // ຕິດຕາມແລ້ວ
  
  // Section 21-24: Submission Info
  submissionLocation: string;
  submissionCoordinates: string; // Lat, Long or map link
  taxSubmissionDate: string;
  submissionIncomingNo: string;
  submissionReceiptAttachment?: FileAttachment;
  
  // Section 25: Tax Document Handover
  taxDocumentHandover: {
    isHandedOver: boolean;
    handoverDate: string;
    handoverBy: string;
    receivedBy: string;
  };
  
  // Section 26: Software Installation
  softwareInstallation: {
    renew2026: boolean;
    apis: boolean;
    tsd: boolean;
    pkt: boolean;
    other: string;
    isInstalled: boolean;
    installTarget: string; // PC specs/location
    pcReceiveDate: string;
    clientPickupDate: string;
    remarks: string;
  };
  
  // Section 27: Operation Status
  operationStatus: OperationStatusType;
  isCompleted: boolean;
  completedDocAttachment?: FileAttachment;
  
  // Section 28: Post Completion
  postCompletion: {
    inGolonoFolder: boolean;
    hasLicenseNo: boolean;
    licenseNo: string;
    licenseDate: string;
    sentToHeadAndCoord: boolean;
    fileSentDate: string;
    remarks: string;
  };
  
  // Section 29: Total Value (Revenue)
  totalValue: MultiCurrencyAmount;
  
  // Section 30: Customer Payment
  customerPayment: {
    isPaid: boolean;
    paymentStatus: PaymentStatusType;
    paidAmount: MultiCurrencyAmount;
    outstandingBalance: MultiCurrencyAmount;
  };
  
  // Section 31: Software Installation Expense
  installationExpense: {
    isReimbursed: boolean;
    reimbursementStatus: ReimbursementStatusType;
    disbursementDate: string;
    lakCost: number;
    usdCost: number;
    paymentAttachment?: FileAttachment;
    remarks: string;
  };
  
  // Section 32: Document Processing Expenses
  documentProcessingExpense: {
    feeReimbursement: boolean;
    feeReimbursementStatus: ReimbursementStatusType;
    feeReimbursementDate: string;
    feeCostLAK: number;
    feeRemarks: string;
    
    urgentLicenseFeeClaimed: boolean;
    urgentLicenseFeeDate: string;
    urgentLicenseFeeLAK: number;
    urgentLicenseFeePaidTo: string;
    urgentLicenseFeeRemarks: string;
    
    supportFeeClaimed: boolean;
    supportFeeDate: string;
    supportFeeLAK: number;
    supportFeeRemarks: string;
  };
  
  // Section 33: Software Installation Contract
  installationContract: {
    hasContract: boolean;
    contractNo: string;
    signingDate: string;
    contractValueLAK: number;
    contractValueUSD: number;
    remarks: string;
  };
  
  // Section 34: User & Invoice Link
  userAndInvoiceLink: {
    primaryUser: UserAccountInfo;
    secondaryUser: UserAccountInfo;
  };
  
  // Section 35: Database sync & Audit History
  masterDatabaseSync: boolean;
  documentExchangeRates?: ExchangeRates;
  generalRemarks?: string;
  auditTrail: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRates {
  USD_TO_LAK: number; // e.g. 21800
  CNY_TO_LAK: number; // e.g. 3050
}

export interface FilterState {
  line: string; // 'ALL' or specific line
  urgency: string; // 'ALL' | 'NORMAL' | 'URGENT'
  status: string; // 'ALL' | OperationStatusType
  paymentStatus: string; // 'ALL' | PaymentStatusType
  software: string; // 'ALL' | 'APIS' | 'TSD' | 'PKT' | 'RENEW_2026' | 'OTHER'
  renewal2026Only: boolean;
  companyType?: string; // 'ALL' | 'NEW_ONLY' | 'EXISTING_ONLY'
  workflowStep?: string; // 'ALL' | 'STAMPED' | 'UNSTAMPED' | 'ASSEMBLED' | 'UNASSEMBLED' | 'SUBMITTED' | 'UNSUBMITTED' | 'TRACKED' | 'UNTRACKED'
  searchQuery: string;
}
