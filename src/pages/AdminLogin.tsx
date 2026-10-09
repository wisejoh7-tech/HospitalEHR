import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, LogIn, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';

export default function AdminLogin() {
  const { profile, loginManual } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (profile && profile.role === 'admin') {
      navigate('/dashboard');
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
      
      if (userData.role !== 'admin') {
        throw new Error('Access Denied: This portal is for Administrators only.');
      }

      loginManual(userData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1587350853328-4745f41d915a?auto=format&fit=crop&q=80&w=1200')` }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-none"></div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-gray-900 rounded-2xl text-white mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight uppercase italic">Admin Console</h1>
          <p className="text-gray-500 font-medium">Authorized Personnel Only • Secure Access</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Admin Identifier (Phone)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08000000000"
              className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Security Token (Password)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-gray-900 outline-none transition-all pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-gray-100 hover:bg-black active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Verifying Identity...' : 'Unlock Console'}
            <LogIn size={20} />
          </button>
        </form>

        <div className="mt-12 text-center">
            <button 
              onClick={() => navigate('/staff/login')}
              className="text-xs font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              Switch to Staff Portal
            </button>
        </div>
      </motion.div>
    </div>
  );
}
