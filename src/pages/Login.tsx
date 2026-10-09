import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, LogIn, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { apiService } from '../services/apiService';

export default function Login() {
  const { profile, loginManual } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'nurse': return '/wards';
      case 'pharmacy': return '/pharmacy';
      case 'lab':
      case 'radiology': return '/investigations';
      case 'record': return '/patients';
      case 'doctor':
      case 'admin':
      default: return '/';
    }
  };

  React.useEffect(() => {
    if (profile) {
      navigate(getRedirectPath(profile.role));
    }
  }, [profile, navigate]);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'doctor' | 'nurse' | 'record' | 'pharmacy' | 'lab' | 'radiology' | 'admin'>('nurse');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');

    try {
      const userData = await apiService.loginStaff({ 
        phone: cleanPhone, 
        password: password.trim() 
      });
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

    const trimmedPhone = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (isRegistering && trimmedPassword !== confirmPassword.trim()) {
      setError('Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      // Register with selected role
      const userData = await apiService.registerStaff({ 
        name: trimmedName, 
        phone: trimmedPhone, 
        password: trimmedPassword, 
        role: role 
      });
      // Automatically login
      loginManual(userData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F3F4F6] flex overflow-hidden">
      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-3/5 p-12 items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200')` }}
      >
        {/* Dark/Blue semi-transparent gradient overlay for high contrast and modern look */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/85 to-slate-900/90 backdrop-blur-[2px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-overlay filter blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/20 rounded-full mix-blend-overlay filter blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 text-white text-center max-w-lg">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5 }}
             className="mb-6 flex justify-center"
          >
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/30">
              <Hospital size={44} className="text-blue-600" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black mb-2 tracking-tight drop-shadow-md"
          >
            VIVO®
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-blue-100 font-medium drop-shadow-sm"
          >
            Teaching Hospital Advanced Healthcare Ecosystem.
          </motion.p>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full py-6 sm:py-10">
          <div className="mb-6 sm:mb-10">
            <div className="lg:hidden mb-4 flex justify-center">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                <Hospital size={28} />
              </div>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-1.5 sm:mb-2 text-center lg:text-left">
              {isRegistering ? 'Staff Registration' : 'VIVO Hospital Portal'}
            </h2>
            <p className="text-xs sm:text-base text-gray-500 font-medium text-center lg:text-left">
              {isRegistering ? 'Create your professional account' : 'VIVO® Administrative Control Panel'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 sm:space-y-6">
            {isRegistering && (
              <>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Departmental Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                    required
                  >
                    <option value="doctor">Medical Doctor</option>
                    <option value="nurse">Nursing Staff</option>
                    <option value="record">Medical Records</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="lab">Laboratory Unit</option>
                    <option value="radiology">Radiology Unit</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Admin ID / Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080 0000 0000"
                className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Security Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white font-black py-3.5 sm:py-4 text-sm sm:text-base rounded-xl sm:rounded-[2rem] transition-all shadow-lg hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Processing...' : (isRegistering ? 'Register Staff Account' : 'Authorize Access')}
                <LogIn size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[11px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors text-center py-1.5"
              >
                {isRegistering ? 'Already have an account? Sign In' : 'New Staff Member? Create Account'}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-gray-100 mt-6">
               <button
                 onClick={() => navigate('/admin/login')}
                 className="flex-1 bg-gray-900 text-white text-xs sm:text-sm font-black py-3 rounded-xl transition-all shadow hover:bg-black flex items-center justify-center gap-2"
               >
                 <ShieldCheck size={18} />
                 Admin Portal
               </button>
               
               <button
                 onClick={() => navigate('/staff/login')}
                 className="flex-1 bg-blue-600 text-white text-xs sm:text-sm font-black py-3 rounded-xl transition-all shadow hover:bg-blue-700 flex items-center justify-center gap-2"
               >
                 <Hospital size={18} />
                 Staff Portal
               </button>
          </div>

          <div className="mt-12 text-center space-y-4">
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/dev/seed', { method: 'POST' });
                  setPhone('08000000000');
                  setPassword('admin');
                  setError(null);
                } catch (err) {
                  setError('System initialization failed');
                }
              }}
              className="px-6 py-3 bg-blue-50 text-[10px] font-black tracking-widest uppercase text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              System Initialization / Master Login
            </button>
            <div>
              <p className="text-gray-300 text-[10px] font-black tracking-widest uppercase mb-1">System Audit Active</p>
              <p className="text-gray-900 font-black text-xl italic">VIVO®</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
