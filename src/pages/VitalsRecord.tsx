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
        // Specifically look for patients whose workflow status is 'vitals'
        setPatients(list.filter(p => p.workflowStatus === 'vitals'));
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-1">Vital Signs Recording</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-tight">Record essential observations for patients before consultation.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Patient Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 shadow-sm transition-all"
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

            <button className="w-full py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow group-hover:bg-blue-600 transition-colors">
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
