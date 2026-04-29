# Security Specification: VIVO Teaching Hospital EHR

## 1. Data Invariants
- A `ClinicalNote` cannot be edited after creation.
- Only users with the `doctor` role can create `Prescriptions`.
- Only users with the `admin` role can modify `Ward` configurations.
- `Bed` status can only be updated by authenticated hospital staff.
- `AuditLog` entries are append-only; they cannot be modified or deleted.
- Users cannot elevate their own privileges.

## 2. The "Dirty Dozen" Payloads (Security Test Cases)

| ID | Title | Target | Action | Expected |
|----|-------|--------|--------|----------|
| P1 | Unauthenticated Read | /patients | list | DENIED |
| P2 | Identity Spoofing | /patients/1 | create | DENIED (wrong authorId) |
| P3 | Privilege Escalation | /users/my-uid | update | DENIED (changing role) |
| P4 | Unauthorized Rx Create | /patients/1/rx/1 | create | DENIED (not a doctor) |
| P5 | Note Corruption | /patients/1/notes/1 | update | DENIED (notes are immutable) |
| P6 | ID Poisoning | /patients/LONG-ID... | create | DENIED (size check) |
| P7 | Audit Log Erasure | /audit_logs/1 | delete | DENIED |
| P8 | Fake Timestamp | /patients/1/notes/1 | create | DENIED (client timestamp) |
| P9 | Resource Exhaustion | /patients/1 | create | DENIED (excessive string size) |
| P10| Shadow Field Injection| /patients/1 | create | DENIED (ghost fields) |
| P11| Data Extraction | /users | list | DENIED (no blanket reads for PII) |
| P12| State Shortcutting | /prescriptions/1 | update | DENIED (bypassing state guard) |

## 3. Test Runner Scaffolding

I will use standard Firebase test patterns (though I don't have a full test runner environment, I will provide the logic).
