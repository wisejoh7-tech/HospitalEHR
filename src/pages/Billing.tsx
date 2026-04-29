import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Patient, Bill } from '../types';
import { 
  ClipboardCheck, 
  Search, 
  User, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';

export default function Billing() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const list = await apiService.getPatients();
        // For each patient, we'll need to fetch their bills to show status
        // But for efficiency, we might want a dedicated GET /api/bills route
        // Let's just fetch all patients and then fetch details for the selected one,
        // or add a new endpoint. For now, I'll fetch patients and filter.
        setPatients(list);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 h-full flex flex-col">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Revenue Management</h1>
          <p className="text-gray-400 font-bold text-sm tracking-tight">Track billing, invoices and payments</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search patient or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl w-80 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Invoices</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      {p.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{p.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.id} • {p.gender.toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                    p.status === 'discharged' ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"
                  )}>
                    {p.status === 'discharged' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {p.status}
                  </span>
                </td>
                <td className="p-6 text-sm font-bold text-gray-500">
                  {formatDate(p.admissionDate)}
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => navigate(`/patients/${p.id}?tab=billing`)}
                    className="p-3 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <ArrowRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center text-gray-300 font-bold">
                  No patients found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
