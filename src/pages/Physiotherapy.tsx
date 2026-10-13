import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { PhysiotherapyReferral, Patient } from '../types';
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  User,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Physiotherapy() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [referrals, setReferrals] = useState<(PhysiotherapyReferral & { patient: Patient })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<(PhysiotherapyReferral & { patient: Patient }) | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPhysiotherapyReferrals(
        filterStatus !== 'all' ? { status: filterStatus } : undefined
      );
      setReferrals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [filterStatus]);

  const handleSendToDoctor = async (patientId: string) => {
    try {
      await apiService.updatePatientWorkflowStatus(patientId, 'consultation', profile?.role);
      fetchReferrals();
    } catch (err: any) {
      alert(err?.message || "Failed to send patient back to doctor");
    }
  };

  const handleUpdateStatus = async (refId: string, status: string, additionalSessions = 0) => {
    try {
      const ref = referrals.find(r => r.id === refId);
      const newCompleted = ref ? Math.min(ref.sessionsRequested, ref.sessionsCompleted + additionalSessions) : 0;
      await apiService.updatePhysiotherapyReferral(refId, {
        status,
        sessionsCompleted: newCompleted
      });
      fetchReferrals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;
    try {
      const updatedCompleted = selectedReferral.sessionsCompleted + 1;
      const isFinished = updatedCompleted >= selectedReferral.sessionsRequested;

      const newNotes = selectedReferral.notes
        ? `${selectedReferral.notes}\n[${new Date().toLocaleDateString()}] Session ${updatedCompleted}: ${sessionNotes}`
        : `[${new Date().toLocaleDateString()}] Session ${updatedCompleted}: ${sessionNotes}`;

      await apiService.updatePhysiotherapyReferral(selectedReferral.id, {
        sessionsCompleted: updatedCompleted,
        status: isFinished ? 'completed' : 'in_progress',
        notes: newNotes
      });

      setSelectedReferral(null);
      setSessionNotes('');
      fetchReferrals();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = referrals.filter(ref => {
    const query = searchQuery.toLowerCase();
    const patientName = ref.patient?.name?.toLowerCase() || '';
    const patientId = ref.patient?.id?.toLowerCase() || '';
    const bodyRegion = ref.bodyRegion?.toLowerCase() || '';
    const treatmentType = ref.treatmentType?.toLowerCase() || '';

    const matchesSearch = patientName.includes(query) ||
           patientId.includes(query) ||
           bodyRegion.includes(query) ||
           treatmentType.includes(query);

    const matchesWorkflow = isAdmin ? true : ref.patient?.workflowStatus === 'physiotherapy';

    return matchesSearch && matchesWorkflow;
  });

  const stats = {
    pending: referrals.filter(r => r.status === 'pending').length,
    inProgress: referrals.filter(r => r.status === 'in_progress').length,
    completed: referrals.filter(r => r.status === 'completed').length
  };

  return (
    <div className="space-y-6 animate-in mt-2 sm:mt-4">
      {/* Physiotherapist Department Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-teal-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
              alt="Physiotherapy Specialist"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-teal-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Physiotherapy Unit
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Activity size={12} /> Physiotherapist Station & Physical Rehabilitation
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Physiotherapy & Physical Rehabilitation</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Managed by Specialist Physiotherapist • Doctor Referrals, Post-Operative Rehabilitation & Physical Therapy
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                <span>Active Referrals: <strong className="text-teal-700 font-black">{referrals.length} Patients</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Sessions</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In Therapy</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{stats.inProgress}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rehab Completed</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
          {['all', 'pending', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                filterStatus === status ? "bg-white text-teal-700 shadow-xs" : "text-gray-400 hover:text-gray-700"
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search patient or therapy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Referrals Queue */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
            Loading Physiotherapy Queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Activity size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-black text-gray-400 uppercase tracking-widest text-xs">No Physiotherapy Referrals Found</p>
          </div>
        ) : (
          filtered.map((ref, i) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 text-white shadow-md",
                  ref.status === 'pending' ? "bg-amber-500 shadow-amber-100" :
                  ref.status === 'in_progress' ? "bg-blue-600 shadow-blue-100" :
                  "bg-emerald-600 shadow-emerald-100"
                )}>
                  <Activity size={24} />
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 leading-tight">
                      {ref.patient?.name || 'Patient Referral'}
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      ID: {ref.patient?.id || 'N/A'}
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                      ref.priority === 'emergency' ? "bg-red-50 text-red-600 border-red-200" :
                      ref.priority === 'urgent' ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {ref.priority}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-teal-800">
                    {ref.treatmentType} • <span className="text-gray-600">Target Region: {ref.bodyRegion}</span>
                  </p>

                  <p className="text-xs text-gray-500 font-medium italic">
                    Indication: "{ref.clinicalIndication}"
                  </p>

                  <div className="text-[11px] font-semibold text-gray-400 flex flex-wrap gap-4 pt-1">
                    <span>Referred By: <strong className="text-gray-700">{ref.referredBy}</strong></span>
                    <span>Date: <strong className="text-gray-700">{formatDate(ref.createdAt)}</strong></span>
                  </div>

                  {ref.notes && (
                    <div className="mt-2 p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-800 whitespace-pre-wrap font-mono">
                      {ref.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex flex-col items-start md:items-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">Sessions</span>
                  <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <strong className="text-sm font-black text-teal-700">{ref.sessionsCompleted}</strong>
                    <span className="text-xs font-bold text-gray-400">/ {ref.sessionsRequested}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {ref.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(ref.id, 'in_progress')}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-teal-700 transition-all flex items-center gap-1"
                    >
                      Accept & Begin Therapy
                    </button>
                  )}

                  {ref.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => setSelectedReferral(ref)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-blue-700 transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Log Session Notes
                      </button>

                      {ref.sessionsCompleted >= ref.sessionsRequested && (
                        <button
                          onClick={() => handleUpdateStatus(ref.id, 'completed')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={14} /> Complete Rehab
                        </button>
                      )}
                    </>
                  )}

                  {ref.status === 'completed' && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={14} /> Rehabilitation Completed
                    </span>
                  )}

                  {ref.patientId && (
                    <button
                      onClick={() => handleSendToDoctor(ref.patientId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-blue-700 transition-all flex items-center gap-1"
                    >
                      Send to Doctor
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Log Session Modal */}
      <AnimatePresence>
        {selectedReferral && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReferral(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Log Physiotherapy Session</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Patient: {selectedReferral.patient?.name} • Session {selectedReferral.sessionsCompleted + 1} of {selectedReferral.sessionsRequested}
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogSession} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                    Therapy Progress & Clinical Notes
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="E.g., Patient completed passive joint mobilization exercises. Pain score reduced from 7/10 to 4/10."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-200 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReferral(null)}
                    className="flex-1 py-3 text-xs font-black text-gray-400 hover:text-gray-700 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase shadow-md transition-all"
                  >
                    Save Session
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
