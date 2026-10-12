import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, LogIn, ShieldAlert, Eye, EyeOff, UserCircle, UserPlus, User, Mail, Phone, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';
import { UserRole } from '../types';

export default function StaffLogin() {
  const { profile, loginManual } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role?: string | null) => {
    if (!role) return '/';
    switch (role) {
      case 'nurse': return '/vitals-record';
      case 'pharmacy_admin':
      case 'pharmacy': return '/pharmacy';
      case 'lab':
      case 'radiology': return '/investigations';
      case 'record': return '/patients';
      case 'doctor': return '/patients';
      case 'admin': return '/dashboard';
      default: return '/';
    }
  };

  React.useEffect(() => {
    if (profile && profile.role) {
      navigate(getRedirectPath(profile.role));
    }
  }, [profile, navigate]);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('admin');

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rolesList: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'System Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'record', label: 'Record Officer' },
    { value: 'pharmacy', label: 'Pharmacist' },
    { value: 'pharmacy_admin', label: 'Pharmacy Admin' },
    { value: 'lab', label: 'Lab Technician' },
    { value: 'radiology', label: 'Radiologist' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Please provide your email/phone and password');
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = await apiService.loginStaff({ 
        identifier: cleanIdentifier,
        password: cleanPassword
      });

      if (!userData) {
        throw new Error('Invalid email/phone or password');
      }

      if (!userData.role) {
        throw new Error('User profile is missing an assigned role');
      }

      loginManual(userData);
      navigate(getRedirectPath(userData.role));
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanPhone = regPhone.replace(/\s+/g, '').replace(/-/g, '').trim();
    const cleanEmail = regEmail.trim();
    const cleanPassword = regPassword.trim();

    if (!cleanName) {
      setError('Full Name is required');
      return;
    }

    if (!cleanPhone && !cleanEmail) {
      setError('Either Email or Phone Number must be provided');
      return;
    }

    if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
      setError('Please enter a valid email address (e.g. name@hospital.com)');
      return;
    }

    if (!cleanPassword) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = await apiService.registerAccount({
        name: cleanName,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
        password: cleanPassword,
        role: regRole
      });

      if (!userData) {
        throw new Error('Registration failed');
      }

      loginManual(userData);
      navigate(getRedirectPath(userData.role));
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('already registered')) {
        // If phone or email is already registered, suggest switching to Login
        const existingIdent = cleanPhone || cleanEmail;
        if (existingIdent) {
          setIdentifier(existingIdent);
        }
        if (cleanEmail === 'admin@hospital.com' || cleanPhone === '08000000000') {
          setLoginPassword('admin');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAdminCredentials = (type: 'email' | 'phone') => {
    setError(null);
    setSuccessMsg('Admin credentials pre-filled! Click "Sign In" below.');
    setActiveTab('login');
    if (type === 'email') {
      setIdentifier('admin@hospital.com');
    } else {
      setIdentifier('08000000000');
    }
    setLoginPassword('admin');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200')` }}
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6 relative z-10 border border-gray-100"
      >
        <div className="text-center mb-4">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl text-white mb-2 shadow-lg shadow-blue-500/20">
            <Hospital size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Hospital Portal</h1>
          <p className="text-xs text-gray-500 font-medium tracking-tight mt-0.5">
            Clinical & Administrative Access
          </p>
        </div>

        {/* Admin Login Details Banner */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span>Admin Login Details</span>
            </div>
            <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider">Default</span>
          </div>

          <div className="text-[11px] text-gray-700 space-y-1 font-mono bg-white/70 p-2 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-sans font-medium">Email:</span>
              <button
                type="button"
                onClick={() => fillAdminCredentials('email')}
                className="font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                title="Click to fill email"
              >
                admin@hospital.com <Sparkles size={11} className="text-amber-500" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-sans font-medium">Phone:</span>
              <button
                type="button"
                onClick={() => fillAdminCredentials('phone')}
                className="font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                title="Click to fill phone"
              >
                08000000000 <Sparkles size={11} className="text-amber-500" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-sans font-medium">Password:</span>
              <span className="font-bold text-slate-900">admin</span>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => fillAdminCredentials('email')}
              className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1 shadow-xs"
            >
              <KeyRound size={12} />
              Auto-fill Admin (Email)
            </button>
            <button
              type="button"
              onClick={() => fillAdminCredentials('phone')}
              className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1 shadow-xs"
            >
              <Phone size={12} />
              Auto-fill Admin (Phone)
            </button>
          </div>
        </div>

        {/* Tab Navigation for Login and Register on same page */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LogIn size={15} />
            Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserPlus size={15} />
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg flex flex-col gap-1.5 text-red-600">
            <div className="flex gap-2 items-start">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-tight">{error}</p>
            </div>
            {error.toLowerCase().includes('already registered') && activeTab === 'register' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  if (!loginPassword) setLoginPassword('admin');
                  setSuccessMsg('Phone/Email pre-filled. Please click Sign In to enter.');
                }}
                className="mt-1 text-xs font-bold text-blue-700 underline hover:text-blue-800 text-left cursor-pointer"
              >
                → Already registered? Click here to Sign In
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-2 text-emerald-700 items-center">
            <Sparkles size={16} className="shrink-0" />
            <p className="text-xs font-semibold leading-tight">{successMsg}</p>
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@hospital.com or 08000000000"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pl-9"
                  required
                />
                <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-black py-2.5 text-xs rounded-xl transition-all shadow-md hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              <LogIn size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pl-9"
                  required
                />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@hospital.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pl-8"
                  />
                  <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08000000000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pl-8"
                  />
                  <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                >
                  {rolesList.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-black py-2.5 text-xs rounded-xl transition-all shadow-md hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? 'Registering...' : 'Register Account'}
              <UserPlus size={16} />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
