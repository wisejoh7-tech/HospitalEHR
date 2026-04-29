import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isRecord: boolean;
  isPharmacy: boolean;
  isLab: boolean;
  isRadiology: boolean;
  completeRegistration: (role: UserRole, name: string) => Promise<void>;
  loginManual: (profile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for manual session
    const saved = localStorage.getItem('hospital_staff_session');
    if (saved) {
       setProfile(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const loginManual = (staffProfile: UserProfile) => {
    setProfile(staffProfile);
    localStorage.setItem('hospital_staff_session', JSON.stringify(staffProfile));
  };

  const logout = () => {
    localStorage.removeItem('hospital_staff_session');
    setProfile(null);
  };

  const completeRegistration = async (role: UserRole, name: string) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email!,
      role,
      createdAt: new Date().toISOString(),
    };
    
    const firestoreProfile = {
      ...newProfile,
      createdAt: serverTimestamp(), // Use server timestamp for Firestore
    };
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), firestoreProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
    
    // Save to Postgres/Backend sync
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name,
          email: user.email!,
          role
        })
      });
    } catch (err) {
      console.error('Backend sync failed:', err);
    }

    setProfile(newProfile);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isDoctor: profile?.role === 'doctor',
    isNurse: profile?.role === 'nurse',
    isRecord: profile?.role === 'record',
    isPharmacy: profile?.role === 'pharmacy',
    isLab: profile?.role === 'lab',
    isRadiology: profile?.role === 'radiology',
    loginManual,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
