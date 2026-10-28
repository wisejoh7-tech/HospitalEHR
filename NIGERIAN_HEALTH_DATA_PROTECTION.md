# Nigerian Health Data Protection & Regulatory Compliance Assessment

## 1. Regulatory Context & Framework
This document outlines the system security, patient privacy, and data protection controls implemented in the Hospital EHR in alignment with relevant Nigerian legal and health-sector frameworks:

1. **Nigerian Data Protection Act (NDPA) 2023** & **NDPR 2019** (Nigeria Data Protection Commission - NDPC):
   - Establishes legal bases for processing sensitive personal data (health records).
   - Requires data minimisation, explicit patient consent, and access restrictions.
   - Enforces data subject rights, including access, correction, and data portability.

2. **National Health Act (NHAct) 2014** (Section 26 - 29):
   - Mandates strict confidentiality of health records.
   - Restricts disclosure of patient information except with consent, court order, or authorized public health duty.
   - Requires health establishments to maintain traceable audit trails and prevent unauthorized access or alteration of medical records.

---

## 2. Technical & Process Remediations Implemented

### A. Role-Based Access Control (RBAC) & Authorization
- **Server-Side Enforcement**: Server endpoints enforce RBAC middleware (`requireRoles`). Client claims alone are insufficient.
- **Role Permissions**:
  - `doctor`: Consultations, diagnoses, treatment plans, prescriptions, physiotherapy orders.
  - `nurse`: Vital signs recording, nursing notes, workflow status updates, admission support.
  - `pharmacy` / `pharmacy_admin`: Prescriptions fulfillment and inventory management.
  - `lab` / `radiology` / `scientist` / `radiographer`: Investigation results and diagnostic status updates.
  - `record`: Patient registration, demographics, appointment booking.
  - `admin`: User role management, ward configuration, pricing, and system audit log review.

### B. Patient Data Confidentiality & Access Logging
- **Sensitive Access Logging**: Access to patient directories (`/api/patients`) and individual medical records (`/api/patients/:id`) creates immutable entries in the `AuditLog`.
- **Tenant & Facility Boundaries**: API requests carry `x-facility-id` headers (default: `VIVO-MAIN`) to maintain multi-facility separation.

### C. Clinical Record Immutability & Traceable Amendments
- **Immutable Notes**: Historical clinical notes (`ClinicalNote`) cannot be edited or deleted via `PUT`, `PATCH`, or `DELETE`.
- **Traceable Amendments**: Addendums and modifications create versioned entries (`version = N`, `parentNoteId`) retaining original timestamps and author authorship.

### D. Interoperability & Data Export Controls (HL7 FHIR R4)
- **Standards Compliance**: Implemented HL7 FHIR R4 interoperability endpoints (`/api/fhir/R4/...`) for `Patient`, `Encounter`, `Observation` (Vitals), `MedicationRequest` (Prescriptions), and `DiagnosticReport`.
- **Controlled Sharing**: Allows seamless, secure data sharing with external laboratory systems, pharmacies, or tertiary health centers without exposing direct database access or modifying underlying schemas.

### E. Data Retention & Preservation
- **Retention Period**: Clinical records and audit logs are retained for a minimum of 5 years in compliance with NHAct guidelines.
- **Append-Only Audits**: System audit logs are append-only; deletion is strictly limited to administrator authorization.

---

## 3. Qualified Legal & Clinical Review Notice
*Disclaimer: The technical and administrative safeguards detailed in this document are designed to align with Nigerian data protection (NDPA 2023 / NDPR) and health sector requirements. These technical controls do not constitute legal certification or substitute for formal audit and review by accredited Nigerian legal practitioners and health regulatory bodies.*
