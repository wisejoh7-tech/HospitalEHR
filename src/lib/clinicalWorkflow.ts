const prescriptionTransitions: Record<string, string[]> = {
  pending: ['dispensing', 'discontinued'],
  active: ['dispensing', 'dispensed', 'discontinued'],
  dispensing: ['dispensed', 'discontinued'],
  dispensed: ['completed', 'discontinued'],
  completed: [],
  discontinued: [],
};

export function canTransitionPrescription(from: string, to: string): boolean {
  return prescriptionTransitions[from]?.includes(to) ?? false;
}

const investigationTransitions: Record<string, string[]> = {
  pending: ['sample_collected', 'processing', 'in_progress', 'completed'],
  sample_collected: ['processing', 'completed'],
  processing: ['completed'],
  in_progress: ['completed'],
  completed: ['reviewed'],
  reviewed: [],
};

export function canTransitionInvestigation(from: string, to: string): boolean {
  return from === to || (investigationTransitions[from]?.includes(to) ?? false);
}

export function isDischarged(patient: { status: string }): boolean {
  return patient.status === 'discharged';
}

export function validatePrescription(input: any): string | null {
  for (const field of ['medication', 'dosage', 'frequency', 'duration', 'authorId'] as const) {
    if (typeof input?.[field] !== 'string' || !input[field].trim()) return `${field} is required`;
  }
  return null;
}

export function canUpdateInvestigation(role: string, type: string, currentStatus: string, input: { status?: string; result?: string; fileUrl?: string }): boolean {
  if (currentStatus === 'reviewed') return false;
  const review = input.status === 'reviewed';
  const hasResultChanges = input.result !== undefined || input.fileUrl !== undefined;
  if (review) return (role === 'doctor' || role === 'admin') && !hasResultChanges;
  if (role === 'admin') return true;
  if (type === 'laboratory') return role === 'lab' || role === 'scientist';
  if (type === 'radiology') return role === 'radiology' || role === 'radiographer';
  return false;
}

export function validateAdministration(input: any): string | null {
  if (typeof input?.dose !== 'string' || !input.dose.trim()) return 'Dose is required';
  if (!['administered', 'held', 'refused'].includes(input.outcome)) return 'Outcome must be administered, held, or refused';
  if (input.notes != null && typeof input.notes !== 'string') return 'Notes must be a string';
  if (input.administeredAt !== undefined && (typeof input.administeredAt !== 'string' || !input.administeredAt.trim() || Number.isNaN(Date.parse(input.administeredAt)))) return 'administeredAt must be a valid date';
  return null;
}
