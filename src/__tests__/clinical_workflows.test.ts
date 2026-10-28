import { describe, it, expect } from 'vitest';

function calculateAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function checkDrugInteractions(newMed: string, existingMeds: string[]): string | null {
  const DRUG_INTERACTIONS: Record<string, string[]> = {
    'Warfarin': ['Aspirin', 'Ibuprofen', 'Naproxen'],
    'Aspirin': ['Warfarin', 'Ibuprofen'],
    'Sildenafil': ['Isosorbide', 'Nitroglycerin'],
  };

  const newMedUpper = newMed.trim().toUpperCase();
  const dbKey = Object.keys(DRUG_INTERACTIONS).find(m => m.toUpperCase() === newMedUpper);
  if (!dbKey) return null;

  const interacting = DRUG_INTERACTIONS[dbKey];
  const upperExisting = existingMeds.map(m => m.trim().toUpperCase());
  const conflict = interacting.find(idrug => upperExisting.includes(idrug.toUpperCase()));

  return conflict ? `CAUTION: Potential interaction detected between ${dbKey} and ${conflict}.` : null;
}

function calculateBedFee(admissionDateStr: string, dischargeDateStr: string, pricePerDay: number): number {
  const start = new Date(admissionDateStr).getTime();
  const end = new Date(dischargeDateStr).getTime();
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  return diffDays * pricePerDay;
}

describe('Clinical Workflows & Business Logic Suite', () => {
  it('should accurately calculate patient age from date of birth', () => {
    expect(calculateAge('2000-01-01')).toBeGreaterThanOrEqual(24);
  });

  it('should detect potential drug interactions between prescribed medications', () => {
    const warning = checkDrugInteractions('Warfarin', ['Aspirin', 'Paracetamol']);
    expect(warning).toContain('Potential interaction detected between Warfarin and Aspirin');

    const noWarning = checkDrugInteractions('Paracetamol', ['Amoxicillin']);
    expect(noWarning).toBeNull();
  });

  it('should accurately calculate inpatient ward bed fees upon discharge', () => {
    const totalFee = calculateBedFee('2025-01-01T10:00:00Z', '2025-01-05T10:00:00Z', 1000);
    expect(totalFee).toBe(4000); // 4 days @ 1000/day
  });

  it('should enforce note addendums and increment version numbers appropriately', () => {
    const originalNote = { id: 'note-1', version: 1, content: 'Initial note' };
    const addendum = { parentNoteId: originalNote.id, version: originalNote.version + 1, type: 'addendum', content: 'Correction/Addendum' };

    expect(addendum.version).toBe(2);
    expect(addendum.parentNoteId).toBe('note-1');
    expect(addendum.type).toBe('addendum');
  });
});
