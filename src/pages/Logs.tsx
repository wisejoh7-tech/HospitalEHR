import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  Activity, 
  Clock, 
  User, 
  Shield, 
  Database,
  Users,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Logs() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsData, usersData] = await Promise.all([
        apiService.getLogs(),
        apiService.getUsers()
      ]);
      setLogs(logsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearLogs = async () => {
    if (!profile || profile.role !== 'admin') {
      alert('Only administrators can clear activity logs.');
      return;
    }

    if (!window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingLogs(true);
      setErrorMsg(null);
      await apiService.clearLogs(profile.role);
      setLogs([]);
      setSuccessMsg('Successfully cleared all activity logs.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to clear activity logs.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setClearingLogs(false);
    }
  };

  const handleDeleteUser = async (userToDelete: { id: string; name: string; role?: string }) => {
    if (!profile || profile.role !== 'admin') {
      alert('Only administrators can delete registered staff and admin accounts.');
      return;
    }

    const isSelf = profile.id === userToDelete.id;
    const confirmMessage = isSelf
      ? `WARNING: You are about to delete your own account (${userToDelete.name}). Are you sure you want to proceed?`
      : `Are you sure you want to delete registered ${userToDelete.role ? userToDelete.role.toUpperCase() : 'staff/admin'} "${userToDelete.name}"? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(userToDelete.id);
      setErrorMsg(null);
      await apiService.deleteUser(userToDelete.id, profile.role);
      setSuccessMsg(`Successfully deleted account: ${userToDelete.name}`);

      // Refresh user list and logs
      const [logsData, usersData] = await Promise.all([
        apiService.getLogs(),
        apiService.getUsers()
      ]);
      setLogs(logsData || []);
      setUsers(usersData || []);

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete user account');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(filter.toLowerCase()) ||
    log.userName?.toLowerCase().includes(filter.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(filter.toLowerCase()) ||
    u.role?.toLowerCase().includes(filter.toLowerCase()) ||
    u.phone?.includes(filter) ||
    u.email?.toLowerCase().includes(filter.toLowerCase())
  );

  // Helper to match a log entry to a registered user
  const findRegisteredUserForLog = (log: any) => {
    if (!log) return null;
    return users.find(u =>
      u.id === log.userId ||
      (u.name && log.userName && u.name.trim().toLowerCase() === log.userName.trim().toLowerCase())
    );
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8 animate-in mt-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">System Audit Logs</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-tight">Comprehensive record of administrative actions and staff user management.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
              activeTab === 'logs'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Activity size={15} />
            Activity Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
              activeTab === 'users'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Users size={15} />
            Registered Staff & Admins ({users.length})
          </button>
        </div>
      </header>

      {/* Notifications */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
        >
          <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
        >
          <AlertCircle className="text-red-600 shrink-0" size={18} />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Search and stats bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'logs' ? "Search logs by action, user, or resource..." : "Search registered staff & admins by name or role..."}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'logs' && isAdmin && (
            <button
              onClick={handleClearLogs}
              disabled={clearingLogs || logs.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-2xl text-xs font-black border border-red-200 hover:border-red-600 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-red-50 disabled:hover:text-red-600 border-dashed cursor-pointer"
            >
              <Trash2 size={15} />
              {clearingLogs ? 'Clearing Logs...' : 'Clear Activity Logs'}
            </button>
          )}
          <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
            {activeTab === 'logs' ? `Total Activity Logs: ${filteredLogs.length}` : `Total Registered Users: ${filteredUsers.length}`}
          </div>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource</th>
                  {isAdmin && (
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-8 py-20 text-center text-gray-300 font-bold uppercase tracking-widest animate-pulse">Loading Audit Records...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-8 py-20 text-center text-gray-300 font-bold uppercase tracking-widest">No matching activities found</td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => {
                    const matchedUser = findRegisteredUserForLog(log);
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Clock size={14} className="text-gray-300" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</p>
                              <p className="text-[10px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs">
                              {log.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{log.userName}</p>
                              {matchedUser && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                                  {matchedUser.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-gray-700 leading-snug">{log.action}</p>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          {log.resourceType && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500">
                              <Database size={10} />
                              {log.resourceType}
                            </div>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-8 py-4 whitespace-nowrap text-right">
                            {matchedUser ? (
                              <button
                                onClick={() => handleDeleteUser(matchedUser)}
                                disabled={deletingId === matchedUser.id}
                                title={`Delete user ${matchedUser.name}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                {deletingId === matchedUser.id ? 'Deleting...' : 'Delete User'}
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-gray-300 italic">System / Removed</span>
                            )}
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Registered Staff & Admin User Management View */
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-600" size={22} />
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Registered Staff & Admin Accounts</h3>
                <p className="text-xs text-gray-500 font-medium">As an administrator, you can view and delete registered staff and admin user accounts directly.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full p-12 text-center text-gray-300 font-bold uppercase tracking-widest animate-pulse">
                Loading Registered Accounts...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-400 font-bold text-xs bg-white rounded-3xl border border-gray-100">
                No matching staff or admin accounts found.
              </div>
            ) : (
              filteredUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">{user.name || 'Unnamed'}</h4>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">{user.phone || user.email || 'No contact info'}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                      user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {user.role || 'N/A'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">
                      ID: {user.id ? `${user.id.slice(0, 8)}...` : 'N/A'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingId === user.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-black border border-red-200 hover:border-red-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        {deletingId === user.id ? 'Deleting...' : 'Delete Account'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
