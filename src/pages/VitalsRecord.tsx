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
  ArrowLeft,
  X,
  Send,
  PlusCircle,
  CheckCircle2,
  BedDouble,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function VitalsRecord() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vitals recording modal state
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<Patient | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    bp: '',
    pulse: '',
    temp: '',
    resp: '',
    spo2: '',
    weight: ''
  });
  const [isSavingVitals, setIsSavingVitals] = useState(false);

  // Admit & Discharge states
  const [selectedPatientForAdmit, setSelectedPatientForAdmit] = useState<Patient | null>(null);
  const [selectedPatientForDischarge, setSelectedPatientForDischarge] = useState<Patient | null>(null);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [selectedBed, setSelectedBed] = useState<string>('');
  const [dischargeReason, setDischargeReason] = useState<string>('');
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);

  const [filterMode, setFilterMode] = useState<'queue' | 'all'>('queue');

  const fetchPatients = async () => {
    try {
      const [list, wardsList] = await Promise.all([
        apiService.getPatients(),
        apiService.getWards().catch(() => [])
      ]);
      setPatients(list);
      setWards(wardsList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleConfirmAdmit = async () => {
    if (!selectedPatientForAdmit || !selectedWard || !selectedBed) return;
    setIsAdmitting(true);
    try {
      await apiService.admitPatient(selectedPatientForAdmit.id, selectedWard, selectedBed);
      alert(`Patient ${selectedPatientForAdmit.name} admitted successfully!`);
      setSelectedPatientForAdmit(null);
      setSelectedWard('');
      setSelectedBed('');
      fetchPatients();
    } catch (err: any) {
      alert(err?.message || "Failed to admit patient");
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleConfirmDischarge = async () => {
    if (!selectedPatientForDischarge) return;
    setIsDischarging(true);
    try {
      await apiService.dischargePatient(selectedPatientForDischarge.id, dischargeReason);
      alert(`Patient ${selectedPatientForDischarge.name} discharged successfully!`);
      setSelectedPatientForDischarge(null);
      setDischargeReason('');
      fetchPatients();
    } catch (err: any) {
      alert(err?.message || "Failed to discharge patient");
    } finally {
      setIsDischarging(false);
    }
  };

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    if (filterMode === 'queue') {
      return matchesSearch && (p.workflowStatus === 'vitals' || p.workflowStatus === 'treatment');
    }
    return matchesSearch;
  });

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForVitals) return;

    setIsSavingVitals(true);
    try {
      await apiService.addVitals(selectedPatientForVitals.id, {
        bp: vitalsForm.bp ? vitalsForm.bp.trim() : undefined,
        pulse: vitalsForm.pulse ? parseInt(vitalsForm.pulse, 10) : undefined,
        temp: vitalsForm.temp ? parseFloat(vitalsForm.temp) : undefined,
        resp: vitalsForm.resp ? parseInt(vitalsForm.resp, 10) : undefined,
        spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2, 10) : undefined,
        weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : undefined,
        takenBy: profile?.name || 'Nurse'
      });
      alert(`Vital signs saved for ${selectedPatientForVitals.name}!`);
      setSelectedPatientForVitals(null);
      setVitalsForm({ bp: '', pulse: '', temp: '', resp: '', spo2: '', weight: '' });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to save vital signs. Please try again.");
    } finally {
      setIsSavingVitals(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Department Banner & Nurse Specialist Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-emerald-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800"
              alt="Nursing Care Specialist"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Nursing Care Unit
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Activity size={12} /> Nursing & Clinical Observation Desk
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Nurses' Clinical Station & Vitals</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Managed by Nurse Officer In-Charge • Pre-consultation Triage & Patient Vital Signs Monitoring
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Nursing Queue Active: <strong className="text-emerald-700 font-black">{filtered.length} Patients</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 mb-0.5">Vitals Queue & Ward Roster</h2>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Measure vital signs, admit/discharge patients, and route records to any department anytime.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('queue')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                filterMode === 'queue' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Nursing Queue ({patients.filter(p => p.workflowStatus === 'vitals' || p.workflowStatus === 'treatment').length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                filterMode === 'all' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              All Patients ({patients.length})
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Patient Name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-56 shadow-sm transition-all font-bold"
            />
          </div>
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

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatientForVitals(patient);
                    setVitalsForm({ bp: '', pulse: '', temp: '', resp: '', spo2: '', weight: '' });
                  }}
                  className="flex-1 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow hover:bg-gray-800 transition-colors"
                >
                  Record Vitals
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const updated = await apiService.updatePatientWorkflowStatus(patient.id, 'consultation', profile?.role);
                      setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, workflowStatus: updated.workflowStatus } : p));
                      alert(`Patient ${patient.name} sent to Doctor for Consultation!`);
                    } catch (err: any) {
                      alert(err?.message || "Failed to send patient to doctor");
                    }
                  }}
                  className="flex-1 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow hover:bg-blue-700 transition-colors"
                >
                  Send to Doctor
                </button>
              </div>

              {/* Department Re-send Selector & Admit/Discharge Row */}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] font-black uppercase text-gray-400">Route/Re-send:</span>
                  <select
                    value={patient.workflowStatus}
                    onChange={async (e) => {
                      const target = e.target.value as any;
                      try {
                        const updated = await apiService.updatePatientWorkflowStatus(patient.id, target, profile?.role);
                        setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, workflowStatus: updated.workflowStatus } : p));
                        alert(`Patient ${patient.name} routed to ${target.toUpperCase()}! You can re-send anytime.`);
                      } catch (err: any) {
                        alert(err?.message || "Failed to update workflow routing");
                      }
                    }}
                    className="text-[10px] font-black uppercase bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="vitals">Nurses (Vitals)</option>
                    <option value="consultation">Doctor (Consultation)</option>
                    <option value="treatment">Nursing (Treatment)</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="radiology">Radiology</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="physiotherapy">Physiotherapy</option>
                    <option value="discharged">Completed</option>
                  </select>
                </div>

                {/* Admit / Discharge quick actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  {patient.status === 'inpatient' ? (
                    <button
                      onClick={() => {
                        setSelectedPatientForDischarge(patient);
                        setDischargeReason('');
                      }}
                      className="w-full py-1.5 px-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-red-100"
                    >
                      <LogOut size={12} /> Discharge Inpatient
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPatientForAdmit(patient);
                        setSelectedWard(wards[0]?.id || '');
                        setSelectedBed('');
                      }}
                      className="w-full py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-emerald-100"
                    >
                      <BedDouble size={12} /> Admit to Ward
                    </button>
                  )}
                </div>
              </div>
            </div>
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

      {/* Direct Record Vitals Modal */}
      <AnimatePresence>
        {selectedPatientForVitals && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatientForVitals(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Record Vitals</h3>
                    <p className="text-xs font-bold text-gray-400">Patient: {selectedPatientForVitals.name} ({selectedPatientForVitals.id})</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatientForVitals(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveVitals} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BP (Systolic/Diastolic)</label>
                    <input
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="e.g. 120/80"
                      value={vitalsForm.bp}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pulse (bpm)</label>
                    <input
                      type="number"
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="72"
                      value={vitalsForm.pulse}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="36.5"
                      value={vitalsForm.temp}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SpO2 (%)</label>
                    <input
                      type="number"
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="98"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resp (cpm)</label>
                    <input
                      type="number"
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="18"
                      value={vitalsForm.resp}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, resp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="70.0"
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForVitals(null)}
                    className="flex-1 py-3.5 text-xs font-black uppercase text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVitals}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {isSavingVitals ? 'Saving...' : 'Save Observations'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Admission Modal */}
      <AnimatePresence>
        {selectedPatientForAdmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatientForAdmit(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-10 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <BedDouble size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Patient Admission</h3>
                  <p className="text-xs font-bold text-gray-400">Admit {selectedPatientForAdmit.name} to Ward</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Ward</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => {
                      setSelectedWard(e.target.value);
                      setSelectedBed('');
                    }}
                    className="w-full p-3.5 bg-gray-50 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose a ward...</option>
                    {wards.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>

                {selectedWard && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Available Bed</label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {wards.find((w: any) => w.id === selectedWard)?.beds?.filter((b: any) => b.status === 'vacant').map((b: any) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBed(b.id)}
                          className={cn(
                            "p-2.5 rounded-xl text-xs font-black transition-all",
                            selectedBed === b.id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          Bed #{b.id.slice(-4)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForAdmit(null)}
                    className="flex-1 py-3 text-xs font-black uppercase text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedBed || isAdmitting}
                    onClick={handleConfirmAdmit}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isAdmitting ? 'Admitting...' : 'Confirm Admission'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Discharge Confirmation Modal */}
      <AnimatePresence>
        {selectedPatientForDischarge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatientForDischarge(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-10 overflow-hidden text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Confirm Patient Discharge</h3>
              <p className="text-xs font-medium text-gray-500 mb-4">
                Discharge inpatient {selectedPatientForDischarge.name}? This will free their bed and finalize admission.
              </p>

              <div className="mb-4 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Discharge Reason</label>
                <textarea
                  value={dischargeReason}
                  onChange={(e) => setDischargeReason(e.target.value)}
                  placeholder="e.g. Treatment completed, Referred, Fit for discharge..."
                  className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none h-20 focus:bg-white focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForDischarge(null)}
                  className="flex-1 py-3 text-xs font-black uppercase text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDischarging}
                  onClick={handleConfirmDischarge}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isDischarging ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
