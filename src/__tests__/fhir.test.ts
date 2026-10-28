import { describe, it, expect } from 'vitest';

function toFhirPatient(p: any) {
  return {
    resourceType: 'Patient',
    id: p.id,
    active: p.status !== 'discharged',
    name: [{
      use: 'official',
      text: p.name,
      family: p.name.split(' ').slice(-1)[0] || '',
      given: p.name.split(' ').slice(0, -1)
    }],
    gender: p.gender === 'male' ? 'male' : p.gender === 'female' ? 'female' : 'other',
    birthDate: p.dob ? new Date(p.dob).toISOString().split('T')[0] : undefined,
    address: p.address ? [{ text: p.address }] : []
  };
}

function toFhirObservation(v: any) {
  const components: any[] = [];
  if (v.bp) {
    const parts = v.bp.split('/');
    if (parts.length === 2) {
      components.push({
        code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
        valueQuantity: { value: parseFloat(parts[0]), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
      });
      components.push({
        code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
        valueQuantity: { value: parseFloat(parts[1]), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
      });
    }
  }
  if (v.temp) {
    components.push({
      code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
      valueQuantity: { value: v.temp, unit: 'C', system: 'http://unitsofmeasure.org', code: 'Cel' }
    });
  }

  return {
    resourceType: 'Observation',
    id: v.id,
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    subject: { reference: `Patient/${v.patientId}` },
    component: components
  };
}

function toFhirMedicationRequest(rx: any) {
  return {
    resourceType: 'MedicationRequest',
    id: rx.id,
    status: rx.status === 'active' ? 'active' : rx.status === 'completed' ? 'completed' : 'stopped',
    intent: 'order',
    medicationCodeableConcept: { text: rx.medication },
    subject: { reference: `Patient/${rx.patientId}` },
    requester: { display: rx.authorName || 'Doctor' },
    dosageInstruction: [{ text: `${rx.dosage} ${rx.frequency} for ${rx.duration}` }]
  };
}

function toFhirDiagnosticReport(inv: any) {
  return {
    resourceType: 'DiagnosticReport',
    id: inv.id,
    status: inv.status === 'completed' || inv.status === 'reviewed' ? 'final' : 'registered',
    code: { text: inv.testName },
    subject: { reference: `Patient/${inv.patientId}` },
    conclusion: inv.result || undefined
  };
}

describe('HL7 FHIR R4 Resource Converter Suite', () => {
  it('should accurately convert internal Patient model to FHIR R4 Patient JSON', () => {
    const rawPatient = {
      id: 'pat-101',
      name: 'Amina Bello',
      gender: 'female',
      dob: '1992-04-15',
      address: 'Abuja, Nigeria',
      status: 'inpatient'
    };
    const fhir = toFhirPatient(rawPatient);

    expect(fhir.resourceType).toBe('Patient');
    expect(fhir.id).toBe('pat-101');
    expect(fhir.active).toBe(true);
    expect(fhir.gender).toBe('female');
    expect(fhir.birthDate).toBe('1992-04-15');
    expect(fhir.name[0].text).toBe('Amina Bello');
  });

  it('should accurately convert VitalSign to FHIR R4 Observation JSON with LOINC codes', () => {
    const rawVitals = {
      id: 'vit-1',
      patientId: 'pat-101',
      bp: '120/80',
      temp: 36.8
    };
    const fhir = toFhirObservation(rawVitals);

    expect(fhir.resourceType).toBe('Observation');
    expect(fhir.subject.reference).toBe('Patient/pat-101');
    expect(fhir.category[0].coding[0].code).toBe('vital-signs');
    expect(fhir.component.length).toBe(3); // Systolic, Diastolic, Temp
  });

  it('should convert Prescription to FHIR R4 MedicationRequest JSON', () => {
    const rawRx = {
      id: 'rx-55',
      patientId: 'pat-101',
      medication: 'Amoxicillin 500mg',
      dosage: '1 capsule',
      frequency: 'TDS',
      duration: '7 days',
      authorName: 'Dr. Okon',
      status: 'active'
    };
    const fhir = toFhirMedicationRequest(rawRx);

    expect(fhir.resourceType).toBe('MedicationRequest');
    expect(fhir.status).toBe('active');
    expect(fhir.intent).toBe('order');
    expect(fhir.medicationCodeableConcept.text).toBe('Amoxicillin 500mg');
  });

  it('should convert Investigation to FHIR R4 DiagnosticReport JSON', () => {
    const rawInv = {
      id: 'inv-99',
      patientId: 'pat-101',
      testName: 'Full Blood Count',
      status: 'completed',
      result: 'Normal WBC and RBC'
    };
    const fhir = toFhirDiagnosticReport(rawInv);

    expect(fhir.resourceType).toBe('DiagnosticReport');
    expect(fhir.status).toBe('final');
    expect(fhir.code.text).toBe('Full Blood Count');
    expect(fhir.conclusion).toBe('Normal WBC and RBC');
  });
});
