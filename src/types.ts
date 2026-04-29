export type UserRole = 'doctor' | 'nurse' | 'admin' | 'record' | 'pharmacy' | 'pharmacy_admin' | 'lab' | 'radiology';

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
}

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
  wardId?: string;
  bedId?: string;
  dischargeReason?: string;
  notes?: ClinicalNote[];
  vitals?: VitalSign[];
  prescriptions?: Prescription[];
  investigations?: Investigation[];
  bills?: Bill[];
  treatmentPlans?: TreatmentPlan[];
  reviews?: Review[];
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
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: 'active' | 'discontinued' | 'completed' | 'dispensed';
  createdAt: string;
}
