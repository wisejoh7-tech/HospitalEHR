import { Patient, Ward, ClinicalNote, Prescription, Investigation, VitalSign, BedStatus, WorkflowStatus, Appointment } from '../types';

const getApiBase = (): string => {
  const rawUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  if (!rawUrl) return '/api';
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE = getApiBase();

async function handleResponse<T>(res: Response, defaultError = 'Request failed'): Promise<T> {
  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }

  if (!res.ok) {
    const errorMessage = body?.error || body?.message || defaultError;
    throw new Error(errorMessage);
  }

  return body as T;
}

export const apiService = {
  async getAppointments(query?: { patientId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/appointments?${params}`);
    return handleResponse<Appointment[]>(res, 'Failed to fetch appointments');
  },

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res, 'Failed to create appointment');
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res, 'Failed to update appointment');
  },

  async deleteAppointment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(res, 'Failed to delete appointment');
  },

  async getWards(): Promise<Ward[]> {
    const res = await fetch(`${API_BASE}/wards`);
    return handleResponse<Ward[]>(res, 'Failed to fetch wards');
  },

  async getPatients(): Promise<Patient[]> {
    const res = await fetch(`${API_BASE}/patients`);
    return handleResponse<Patient[]>(res, 'Failed to fetch patients');
  },

  async registerPatient(data: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Patient>(res, 'Registration failed');
  },

  async getPatientById(id: string): Promise<Patient & { notes: ClinicalNote[], prescriptions: Prescription[], investigations: Investigation[], vitals: VitalSign[] }> {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    return handleResponse<Patient & { notes: ClinicalNote[], prescriptions: Prescription[], investigations: Investigation[], vitals: VitalSign[] }>(res, 'Failed to fetch patient details');
  },

  async admitPatient(id: string, wardId: string, bedId: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}/admit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wardId, bedId }),
    });
    return handleResponse<Patient>(res, 'Admission failed');
  },

  async dischargePatient(id: string, reason?: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}/discharge`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return handleResponse<Patient>(res, 'Discharge failed');
  },

  async addVitals(id: string, data: Partial<VitalSign>): Promise<VitalSign> {
    const res = await fetch(`${API_BASE}/patients/${id}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<VitalSign>(res, 'Failed to record vitals');
  },

  async createWard(data: { name: string, type: string, capacity: number }): Promise<Ward> {
    const res = await fetch(`${API_BASE}/wards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Ward>(res, 'Failed to create ward');
  },

  async addBeds(wardId: string, count: number): Promise<any> {
    const res = await fetch(`${API_BASE}/wards/${wardId}/beds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    return handleResponse<any>(res, 'Failed to add beds');
  },

  async toggleBedStatus(bedId: string, status: BedStatus): Promise<any> {
    const res = await fetch(`${API_BASE}/beds/${bedId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<any>(res, 'Failed to update bed status');
  },

  async getPhysiotherapyReferrals(query?: { status?: string, patientId?: string }): Promise<any[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/physiotherapy/referrals?${params}`);
    return handleResponse<any[]>(res, 'Failed to fetch physiotherapy referrals');
  },

  async createPhysiotherapyReferral(patientId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/physiotherapy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to create physiotherapy referral');
  },

  async updatePhysiotherapyReferral(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/physiotherapy/referrals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to update physiotherapy referral');
  },

  async getInvestigations(query?: { type?: string, status?: string }): Promise<(Investigation & { patient: Patient })[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/investigations?${params}`);
    return handleResponse<(Investigation & { patient: Patient })[]>(res, 'Failed to fetch investigations');
  },

  async addInvestigation(patientId: string, data: Partial<Investigation>): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Investigation>(res, 'Failed to request investigation');
  },

  async addNote(patientId: string, note: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return handleResponse<ClinicalNote>(res, 'Failed to add note');
  },

  async addPrescription(patientId: string, data: Partial<Prescription>): Promise<Prescription> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Prescription>(res, 'Failed to create prescription');
  },

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription> {
    const res = await fetch(`${API_BASE}/prescriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Prescription>(res, 'Failed to update prescription');
  },

  async updateInvestigation(id: string, data: { status?: string, result?: string, fileUrl?: string }): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Investigation>(res, 'Failed to update investigation');
  },

  async uploadFile(file: File): Promise<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ fileUrl: string }>(res, 'File upload failed');
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users`);
    return handleResponse<any[]>(res, 'Failed to fetch users');
  },

  async getStaff(): Promise<any[]> {
    return this.getUsers();
  },

  async getLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs`);
    return handleResponse<any[]>(res, 'Failed to fetch logs');
  },

  async clearLogs(adminRole?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (adminRole) headers['x-user-role'] = adminRole;
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<any>(res, 'Failed to clear logs');
  },

  async updateUserRole(id: string, role: string, adminRole?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminRole) headers['x-user-role'] = adminRole;
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    });
    return handleResponse<any>(res, 'Failed to update role');
  },

  async deleteUser(id: string, adminRole?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (adminRole) headers['x-user-role'] = adminRole;
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<any>(res, 'Failed to delete user');
  },

  async registerAccount(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to register account');
  },

  async registerStaff(data: any, adminRole?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminRole) headers['x-user-role'] = adminRole;
    const res = await fetch(`${API_BASE}/auth/staff`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to register staff');
  },

  async loginStaff(data: { identifier?: string; phone?: string; email?: string; password: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Invalid email/phone or password');
  },

  async getInventory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/inventory`);
    return handleResponse<any[]>(res, 'Failed to fetch inventory');
  },

  async addInventoryItem(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to add inventory item');
  },

  async updateInventoryItem(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to update inventory item');
  },

  async getPrescriptions(query?: { status?: string }): Promise<any[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/prescriptions?${params}`);
    return handleResponse<any[]>(res, 'Failed to fetch prescriptions');
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Patient>(res, 'Failed to update patient');
  },

  async deletePatient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(res, 'Failed to delete patient');
  },

  async updatePatientWorkflowStatus(id: string, workflowStatus: WorkflowStatus, userRole?: string): Promise<Patient> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userRole) headers['x-user-role'] = userRole;
    const res = await fetch(`${API_BASE}/patients/${id}/workflow`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ workflowStatus }),
    });
    return handleResponse<Patient>(res, 'Failed to update workflow status');
  },

  async findPatientByFingerprint(fingerprintId: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/fingerprint/${fingerprintId}`);
    if (res.status === 404) throw new Error('Fingerprint not recognized');
    return handleResponse<Patient>(res, 'Biometric search failed');
  },

  async getPricing(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/pricing`);
    return handleResponse<any[]>(res, 'Failed to fetch pricing');
  },

  async updatePricing(data: { name: string, category: string, price: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res, 'Failed to update pricing');
  },

  async getPatientBills(id: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/patients/${id}/bills`);
    return handleResponse<any[]>(res, 'Failed to fetch patient bills');
  },

  async createBill(patientId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/bills`, {
      method: 'POST',
    });
    return handleResponse<any>(res, 'Failed to create bill');
  },

  async payBill(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bills/${id}/pay`, {
      method: 'POST',
    });
    return handleResponse<any>(res, 'Payment failed');
  },

  async getBills(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/bills`);
    return handleResponse<any[]>(res, 'Failed to fetch global bills');
  },

  async addTreatmentPlan(patientId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/treatment-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to create treatment plan');
  },

  async addReview(patientId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res, 'Failed to record review');
  },

  async seedData() {
    const res = await fetch(`${API_BASE}/dev/seed`, { method: 'POST' });
    return handleResponse<any>(res, 'Failed to seed data');
  }
};
