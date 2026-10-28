/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WardsOverview = lazy(() => import('./pages/WardsOverview'));
const PatientsList = lazy(() => import('./pages/PatientsList'));
const PatientDetails = lazy(() => import('./pages/PatientDetails'));
const PatientRegistration = lazy(() => import('./pages/PatientRegistration'));
const PatientAdmission = lazy(() => import('./pages/PatientAdmission'));
const Investigations = lazy(() => import('./pages/Investigations'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const Physiotherapy = lazy(() => import('./pages/Physiotherapy'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const RevenueSettings = lazy(() => import('./pages/RevenueSettings'));
const Billing = lazy(() => import('./pages/Billing'));
const FinancialReconciliation = lazy(() => import('./pages/FinancialReconciliation'));
const Logs = lazy(() => import('./pages/Logs'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const VitalsRecord = lazy(() => import('./pages/VitalsRecord'));
const Appointments = lazy(() => import('./pages/Appointments'));
const AcademicRounds = lazy(() => import('./pages/AcademicRounds'));
const MedicalEducation = lazy(() => import('./pages/MedicalEducation'));
const ClinicalTrials = lazy(() => import('./pages/ClinicalTrials'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.role) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const { profile } = useAuth();
  if (!profile || !profile.role) return <Navigate to="/login" replace />;

  switch (profile.role) {
    case 'nurse': return <Navigate to="/vitals-record" replace />;
    case 'pharmacy_admin':
    case 'pharmacy': return <Navigate to="/pharmacy" replace />;
    case 'lab':
    case 'radiology': return <Navigate to="/investigations" replace />;
    case 'record': 
    case 'doctor': return <Navigate to="/patients" replace />;
    case 'admin': return <Navigate to="/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/dashboard" element={<ProtectedRoute roles={['admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/wards" element={<ProtectedRoute roles={['admin', 'doctor', 'nurse']}><WardsOverview /></ProtectedRoute>} />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/vitals-record" element={<ProtectedRoute roles={['admin', 'nurse']}><VitalsRecord /></ProtectedRoute>} />
              <Route path="/patients/register" element={<ProtectedRoute roles={['admin', 'record']}><PatientRegistration /></ProtectedRoute>} />
              <Route path="/admission" element={<ProtectedRoute roles={['admin', 'nurse', 'doctor']}><PatientAdmission /></ProtectedRoute>} />
              <Route path="/patients/:id" element={<PatientDetails />} />
              <Route path="/investigations" element={<ProtectedRoute roles={['admin', 'doctor', 'nurse', 'lab', 'radiology']}><Investigations /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute roles={['admin', 'doctor', 'pharmacy', 'pharmacy_admin']}><Pharmacy /></ProtectedRoute>} />
              <Route path="/physiotherapy" element={<ProtectedRoute roles={['admin', 'doctor', 'physiotherapist', 'physio', 'nurse']}><Physiotherapy /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute roles={['admin']}><StaffManagement /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute roles={['admin', 'record', 'doctor', 'finance', 'finance_admin']}><Billing /></ProtectedRoute>} />
              <Route path="/reconciliation" element={<ProtectedRoute roles={['admin', 'finance', 'finance_admin']}><FinancialReconciliation /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute roles={['admin', 'record', 'doctor']}><Appointments /></ProtectedRoute>} />
              <Route path="/academic-rounds" element={<ProtectedRoute roles={['admin', 'doctor']}><AcademicRounds /></ProtectedRoute>} />
              <Route path="/medical-education" element={<ProtectedRoute roles={['admin', 'doctor']}><MedicalEducation /></ProtectedRoute>} />
              <Route path="/clinical-research" element={<ProtectedRoute roles={['admin', 'doctor']}><ClinicalTrials /></ProtectedRoute>} />
              <Route path="/revenue" element={<ProtectedRoute roles={['admin']}><RevenueSettings /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute roles={['admin']}><Logs /></ProtectedRoute>} />
              <Route path="/records" element={<ProtectedRoute roles={['admin', 'record']}><PatientsList /></ProtectedRoute>} />
              <Route path="/settings" element={<div>Settings</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
