import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  Search, 
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Clock,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface TeachingCase {
  id: string;
  title: string;
  specialty: string;
  summary: string;
  presenter: string;
  presenterRole: string;
  date: string;
  status: 'published' | 'draft' | 'archived';
  discussionCount: number;
  tags: string[];
}

export default function AcademicRounds() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<TeachingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Mocking API call for Teaching Cases
    setTimeout(() => {
      setCases([
        {
          id: 'case-1',
          title: 'Unusual Presentation of Stage IV Hodgkin Lymphoma',
          specialty: 'Oncology',
          summary: 'A 24-year-old male presented with persistent back pain and weight loss. Initial imaging showed skeletal lesions but normal lymph node sizes...',
          presenter: 'Dr. Sarah Johnson',
          presenterRole: 'Senior Registrar',
          date: new Date().toISOString(),
          status: 'published',
          discussionCount: 12,
          tags: ['Hematology', 'Oncology', 'Diagnostic Challenge']
        },
        {
          id: 'case-2',
          title: 'Management of Refractory Status Epilepticus in Pediatrics',
          specialty: 'Pediatrics',
          summary: 'Case study of a 5-year-old female with long-standing epilepsy presenting with seizures lasting over 45 minutes despite standard protocols...',
          presenter: 'Prof. Michael Chen',
          presenterRole: 'Chief of Pediatrics',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'published',
          discussionCount: 8,
          tags: ['Neurology', 'Critical Care', 'Pediatrics']
        },
        {
          id: 'case-3',
          title: 'Surgical Management of Complex Tetralogy of Fallot',
          specialty: 'Cardiology',
          summary: 'Detailed review of surgical interventions and post-operative care in a neonate with significant pulmonary atresia...',
          presenter: 'Dr. James Wilson',
          presenterRole: 'Cardiac Surgeon',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'published',
          discussionCount: 15,
          tags: ['Surgery', 'Cardiology', 'Neonatal']
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const specialties = ['All', 'Oncology', 'Pediatrics', 'Cardiology', 'Neurology', 'Internal Medicine', 'Surgery'];

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = activeSpecialty === 'All' || c.specialty === activeSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Rounds</h1>
            <p className="text-gray-500 font-medium">VIVO Knowledge Hub & Clinical Case Repository</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Submit Teaching Case
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-tighter">Total Cases</p>
            <h3 className="text-2xl font-black text-gray-900">142</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><MessageSquare size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-tighter">Active Discussions</p>
            <h3 className="text-2xl font-black text-gray-900">28</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><TrendingUp size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-tighter">Engagement Rate</p>
            <h3 className="text-2xl font-black text-gray-900">86%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Award size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-tighter">CME Credits Awarded</p>
            <h3 className="text-2xl font-black text-gray-900">1,240</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} /> Filters
            </h3>
            <div className="space-y-2">
              {specialties.map(specialty => (
                <button
                  key={specialty}
                  onClick={() => setActiveSpecialty(specialty)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all transition-colors",
                    activeSpecialty === specialty 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-900 text-white p-6 rounded-[2rem] shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <GraduationCap size={120} />
            </div>
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-2 leading-tight">VIVO CME Program</h4>
              <p className="text-blue-200 text-xs font-medium mb-4">Complete module quizzes and discussions to earn Continuing Medical Education credits.</p>
              <button className="w-full py-2.5 bg-white text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest">Enroll Now</button>
            </div>
          </div>
        </aside>

        {/* Case Feed */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search across 142 teaching cases, grand rounds, and academic papers..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredCases.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col md:flex-row gap-8"
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                        {c.specialty}
                      </span>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {formatDate(c.date)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {c.title}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-2 italic">
                      "{c.summary}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {c.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 flex flex-col justify-between border-l border-gray-50 pl-0 md:pl-8 pt-6 md:pt-0">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Presented By</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {c.presenter.charAt(4)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{c.presenter}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{c.presenterRole}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MessageSquare size={16} />
                        <span className="text-xs font-black">{c.discussionCount}</span>
                      </div>
                      <button className="flex-1 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white text-gray-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredCases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                   <BookOpen size={48} className="text-gray-200 mb-4" />
                   <h3 className="font-bold text-gray-400 uppercase tracking-widest">No matching cases found</h3>
                   <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search keywords.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
