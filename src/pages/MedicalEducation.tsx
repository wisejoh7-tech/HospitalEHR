import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  Calendar, 
  Award,
  Search,
  ChevronRight,
  TrendingUp,
  FileText,
  UserPlus,
  X,
  Plus,
  Edit3,
  CheckCircle2,
  Trash2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export interface Trainee {
  id: string;
  name: string;
  type: 'Resident' | 'Intern' | 'Medical Student';
  level: string; // e.g. Year 1, Year 3, PGY-2
  specialty: string;
  currentRotation: string;
  rotationEndDate: string;
  supervisor: string;
  performanceScore: number;
  completedTasks: number;
  totalTasks: number;
}

const LOCAL_STORAGE_KEY = 'vivo_medical_trainees';

export default function MedicalEducation() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Resident' as Trainee['type'],
    level: 'PGY-1',
    specialty: 'Internal Medicine',
    currentRotation: 'Cardiology',
    rotationEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    supervisor: profile?.name || 'Prof. Medical Supervisor',
    performanceScore: 4.5,
    completedTasks: 10,
    totalTasks: 15
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrainees(parsed);
          setLoading(false);
          return;
        }
      }

      // Default initial trainees
      const initial: Trainee[] = [
        {
          id: 'T-101',
          name: 'Dr. Emily Blunt',
          type: 'Resident',
          level: 'PGY-2',
          specialty: 'Internal Medicine',
          currentRotation: 'Cardiology',
          rotationEndDate: new Date(Date.now() + 864000000).toISOString(),
          supervisor: 'Prof. Adeyemi',
          performanceScore: 4.8,
          completedTasks: 18,
          totalTasks: 20
        },
        {
          id: 'T-102',
          name: 'James Rodriguez',
          type: 'Medical Student',
          level: 'Year 5',
          specialty: 'General Surgery',
          currentRotation: 'Orthopedics',
          rotationEndDate: new Date(Date.now() + 172800000).toISOString(),
          supervisor: 'Dr. Okeke',
          performanceScore: 4.2,
          completedTasks: 8,
          totalTasks: 15
        },
        {
          id: 'T-103',
          name: 'Dr. Fatima Musa',
          type: 'Intern',
          level: 'House Officer',
          specialty: 'Obstetrics & Gynecology',
          currentRotation: 'Pediatrics',
          rotationEndDate: new Date(Date.now() + 432000000).toISOString(),
          supervisor: 'Dr. Bello',
          performanceScore: 4.5,
          completedTasks: 12,
          totalTasks: 12
        }
      ];
      setTrainees(initial);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    } catch (err) {
      console.error('Failed to load trainees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTraineesToStorage = (updatedList: Trainee[]) => {
    setTrainees(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to save trainees:', err);
    }
  };

  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.currentRotation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      type: 'Resident',
      level: 'PGY-1',
      specialty: 'Internal Medicine',
      currentRotation: 'Cardiology',
      rotationEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      supervisor: profile?.name || 'Prof. Medical Supervisor',
      performanceScore: 4.5,
      completedTasks: 10,
      totalTasks: 15
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newTrainee: Trainee = {
      id: `T-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name.trim(),
      type: formData.type,
      level: formData.level.trim() || 'PGY-1',
      specialty: formData.specialty.trim() || 'General Medicine',
      currentRotation: formData.currentRotation.trim() || 'Internal Medicine',
      rotationEndDate: new Date(formData.rotationEndDate).toISOString(),
      supervisor: formData.supervisor.trim() || 'Prof. Supervisor',
      performanceScore: Number(formData.performanceScore) || 4.0,
      completedTasks: Number(formData.completedTasks) || 0,
      totalTasks: Number(formData.totalTasks) || 10
    };

    saveTraineesToStorage([newTrainee, ...trainees]);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee || !formData.name.trim()) return;

    const updated: Trainee = {
      ...selectedTrainee,
      name: formData.name.trim(),
      type: formData.type,
      level: formData.level.trim(),
      specialty: formData.specialty.trim(),
      currentRotation: formData.currentRotation.trim(),
      rotationEndDate: new Date(formData.rotationEndDate).toISOString(),
      supervisor: formData.supervisor.trim(),
      performanceScore: Number(formData.performanceScore),
      completedTasks: Number(formData.completedTasks),
      totalTasks: Number(formData.totalTasks)
    };

    const updatedList = trainees.map(t => t.id === updated.id ? updated : t);
    saveTraineesToStorage(updatedList);
    setSelectedTrainee(updated);
    setIsEditing(false);
  };

  const handleDeleteTrainee = (id: string) => {
    if (window.confirm('Are you sure you want to remove this trainee from education records?')) {
      const updatedList = trainees.filter(t => t.id !== id);
      saveTraineesToStorage(updatedList);
      setSelectedTrainee(null);
      setIsEditing(false);
    }
  };

  const handleOpenDetailModal = (t: Trainee) => {
    setSelectedTrainee(t);
    setIsEditing(false);
    setFormData({
      name: t.name,
      type: t.type,
      level: t.level,
      specialty: t.specialty,
      currentRotation: t.currentRotation,
      rotationEndDate: t.rotationEndDate.split('T')[0],
      supervisor: t.supervisor,
      performanceScore: t.performanceScore,
      completedTasks: t.completedTasks,
      totalTasks: t.totalTasks
    });
  };

  const handleExportCSV = () => {
    if (trainees.length === 0) return;

    const headers = ['Trainee ID', 'Name', 'Type', 'Level', 'Specialty', 'Current Rotation', 'Rotation End Date', 'Supervisor', 'Performance Score', 'Completed Tasks', 'Total Tasks'];
    const rows = trainees.map(t => [
      `"${t.id}"`,
      `"${t.name}"`,
      `"${t.type}"`,
      `"${t.level}"`,
      `"${t.specialty}"`,
      `"${t.currentRotation}"`,
      `"${formatDate(t.rotationEndDate)}"`,
      `"${t.supervisor}"`,
      t.performanceScore,
      t.completedTasks,
      t.totalTasks
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VIVO_Medical_Education_Rotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const residentsCount = trainees.filter(t => t.type === 'Resident').length;
  const avgScore = trainees.length > 0
    ? (trainees.reduce((acc, t) => acc + t.performanceScore, 0) / trainees.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-600 rounded-2xl text-white border border-purple-700 shadow-2xs">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Staff Education & Development</h1>
            <p className="text-gray-500 font-medium text-xs sm:text-sm">Tracking the next generation of clinical experts & residents</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-2xs uppercase tracking-wider cursor-pointer"
          >
            <Download size={16} />
            Export Rotations
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all border border-purple-700 shadow-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <UserPlus size={16} />
            Onboard Trainee
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] p-6 text-blue-50 opacity-10 group-hover:scale-110 transition-transform">
             <GraduationCap size={120} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Active Residents</p>
          <h3 className="text-4xl font-black text-blue-600 relative z-10">{residentsCount}</h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">{trainees.length} Total Enrolled</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] p-6 text-purple-50 opacity-10 group-hover:scale-110 transition-transform">
             <ClipboardCheck size={120} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Evaluation Average</p>
          <h3 className="text-4xl font-black text-purple-600 relative z-10">{avgScore}<span className="text-lg text-gray-300">/5.0</span></h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <TrendingUp size={14} className="text-emerald-500" />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Improvement</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute right-[-10px] top-[-10px] p-6 text-orange-50 opacity-10 group-hover:scale-110 transition-transform">
             <Calendar size={120} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Rotation Endings</p>
          <h3 className="text-4xl font-black text-orange-600 relative z-10">{trainees.length}</h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">Active Rotations</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex bg-gray-50 p-1.5 rounded-2xl overflow-x-auto">
              {['All', 'Resident', 'Intern', 'Medical Student'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap",
                    filterType === type ? "bg-white shadow-sm text-purple-600" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {type}
                </button>
              ))}
           </div>
           
           <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, ID, or supervisor..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trainee Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Placement & Specialty</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rotation Progress</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Performance</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTrainees.map((t, i) => (
                <motion.tr 
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-purple-50/20 transition-colors group cursor-pointer"
                  onClick={() => handleOpenDetailModal(t)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black text-lg group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                          {t.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-gray-900 leading-none mb-1 text-sm">{t.name}</p>
                          <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{t.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                       <p className="text-xs font-black text-gray-700">{t.type} • {t.level}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{t.specialty}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2 max-w-[200px]">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                          <span className="text-gray-400">Rotation: {t.currentRotation}</span>
                          <span className="text-purple-600">{Math.round((t.completedTasks / (t.totalTasks || 1)) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full" 
                            style={{ width: `${Math.min(100, (t.completedTasks / (t.totalTasks || 1)) * 100)}%` }}
                          />
                       </div>
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Until {formatDate(t.rotationEndDate)}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div>
                       <div className="flex items-center justify-end gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Award key={star} size={12} className={cn(star <= Math.floor(t.performanceScore) ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                          ))}
                       </div>
                       <p className="text-xs font-black text-gray-900">{t.performanceScore} / 5.0</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleOpenDetailModal(t);
                       }}
                       className="p-2 text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={20} />
                     </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredTrainees.length === 0 && (
             <div className="py-24 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 font-black uppercase tracking-widest">No trainees found</h3>
                <p className="text-xs text-gray-400 mt-2">Adjust your filters or onboard a new trainee using the button above.</p>
             </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Onboard Trainee Form */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <UserPlus size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Onboard New Trainee</h2>
                    <p className="text-xs text-gray-500 font-medium">Register resident doctor, intern, or medical student</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Trainee Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Alexander Hamilton"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Trainee Category *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Trainee['type'] })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="Resident">Resident</option>
                      <option value="Intern">Intern</option>
                      <option value="Medical Student">Medical Student</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Level / Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      placeholder="e.g. PGY-2, House Officer, Year 5"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Specialty
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="e.g. Internal Medicine, Pediatrics"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Current Rotation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.currentRotation}
                      onChange={(e) => setFormData({ ...formData, currentRotation: e.target.value })}
                      placeholder="e.g. Cardiology, Orthopedics"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Assigned Supervisor
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      placeholder="e.g. Prof. Adeyemi"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Rotation End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.rotationEndDate}
                      onChange={(e) => setFormData({ ...formData, rotationEndDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Onboard Trainee
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: View & Update Trainee Progress */}
      <AnimatePresence>
        {selectedTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {selectedTrainee.id} • {selectedTrainee.type}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900">{selectedTrainee.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">Specialty: {selectedTrainee.specialty} | Supervisor: {selectedTrainee.supervisor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-full cursor-pointer transition-colors"
                    title="Edit Trainee Details"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTrainee(selectedTrainee.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full cursor-pointer transition-colors"
                    title="Remove Trainee"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => { setSelectedTrainee(null); setIsEditing(false); }}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4 bg-purple-50/40 p-6 rounded-2xl border border-purple-100">
                  <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                    <Edit3 size={16} /> Update Trainee Evaluation & Progress
                  </h3>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Level</label>
                      <input
                        type="text"
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Rotation</label>
                      <input
                        type="text"
                        required
                        value={formData.currentRotation}
                        onChange={(e) => setFormData({ ...formData, currentRotation: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Performance Score (0 - 5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        required
                        value={formData.performanceScore}
                        onChange={(e) => setFormData({ ...formData, performanceScore: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Completed Tasks</label>
                      <input
                        type="number"
                        required
                        value={formData.completedTasks}
                        onChange={(e) => setFormData({ ...formData, completedTasks: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Assigned Tasks</label>
                      <input
                        type="number"
                        required
                        value={formData.totalTasks}
                        onChange={(e) => setFormData({ ...formData, totalTasks: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 transition-all cursor-pointer shadow-md"
                    >
                      Save Evaluation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Rotation</p>
                      <p className="text-sm font-black text-purple-950 mt-1">{selectedTrainee.currentRotation}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Performance</p>
                      <p className="text-sm font-black text-blue-950 mt-1">{selectedTrainee.performanceScore} / 5.0</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Task Completion</p>
                      <p className="text-sm font-black text-emerald-950 mt-1">{selectedTrainee.completedTasks} / {selectedTrainee.totalTasks} ({Math.round((selectedTrainee.completedTasks / (selectedTrainee.totalTasks || 1)) * 100)}%)</p>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisor Details</p>
                    <p className="text-xs font-bold text-gray-800">Current Supervisor: {selectedTrainee.supervisor}</p>
                    <p className="text-xs font-bold text-gray-800">Rotation End Date: {formatDate(selectedTrainee.rotationEndDate)}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 transition-all cursor-pointer shadow-md"
                    >
                      Update Evaluation
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
