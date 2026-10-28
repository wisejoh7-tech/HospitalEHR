export type UserRole = 'doctor' | 'nurse' | 'admin' | 'record' | 'pharmacy' | 'pharmacy_admin' | 'lab' | 'radiology' | 'physiotherapist' | 'physio' | 'finance' | 'finance_admin';

export interface UserProfile {
  uid?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface Ward {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: Bed[];
}

export type BedStatus = 'vacant' | 'occupied' | 'maintenance';

export interface Bed {
  id: string;
  wardId: string;
  status: BedStatus;
  patientId?: string;
  patient?: Patient;
}

export type WorkflowStatus = 'registered' | 'triage' | 'vitals' | 'consultation' | 'laboratory' | 'radiology' | 'physiotherapy' | 'treatment' | 'pharmacy' | 'discharged';

export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  photoUrl?: string;
  fingerprint?: string;
  nextVisit?: string;
  allergies?: string[];
  admissionDate: string;
  status: 'inpatient' | 'outpatient' | 'discharged';
  workflowStatus: WorkflowStatus; // The current stage in clinical workflow
  triagePriority?: 'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4' | 'ESI-5' | string;
  wardId?: string;
  bedId?: string;
  dischargeReason?: string;
  diagnosis?: string;
  notes?: ClinicalNote[];
  vitals?: VitalSign[];
  prescriptions?: Prescription[];
  investigations?: Investigation[];
  bills?: Bill[];
  treatmentPlans?: TreatmentPlan[];
  reviews?: Review[];
  appointments?: Appointment[];
  physiotherapyReferrals?: PhysiotherapyReferral[];
  paymentRecords?: PaymentRecord[];
  refundRecords?: RefundRecord[];
  insuranceReimbursements?: InsuranceReimbursement[];
}

export interface PhysiotherapyReferral {
  id: string;
  patientId: string;
  patient?: Patient;
  referredBy: string;
  clinicalIndication: string;
  bodyRegion: string;
  treatmentType: string;
  sessionsRequested: number;
  sessionsCompleted: number;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type AppointmentType = 'consultation' | 'follow-up' | 'investigation';

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId?: string;
  doctorName?: string;
  dateTime: string;
  reason: string;
  status: AppointmentStatus;
  type: AppointmentType;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: string;
  billId: string;
  description: string;
  amount: number;
  type: 'medication' | 'investigation' | 'consultation' | 'ward';
  createdAt: string;
}

export interface Bill {
  id: string;
  patientId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'partially_paid';
  items: BillItem[];
  payments?: PaymentRecord[];
  refunds?: RefundRecord[];
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string; // Masked for non-finance or stored securely
  bankName: string;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface BankStatementImport {
  id: string;
  bankAccountId: string;
  filename: string;
  importedBy: string;
  importedByName: string;
  periodStart?: string;
  periodEnd?: string;
  totalRecords: number;
  matchedRecords: number;
  status: string;
  createdAt: string;
  transactions?: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankAccount?: BankAccount;
  importId?: string;
  transactionDate: string;
  valueDate?: string;
  description: string;
  reference?: string;
  amount: number;
  type: 'credit' | 'debit';
  reconciliationStatus: 'unmatched' | 'matched' | 'discrepancy' | 'flagged';
  matchedPaymentId?: string;
  matchedRefundId?: string;
  matchedClaimId?: string;
  matchedSettlementId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  billId?: string;
  bill?: Bill;
  patientId?: string;
  patient?: Patient;
  amount: number;
  paymentMethod: 'bank_transfer' | 'pos' | 'card' | 'cash' | 'insurance';
  paymentReference?: string;
  status: 'pending_verification' | 'verified' | 'reconciled' | 'rejected';
  reconciledTransactionId?: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
  refunds?: RefundRecord[];
}

export interface RefundRecord {
  id: string;
  refundNumber: string;
  paymentRecordId?: string;
  paymentRecord?: PaymentRecord;
  billId?: string;
  bill?: Bill;
  patientId?: string;
  patient?: Patient;
  amount: number;
  reason: string;
  refundMethod: 'bank_transfer' | 'card' | 'cash';
  refundReference?: string;
  status: 'pending_approval' | 'approved' | 'processed' | 'reconciled' | 'rejected';
  approvedBy?: string;
  reconciledTransactionId?: string;
  createdAt: string;
}

export interface InsuranceReimbursement {
  id: string;
  claimNumber: string;
  providerName: string;
  patientId?: string;
  patient?: Patient;
  billedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  paymentReference?: string;
  status: 'submitted' | 'partial' | 'settled' | 'reconciled' | 'disputed';
  reconciledTransactionId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface ProviderSettlement {
  id: string;
  settlementBatchId: string;
  provider: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  settlementDate: string;
  transactionCount: number;
  status: 'unmatched' | 'reconciled' | 'discrepancy';
  reconciledTransactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyReconciliationReport {
  id: string;
  reportDate: string;
  totalBankCredits: number;
  totalBankDebits: number;
  totalVerifiedPayments: number;
  totalProcessedRefunds: number;
  totalInsuranceSettled: number;
  totalProviderSettled: number;
  matchedTransactionsCount: number;
  unmatchedTransactionsCount: number;
  discrepancyCount: number;
  status: 'draft' | 'finalized' | 'closed';
  generatedBy: string;
  createdAt: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Review {
  id: string;
  patientId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export type InvestigationType = 'laboratory' | 'radiology';

export interface Investigation {
  id: string;
  patientId: string;
  type: InvestigationType;
  category: string;
  testName: string;
  status: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'reviewed';
  priority: 'routine' | 'urgent' | 'emergency';
  requestedBy: string;
  result?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  bp?: string;
  pulse?: number;
  temp?: number;
  resp?: number;
  spo2?: number;
  weight?: number;
  takenBy: string;
  createdAt: string;
}

export type NoteType = 'physician' | 'nursing' | 'vitals' | 'addendum';

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  type: NoteType;
  content: string;
  version?: number;
  parentNoteId?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: 'active' | 'discontinued' | 'completed' | 'dispensed';
  createdAt: string;
}
