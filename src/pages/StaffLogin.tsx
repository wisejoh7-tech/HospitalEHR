import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, LogIn, ShieldAlert, Eye, EyeOff, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';

export default function StaffLogin() {
  const { profile, loginManual } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role: string) => {
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
    if (profile) {
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
      
      if (userData.role === 'admin') {
         setError('Admins should use the dedicated Admin Portal');
         setIsSubmitting(false);
         return;
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200')` }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-xl p-10 relative z-10 border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl text-white mb-4 shadow-md shadow-blue-100">
            <Hospital size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Hospital Portal</h1>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Clinical & Administrative Services</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080 0000 0000"
                className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all pl-14"
                required
              />
              <UserCircle size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Access Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
            <LogIn size={20} />
          </button>
        </form>

        <div className="mt-12 flex items-center justify-between">
            <button 
              onClick={() => navigate('/admin/login')}
              className="text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
            >
              Administrator Login
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
            >
              Account Management
            </button>
        </div>
      </motion.div>
    </div>
  );
}
