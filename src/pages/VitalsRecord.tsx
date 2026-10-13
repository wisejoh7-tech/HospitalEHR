import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Patient } from '../types';
import { 
  Activity, 
  Search, 
  ChevronRight,
  TrendingUp,
  Thermometer,
  Wind,
  Droplet,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function VitalsRecord() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const list = await apiService.getPatients();
        // Specifically look for patients whose workflow status is 'vitals' or 'treatment'
        setPatients(list.filter(p => p.workflowStatus === 'vitals' || p.workflowStatus === 'treatment'));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Department Banner & Nurse Specialist Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-emerald-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800"
              alt="Nursing Care Specialist"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Nursing Care Unit
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Activity size={12} /> Nursing & Clinical Observation Desk
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Nurses' Clinical Station & Vitals</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Managed by Nurse Officer In-Charge • Pre-consultation Triage & Patient Vital Signs Monitoring
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Nursing Queue Active: <strong className="text-emerald-700 font-black">{filtered.length} Patients</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 mb-0.5">Vitals Queue</h2>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Select a patient to measure temperature, blood pressure, pulse, respiration, and oxygen saturation.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Patient Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 shadow-sm transition-all font-bold"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filtered.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/patients/${patient.id}?recordVitals=true`)}
            className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black overflow-hidden border border-blue-100 shadow-inner shrink-0">
                  {patient.photoUrl ? (
                    <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    patient.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-gray-900 leading-tight">{patient.name}</h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{patient.id}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-200 group-hover:text-blue-500 transition-colors" size={18} />
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="bg-gray-50/50 p-1.5 sm:p-2 rounded-lg flex items-center gap-1.5">
                <Thermometer size={12} className="text-orange-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">Temp</span>
              </div>
              <div className="bg-gray-50/50 p-1.5 sm:p-2 rounded-lg flex items-center gap-1.5">
                <Wind size={12} className="text-blue-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">Resp</span>
              </div>
              <div className="bg-gray-50/50 p-1.5 sm:p-2 rounded-lg flex items-center gap-1.5">
                <Activity size={12} className="text-red-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">BP/PR</span>
              </div>
              <div className="bg-gray-50/50 p-1.5 sm:p-2 rounded-lg flex items-center gap-1.5">
                <Droplet size={12} className="text-indigo-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">SPO2</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/patients/${patient.id}?recordVitals=true`);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow hover:bg-gray-800 transition-colors"
              >
                Record Vitals
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await apiService.updatePatientWorkflowStatus(patient.id, 'consultation', profile?.role);
                    setPatients(prev => prev.filter(p => p.id !== patient.id));
                  } catch (err: any) {
                    alert(err?.message || "Failed to send patient to doctor");
                  }
                }}
                className="flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow hover:bg-blue-700 transition-colors"
              >
                Send to Doctor
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
              <Activity size={40} />
            </div>
            <h3 className="font-bold text-gray-900">No Pending Vitals</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Either all patients are cleared or no one matches your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
