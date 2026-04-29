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

export default function VitalsRecord() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const list = await apiService.getPatients();
        // Specifically look for patients marked as 'pending_vitals' or just any outpatient/inpatient
        setPatients(list);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Vital Signs Recording</h1>
          <p className="text-gray-500 font-medium tracking-tight">Record essential observations for patients before consultation.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Patient Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/patients/${patient.id}?recordVitals=true`)}
            className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black overflow-hidden border border-blue-100 shadow-inner">
                  {patient.photoUrl ? (
                    <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    patient.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{patient.name}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{patient.id}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-200 group-hover:text-blue-500 transition-colors" size={20} />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50/50 p-2 rounded-lg flex items-center gap-2">
                <Thermometer size={14} className="text-orange-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Temp</span>
              </div>
              <div className="bg-gray-50/50 p-2 rounded-lg flex items-center gap-2">
                <Wind size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Resp</span>
              </div>
              <div className="bg-gray-50/50 p-2 rounded-lg flex items-center gap-2">
                <Activity size={14} className="text-red-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">BP/PR</span>
              </div>
              <div className="bg-gray-50/50 p-2 rounded-lg flex items-center gap-2">
                <Droplet size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">SPO2</span>
              </div>
            </div>

            <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-100 group-hover:bg-blue-600 transition-colors">
              Record Measurements
            </button>
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
