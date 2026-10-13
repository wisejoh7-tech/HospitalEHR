import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Investigation } from '../types';
import { 
  Activity, 
  FileSearch, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  Upload,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

import { useAuth } from '../contexts/AuthContext';

export default function Investigations() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [investigations, setInvestigations] = useState<(Investigation & { patient: any })[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'laboratory' | 'radiology'>('all');
  const [selectedInv, setSelectedInv] = useState<(Investigation & { patient: any }) | null>(null);
  const [resultText, setResultText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'lab' && filterType !== 'laboratory') setFilterType('laboratory');
    else if (profile?.role === 'radiology' && filterType !== 'radiology') setFilterType('radiology');
  }, [profile, filterType]);

  const fetchInv = async () => {
    try {
      const data = await apiService.getInvestigations(filterType !== 'all' ? { type: filterType } : {});
      setInvestigations(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInv();
  }, [filterType]);

  const handleSendToDoctor = async (patientId: string) => {
    try {
      await apiService.updatePatientWorkflowStatus(patientId, 'consultation', profile?.role);
      fetchInv();
    } catch (err: any) {
      alert(err?.message || "Failed to send patient to doctor");
    }
  };

  const handleUpdateStatus = async (invId: string, status: string, result?: string) => {
    try {
      await apiService.updateInvestigation(invId, { status, result });
      fetchInv();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !resultText.trim()) return;
    setLoadingUpdate(true);
    try {
      let fileUrl = '';
      if (selectedFile) {
        const uploadRes = await apiService.uploadFile(selectedFile);
        fileUrl = uploadRes.fileUrl;
      }

      await apiService.updateInvestigation(selectedInv.id, {
        status: 'completed',
        result: resultText,
        fileUrl: fileUrl || undefined
      });
      setSelectedInv(null);
      setResultText('');
      setSelectedFile(null);
      fetchInv();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUpdate(false);
    }
  };

  return (
    <div className="space-y-8 animate-in mt-6">
      {/* Diagnostic Services Banner (Lab Scientist & Radiologist Pictures) */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-indigo-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src={
                filterType === 'radiology'
                  ? "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"
                  : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800"
              }
              alt={filterType === 'radiology' ? "Radiologist Reading Scans" : "Laboratory Scientist"}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                {filterType === 'radiology' ? 'Radiology Unit' : 'Laboratory Unit'}
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Activity size={12} /> {filterType === 'radiology' ? 'Radiology Specialist Desk' : 'Laboratory Scientist Desk'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Diagnostic Services Terminal</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {filterType === 'radiology'
                  ? 'Managed by Consultant Radiologist • X-Ray, CT Scan, Ultrasound & MRI Diagnostic Imaging'
                  : 'Managed by Medical Laboratory Scientist • Clinical Pathology, Hematology, Microbiology & Chemistry Diagnostics'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Active Investigations: <strong className="text-indigo-700 font-black">{investigations.length} Requests</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

       <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Investigation Worklist</h2>
        </div>
        
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          {(!profile?.role || (profile.role !== 'lab' && profile.role !== 'radiology')) && (
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filterType === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              all
            </button>
          )}
          {(!profile?.role || profile.role !== 'radiology') && (
            <button
              onClick={() => setFilterType('laboratory')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filterType === 'laboratory' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              laboratory
            </button>
          )}
          {(!profile?.role || profile.role !== 'lab') && (
            <button
              onClick={() => setFilterType('radiology')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filterType === 'radiology' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              radiology
            </button>
          )}
        </div>
      </header>

      {/* Diagnostic Stats - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Requests</p>
            <h3 className="text-3xl font-black text-gray-900">{investigations.filter(i => i.status === 'pending').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">In Processing</p>
            <h3 className="text-3xl font-black text-blue-600">{investigations.filter(i => i.status === 'processing' || i.status === 'sample_collected').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed (24h)</p>
            <h3 className="text-3xl font-black text-emerald-600">{investigations.filter(i => i.status === 'completed').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm bg-indigo-600 text-white border-none">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Urgent Queue</p>
            <h3 className="text-3xl font-black">{investigations.filter(i => i.priority === 'emergency' && i.status !== 'completed').length}</h3>
          </div>
        </div>
      )}

      <div className={cn("grid grid-cols-1 gap-8", isAdmin ? "xl:grid-cols-3" : "")}>
        <div className={cn("space-y-6", isAdmin ? "xl:col-span-2" : "w-full")}>
           {loading ? (
             <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Scanning Network...</div>
           ) : (
             <div className="grid gap-4">
                {investigations.filter(inv => isAdmin ? true : (inv.patient?.workflowStatus === 'laboratory' || inv.patient?.workflowStatus === 'radiology')).map((inv, i) => (
                   <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-200 transition-all",
                      inv.status === 'completed' || inv.status === 'reviewed' ? "opacity-90" : ""
                    )}
                  >
                    <div className="flex items-center gap-5">
                       <div className={cn(
                         "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                         inv.type === 'laboratory' ? "bg-blue-600 text-white shadow-blue-100" : "bg-indigo-600 text-white shadow-indigo-100"
                       )}>
                          {inv.type === 'laboratory' ? <Activity size={28} /> : <FileSearch size={28} />}
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-black text-gray-900 leading-none uppercase tracking-tight">{inv.testName}</h3>
                             <span className={cn(
                               "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                               inv.priority === 'emergency' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                             )}>
                               {inv.priority}
                             </span>
                          </div>
                          <p className="text-sm font-bold text-gray-400">Patient: <span className="text-gray-700">{inv.patient.name}</span> • ID: {inv.patient.id}</p>
                          {inv.result && (
                            <p className="text-xs font-semibold text-emerald-600 mt-1 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">Findings: {inv.result}</p>
                          )}
                          {inv.fileUrl && (
                            <a 
                              href={inv.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[10px] font-black text-blue-600 mt-2 bg-blue-50 w-fit px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Download size={12} /> View Attached Report
                            </a>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                       <div className={cn(
                         "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 min-w-[120px] justify-center",
                         inv.status === 'pending' ? "bg-amber-50 text-amber-700" : 
                         inv.status === 'completed' ? "bg-green-50 text-green-700" : 
                         inv.status === 'sample_collected' ? "bg-blue-50 text-blue-700" :
                         inv.status === 'processing' ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
                       )}>
                          {inv.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {inv.status.replace('_', ' ')}
                       </div>

                       <div className="flex items-center gap-2">
                          {inv.status === 'pending' && (profile?.role === 'lab' || profile?.role === 'radiology' || profile?.role === 'admin') && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.id, 'sample_collected')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all"
                            >
                              Collect Sample
                            </button>
                          )}
                          {inv.status === 'sample_collected' && (profile?.role === 'lab' || profile?.role === 'radiology' || profile?.role === 'admin') && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.id, 'processing')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all"
                            >
                              Start Process
                            </button>
                          )}
                          {(inv.status === 'processing' || inv.status === 'sample_collected') && (profile?.role === 'lab' || profile?.role === 'radiology' || profile?.role === 'admin') && (
                            <button 
                              onClick={() => { setSelectedInv(inv); setResultText(''); }}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-green-700 transition-all"
                            >
                              Complete
                            </button>
                          )}
                          {inv.status === 'completed' && (profile?.role === 'doctor' || profile?.role === 'admin') && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.id, 'reviewed')}
                              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-gray-800 transition-all"
                            >
                              Review & Close
                            </button>
                          )}
                          {inv.patientId && (
                            <button
                              onClick={() => handleSendToDoctor(inv.patientId)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all"
                            >
                              Send to Doctor
                            </button>
                          )}
                       </div>
                    </div>
                  </motion.div>
                ))}
                {investigations.length === 0 && (
                   <div className="p-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                     <Activity size={48} className="text-gray-200 mx-auto mb-4" />
                     <p className="font-black text-gray-400 uppercase tracking-widest">No matching records found</p>
                   </div>
                )}
             </div>
           )}
        </div>

        {isAdmin && (
          <aside className="space-y-6">
             <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Diagnostic Summary</h3>
                <div className="space-y-4">
                   {[
                     { label: 'Pending Labs', count: investigations.filter(i => i.type === 'laboratory' && i.status === 'pending').length, color: 'bg-blue-600' },
                     { label: 'Pending Radiology', count: investigations.filter(i => i.type === 'radiology' && i.status === 'pending').length, color: 'bg-indigo-600' },
                     { label: 'Critical Alerts', count: 0, color: 'bg-red-600' },
                   ].map(stat => (
                      <div key={stat.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", stat.color)} />
                            <span className="text-sm font-bold text-gray-600">{stat.label}</span>
                         </div>
                         <span className="text-lg font-black text-gray-900">{stat.count}</span>
                      </div>
                   ))}
                </div>
             </section>

             <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-white/5" />
                <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Quality Control</h3>
                <p className="text-lg font-bold leading-snug mb-6">Scan times are currently averaging 42 minutes across units.</p>
                <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl text-sm font-black hover:bg-white/30 transition-all">Optimization Report</button>
             </section>
          </aside>
        )}
      </div>

      {/* Result Entry Modal */}
      <AnimatePresence>
        {selectedInv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedInv(null)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                      <FileSearch size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Enter Results</h3>
                     <p className="text-xs font-bold text-gray-400">{selectedInv.testName} for {selectedInv.patient.name}</p>
                   </div>
                </div>

                <form onSubmit={handleUpdateResult} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Findings / Result Summary</label>
                      <textarea 
                        required
                        autoFocus
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold h-40 resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        placeholder="Type findings here..."
                        value={resultText}
                        onChange={(e) => setResultText(e.target.value)}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attach Report (Image/PDF)</label>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-200 transition-all">
                         <input 
                           type="file" 
                           id="file-upload"
                           accept="image/*,application/pdf"
                           className="hidden"
                           onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                         />
                         <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-xs font-black text-blue-600 hover:scale-105 transition-all">
                            <Upload size={18} />
                            {selectedFile ? selectedFile.name : "Choose File..."}
                         </label>
                         {selectedFile && (
                           <button 
                             type="button" 
                             onClick={() => setSelectedFile(null)}
                             className="text-[10px] font-black text-red-500 ml-auto"
                           >
                             Remove
                           </button>
                         )}
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setSelectedInv(null)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button 
                        type="submit" 
                        disabled={loadingUpdate}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg disabled:opacity-50"
                      >
                         {loadingUpdate ? "Uploading..." : "Save & Complete"}
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
