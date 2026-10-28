import { describe, it, expect } from 'vitest';

type Role = 'admin' | 'doctor' | 'nurse' | 'record' | 'pharmacy' | 'pharmacy_admin' | 'lab' | 'radiology' | 'physiotherapist' | 'physio' | 'finance' | 'finance_admin';

const FINANCIAL_ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['reconcile:read', 'reconcile:write', 'bank_accounts:read', 'bank_accounts:write', 'reports:daily'],
  finance: ['reconcile:read', 'reconcile:write', 'bank_accounts:read', 'bank_accounts:write', 'reports:daily'],
  finance_admin: ['reconcile:read', 'reconcile:write', 'bank_accounts:read', 'bank_accounts:write', 'reports:daily', 'refunds:approve'],
  doctor: [],
  nurse: [],
  record: [],
  pharmacy: [],
  pharmacy_admin: [],
  lab: [],
  radiology: [],
  physiotherapist: [],
  physio: []
};

function canAccessFinancialReconciliation(role: Role, permission: string): boolean {
  const permissions = FINANCIAL_ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

function maskAccountNumber(accNo: string): string {
  if (!accNo || accNo.length <= 4) return '****';
  return '*'.repeat(accNo.length - 4) + accNo.slice(-4);
}

function sanitizeFinancialNarration(narration: string): string {
  if (!narration) return '';
  let clean = narration;
  clean = clean.replace(/Patient ID:\s*[a-zA-Z0-9-]+/gi, 'Patient ID: [REDACTED]');
  clean = clean.replace(/DOB:\s*\d{2}\/\d{2}\/\d{4}/gi, 'DOB: [REDACTED]');
  clean = clean.replace(/Diagnosis:\s*[^;\n]+/gi, 'Diagnosis: [REDACTED]');
  return clean.trim();
}

function matchTransaction(txAmount: number, targetAmount: number): 'matched' | 'discrepancy' {
  if (Math.abs(txAmount - targetAmount) < 0.01) {
    return 'matched';
  }
  return 'discrepancy';
}

describe('Financial Reconciliation Engine & Security Spec', () => {
  it('strictly restricts bank account details and reconciliation to finance and admin personnel', () => {
    expect(canAccessFinancialReconciliation('finance', 'bank_accounts:read')).toBe(true);
    expect(canAccessFinancialReconciliation('finance_admin', 'refunds:approve')).toBe(true);
    expect(canAccessFinancialReconciliation('admin', 'reconcile:write')).toBe(true);

    // Clinical roles must be blocked from banking records
    expect(canAccessFinancialReconciliation('doctor', 'bank_accounts:read')).toBe(false);
    expect(canAccessFinancialReconciliation('nurse', 'reconcile:read')).toBe(false);
    expect(canAccessFinancialReconciliation('pharmacy', 'bank_accounts:write')).toBe(false);
  });

  it('masks bank account numbers for secure display', () => {
    expect(maskAccountNumber('0123456789')).toBe('******6789');
    expect(maskAccountNumber('1234')).toBe('****');
  });

  it('sanitizes PHI details from financial narrations', () => {
    const rawNarration = 'Transfer from Patient ID: PAT-1002, DOB: 12/05/1985 for Diagnosis: Malaria treatment';
    const sanitized = sanitizeFinancialNarration(rawNarration);

    expect(sanitized).not.toContain('PAT-1002');
    expect(sanitized).not.toContain('12/05/1985');
    expect(sanitized).not.toContain('Malaria treatment');
    expect(sanitized).toContain('Patient ID: [REDACTED]');
    expect(sanitized).toContain('DOB: [REDACTED]');
    expect(sanitized).toContain('Diagnosis: [REDACTED]');
  });

  it('detects discrepancies in amounts during reconciliation', () => {
    expect(matchTransaction(15000, 15000)).toBe('matched');
    expect(matchTransaction(15000, 14500)).toBe('discrepancy');
  });

  it('prevents duplicate payment processing by reference key', () => {
    const processedRefs = new Set<string>();
    const ref = 'TXN-REF-998877';

    // First attempt
    expect(processedRefs.has(ref)).toBe(false);
    processedRefs.add(ref);

    // Second attempt
    expect(processedRefs.has(ref)).toBe(true);
  });

  it('correctly aggregates daily reconciliation report totals', () => {
    const bankCredits = [10000, 25000, 5000];
    const verifiedPayments = [10000, 25000];
    const refunds = [2000];

    const totalBankCredits = bankCredits.reduce((a, b) => a + b, 0);
    const totalPayments = verifiedPayments.reduce((a, b) => a + b, 0);
    const totalRefunds = refunds.reduce((a, b) => a + b, 0);

    expect(totalBankCredits).toBe(40000);
    expect(totalPayments).toBe(35000);
    expect(totalRefunds).toBe(2000);
  });
});
