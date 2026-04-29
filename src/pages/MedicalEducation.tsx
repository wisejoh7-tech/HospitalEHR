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
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Trainee {
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

export default function MedicalEducation() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    // Mocking trainee data
    setTimeout(() => {
      setTrainees([
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
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-in mt-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Education & Development</h1>
            <p className="text-gray-500 font-medium">Tracking the next generation of clinical experts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl text-sm font-black hover:bg-gray-200 transition-all flex items-center gap-2">
            <FileText size={18} />
            Export Rotations
          </button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2">
            <UserPlus size={18} />
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
          <h3 className="text-4xl font-black text-blue-600 relative z-10">42</h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">+4 New this month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] p-6 text-purple-50 opacity-10 group-hover:scale-110 transition-transform">
             <ClipboardCheck size={120} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Evaluation Average</p>
          <h3 className="text-4xl font-black text-purple-600 relative z-10">4.6<span className="text-lg text-gray-300">/5.0</span></h3>
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
          <h3 className="text-4xl font-black text-orange-600 relative z-10">12</h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">Due within 7 days</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex bg-gray-50 p-1.5 rounded-2xl">
              {['All', 'Resident', 'Intern', 'Medical Student'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
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
                  className="hover:bg-purple-50/20 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black text-lg group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                          {t.name.charAt(4)}
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
                          <span className="text-purple-600">{Math.round((t.completedTasks / t.totalTasks) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full" 
                            style={{ width: `${(t.completedTasks / t.totalTasks) * 100}%` }}
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
                     <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                        <ChevronRight size={20} />
                     </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredTrainees.length === 0 && (
             <div className="py-24 text-center">
                <Users size={48} className="text-gray-100 mx-auto mb-4" />
                <h3 className="text-gray-400 font-black uppercase tracking-widest">No trainees found</h3>
                <p className="text-xs text-gray-300 mt-2">Adjust your filters or search criteria.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
