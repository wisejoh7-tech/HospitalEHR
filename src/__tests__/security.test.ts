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
