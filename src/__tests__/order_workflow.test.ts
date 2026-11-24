import { describe, expect, it } from 'vitest';
import { canTransitionInvestigation, canTransitionPrescription, canUpdateInvestigation, isDischarged, validateAdministration, validatePrescription } from '../lib/clinicalWorkflow';

describe('clinical order workflow', () => {
  it('allows sequential dispensing and legacy active handoff', () => {
    for (const [from, to] of [['pending', 'dispensing'], ['dispensing', 'dispensed'], ['active', 'dispensing'], ['active', 'dispensed'], ['dispensed', 'completed'], ['pending', 'discontinued'], ['dispensed', 'discontinued']]) {
      expect(canTransitionPrescription(from, to)).toBe(true);
    }
    for (const [from, to] of [['pending', 'dispensed'], ['pending', 'completed'], ['completed', 'dispensing'], ['discontinued', 'dispensed'], ['unknown', 'dispensed']]) {
      expect(canTransitionPrescription(from, to)).toBe(false);
    }
  });
  it('supports result submission and review without backwards transitions', () => {
    expect(canTransitionInvestigation('pending', 'completed')).toBe(true);
    expect(canTransitionInvestigation('pending', 'sample_collected')).toBe(true);
    expect(canTransitionInvestigation('sample_collected', 'processing')).toBe(true);
    expect(canTransitionInvestigation('sample_collected', 'completed')).toBe(true);
    expect(canTransitionInvestigation('processing', 'completed')).toBe(true);
    expect(canTransitionInvestigation('pending', 'in_progress')).toBe(true);
    expect(canTransitionInvestigation('completed', 'completed')).toBe(true);
    expect(canTransitionInvestigation('completed', 'reviewed')).toBe(true);
    expect(canTransitionInvestigation('reviewed', 'pending')).toBe(false);
  });
  it('uses patient status rather than stale workflow state', () => {
    expect(isDischarged({ status: 'inpatient', workflowStatus: 'discharged' } as { status: string })).toBe(false);
    expect(isDischarged({ status: 'discharged', workflowStatus: 'treatment' } as { status: string })).toBe(true);
  });
  it('requires all medication details and a prescriber', () => {
    const order = { medication: 'Amoxicillin', dosage: '500 mg', frequency: 'three times daily', duration: '5 days', authorId: 'doctor-1' };
    expect(validatePrescription(order)).toBeNull();
    for (const field of Object.keys(order)) {
      expect(validatePrescription({ ...order, [field]: '  ' })).toContain(field);
      expect(validatePrescription({ ...order, [field]: null })).toContain(field);
    }
  });
  it('limits diagnostic actions by specialty and reviews to doctors and admins', () => {
    for (const role of ['lab', 'scientist']) {
      expect(canUpdateInvestigation(role, 'laboratory', 'processing', { status: 'completed', result: 'Normal' })).toBe(true);
      expect(canUpdateInvestigation(role, 'radiology', 'processing', { status: 'completed' })).toBe(false);
      expect(canUpdateInvestigation(role, 'laboratory', 'completed', { status: 'reviewed' })).toBe(false);
    }
    for (const role of ['radiology', 'radiographer']) {
      expect(canUpdateInvestigation(role, 'radiology', 'pending', { status: 'processing' })).toBe(true);
      expect(canUpdateInvestigation(role, 'laboratory', 'pending', { status: 'processing' })).toBe(false);
    }
    expect(canUpdateInvestigation('doctor', 'laboratory', 'completed', { status: 'reviewed' })).toBe(true);
    expect(canUpdateInvestigation('doctor', 'laboratory', 'completed', { status: 'reviewed', result: 'changed' })).toBe(false);
    expect(canUpdateInvestigation('doctor', 'laboratory', 'pending', { status: 'completed' })).toBe(false);
    expect(canUpdateInvestigation('admin', 'radiology', 'completed', { status: 'reviewed' })).toBe(true);
    expect(canUpdateInvestigation('admin', 'radiology', 'reviewed', { result: 'changed' })).toBe(false);
    expect(canUpdateInvestigation('lab', 'other', 'pending', { status: 'processing' })).toBe(false);
  });
  it('validates administration details', () => {
    expect(validateAdministration({ dose: '10 mg', outcome: 'held', notes: 'Patient unwell' })).toBeNull();
    expect(validateAdministration({ dose: '', outcome: 'administered' })).toMatch(/Dose/);
    expect(validateAdministration({ dose: '10 mg', outcome: 'unknown' })).toMatch(/Outcome/);
    expect(validateAdministration({ dose: '10 mg', outcome: 'refused', administeredAt: 'invalid' })).toMatch(/date/);
    expect(validateAdministration({ dose: '10 mg', outcome: 'refused', notes: 2 })).toMatch(/Notes/);
  });
});
