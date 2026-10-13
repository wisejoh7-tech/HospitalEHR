export type UserRole = 'doctor' | 'nurse' | 'admin' | 'record' | 'pharmacy' | 'pharmacy_admin' | 'lab' | 'radiology' | 'physiotherapist' | 'physio';

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

export type WorkflowStatus = 'registered' | 'vitals' | 'consultation' | 'laboratory' | 'radiology' | 'treatment' | 'pharmacy' | 'discharged';

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
  status: 'pending' | 'paid';
  items: BillItem[];
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

export type NoteType = 'physician' | 'nursing' | 'vitals';

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  type: NoteType;
  content: string;
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
