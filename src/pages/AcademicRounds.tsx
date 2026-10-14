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
  Filter,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Tag,
  Send,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export interface TeachingCase {
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
  isVerifiedByDoctor?: boolean;
  verifiedByDoctorName?: string;
  discussions?: { id: string; author: string; role: string; text: string; date: string }[];
}

const LOCAL_STORAGE_KEY = 'vivo_academic_teaching_cases';

export default function AcademicRounds() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<TeachingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TeachingCase | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newDiscussionText, setNewDiscussionText] = useState('');

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    title: '',
    specialty: 'Internal Medicine',
    summary: '',
    presenter: profile?.name || 'Dr. Physical Doctor',
    presenterRole: 'Attending Physician',
    status: 'published' as TeachingCase['status'],
    tags: ''
  });

  // Load cases from local storage or set empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCases(parsed);
        }
      } else {
        setCases([]);
      }
    } catch (err) {
      console.error('Failed to load teaching cases:', err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update localStorage when cases change
  const saveCasesToStorage = (updatedCases: TeachingCase[]) => {
    setCases(updatedCases);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCases));
    } catch (err) {
      console.error('Failed to save teaching cases:', err);
    }
  };

  const specialties = ['All', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Cardiology', 'Oncology', 'Neurology'];

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.presenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialty = activeSpecialty === 'All' || c.specialty === activeSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      specialty: activeSpecialty === 'All' ? 'Internal Medicine' : activeSpecialty,
      summary: '',
      presenter: profile?.name || 'Dr. Physical Doctor',
      presenterRole: 'Attending Physician',
      status: 'published',
      tags: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) return;

    const parsedTags = formData.tags
      ? formData.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
      : [formData.specialty];

    const newCase: TeachingCase = {
      id: `case-${Date.now()}`,
      title: formData.title.trim(),
      specialty: formData.specialty,
      summary: formData.summary.trim(),
      presenter: formData.presenter.trim() || profile?.name || 'Dr. Physical Doctor',
      presenterRole: formData.presenterRole.trim() || 'Attending Physician',
      date: new Date().toISOString(),
      status: formData.status,
      discussionCount: 0,
      tags: parsedTags,
      isVerifiedByDoctor: true,
      verifiedByDoctorName: profile?.name || 'Attending Physician',
      discussions: []
    };

    saveCasesToStorage([newCase, ...cases]);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !formData.title.trim() || !formData.summary.trim()) return;

    const parsedTags = formData.tags
      ? formData.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
      : [formData.specialty];

    const updatedCase: TeachingCase = {
      ...selectedCase,
      title: formData.title.trim(),
      specialty: formData.specialty,
      summary: formData.summary.trim(),
      presenter: formData.presenter.trim(),
      presenterRole: formData.presenterRole.trim(),
      status: formData.status,
      tags: parsedTags,
      isVerifiedByDoctor: true,
      verifiedByDoctorName: profile?.name || selectedCase.verifiedByDoctorName || 'Attending Physician'
    };

    const updatedList = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    saveCasesToStorage(updatedList);
    setSelectedCase(updatedCase);
    setIsEditing(false);
  };

  const handleDeleteCase = (id: string) => {
    if (window.confirm('Are you sure you want to delete this teaching case?')) {
      const updatedList = cases.filter(c => c.id !== id);
      saveCasesToStorage(updatedList);
      setSelectedCase(null);
      setIsEditing(false);
    }
  };

  const handleAddDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newDiscussionText.trim()) return;

    const newComment = {
      id: `disc-${Date.now()}`,
      author: profile?.name || 'Dr. Physical Doctor',
      role: 'Attending Physician',
      text: newDiscussionText.trim(),
      date: new Date().toISOString()
    };

    const updatedDiscussions = [...(selectedCase.discussions || []), newComment];
    const updatedCase: TeachingCase = {
      ...selectedCase,
      discussions: updatedDiscussions,
      discussionCount: updatedDiscussions.length
    };

    const updatedList = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    saveCasesToStorage(updatedList);
    setSelectedCase(updatedCase);
    setNewDiscussionText('');
  };

  const handleOpenDetailModal = (c: TeachingCase) => {
    setSelectedCase(c);
    setIsEditing(false);
    setFormData({
      title: c.title,
      specialty: c.specialty,
      summary: c.summary,
      presenter: c.presenter,
      presenterRole: c.presenterRole,
      status: c.status,
      tags: c.tags.join(', ')
    });
  };

  const totalDiscussions = cases.reduce((acc, c) => acc + (c.discussionCount || 0), 0);

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Rounds</h1>
            <p className="text-gray-500 font-medium">VIVO Clinical Case Repository & Doctor Knowledge Hub</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          Submit Teaching Case Form
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Cases</p>
            <h3 className="text-2xl font-black text-gray-900">{cases.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><MessageSquare size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Discussions</p>
            <h3 className="text-2xl font-black text-gray-900">{totalDiscussions}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor Verified</p>
            <h3 className="text-2xl font-black text-gray-900">{cases.filter(c => c.isVerifiedByDoctor).length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Award size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CME Modules</p>
            <h3 className="text-2xl font-black text-gray-900">{cases.length * 5} CME</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} /> Specialties
            </h3>
            <div className="space-y-2">
              {specialties.map(specialty => (
                <button
                  key={specialty}
                  onClick={() => setActiveSpecialty(specialty)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all transition-colors flex items-center justify-between cursor-pointer",
                    activeSpecialty === specialty 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <span>{specialty}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-black",
                    activeSpecialty === specialty ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  )}>
                    {specialty === 'All'
                      ? cases.length
                      : cases.filter(c => c.specialty === specialty).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-900 text-white p-6 rounded-[2rem] shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <GraduationCap size={120} />
            </div>
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-2 leading-tight">Doctor CME Portal</h4>
              <p className="text-blue-200 text-xs font-medium mb-4">Review, verify, and publish physical case findings to grant CME points for resident training.</p>
              <button
                onClick={handleOpenAddModal}
                className="w-full py-2.5 bg-white text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-colors"
              >
                Add Teaching Case
              </button>
            </div>
          </div>
        </aside>

        {/* Case Feed */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search teaching cases by title, diagnosis, doctor, or tag..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
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
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {formatDate(c.date)}
                      </span>
                      {c.isVerifiedByDoctor && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={12} /> Verified by Doctor
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {c.title}
                    </h2>
                    <p className="text-gray-600 text-sm font-medium leading-relaxed line-clamp-3">
                      "{c.summary}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {c.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag size={10} className="text-blue-500" /> #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 flex flex-col justify-between border-l border-gray-100 pl-0 md:pl-8 pt-6 md:pt-0">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Presented / Updated By</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {c.presenter.charAt(0) || 'D'}
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
                        <span className="text-xs font-black">{c.discussionCount || 0}</span>
                      </div>
                      <button
                        onClick={() => handleOpenDetailModal(c)}
                        className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        View & Update <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredCases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                   <BookOpen size={48} className="text-gray-300 mb-4" />
                   <h3 className="font-bold text-gray-500 uppercase tracking-widest">No teaching cases currently listed</h3>
                   <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
                     Use the button above to make this page a form and submit updated clinical cases directly as an attending doctor.
                   </p>
                   <button
                     onClick={handleOpenAddModal}
                     className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all cursor-pointer shadow-md flex items-center gap-2"
                   >
                     <Plus size={16} /> Submit First Teaching Case
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Submit Teaching Case Form */}
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
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Submit Teaching Case Form</h2>
                    <p className="text-xs text-gray-500 font-medium">Physical doctor update form for grand rounds and clinical education</p>
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
                    Case Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Management of Refractory Cardiac Arrhythmia in Post-OP Patient"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Clinical Specialty *
                    </label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {specialties.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Publication Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TeachingCase['status'] })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Clinical Summary & Case Findings *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Describe patient demographics, symptoms, diagnostic imaging, pathology findings, therapeutic intervention, and outcomes..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Doctor / Presenter Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.presenter}
                      onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                      placeholder="e.g. Dr. Sarah Johnson"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Doctor Designation / Role
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.presenterRole}
                      onChange={(e) => setFormData({ ...formData, presenterRole: e.target.value })}
                      placeholder="e.g. Senior Registrar / Consultant"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Hematology, Diagnostic Challenge, Post-Op Care"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
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
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Save & Publish Teaching Case
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: View Case Details & Doctor Update Form */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedCase.specialty}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      ID: {selectedCase.id}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedCase.title}</h2>
                  <p className="text-xs text-gray-500 font-medium">Presented by {selectedCase.presenter} ({selectedCase.presenterRole}) on {formatDate(selectedCase.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer transition-colors"
                    title="Toggle Doctor Edit Mode"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCase(selectedCase.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full cursor-pointer transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => { setSelectedCase(null); setIsEditing(false); }}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                /* Doctor Edit Mode Form */
                <form onSubmit={handleEditSubmit} className="space-y-4 bg-blue-50/40 p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <Edit3 size={16} /> Physical Doctor Update Form
                  </h3>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Case Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Specialty
                      </label>
                      <select
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {specialties.filter(s => s !== 'All').map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TeachingCase['status'] })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Case Findings & Summary
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.presenter}
                        onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Doctor Role
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.presenterRole}
                        onChange={(e) => setFormData({ ...formData, presenterRole: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
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
                      className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all cursor-pointer shadow-md"
                    >
                      Save Updates
                    </button>
                  </div>
                </form>
              ) : (
                /* Doctor View Details Mode */
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Case Summary & Diagnostics</p>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                      {selectedCase.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-900">Doctor Verification & Quality Assurance</p>
                        <p className="text-[11px] font-medium text-emerald-700">Verified by {selectedCase.verifiedByDoctorName || selectedCase.presenter}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 transition-all cursor-pointer"
                    >
                      Update Case Info
                    </button>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Case Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Discussions & Notes */}
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} className="text-blue-600" /> Clinical Discussions ({selectedCase.discussions?.length || 0})
                    </h3>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedCase.discussions && selectedCase.discussions.length > 0 ? (
                        selectedCase.discussions.map(d => (
                          <div key={d.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                            <div className="flex justify-between items-center text-gray-500 font-bold">
                              <span className="text-gray-900 font-black">{d.author} ({d.role})</span>
                              <span className="text-[10px]">{formatDate(d.date)}</span>
                            </div>
                            <p className="text-gray-700 font-medium">{d.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">No discussion notes added yet. Add doctor comments below.</p>
                      )}
                    </div>

                    <form onSubmit={handleAddDiscussion} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newDiscussionText}
                        onChange={(e) => setNewDiscussionText(e.target.value)}
                        placeholder="Add clinical insight or peer review comment..."
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all cursor-pointer shadow-md flex items-center gap-1 shrink-0"
                      >
                        <Send size={14} /> Add Note
                      </button>
                    </form>
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
