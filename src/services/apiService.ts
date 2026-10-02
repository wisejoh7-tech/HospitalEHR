import { Patient, Ward, ClinicalNote, Prescription, Investigation, VitalSign, BedStatus, WorkflowStatus, Appointment } from '../types';

const API_BASE = '/api';

export const apiService = {
  async getAppointments(query?: { patientId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/appointments?${params}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create appointment');
    return res.json();
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },

  async deleteAppointment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete appointment');
  },

  async getWards(): Promise<Ward[]> {
    const res = await fetch(`${API_BASE}/wards`);
    if (!res.ok) throw new Error('Failed to fetch wards');
    return res.json();
  },

  async getPatients(): Promise<Patient[]> {
    const res = await fetch(`${API_BASE}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async registerPatient(data: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Registration failed');
    }
    return res.json();
  },

  async getPatientById(id: string): Promise<Patient & { notes: ClinicalNote[], prescriptions: Prescription[], investigations: Investigation[], vitals: VitalSign[] }> {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient details');
    return res.json();
  },

  async admitPatient(id: string, wardId: string, bedId: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}/admit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wardId, bedId }),
    });
    if (!res.ok) throw new Error('Admission failed');
    return res.json();
  },

  async dischargePatient(id: string, reason?: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}/discharge`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Discharge failed');
    return res.json();
  },

  async addVitals(id: string, data: Partial<VitalSign>): Promise<VitalSign> {
    const res = await fetch(`${API_BASE}/patients/${id}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record vitals');
    return res.json();
  },

  async createWard(data: { name: string, type: string, capacity: number }): Promise<Ward> {
    const res = await fetch(`${API_BASE}/wards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create ward');
    return res.json();
  },

  async addBeds(wardId: string, count: number): Promise<any> {
    const res = await fetch(`${API_BASE}/wards/${wardId}/beds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    if (!res.ok) throw new Error('Failed to add beds');
    return res.json();
  },

  async toggleBedStatus(bedId: string, status: BedStatus): Promise<any> {
    const res = await fetch(`${API_BASE}/beds/${bedId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update bed status');
    return res.json();
  },

  async getInvestigations(query?: { type?: string, status?: string }): Promise<(Investigation & { patient: Patient })[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/investigations?${params}`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  async addInvestigation(patientId: string, data: Partial<Investigation>): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to request investigation');
    return res.json();
  },

  async addNote(patientId: string, note: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  async addPrescription(patientId: string, data: Partial<Prescription>): Promise<Prescription> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create prescription');
    return res.json();
  },

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription> {
    const res = await fetch(`${API_BASE}/prescriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update prescription');
    return res.json();
  },

  async updateInvestigation(id: string, data: { status?: string, result?: string, fileUrl?: string }): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update investigation');
    return res.json();
  },

  async uploadFile(file: File): Promise<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getStaff(): Promise<any[]> {
    return this.getUsers();
  },

  async getLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async updateUserRole(id: string, role: string): Promise<any> {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  async deleteUser(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  async registerStaff(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to register staff');
    }
    return res.json();
  },

  async loginStaff(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Invalid phone or password');
    return res.json();
  },

  async getInventory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async addInventoryItem(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add inventory item');
    return res.json();
  },

  async updateInventoryItem(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
    return res.json();
  },

  async getPrescriptions(query?: { status?: string }): Promise<any[]> {
    const params = new URLSearchParams(query as any).toString();
    const res = await fetch(`${API_BASE}/prescriptions?${params}`);
    if (!res.ok) throw new Error('Failed to fetch prescriptions');
    return res.json();
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },

  async deletePatient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete patient');
  },

  async updatePatientWorkflowStatus(id: string, workflowStatus: WorkflowStatus): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowStatus }),
    });
    if (!res.ok) throw new Error('Failed to update workflow status');
    return res.json();
  },

  async findPatientByFingerprint(fingerprintId: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/fingerprint/${fingerprintId}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Fingerprint not recognized');
      throw new Error('Biometric search failed');
    }
    return res.json();
  },

  async getPricing(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/pricing`);
    if (!res.ok) throw new Error('Failed to fetch pricing');
    return res.json();
  },

  async updatePricing(data: { name: string, category: string, price: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update pricing');
    return res.json();
  },

  async getPatientBills(id: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/patients/${id}/bills`);
    if (!res.ok) throw new Error('Failed to fetch patient bills');
    return res.json();
  },

  async createBill(patientId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/bills`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create bill');
    return res.json();
  },

  async payBill(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bills/${id}/pay`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Payment failed');
    return res.json();
  },

  async getBills(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/bills`);
    if (!res.ok) throw new Error('Failed to fetch global bills');
    return res.json();
  },

  async addTreatmentPlan(patientId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/treatment-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addReview(patientId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async seedData() {
    const res = await fetch(`${API_BASE}/dev/seed`, { method: 'POST' });
    return res.json();
  }
};
