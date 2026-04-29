import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  UserCircle, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Search
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function StaffManagement() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    phone: '', 
    password: '', 
    role: (profile?.role === 'pharmacy_admin' ? 'pharmacy' : 'doctor') as UserRole 
  });

  const fetchStaff = async () => {
    try {
      const data = await apiService.getUsers();
      // Filter out admins from common list or show all
      setStaff(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean phone number
      const cleanedStaff = {
        ...newStaff,
        phone: newStaff.phone.replace(/\s+/g, '').replace(/-/g, '')
      };
      await apiService.registerStaff(cleanedStaff);
      setShowAddModal(false);
      setNewStaff({ name: '', phone: '', password: '', role: (profile?.role === 'pharmacy_admin' ? 'pharmacy' : 'doctor') as UserRole });
      fetchStaff();
    } catch (err) {
      console.error(err);
      alert('Failed to register staff');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await apiService.updateUserRole(userId, role);
      setStaff(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) return;
    try {
      await apiService.deleteUser(userId);
      setStaff(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete staff member');
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isPharmacyAdmin = profile?.role === 'pharmacy_admin';
  const roles: UserRole[] = isAdmin 
    ? ['admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology']
    : ['pharmacy'];

  const filteredStaff = staff.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.role.toLowerCase().includes(searchTerm.toLowerCase());
    if (isPharmacyAdmin) {
      return matchesSearch && user.role === 'pharmacy';
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in mt-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 font-medium">Configure roles and permissions for hospital personnel.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search staff by name or role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
              />
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
           >
             <UserPlus size={20} />
             Register Staff
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Personnel...</div>
        ) : filteredStaff.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                {user.name.charAt(0)}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              )}>
                {user.role}
              </div>
              {profile?.id !== user.id && user.phone !== '08000000000' && (
                <button 
                  onClick={() => handleDeleteStaff(user.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove Staff"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user.name}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                  <span>{user.phone || user.email}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex flex-col gap-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Role</label>
                 <select 
                   value={user.role}
                   onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                   className="w-full p-3 bg-gray-50 rounded-xl border-none text-xs font-black outline-none focus:ring-2 focus:ring-blue-100"
                 >
                   {roles.map(r => (
                     <option key={r} value={r}>{r.toUpperCase()}</option>
                   ))}
                 </select>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-4">
                  <UserPlus className="text-blue-600" size={32} />
                  Staff Registration
                </h3>
                
                <p className="text-sm font-medium text-gray-500 mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                   <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                   {isPharmacyAdmin ? 'Register a new pharmacy member specifically for medication dispensing.' : 'Admin: Register new hospital staff members with secure credentials.'}
                </p>

                <form className="space-y-6" onSubmit={handleRegister}>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                      <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                        <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                        <select 
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          value={newStaff.role} 
                          onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                          disabled={isPharmacyAdmin}
                        >
                           {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] text-sm font-black shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                      Create Staff Account
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
