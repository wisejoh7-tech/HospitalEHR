import { describe, it, expect } from 'vitest';

type Role = 'admin' | 'doctor' | 'nurse' | 'record' | 'pharmacy' | 'lab';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['read:all', 'write:all', 'delete:all', 'update:role'],
  doctor: ['read:patients', 'write:prescriptions', 'write:notes', 'write:physio'],
  nurse: ['read:patients', 'write:vitals', 'update:workflow'],
  record: ['read:patients', 'register:patients'],
  pharmacy: ['read:prescriptions', 'update:prescriptions', 'manage:inventory'],
  lab: ['read:investigations', 'update:investigations']
};

function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('read:all') || permissions.includes('write:all') || permissions.includes(permission);
}

describe('Role-Based Access Control (RBAC) Guard Tests', () => {
  it('admin should have full elevated permissions including update:role', () => {
    expect(hasPermission('admin', 'update:role')).toBe(true);
    expect(hasPermission('admin', 'delete:all')).toBe(true);
  });

  it('doctors should be allowed to write prescriptions and notes but not update roles', () => {
    expect(hasPermission('doctor', 'write:prescriptions')).toBe(true);
    expect(hasPermission('doctor', 'write:notes')).toBe(true);
    expect(hasPermission('doctor', 'update:role')).toBe(false);
  });

  it('nurses should be allowed to write vitals and update workflow but not prescribe', () => {
    expect(hasPermission('nurse', 'write:vitals')).toBe(true);
    expect(hasPermission('nurse', 'update:workflow')).toBe(true);
    expect(hasPermission('nurse', 'write:prescriptions')).toBe(false);
  });
});

describe('Login Credential & Identifier Matching Logic Suite', () => {
  const mockUsers = [
    { id: 'usr-1', uid: 'firebase-uid-1', name: 'Dr. John Doe', email: 'john.doe@hospital.com', phone: '08012345678', password: 'password123', role: 'doctor' },
    { id: 'usr-2', uid: 'admin-uid', name: 'System Admin', email: 'admin@hospital.com', phone: '08000000000', password: 'admin', role: 'admin' },
  ];

  const normalizePhoneDigits = (phoneStr?: string | null): string => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('234') && digits.length === 13) {
      digits = '0' + digits.slice(3);
    }
    return digits;
  };

  const phonesMatch = (phoneA?: string | null, phoneB?: string | null): boolean => {
    if (!phoneA || !phoneB) return false;
    const rawA = phoneA.replace(/\s+/g, '').replace(/-/g, '').trim();
    const rawB = phoneB.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (rawA === rawB) return true;

    const normA = normalizePhoneDigits(phoneA);
    const normB = normalizePhoneDigits(phoneB);
    if (normA && normB && normA === normB) return true;

    const last10A = normA.slice(-10);
    const last10B = normB.slice(-10);
    if (last10A.length === 10 && last10A === last10B) return true;

    return false;
  };

  const findUserByRawIdentifier = (rawIdentifier: string) => {
    return mockUsers.find(u => {
      const matchesId = u.id && u.id === rawIdentifier;
      const matchesUid = u.uid && u.uid === rawIdentifier;
      const matchesEmail = u.email && u.email.toLowerCase() === rawIdentifier.toLowerCase();
      const matchesPhone = u.phone && phonesMatch(u.phone, rawIdentifier);
      const matchesEmailPrefix = u.email && !rawIdentifier.includes('@') && u.email.toLowerCase().startsWith(rawIdentifier.toLowerCase() + '@');
      const matchesName = u.name && u.name.toLowerCase() === rawIdentifier.toLowerCase();
      return Boolean(matchesId || matchesUid || matchesEmail || matchesPhone || matchesEmailPrefix || matchesName);
    }) || null;
  };

  it('should match user by exact email, case-insensitive email, and email prefix', () => {
    expect(findUserByRawIdentifier('john.doe@hospital.com')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('JOHN.DOE@HOSPITAL.COM')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('john.doe')?.id).toBe('usr-1');
  });

  it('should match user by phone number with local and international formats (+234)', () => {
    expect(findUserByRawIdentifier('08012345678')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('+2348012345678')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('2348012345678')?.id).toBe('usr-1');
  });

  it('should match user by ID, UID, and full name', () => {
    expect(findUserByRawIdentifier('usr-1')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('firebase-uid-1')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('Dr. John Doe')?.id).toBe('usr-1');
    expect(findUserByRawIdentifier('dr. john doe')?.id).toBe('usr-1');
  });

  it('should match default admin credentials by email, phone, name, or shortcut "admin"', () => {
    expect(findUserByRawIdentifier('admin@hospital.com')?.role).toBe('admin');
    expect(findUserByRawIdentifier('08000000000')?.role).toBe('admin');
    expect(findUserByRawIdentifier('System Admin')?.role).toBe('admin');
  });
});

describe('Environment Variable Normalization & Admin Identifier Matching Suite', () => {
  const cleanEnvStr = (val?: string): string => {
    return (val || '').trim().replace(/^["']|["']$/g, '').trim();
  };

  it('should correctly strip whitespace and surrounding quotes from env variables', () => {
    expect(cleanEnvStr('  admin@hospital.com  ')).toBe('admin@hospital.com');
    expect(cleanEnvStr('"admin@hospital.com"')).toBe('admin@hospital.com');
    expect(cleanEnvStr("'secretpassword'")).toBe('secretpassword');
    expect(cleanEnvStr(' "mypass123" ')).toBe('mypass123');
  });

  it('should accurately detect admin login attempts even with custom env credentials and quoted strings', () => {
    const customAdminEmail = cleanEnvStr('"customadmin@hospital.com"');
    const customAdminPhone = cleanEnvStr(" '08123456789' ");
    const customAdminName = cleanEnvStr(' "Super Admin" ');
    const customAdminPass = cleanEnvStr(' "secret123" ');

    const checkIsAdminAttempt = (rawIdentifier: string) => {
      const idClean = cleanEnvStr(rawIdentifier);

      return (
        idClean.toLowerCase() === customAdminEmail.toLowerCase() ||
        idClean === customAdminPhone ||
        idClean.toLowerCase() === customAdminName.toLowerCase() ||
        idClean.toLowerCase() === 'admin@hospital.com' ||
        idClean === '08000000000' ||
        idClean.toLowerCase() === 'admin'
      );
    };

    expect(checkIsAdminAttempt('customadmin@hospital.com')).toBe(true);
    expect(checkIsAdminAttempt('CUSTOMADMIN@HOSPITAL.COM')).toBe(true);
    expect(checkIsAdminAttempt('08123456789')).toBe(true);
    expect(checkIsAdminAttempt('Super Admin')).toBe(true);
    expect(checkIsAdminAttempt('admin')).toBe(true);
    expect(checkIsAdminAttempt('doctor@hospital.com')).toBe(false);
  });
});
