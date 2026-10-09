import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
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
    role: 'doctor' as UserRole
  });

  const fetchStaff = async () => {
    try {
      const data = await apiService.getUsers();
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
    if (profile?.role !== 'admin') {
      alert('Only administrators can register staff.');
      return;
    }
    try {
      const cleanedStaff = {
        ...newStaff,
        phone: newStaff.phone.replace(/\s+/g, '').replace(/-/g, '')
      };
      await apiService.registerStaff(cleanedStaff, profile.role);
      setShowAddModal(false);
      setNewStaff({ name: '', phone: '', password: '', role: 'doctor' as UserRole });
      fetchStaff();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to register staff');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (profile?.role !== 'admin') {
      alert('Only administrators can assign roles.');
      return;
    }
    try {
      await apiService.updateUserRole(userId, role, profile.role);
      setStaff(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (profile?.role !== 'admin') {
      alert('Only administrators can remove staff members.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) return;
    try {
      await apiService.deleteUser(userId, profile.role);
      setStaff(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete staff member');
    }
  };

  const isAdmin = profile?.role === 'admin';
  const roles: UserRole[] = ['admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology'];

  const filteredStaff = staff.filter(user => {
    if (!user) return false;
    const nameMatch = user.name ? user.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const roleMatch = user.role ? user.role.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || roleMatch;
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl border border-red-100">
        Access Denied. Only administrators can access Staff Management and register staff.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-xs text-gray-500 font-medium">Configure roles and permissions for hospital personnel.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-xs"
              />
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
           >
             <UserPlus size={16} />
             Register Staff
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Personnel...</div>
        ) : filteredStaff.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              )}>
                {user.role || 'N/A'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user.name || 'Unnamed'}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                  <span>{user.phone || user.email || 'No contact info'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 flex flex-col gap-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Assign Role</label>
                 <select 
                   value={user.role || ''}
                   onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                   className="w-full p-2 bg-gray-50 rounded-lg border-none text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
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
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
               className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-hidden z-10 border border-gray-100"
             >
                <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-2.5">
                  <UserPlus className="text-blue-600" size={22} />
                  Staff Registration
                </h3>
                
                <p className="text-xs font-medium text-gray-500 mb-5 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                   <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={16} />
                   Admin: Register new hospital staff with credentials.
                </p>

                <form className="space-y-4" onSubmit={handleRegister}>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Full Name</label>
                      <input className="w-full p-2.5 bg-gray-50 rounded-xl border-none text-xs font-bold" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</label>
                      <input className="w-full p-2.5 bg-gray-50 rounded-xl border-none text-xs font-bold" required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Password</label>
                        <input className="w-full p-2.5 bg-gray-50 rounded-xl border-none text-xs font-bold" required type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Role</label>
                        <select 
                          className="w-full p-2.5 bg-gray-50 rounded-xl border-none text-xs font-bold"
                          value={newStaff.role} 
                          onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                        >
                           {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="w-1/2 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="w-1/2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                        Create
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
