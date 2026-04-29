import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  Activity, 
  Clock, 
  User, 
  Shield, 
  Database,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiService.getLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.userName.toLowerCase().includes(filter.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in mt-20">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Audit Logs</h1>
        <p className="text-gray-500 font-medium tracking-tight">Comprehensive record of all administrative and clinical actions.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs by action or user..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          Total Logs: {filteredLogs.length}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold uppercase tracking-widest animate-pulse">Loading Audit Records...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold uppercase tracking-widest">No matching activities found</td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
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
                          {log.userName.charAt(0)}
                        </div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{log.userName}</p>
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
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
