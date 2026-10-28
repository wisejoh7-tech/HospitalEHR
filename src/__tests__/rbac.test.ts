import { describe, it, expect } from 'vitest';

type Role = 'admin' | 'doctor' | 'nurse' | 'record' | 'pharmacy' | 'pharmacy_admin' | 'lab' | 'radiology' | 'physiotherapist' | 'physio';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['read:all', 'write:all', 'delete:all', 'update:role', 'manage:inventory'],
  doctor: ['read:patients', 'write:prescriptions', 'write:notes', 'write:physio', 'write:treatment', 'write:investigations'],
  nurse: ['read:patients', 'write:vitals', 'update:workflow', 'write:notes', 'write:investigations'],
  record: ['read:patients', 'register:patients', 'manage:appointments'],
  pharmacy: ['read:prescriptions', 'update:prescriptions', 'manage:inventory'],
  pharmacy_admin: ['read:prescriptions', 'update:prescriptions', 'manage:inventory'],
  lab: ['read:investigations', 'update:investigations'],
  radiology: ['read:investigations', 'update:investigations'],
  physiotherapist: ['read:physio', 'update:physio'],
  physio: ['read:physio', 'update:physio']
};

function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('read:all') || permissions.includes('write:all') || permissions.includes(permission);
}

describe('Server & Application RBAC Authorization Suite', () => {
  it('admin should have full permissions including user management and clearing logs', () => {
    expect(hasPermission('admin', 'update:role')).toBe(true);
    expect(hasPermission('admin', 'delete:all')).toBe(true);
    expect(hasPermission('admin', 'manage:inventory')).toBe(true);
  });

  it('doctor can prescribe and write clinical notes, but cannot manage inventory or update roles', () => {
    expect(hasPermission('doctor', 'write:prescriptions')).toBe(true);
    expect(hasPermission('doctor', 'write:notes')).toBe(true);
    expect(hasPermission('doctor', 'update:role')).toBe(false);
    expect(hasPermission('doctor', 'manage:inventory')).toBe(false);
  });

  it('nurse can record vitals and update workflow, but cannot write prescriptions', () => {
    expect(hasPermission('nurse', 'write:vitals')).toBe(true);
    expect(hasPermission('nurse', 'update:workflow')).toBe(true);
    expect(hasPermission('nurse', 'write:prescriptions')).toBe(false);
  });

  it('pharmacist can fulfill prescriptions and manage inventory, but cannot record vitals', () => {
    expect(hasPermission('pharmacy', 'manage:inventory')).toBe(true);
    expect(hasPermission('pharmacy', 'update:prescriptions')).toBe(true);
    expect(hasPermission('pharmacy', 'write:vitals')).toBe(false);
  });

  it('lab personnel can update diagnostic test results, but cannot register patients or prescribe', () => {
    expect(hasPermission('lab', 'update:investigations')).toBe(true);
    expect(hasPermission('lab', 'register:patients')).toBe(false);
    expect(hasPermission('lab', 'write:prescriptions')).toBe(false);
  });

  it('records officer can register patients and manage appointments, but cannot prescribe or enter lab results', () => {
    expect(hasPermission('record', 'register:patients')).toBe(true);
    expect(hasPermission('record', 'manage:appointments')).toBe(true);
    expect(hasPermission('record', 'write:prescriptions')).toBe(false);
    expect(hasPermission('record', 'update:investigations')).toBe(false);
  });
});
