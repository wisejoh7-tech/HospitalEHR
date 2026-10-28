import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  ShieldAlert,
  Eye,
  EyeOff,
  UserCircle,
  UserPlus,
  User,
  Mail,
  Phone,
  Sparkles,
  Lock,
  Hospital
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

interface StaffLoginProps {
  isAdmin?: boolean;
}

export default function StaffLogin({ isAdmin = false }: StaffLoginProps) {
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

  const [rememberMe, setRememberMe] = useState(true);

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Please provide your Username / ID / Email and password');
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = await apiService.loginStaff({ 
        identifier: cleanIdentifier,
        password: cleanPassword
      });

      if (!userData) {
        throw new Error('Invalid credentials');
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

  const handleForgotPassword = () => {
    setSuccessMsg('Password reset instructions have been requested. Please contact system administrator.');
  };

  const portalHeaderTitle = isAdmin
    ? "Admin Login"
    : "VIVI medical center login";

  const cardHeaderTitle = isAdmin
    ? "System Admin Login"
    : "VIVI medical center login";

  const cardSubtitle = isAdmin
    ? "Access Your Secure Management Console"
    : "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden bg-cover bg-center font-sans"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=1920')`
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>

      {/* Floating Header Title above Laptop Frame */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow-md mb-4 text-center tracking-tight"
        style={{ color: '#1a3250' }}
      >
        {portalHeaderTitle}
      </motion.h1>

      {/* Laptop Mockup Bezel Outer Frame */}
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-lg mx-auto"
      >
        {/* Laptop Screen Bezel */}
        <div className="bg-slate-950 rounded-[28px] sm:rounded-[34px] p-3 sm:p-4 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/20 relative">
          {/* Webcam Camera Dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 mx-auto mb-2 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-900/80"></div>
          </div>

          {/* Screen Content Container */}
          <div className="bg-slate-100 rounded-[20px] sm:rounded-[24px] overflow-hidden p-3 sm:p-5 relative shadow-inner">

            {/* Main Login Card */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200/80 max-w-sm mx-auto">

              {/* Card Header Section */}
              <div className="bg-[#1a3250] text-white p-5 text-center relative">
                {/* Header Titles */}
                <h2 className="text-lg font-bold text-white tracking-tight">{cardHeaderTitle}</h2>
                {cardSubtitle && <p className="text-[11px] text-blue-200/90 font-medium mt-0.5">{cardSubtitle}</p>}
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 bg-white space-y-3.5">

                {/* Error Banner */}
                {error && (
                  <div className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-1.5 text-red-600 text-xs">
                    <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                    <p className="leading-tight text-[11px] font-medium">{error}</p>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-1.5 text-emerald-700 text-xs">
                    <Sparkles size={15} className="shrink-0 text-emerald-600" />
                    <p className="leading-tight text-[11px] font-medium">{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3">
                  {/* Identifier Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Username / Medical Center ID / Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g., admin@hospital.com or 08000000000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all pl-9 text-slate-800 placeholder:text-slate-400"
                        required
                      />
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all pl-9 pr-9 text-slate-800"
                        required
                      />
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-800 focus:ring-blue-500"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-blue-700 hover:underline font-bold text-[11px]"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Log In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1a3250] hover:bg-[#12243b] text-white font-bold py-2.5 text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? 'Authenticating...' : 'Log In'}
                  </button>
                </form>

                {/* Card Footer Section */}
                <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 border-t border-slate-100">
                  <p className="text-slate-600 font-medium">
                    Need an account? Please contact system administrator.
                  </p>
                  <p className="text-[9px] text-slate-400">
                    © 2024 VIVI Medical Center. All Rights Reserved.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Laptop Bottom Deck Base */}
        <div className="w-[106%] -ml-[3%] h-4 sm:h-5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-b-2xl shadow-xl border-t border-slate-400/60 flex justify-center items-center relative z-0">
          <div className="w-16 sm:w-20 h-1 bg-slate-500/50 rounded-full"></div>
        </div>
      </motion.div>
    </div>
  );
}
