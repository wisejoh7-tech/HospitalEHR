import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  ChevronRight, 
  Beaker, 
  ClipboardList, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Trial {
  id: string;
  title: string;
  phase: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Suspended';
  principalInvestigator: string;
  enrollmentCount: number;
  targetEnrollment: number;
  startDate: string;
  therapeuticArea: string;
}

export default function ClinicalTrials() {
  const { profile } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock research data
    setTimeout(() => {
      setTrials([
        {
          id: 'CT-2026-001',
          title: 'Efficacy of Novel SGLT2 Inhibitor in Post-Ischemic Stroke Patients',
          phase: 'Phase III',
          status: 'Recruiting',
          principalInvestigator: 'Prof. Adeyinka Johnson',
          enrollmentCount: 45,
          targetEnrollment: 120,
          startDate: '2026-01-15',
          therapeuticArea: 'Cardiovascular'
        },
        {
          id: 'CT-2026-005',
          title: 'Genomic Profiling of Triple-Negative Breast Cancer in West African Populations',
          phase: 'Observational',
          status: 'Active',
          principalInvestigator: 'Dr. Chidinma Okafor',
          enrollmentCount: 88,
          targetEnrollment: 200,
          startDate: '2025-11-20',
          therapeuticArea: 'Oncology'
        },
        {
          id: 'CT-2025-012',
          title: 'AI-Assisted Retinal Screening for Early Detection of Diabetic Retinopathy',
          phase: 'Pilot',
          status: 'Completed',
          principalInvestigator: 'Dr. Segun Bello',
          enrollmentCount: 50,
          targetEnrollment: 50,
          startDate: '2025-06-10',
          therapeuticArea: 'Ophthalmology'
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-8 animate-in mt-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <FlaskConical size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Research & Trials</h1>
            <p className="text-gray-500 font-medium">Managing ethical medical breakthroughs at VIVO</p>
          </div>
        </div>
        <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-black transition-all shadow-lg flex items-center gap-2">
          <Plus size={18} />
          Register New Protocol
        </button>
      </header>

      {/* Research Dashboard Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
              <ClipboardList size={24} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Protocols</p>
           <h3 className="text-2xl font-black text-gray-900">24</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
              <Users size={24} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Enrolled</p>
           <h3 className="text-2xl font-black text-gray-900">842</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
              <Globe size={24} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Partnerships</p>
           <h3 className="text-2xl font-black text-gray-900">8</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
              <CheckCircle2 size={24} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IRB Certifications</p>
           <h3 className="text-2xl font-black text-gray-900">100%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Trials Pipeline</h3>
           <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search research registry..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-100 outline-none"
              />
           </div>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse">Loading protocols...</div>
        ) : (
          trials.map((trial, i) => (
            <motion.div
              key={trial.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                     trial.status === 'Recruiting' ? "bg-blue-50 text-blue-600" :
                     trial.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                     trial.status === 'Completed' ? "bg-purple-50 text-purple-600" :
                     "bg-red-50 text-red-600"
                   )}>
                      {trial.status}
                   </span>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                      {trial.phase}
                   </span>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      ID: {trial.id}
                   </span>
                </div>
                <h2 className="text-xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
                  {trial.title}
                </h2>
                <div className="flex flex-wrap gap-6 pt-2">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Principal Investigator</p>
                      <p className="text-sm font-bold text-gray-700">{trial.principalInvestigator}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Therapeutic Area</p>
                      <p className="text-sm font-bold text-gray-700">{trial.therapeuticArea}</p>
                   </div>
                </div>
              </div>

              <div className="w-full md:w-72 space-y-6 pt-6 md:pt-0 md:border-l border-gray-50 md:pl-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment Progress</p>
                     <p className="text-xs font-black text-emerald-600">{trial.enrollmentCount} / {trial.targetEnrollment}</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-600 rounded-full transition-all duration-1000" 
                       style={{ width: `${(trial.enrollmentCount / trial.targetEnrollment) * 100}%` }}
                     />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95">
                      Protocol Access <Lock size={12} />
                   </button>
                   <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100">
                      <Beaker size={18} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-center gap-6">
         <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <AlertTriangle size={24} />
         </div>
         <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Ethics Compliance Alert</h4>
            <p className="text-xs font-medium text-amber-700">3 protocols are due for annual IRB review in the next 15 days. Please ensure all safety documents are updated.</p>
         </div>
      </div>
    </div>
  );
}
