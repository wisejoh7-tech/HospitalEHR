import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, LogIn, ShieldAlert, Eye, EyeOff, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';

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

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      if (!userData) {
        throw new Error('Invalid phone or password');
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200')` }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-2xl p-5 sm:p-6 relative z-10 border border-gray-100"
      >
        <div className="text-center mb-5">
          <div className="inline-flex p-2.5 bg-blue-600 rounded-xl text-white mb-3 shadow-md shadow-blue-100">
            <Hospital size={24} />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-0.5">Hospital Portal</h1>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium tracking-tight">Clinical & Administrative Login</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg flex gap-2 text-red-600 items-start">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080 0000 0000"
                className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all pl-9"
                required
              />
              <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Access Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10"
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
      </motion.div>
    </div>
  );
}
