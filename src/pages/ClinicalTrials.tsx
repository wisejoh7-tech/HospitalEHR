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
  Globe,
  X,
  Stethoscope,
  Activity,
  Microscope,
  Pill,
  HeartPulse,
  Eye,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export interface Trial {
  id: string;
  title: string;
  phase: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Suspended';
  principalInvestigator: string;
  enrollmentCount: number;
  targetEnrollment: number;
  startDate: string;
  therapeuticArea: string;
  targetDisease: string;
  investigatedDrugs: string[];
  sideEffects: string[];
  personnel: {
    doctors: string[];
    nurses: string[];
    scientists: string[];
    pharmacists: string[];
    physiotherapists: string[];
  };
}

export default function ClinicalTrials() {
  const { profile } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    phase: 'Phase III',
    status: 'Recruiting' as Trial['status'],
    principalInvestigator: '',
    targetEnrollment: 100,
    startDate: new Date().toISOString().split('T')[0],
    therapeuticArea: 'Cardiovascular',
    targetDisease: '',
    investigatedDrugs: '',
    sideEffects: '',
    doctors: '',
    nurses: '',
    scientists: '',
    pharmacists: '',
    physiotherapists: ''
  });

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
          therapeuticArea: 'Cardiovascular',
          targetDisease: 'Ischemic Stroke & Type 2 Diabetes Mellitus',
          investigatedDrugs: ['Empagliflozin-X', 'Dapagliflozin Modified Release'],
          sideEffects: ['Mild Hypoglycemia', 'Transient Orthostatic Hypotension', 'Urinary Tract Infection'],
          personnel: {
            doctors: ['Prof. Adeyinka Johnson', 'Dr. Folake Davies'],
            nurses: ['RN Nurse Grace Amadi', 'RN Nurse Chukwudi Eze'],
            scientists: ['Dr. Amina Abubakar (Lead Bio-Researcher)', 'Dr. Kenji Sato'],
            pharmacists: ['Pharm. Samuel Okon', 'Pharm. Blessing Idowu'],
            physiotherapists: ['PT David Olatunji', 'PT Joy Nwachukwu']
          }
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
          therapeuticArea: 'Oncology',
          targetDisease: 'Triple-Negative Breast Carcinoma',
          investigatedDrugs: ['Pembrolizumab Targeted Cohort', 'Poly (ADP-ribose) Polymerase Inhibitors'],
          sideEffects: ['Fatigue', 'Mild Peripheral Neuropathy', 'Nausea'],
          personnel: {
            doctors: ['Dr. Chidinma Okafor', 'Dr. Ibrahim Bello'],
            nurses: ['RN Nurse Miriam Bassey'],
            scientists: ['Dr. Temitope Alabi (Genomics Expert)', 'Dr. Sarah Jenkins'],
            pharmacists: ['Pharm. Kemi Adebayo'],
            physiotherapists: ['PT Emmanuel Vance']
          }
        },
        {
          id: 'CT-2025-012',
          title: 'AI-Assisted Retinal Screening and Neuro-rehabilitation for Early Detection of Diabetic Retinopathy',
          phase: 'Pilot',
          status: 'Completed',
          principalInvestigator: 'Dr. Segun Bello',
          enrollmentCount: 50,
          targetEnrollment: 50,
          startDate: '2025-06-10',
          therapeuticArea: 'Ophthalmology',
          targetDisease: 'Diabetic Retinopathy & Ocular Neuropathy',
          investigatedDrugs: ['Ranibizumab Intravitreal Injections', 'Alpha-Lipoic Acid Supplementation'],
          sideEffects: ['Transient Ocular Irritation', 'Mild Headache'],
          personnel: {
            doctors: ['Dr. Segun Bello', 'Dr. Anita Roy'],
            nurses: ['RN Nurse Halima Yusuf'],
            scientists: ['Dr. Marcus Vance (AI & Bio-imaging Scientist)'],
            pharmacists: ['Pharm. Victor Danladi'],
            physiotherapists: ['PT Sandra Enahoro (Vestibular & Neuro-Physiotherapist)']
          }
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredTrials = trials.filter(trial => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      trial.title.toLowerCase().includes(q) ||
      trial.id.toLowerCase().includes(q) ||
      trial.targetDisease.toLowerCase().includes(q) ||
      trial.therapeuticArea.toLowerCase().includes(q) ||
      trial.principalInvestigator.toLowerCase().includes(q) ||
      trial.investigatedDrugs.some(d => d.toLowerCase().includes(q)) ||
      trial.sideEffects.some(s => s.toLowerCase().includes(q)) ||
      trial.personnel.doctors.some(p => p.toLowerCase().includes(q)) ||
      trial.personnel.nurses.some(p => p.toLowerCase().includes(q)) ||
      trial.personnel.scientists.some(p => p.toLowerCase().includes(q)) ||
      trial.personnel.pharmacists.some(p => p.toLowerCase().includes(q)) ||
      trial.personnel.physiotherapists.some(p => p.toLowerCase().includes(q))
    );
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parseList = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

    const newTrial: Trial = {
      id: `CT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: formData.title,
      phase: formData.phase,
      status: formData.status,
      principalInvestigator: formData.principalInvestigator,
      enrollmentCount: 0,
      targetEnrollment: Number(formData.targetEnrollment),
      startDate: formData.startDate,
      therapeuticArea: formData.therapeuticArea,
      targetDisease: formData.targetDisease,
      investigatedDrugs: parseList(formData.investigatedDrugs),
      sideEffects: parseList(formData.sideEffects),
      personnel: {
        doctors: parseList(formData.doctors),
        nurses: parseList(formData.nurses),
        scientists: parseList(formData.scientists),
        pharmacists: parseList(formData.pharmacists),
        physiotherapists: parseList(formData.physiotherapists)
      }
    };

    setTrials([newTrial, ...trials]);
    setIsRegisterModalOpen(false);

    // Reset form
    setFormData({
      title: '',
      phase: 'Phase III',
      status: 'Recruiting',
      principalInvestigator: '',
      targetEnrollment: 100,
      startDate: new Date().toISOString().split('T')[0],
      therapeuticArea: 'Cardiovascular',
      targetDisease: '',
      investigatedDrugs: '',
      sideEffects: '',
      doctors: '',
      nurses: '',
      scientists: '',
      pharmacists: '',
      physiotherapists: ''
    });
  };

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <FlaskConical size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Research & Findings</h1>
            <p className="text-gray-500 font-medium">Managing ethical medical breakthroughs, findings & multi-disciplinary personnel at VIVO</p>
          </div>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-black transition-all shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          Register New Protocol & Findings
        </button>
      </header>

      {/* Research Dashboard Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-xs">
           <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl w-fit mb-3">
              <ClipboardList size={22} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Protocols</p>
           <h3 className="text-xl sm:text-2xl font-black text-gray-900">{trials.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-xs">
           <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl w-fit mb-3">
              <Users size={22} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Enrolled</p>
           <h3 className="text-xl sm:text-2xl font-black text-gray-900">
             {trials.reduce((acc, t) => acc + t.enrollmentCount, 0)}
           </h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-xs">
           <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl w-fit mb-3">
              <Globe size={22} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Partnerships</p>
           <h3 className="text-xl sm:text-2xl font-black text-gray-900">8</h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-xs">
           <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl w-fit mb-3">
              <CheckCircle2 size={22} />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IRB Certifications</p>
           <h3 className="text-xl sm:text-2xl font-black text-gray-900">100%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Research Pipeline & Multi-disciplinary Findings</h3>
           <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search disease, drug, side effects, doctor, nurse, scientist, pharmacist, PT..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
           </div>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse">Loading research findings & personnel data...</div>
        ) : filteredTrials.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-500 font-medium text-sm">
            No research protocols or findings match your search filter "{searchQuery}".
          </div>
        ) : (
          filteredTrials.map((trial, i) => (
            <motion.div
              key={trial.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 shadow-xs hover:border-emerald-300 transition-all group flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                     trial.status === 'Recruiting' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                     trial.status === 'Active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                     trial.status === 'Completed' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                     "bg-red-50 text-red-600 border border-red-100"
                   )}>
                      {trial.status}
                   </span>
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-lg">
                      {trial.phase}
                   </span>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      ID: {trial.id}
                   </span>
                </div>

                <h2 className="text-xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
                  {trial.title}
                </h2>

                {/* Disease, Drugs & Side Effects Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Disease</span>
                    <p className="font-black text-slate-800">{trial.targetDisease}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Investigated Drugs</span>
                    <div className="flex flex-wrap gap-1">
                      {trial.investigatedDrugs.map((drug, dIdx) => (
                        <span key={dIdx} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {drug}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Observed Side Effects</span>
                    <div className="flex flex-wrap gap-1">
                      {trial.sideEffects.map((effect, sIdx) => (
                        <span key={sIdx} className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Personnel Overview Badges */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Research Personnel Involved</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl font-medium">
                      <Stethoscope size={14} className="text-indigo-600" />
                      <strong className="font-black">Doctors:</strong> {trial.personnel.doctors.join(', ') || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1 rounded-xl font-medium">
                      <Activity size={14} className="text-rose-600" />
                      <strong className="font-black">Nurses:</strong> {trial.personnel.nurses.join(', ') || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-xl font-medium">
                      <Microscope size={14} className="text-teal-600" />
                      <strong className="font-black">Scientists:</strong> {trial.personnel.scientists.join(', ') || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-xl font-medium">
                      <Pill size={14} className="text-blue-600" />
                      <strong className="font-black">Pharmacists:</strong> {trial.personnel.pharmacists.join(', ') || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 rounded-xl font-medium">
                      <HeartPulse size={14} className="text-amber-600" />
                      <strong className="font-black">Physiotherapists:</strong> {trial.personnel.physiotherapists.join(', ') || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-1 text-xs">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Principal Investigator</p>
                      <p className="font-bold text-gray-800">{trial.principalInvestigator}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Therapeutic Area</p>
                      <p className="font-bold text-gray-800">{trial.therapeuticArea}</p>
                   </div>
                </div>
              </div>

              <div className="w-full lg:w-72 space-y-6 pt-6 lg:pt-0 lg:border-l border-gray-100 lg:pl-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment Progress</p>
                     <p className="text-xs font-black text-emerald-600">{trial.enrollmentCount} / {trial.targetEnrollment}</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-600 rounded-full transition-all duration-1000" 
                       style={{ width: `${Math.min(100, (trial.enrollmentCount / trial.targetEnrollment) * 100)}%` }}
                     />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <button
                     onClick={() => setSelectedTrial(trial)}
                     className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                   >
                      <Eye size={16} /> View Research Findings
                   </button>
                   <button className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer">
                      Protocol Access <Lock size={12} />
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

      {/* Modal: View Detailed Protocol Findings & All Personnel */}
      <AnimatePresence>
        {selectedTrial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {selectedTrial.id} • {selectedTrial.phase}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900">{selectedTrial.title}</h2>
                  <p className="text-xs text-gray-500 font-medium">Therapeutic Area: {selectedTrial.therapeuticArea} | PI: {selectedTrial.principalInvestigator}</p>
                </div>
                <button
                  onClick={() => setSelectedTrial(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Disease & Findings Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" /> Target Disease, Investigated Drugs & Side Effects
                </h3>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Target Disease / Condition</p>
                    <p className="text-sm font-black text-slate-900">{selectedTrial.targetDisease}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Investigated Drugs</p>
                      <ul className="space-y-1">
                        {selectedTrial.investigatedDrugs.map((drug, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <Pill size={14} className="text-emerald-600" />
                            {drug}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Observed Side Effects</p>
                      <ul className="space-y-1">
                        {selectedTrial.sideEffects.map((effect, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                            <AlertTriangle size={14} className="text-amber-600" />
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Personnel Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" /> Multidisciplinary Clinical Research Team
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doctors */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider mb-2">
                      <Stethoscope size={16} className="text-indigo-600" /> Doctors
                    </div>
                    <div className="space-y-1 text-xs font-medium text-slate-700">
                      {selectedTrial.personnel.doctors.length > 0 ? (
                        selectedTrial.personnel.doctors.map((doc, idx) => (
                          <p key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 font-bold">{doc}</p>
                        ))
                      ) : <p className="text-gray-400 italic">None assigned</p>}
                    </div>
                  </div>

                  {/* Nurses */}
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wider mb-2">
                      <Activity size={16} className="text-rose-600" /> Nurses
                    </div>
                    <div className="space-y-1 text-xs font-medium text-slate-700">
                      {selectedTrial.personnel.nurses.length > 0 ? (
                        selectedTrial.personnel.nurses.map((nurse, idx) => (
                          <p key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-rose-100 font-bold">{nurse}</p>
                        ))
                      ) : <p className="text-gray-400 italic">None assigned</p>}
                    </div>
                  </div>

                  {/* Scientists */}
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                    <div className="flex items-center gap-2 text-teal-900 font-black text-xs uppercase tracking-wider mb-2">
                      <Microscope size={16} className="text-teal-600" /> Research Scientists
                    </div>
                    <div className="space-y-1 text-xs font-medium text-slate-700">
                      {selectedTrial.personnel.scientists.length > 0 ? (
                        selectedTrial.personnel.scientists.map((sci, idx) => (
                          <p key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-teal-100 font-bold">{sci}</p>
                        ))
                      ) : <p className="text-gray-400 italic">None assigned</p>}
                    </div>
                  </div>

                  {/* Pharmacists */}
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wider mb-2">
                      <Pill size={16} className="text-blue-600" /> Pharmacists
                    </div>
                    <div className="space-y-1 text-xs font-medium text-slate-700">
                      {selectedTrial.personnel.pharmacists.length > 0 ? (
                        selectedTrial.personnel.pharmacists.map((pharm, idx) => (
                          <p key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 font-bold">{pharm}</p>
                        ))
                      ) : <p className="text-gray-400 italic">None assigned</p>}
                    </div>
                  </div>

                  {/* Physiotherapists */}
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 md:col-span-2">
                    <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider mb-2">
                      <HeartPulse size={16} className="text-amber-600" /> Physiotherapists
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                      {selectedTrial.personnel.physiotherapists.length > 0 ? (
                        selectedTrial.personnel.physiotherapists.map((pt, idx) => (
                          <p key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-amber-100 font-bold">{pt}</p>
                        ))
                      ) : <p className="text-gray-400 italic">None assigned</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedTrial(null)}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                >
                  Close Findings View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Register New Research Protocol & Findings */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Register New Clinical Research & Findings</h2>
                  <p className="text-xs text-gray-500 font-medium">Capture disease details, drugs, side effects, and all involved clinical personnel</p>
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {/* Basic Protocol Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-1">
                    1. Protocol Overview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Research Protocol Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Clinical Trial of Novel Monoclonal Antibody for Systemic Lupus"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Therapeutic Area
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.therapeuticArea}
                        onChange={(e) => setFormData({ ...formData, therapeuticArea: e.target.value })}
                        placeholder="e.g. Oncology, Cardiology, Neurology"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Principal Investigator *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.principalInvestigator}
                        onChange={(e) => setFormData({ ...formData, principalInvestigator: e.target.value })}
                        placeholder="e.g. Prof. Jane Doe"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Phase
                      </label>
                      <select
                        value={formData.phase}
                        onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Pilot">Pilot</option>
                        <option value="Phase I">Phase I</option>
                        <option value="Phase II">Phase II</option>
                        <option value="Phase III">Phase III</option>
                        <option value="Observational">Observational</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Trial['status'] })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Recruiting">Recruiting</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Target Enrollment Count
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.targetEnrollment}
                        onChange={(e) => setFormData({ ...formData, targetEnrollment: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Disease & Findings Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-1">
                    2. Research Findings (Disease, Drugs & Side Effects)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Target Disease / Condition *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.targetDisease}
                        onChange={(e) => setFormData({ ...formData, targetDisease: e.target.value })}
                        placeholder="e.g. Type 2 Diabetes Mellitus with Chronic Kidney Disease"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Investigated Drugs / Treatments (Comma separated) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.investigatedDrugs}
                        onChange={(e) => setFormData({ ...formData, investigatedDrugs: e.target.value })}
                        placeholder="e.g. Metformin Extended Release, Sitagliptin, SGLT2 Inhibitor"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Observed Side Effects / Adverse Reactions (Comma separated) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sideEffects}
                        onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                        placeholder="e.g. Gastrointestinal discomfort, Mild Dizziness, Rash"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Research Personnel Inputs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-1">
                    3. Research Personnel (Names separated by commas)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <Stethoscope size={12} className="text-indigo-600" /> Doctors *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.doctors}
                        onChange={(e) => setFormData({ ...formData, doctors: e.target.value })}
                        placeholder="e.g. Dr. John Smith, Prof. Sarah Connor"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <Activity size={12} className="text-rose-600" /> Nurses *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nurses}
                        onChange={(e) => setFormData({ ...formData, nurses: e.target.value })}
                        placeholder="e.g. RN Mary Johnson, RN David Vance"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <Microscope size={12} className="text-teal-600" /> Scientists *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.scientists}
                        onChange={(e) => setFormData({ ...formData, scientists: e.target.value })}
                        placeholder="e.g. Dr. Robert Lang, Dr. Emily Watson"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <Pill size={12} className="text-blue-600" /> Pharmacists *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pharmacists}
                        onChange={(e) => setFormData({ ...formData, pharmacists: e.target.value })}
                        placeholder="e.g. Pharm. Lisa Wong, Pharm. Alex Rivera"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <HeartPulse size={12} className="text-amber-600" /> Physiotherapists *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.physiotherapists}
                        onChange={(e) => setFormData({ ...formData, physiotherapists: e.target.value })}
                        placeholder="e.g. PT Mark Taylor, PT Angela Merkel"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                  >
                    Save Research Protocol & Findings
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
