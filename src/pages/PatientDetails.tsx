import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Patient, ClinicalNote, Prescription, NoteType, Investigation, VitalSign, Ward, Bed, Appointment } from '../types';
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertCircle,
  FileText, 
  Stethoscope, 
  Pill, 
  FileSearch,
  Activity,
  History,
  Send,
  Sparkles,
  MessageSquare,
  ClipboardCheck,
  User as UserIcon,
  Users,
  Trash2,
  Fingerprint,
  Droplet,
  PlusCircle,
  LogOut,
  BedDouble,
  Thermometer,
  Wind,
  Search,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatTime } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'prescriptions' | 'labs' | 'radiology' | 'vitals' | 'treatment' | 'billing' | 'appointments'>('notes');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('physician');
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [nextAppointment, setNextAppointment] = useState('');
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);

  const isDoctor = profile?.role === 'doctor';
  const isNurse = profile?.role === 'nurse';
  const isClinical = isDoctor || isNurse;

  const NOTE_TEMPLATES = [
    {
      name: 'Initial Assessment',
      content: 'CHIEF COMPLAINT: \n\nHISTORY OF PRESENT ILLNESS: \n\nPAST MEDICAL HISTORY: \n\nEXAMINATION: \n\nASSESSMENT & PLAN: '
    },
    {
      name: 'SOAP Note',
      content: 'SUBJECTIVE: \n\nOBJECTIVE: \n\nASSESSMENT: \n\nPLAN: '
    },
    {
      name: 'Follow-up Visit',
      content: 'INTERVAL HISTORY: \n\nCURRENT SYMPTOMS: \n\nEXAMINATION: \n\nADJUSTMENTS TO PLAN: '
    }
  ];

  const applyTemplate = (content: string) => {
    if (noteContent && !window.confirm('This will replace your current note content. Continue?')) {
      return;
    }
    setNoteContent(content);
  };

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showInvModal, setShowInvModal] = useState(false);
  const [invType, setInvType] = useState<'laboratory' | 'radiology'>('laboratory');
  const [invTestName, setInvTestName] = useState('');

  const [showRxModal, setShowRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: ''
  });
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const checkInteractions = (medication: string) => {
    const DRUG_INTERACTIONS: Record<string, string[]> = {
      'Warfarin': ['Aspirin', 'Ibuprofen', 'Naproxen'],
      'Aspirin': ['Warfarin', 'Ibuprofen'],
      'Sildenafil': ['Isosorbide', 'Nitroglycerin'],
      'Metformin': ['Contrast Dye'],
      'Atorvastatin': ['Clarithromycin', 'Erythromycin'],
    };

    const meds = Object.keys(DRUG_INTERACTIONS);
    const newMedUpper = medication.trim().toUpperCase();
    
    // Find matching drug in our database
    const dbKey = meds.find(m => m.toUpperCase() === newMedUpper);
    if (!dbKey) {
      setInteractionWarning(null);
      return;
    }

    const interactingDrugs = DRUG_INTERACTIONS[dbKey];
    const existingMeds = prescriptions.map(p => p.medication.trim().toUpperCase());
    
    const conflict = interactingDrugs.find(idrug => 
      existingMeds.includes(idrug.toUpperCase())
    );

    if (conflict) {
      setInteractionWarning(`CAUTION: Potential interaction detected between ${dbKey} and ${conflict}.`);
    } else {
      setInteractionWarning(null);
    }
  };

  const handleRxFormChange = (field: string, value: string) => {
    const newForm = { ...rxForm, [field]: value };
    setRxForm(newForm);
    if (field === 'medication') {
      checkInteractions(value);
    }
  };

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bp: '',
    pulse: '',
    temp: '',
    resp: '',
    spo2: '',
    weight: ''
  });

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeReason, setDischargeReason] = useState('');
  const [wards, setWards] = useState<Ward[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [selectedBed, setSelectedBed] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const data = await apiService.getPatientById(id);
        setPatient(data);
        setNotes(data.notes);
        setPrescriptions(data.prescriptions);
        setInvestigations(data.investigations || []);
        setVitals(data.vitals || []);
        setBills(data.bills || []);
        setTreatmentPlans(data.treatmentPlans || []);
        setReviews(data.reviews || []);

        const [wardsList, invList, appsList] = await Promise.all([
          apiService.getWards(),
          (profile?.role === 'doctor' || profile?.role === 'admin') ? apiService.getInventory() : Promise.resolve([]),
          apiService.getAppointments({ patientId: id })
        ]);
        setWards(wardsList);
        setInventory(invList);
        setAppointments(appsList);

        if (data.nextVisit) {
          setNextAppointment(new Date(data.nextVisit).toISOString().split('T')[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setPatient(null);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    const params = new URLSearchParams(location.search);
    if (params.get('recordVitals') === 'true') {
      setShowVitalsModal(true);
    }

    return () => clearInterval(interval);
  }, [id, location.search]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !id || !profile) return;

    try {
      const newNote = await apiService.addNote(id, {
        authorId: profile.uid,
        authorName: profile.name,
        type: noteType,
        content: noteContent,
      });
      setNotes(prev => [newNote, ...prev]);
      setNoteContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTestName.trim() || !id || !profile) return;
    try {
      const newInv = await apiService.addInvestigation(id, {
        type: invType,
        category: invType === 'laboratory' ? 'General' : 'Imaging',
        testName: invTestName,
        priority: 'routine',
        requestedBy: profile.name
      });
      setInvestigations(prev => [newInv, ...prev]);
      setInvTestName('');
      setShowInvModal(false);

      // Auto-move to lab/radiology after ordering
      if (patient?.workflowStatus === 'consultation') {
        const nextStatus = invType === 'radiology' ? 'radiology' : 'laboratory';
        const updated = await apiService.updatePatientWorkflowStatus(id, nextStatus);
        setPatient(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInvestigation = async (invId: string, status: string, result?: string) => {
    try {
      const updated = await apiService.updateInvestigation(invId, { status, result });
      setInvestigations(prev => prev.map(i => i.id === invId ? updated : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile || !rxForm.medication) return;
    try {
      const newRx = await apiService.addPrescription(id, {
        ...rxForm,
        authorId: profile.uid,
        authorName: profile.name
      });
      setPrescriptions(prev => [newRx, ...prev]);
      setShowRxModal(false);
      setRxForm({ medication: '', dosage: '', frequency: '', duration: '' });

      // Auto-move to pharmacy stage
      if (patient?.workflowStatus === 'consultation') {
        const updated = await apiService.updatePatientWorkflowStatus(id, 'pharmacy');
        setPatient(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRxStatus = async (rxId: string, status: string) => {
    try {
      const updated = await apiService.updatePrescriptionStatus(rxId, status);
      setPrescriptions(prev => prev.map(r => r.id === rxId ? updated : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile) return;
    try {
      const newVitals = await apiService.addVitals(id, {
        bp: vitalsForm.bp,
        pulse: parseInt(vitalsForm.pulse) || undefined,
        temp: parseFloat(vitalsForm.temp) || undefined,
        resp: parseInt(vitalsForm.resp) || undefined,
        spo2: parseInt(vitalsForm.spo2) || undefined,
        weight: parseFloat(vitalsForm.weight) || undefined,
        takenBy: profile.name
      });
      setVitals(prev => [newVitals, ...prev]);
      setShowVitalsModal(false);
      setVitalsForm({ bp: '', pulse: '', temp: '', resp: '', spo2: '', weight: '' });

      // Auto-move to consultation after vitals
      if (patient?.workflowStatus === 'vitals') {
        const updated = await apiService.updatePatientWorkflowStatus(id, 'consultation');
        setPatient(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!id || !nextAppointment) return;
    setIsUpdatingAppointment(true);
    try {
      await Promise.all([
        apiService.updatePatient(id, { nextVisit: nextAppointment }),
        apiService.createAppointment({
          patientId: id,
          doctorId: profile?.uid,
          doctorName: profile?.name,
          dateTime: `${nextAppointment}T09:00:00`,
          reason: 'Return Consultation (Scheduled from Details)',
          type: 'consultation',
          status: 'scheduled'
        })
      ]);
      const updated = await apiService.getPatientById(id);
      setPatient(updated);
      setAppointments(await apiService.getAppointments({ patientId: id }));
      setShowAppointmentModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingAppointment(false);
    }
  };

  const handleCreateBill = async () => {
    if (!id) return;
    try {
      const bill = await apiService.createBill(id);
      setBills(prev => [bill, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmit = async () => {
    if (!id || !selectedWard || !selectedBed) return;
    try {
      const updated = await apiService.admitPatient(id, selectedWard, selectedBed);
      setPatient(updated as any);
      setShowAdmitModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDischarge = async () => {
    if (!id) return;
    try {
      const updated = await apiService.dischargePatient(id, dischargeReason);
      setPatient(updated as any);
      setShowDischargeModal(false);
      setDischargeReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWards = async () => {
    const list = await apiService.getWards();
    setWards(list);
    if (list.length > 0) setSelectedWard(list[0].id);
  };

  const generateAISummary = async () => {
    if (notes.length === 0) return;
    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const context = notes.map(n => `[${n.type.toUpperCase()}] ${n.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following clinical notes for patient ${patient?.name}: \n\n${context}\n\nProvide a concise 3-sentence clinical summary and highlight immediate concerns.`,
      });
      setSummary(response.text || "Summary unavailable.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Retrieving patient data...</div>;
  if (!patient) return <div className="p-8 text-center text-red-600 font-bold">Patient record not found.</div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/patients')}
          className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        
        {patient.photoUrl && (
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
            <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-black text-gray-900">{patient.name}</h1>
             <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                {patient.id}
             </span>
          </div>
          <p className="text-sm font-bold text-gray-400 tracking-tight">Admission: {formatDate(patient.admissionDate)} • {patient.status.toUpperCase()}</p>
          {patient.status === 'discharged' && patient.dischargeReason && (
            <p className="text-xs font-bold text-red-500 mt-1">Reason: {patient.dischargeReason}</p>
          )}
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <button 
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone and will remove all their records.`)) {
                  try {
                    await apiService.deletePatient(id!);
                    navigate('/patients');
                  } catch (err) {
                    alert('Failed to delete patient');
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-red-100 text-red-600 hover:bg-red-200 transition-all mr-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}

          {(profile?.role === 'admin' || profile?.role === 'record') && (
            <button 
              onClick={async () => {
                const fingerprint = prompt("Place finger on scanner (Simulated: Enter unique ID)");
                if (fingerprint) {
                  try {
                    await apiService.updatePatient(id!, { fingerprint });
                    alert("Biometric data registered successfully");
                    window.location.reload();
                  } catch (err) {
                    alert("Failed to register biometrics");
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all mr-4"
            >
              <Fingerprint size={16} /> Register Biometrics
            </button>
          )}

          {isClinical && (
            <div className="flex items-center gap-2 mr-4 bg-gray-50 p-1 rounded-xl border border-gray-100">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Workflow Status:</span>
               <select 
                 value={patient.workflowStatus}
                 onChange={async (e) => {
                   try {
                     const updated = await apiService.updatePatientWorkflowStatus(id!, e.target.value as any);
                     setPatient(prev => prev ? { ...prev, workflowStatus: updated.workflowStatus } : null);
                   } catch (err) {
                     alert("Failed to update status");
                   }
                 }}
                 className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
               >
                 <option value="registered">Registered</option>
                 <option value="vitals">Nursing (Vitals)</option>
                 <option value="consultation">Doctor (Consultation)</option>
                 <option value="laboratory">Laboratory</option>
                 <option value="radiology">Radiology</option>
                 <option value="treatment">Nursing (Treatment)</option>
                 <option value="pharmacy">Pharmacy</option>
                 <option value="discharged">Completed</option>
               </select>
            </div>
          )}

          {isClinical && (
            patient.status === 'inpatient' ? (
              <button 
                onClick={() => setShowDischargeModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-red-600 text-white shadow-lg shadow-red-100 hover:scale-105 transition-all"
              >
                <LogOut size={16} /> Discharge Patient
              </button>
            ) : (
              !['registered', 'vitals'].includes(patient.workflowStatus) && (
                <button 
                  onClick={() => {
                    fetchWards();
                    setShowAdmitModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105 transition-all"
                >
                  <BedDouble size={16} /> Admit Patient
                </button>
              )
            )
          )}

          <button 
            onClick={generateAISummary}
            disabled={isSummarizing || notes.length === 0}
            className="flex items-center gap-2 border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-sm font-black hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
          {isSummarizing ? (
            <div className="w-4 h-4 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin" />
          ) : <Sparkles size={18} />}
          AI Clinical Insight
        </button>
      </div>
    </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        {/* Left Column: Demographics & Allergies */}
        <aside className="lg:col-span-1 space-y-6 overflow-auto pr-2">
          {/* Vitals Quick Card */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Latest Vitals
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">Temp</p>
                 <p className="text-lg font-black text-gray-900">{vitals[0]?.temp || '--'}<span className="text-[10px] text-gray-400 font-medium ml-0.5">°C</span></p>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">Pulse</p>
                 <p className="text-lg font-black text-gray-900">{vitals[0]?.pulse || '--'}<span className="text-[10px] text-gray-400 font-medium ml-0.5">bpm</span></p>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">BP</p>
                 <p className="text-lg font-black text-gray-900">{vitals[0]?.bp || '--'}</p>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">SpO2</p>
                 <p className="text-lg font-black text-gray-900">{vitals[0]?.spo2 || '--'}<span className="text-[10px] text-gray-400 font-medium ml-0.5">%</span></p>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">Resp</p>
                 <p className="text-lg font-black text-gray-900">{vitals[0]?.resp || '--'}<span className="text-[10px] text-gray-400 font-medium ml-0.5">cpm</span></p>
               </div>
            </div>
            <button 
              onClick={() => setShowVitalsModal(true)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Record Today's Vitals
            </button>
          </section>

          {/* Admission & Location Info */}
          {patient.status === 'inpatient' && (
            <section className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-2">
                  <BedDouble size={14} /> Ward Assignment
                </h3>
                <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-black uppercase">Active</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black leading-tight">
                  {patient.wardId ? wards.find(w => w.id === patient.wardId)?.name : 'Unassigned Ward'}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                   <p className="text-xs font-bold text-blue-100">Bed Number</p>
                   <p className="text-sm font-black">{patient.bedId || 'N/A'}</p>
                </div>
              </div>
            </section>
          )}

          {/* Clinical Info */}
          <section className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 space-y-6 relative overflow-hidden">
            <Droplet className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24" />
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-2 relative z-10">
              <ShieldAlert size={14} /> Medical Profile
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-xs font-bold text-white/60 mb-1">Blood Group</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black">{patient.bloodGroup || '?'}</div>
                   <span className="text-sm font-bold">Rh Positive</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white/60 mb-1">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies?.map((a, i) => (
                    <span key={i} className="px-2 py-1 bg-white/20 rounded-md text-[10px] font-black uppercase">{a}</span>
                  )) || <span className="text-xs opacity-50 italic">None recorded</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Demographics</h3>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-xs font-bold text-gray-400 uppercase">DOB</span>
                 <span className="text-sm font-bold text-gray-900">{formatDate(patient.dob)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-xs font-bold text-gray-400 uppercase">Gender</span>
                 <span className="text-sm font-bold text-gray-900 capitalize">{patient.gender}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-xs font-bold text-gray-400 uppercase">Location</span>
                 <span className="text-sm font-bold text-blue-600">{patient.wardId?.toUpperCase() || 'N/A'} • {patient.bedId || 'N/A'}</span>
               </div>
               <div className="pt-3 border-t border-gray-50">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Residential Address</p>
                 <p className="text-xs font-bold text-gray-700 leading-relaxed">{patient.address || 'No address recorded.'}</p>
               </div>
               <div className="pt-3 border-t border-gray-50">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Next of Kin</p>
                 <p className="text-xs font-bold text-gray-900">{patient.nextOfKinName || 'N/A'}</p>
                 <p className="text-[10px] font-bold text-gray-400">{patient.nextOfKinPhone || ''}</p>
               </div>
               {patient.status === 'outpatient' && (
                 <div className="pt-3 border-t border-blue-50 bg-blue-50/30 p-2 rounded-lg relative group">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Next Follow-up</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-blue-700">{patient.nextVisit ? formatDate(patient.nextVisit) : 'No appointment set'}</p>
                      {isDoctor && (
                        <button 
                          onClick={() => setShowAppointmentModal(true)}
                          className="p-1 text-blue-400 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PlusCircle size={14} />
                        </button>
                      )}
                    </div>
                 </div>
               )}
             </div>
          </section>
        </aside>

        {/* Right Column: Timeline & Input */}
        <div className="lg:col-span-3 flex flex-col min-h-0 gap-6">
          {/* AI Summary View */}
          <AnimatePresence>
            {summary && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl overflow-hidden relative"
              >
                <button onClick={() => setSummary(null)} className="absolute top-4 right-4 text-indigo-300 hover:text-indigo-600">✕</button>
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 shrink-0">
                      <Sparkles size={24} />
                   </div>
                   <div>
                     <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">AI Clinical Summary</p>
                     <p className="text-sm text-indigo-900 font-medium leading-relaxed">{summary}</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interaction Area */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-50 p-2 gap-2 bg-gray-50/50">
              {[
                { id: 'notes', label: 'Timeline', icon: FileText },
                { id: 'vitals', label: 'Vitals', icon: Activity },
                { id: 'treatment', label: 'Plan & Review', icon: Stethoscope },
                { id: 'prescriptions', label: 'Rx', icon: Pill },
                { id: 'labs', label: 'Labs', icon: Activity },
                { id: 'radiology', label: 'Radiology', icon: FileSearch },
                { id: 'billing', label: 'Billing', icon: ClipboardCheck },
                { id: 'appointments', label: 'Appointments', icon: CalendarDays },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap",
                    activeTab === tab.id 
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-100" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Note Input */}
            <div className="p-6 border-b border-gray-50 bg-white">
               <form onSubmit={handleAddNote} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-4 border-r border-gray-100 pr-4">
                      {(['physician', 'nursing', 'vitals'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNoteType(type)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all",
                            noteType === type ? "bg-gray-900 text-white border-gray-900" : "text-gray-400 border-gray-100 hover:bg-gray-50"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Templates:</span>
                      {NOTE_TEMPLATES.map((template) => (
                        <button
                          key={template.name}
                          type="button"
                          onClick={() => applyTemplate(template.content)}
                          className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-50 text-blue-500 hover:bg-blue-50 transition-all"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea 
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add a new clinical entry..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none h-24 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    />
                    <button 
                      type="submit"
                      className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
               </form>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-auto p-6 bg-white">
              <AnimatePresence mode="popLayout">
                {activeTab === 'notes' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {notes.map((note) => (
                      <div key={note.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg",
                            note.type === 'physician' ? "bg-indigo-500" : note.type === 'nursing' ? "bg-blue-500" : "bg-emerald-500"
                          )}>
                            <MessageSquare size={18} />
                          </div>
                          <div className="w-px flex-1 bg-gray-100 my-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="font-black text-gray-900 text-sm leading-none">{note.authorName}</h4>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{note.type} • {formatTime(note.createdAt)}</span>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-gray-100/50 transition-colors">
                             <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'prescriptions' && (
                  <motion.div layout className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Pharmacotherapy</h3>
                       {isDoctor && (
                         <button 
                           onClick={() => setShowRxModal(true)}
                           className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg"
                         >
                           <PlusCircle size={14} /> New Prescription
                         </button>
                       )}
                    </div>
                    {prescriptions.map(rx => (
                      <div key={rx.id} className="p-5 border border-gray-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-4 w-full">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                             rx.status === 'active' ? "bg-orange-50 text-orange-600" :
                             rx.status === 'dispensed' ? "bg-blue-50 text-blue-600" :
                             rx.status === 'discontinued' ? "bg-red-50 text-red-600" :
                             "bg-emerald-50 text-emerald-600"
                           )}>
                              <Pill size={24} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{rx.medication}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                                <span className="w-1 h-1 rounded-full bg-gray-200 hidden sm:block" />
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Dr. {rx.authorName}</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest pr-1">Prescription Status</span>
                              <select 
                                value={rx.status}
                                onChange={(e) => handleUpdateRxStatus(rx.id, e.target.value)}
                                className={cn(
                                  "pl-3 pr-8 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer border appearance-none transition-all",
                                  rx.status === 'active' ? "bg-amber-50 border-amber-100 text-amber-600" : 
                                  rx.status === 'dispensed' ? "bg-blue-50 border-blue-100 text-blue-600" : 
                                  rx.status === 'discontinued' ? "bg-red-50 border-red-100 text-red-600" :
                                  "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat' }}
                              >
                                <option value="active">Active</option>
                                <option value="dispensed">Dispensed</option>
                                <option value="completed">Completed</option>
                                <option value="discontinued">Discontinued</option>
                              </select>
                           </div>
                        </div>
                      </div>
                    ))}
                    {prescriptions.length === 0 && <p className="text-center p-12 text-gray-300 font-bold">No active prescriptions.</p>}
                  </motion.div>
                )}

                {activeTab === 'vitals' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Clinical Observations</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Physiological Parameter History</p>
                       </div>
                       <button 
                         onClick={() => setShowVitalsModal(true)}
                         className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:scale-[1.02] transition-all"
                       >
                         <PlusCircle size={14} /> Record New Vitals
                       </button>
                    </div>

                    {vitals.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { label: 'Temp', value: vitals[0].temp, unit: '°C', icon: Thermometer, color: 'text-orange-500', bgColor: 'bg-orange-50' },
                          { label: 'BP', value: vitals[0].bp, unit: '', icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                          { label: 'Pulse', value: vitals[0].pulse, unit: 'bpm', icon: Activity, color: 'text-red-500', bgColor: 'bg-red-50' },
                          { label: 'SpO2', value: vitals[0].spo2, unit: '%', icon: Wind, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
                          { label: 'Resp', value: vitals[0].resp, unit: 'cpm', icon: Activity, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
                          { label: 'Weight', value: vitals[0].weight, unit: 'kg', icon: Activity, color: 'text-gray-500', bgColor: 'bg-gray-50' },
                        ].map((stat, i) => (
                          <div key={i} className={cn("p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center", stat.bgColor)}>
                             <stat.icon size={16} className={cn("mb-2", stat.color)} />
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                             <p className="text-sm font-black text-gray-900">{stat.value || '--'}<span className="text-[10px] ml-0.5 opacity-50">{stat.unit}</span></p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-50">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Observation Timeline</h4>
                      {vitals.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                           <Activity className="mx-auto text-gray-300 mb-2" size={32} />
                           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No vitals recorded yet.</p>
                           <button onClick={() => setShowVitalsModal(true)} className="mt-4 text-xs font-black text-blue-600 hover:underline">Start Clinical Recording</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {vitals.map(v => (
                            <div key={v.id} className="p-4 bg-white border border-gray-50 rounded-2xl flex flex-wrap gap-4 items-center justify-between hover:shadow-md hover:border-blue-100 transition-all group">
                               <div className="flex items-center gap-4">
                                  <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                     <Activity size={18} />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-gray-900">{formatDate(v.createdAt)} at {formatTime(v.createdAt)}</p>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observed by {v.takenBy}</p>
                                  </div>
                               </div>
                               <div className="flex gap-4 items-center">
                                  {v.bp && <div className="px-3 py-1 bg-gray-50 rounded-lg text-center"><p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">BP</p><p className="text-xs font-black">{v.bp}</p></div>}
                                  {v.temp && <div className="px-3 py-1 bg-gray-50 rounded-lg text-center"><p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Temp</p><p className="text-xs font-black text-orange-600">{v.temp}°C</p></div>}
                                  {v.pulse && <div className="px-3 py-1 bg-gray-50 rounded-lg text-center"><p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">PR</p><p className="text-xs font-black text-red-600">{v.pulse}</p></div>}
                                  {v.spo2 && <div className="px-3 py-1 bg-gray-50 rounded-lg text-center"><p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">SpO2</p><p className="text-xs font-black text-emerald-600">{v.spo2}%</p></div>}
                                  {v.resp && <div className="px-3 py-1 bg-gray-50 rounded-lg text-center"><p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Resp</p><p className="text-xs font-black text-indigo-600">{v.resp}</p></div>}
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'treatment' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Clinical Management</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">Dr. {profile?.name}</span>
                        </div>
                     </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} /> Clinical Diagnosis
                              </h4>
                              {isDoctor ? (
                                <textarea 
                                  className="w-full p-4 bg-blue-50/30 rounded-2xl text-sm font-black h-24 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border border-blue-50"
                                  placeholder="Enter definitive or differential diagnosis..."
                                  defaultValue={patient.diagnosis || ''}
                                  onBlur={async (e) => {
                                    try {
                                      const updated = await apiService.updatePatient(id!, { diagnosis: e.target.value });
                                      setPatient(prev => prev ? { ...prev, diagnosis: updated.diagnosis, workflowStatus: prev.workflowStatus } : null);
                                    } catch (err) {
                                      alert("Failed to save diagnosis");
                                    }
                                  }}
                                />
                              ) : (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                   <p className="text-sm font-black text-gray-700">{patient.diagnosis || 'No diagnosis recorded yet.'}</p>
                                </div>
                              )}
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Stethoscope size={14} /> Treatment Plan
                              </h4>
                              {isDoctor && (
                                <textarea 
                                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium h-48 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                  placeholder="Define the long-term clinical goal and steps..."
                                  onBlur={async (e) => {
                                    if (!e.target.value) return;
                                    const plan = await apiService.addTreatmentPlan(id!, { content: e.target.value, authorId: profile!.uid, authorName: profile!.name });
                                    setTreatmentPlans(p => [plan, ...p]);
                                    e.target.value = '';
                                    
                                    // Auto-move to treatment stage
                                    if (patient?.workflowStatus === 'consultation') {
                                      const updated = await apiService.updatePatientWorkflowStatus(id!, 'treatment');
                                      setPatient(updated);
                                    }
                                  }}
                                />
                              )}
                              <div className="space-y-3">
                                 {treatmentPlans.map(tp => (
                                   <div key={tp.id} className="p-4 bg-white border border-gray-100 rounded-xl">
                                      <p className="text-sm text-gray-700">{tp.content}</p>
                                      <p className="text-[10px] text-gray-400 mt-2 font-bold">{tp.authorName} • {formatDate(tp.createdAt)}</p>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <ClipboardCheck size={14} /> Clinical Review
                           </h4>
                           {isDoctor && (
                             <textarea 
                               className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium h-48 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                               placeholder="Note findings from today's physical exam or review..."
                               onBlur={async (e) => {
                                 if (!e.target.value) return;
                                 const rev = await apiService.addReview(id!, { content: e.target.value, authorId: profile!.uid, authorName: profile!.name });
                                 setReviews(r => [rev, ...r]);
                                 e.target.value = '';

                                 // Auto-move to treatment stage after review
                                 if (patient?.workflowStatus === 'consultation') {
                                   const updated = await apiService.updatePatientWorkflowStatus(id!, 'treatment');
                                   setPatient(updated);
                                 }
                               }}
                             />
                           )}
                           <div className="space-y-3">
                              {reviews.map(rv => (
                                <div key={rv.id} className="p-4 bg-white border border-gray-100 rounded-xl">
                                   <p className="text-sm text-gray-700">{rv.content}</p>
                                   <p className="text-[10px] text-gray-400 mt-2 font-bold">{rv.authorName} • {formatDate(rv.createdAt)}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                 {activeTab === 'appointments' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Scheduled Visits</h3>
                       <button 
                         onClick={() => setShowAppointmentModal(true)}
                         className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg"
                       >
                         Book Return Visit
                       </button>
                    </div>

                    <div className="space-y-4">
                       {appointments.map(app => (
                         <div key={app.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-12 h-12 rounded-xl flex items-center justify-center",
                                 app.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                                 app.status === 'cancelled' ? "bg-red-100 text-red-600" :
                                 "bg-blue-100 text-blue-600"
                               )}>
                                  <CalendarDays size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{app.type.replace('_', ' ')} with {app.doctorName || 'Any Staff'}</p>
                                  <p className="text-xs font-bold text-gray-400 capitalize">{formatDate(app.dateTime)} @ {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                 app.status === 'scheduled' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                 app.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                 "bg-red-50 border-red-100 text-red-600"
                               )}>
                                 {app.status}
                               </span>
                               {app.status === 'scheduled' && (
                                 <button 
                                   onClick={async () => {
                                     await apiService.updateAppointment(app.id, { status: 'cancelled' });
                                     setAppointments(as => as.map(a => a.id === app.id ? {...a, status: 'cancelled'} : a));
                                   }}
                                   className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest underline decoration-red-100"
                                 >
                                   Cancel
                                 </button>
                               )}
                            </div>
                         </div>
                       ))}
                       {appointments.length === 0 && (
                         <div className="py-20 text-center flex flex-col items-center">
                            <CalendarDays size={48} className="text-gray-100 mb-4" />
                            <p className="text-gray-300 font-bold uppercase text-xs tracking-widest">No appointments booked yet</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Financial Records</h3>
                       <button 
                         onClick={handleCreateBill}
                         className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black"
                       >
                         Generate New Invoice
                       </button>
                    </div>

                    <div className="space-y-6">
                       {bills.map(bill => (
                         <div key={bill.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <div className="flex justify-between items-start mb-6">
                               <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #{bill.id.slice(-6)}</p>
                                  <p className="text-lg font-black text-gray-900">₦{bill.totalAmount.toLocaleString()}</p>
                               </div>
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                 bill.status === 'paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                               )}>
                                 {bill.status}
                               </span>
                            </div>
                            <div className="space-y-2">
                               {bill.items.map((item: any) => (
                                 <div key={item.id} className="flex justify-between text-xs font-bold py-2 border-b border-gray-200/50">
                                    <span className="text-gray-500">{item.description}</span>
                                    <span className="text-gray-900">₦{item.amount.toLocaleString()}</span>
                                 </div>
                               ))}
                            </div>
                            {bill.status === 'pending' && (
                              <button 
                                onClick={async () => {
                                  await apiService.payBill(bill.id);
                                  setBills(bs => bs.map(b => b.id === bill.id ? {...b, status: 'paid'} : b));
                                }}
                                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg"
                              >
                                Mark as Paid
                              </button>
                            )}
                         </div>
                       ))}
                       {bills.length === 0 && <p className="text-center py-12 text-gray-300 font-bold">No billing history found.</p>}
                    </div>
                  </motion.div>
                )}

                {(activeTab === 'labs' || activeTab === 'radiology') && (
                   <motion.div layout className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">{activeTab} Investigation Requests</h3>
                        <button 
                          onClick={() => {
                            setInvType(activeTab === 'labs' ? 'laboratory' : 'radiology');
                            setShowInvModal(true);
                          }}
                          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg"
                        >
                          <PlusCircle size={14} /> Request {activeTab === 'labs' ? 'Lab' : 'Scan'}
                        </button>
                      </div>
                      <div className="grid gap-4">
                        {investigations.filter(i => i.type === (activeTab === 'labs' ? 'laboratory' : 'radiology')).map(inv => (
                          <div key={inv.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-10 h-10 rounded-xl flex items-center justify-center",
                                 inv.status === 'completed' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                               )}>
                                  {inv.type === 'laboratory' ? <Activity size={20} /> : <FileSearch size={20} />}
                               </div>
                               <div>
                                  <p className="font-black text-gray-900">{inv.testName}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested by {inv.requestedBy} • {formatDate(inv.createdAt)}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <select 
                                 value={inv.status}
                                 onChange={(e) => handleUpdateInvestigation(inv.id, e.target.value)}
                                 className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer",
                                   inv.status === 'pending' ? "bg-yellow-100 text-yellow-700" : 
                                   inv.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                 )}
                               >
                                 <option value="pending">Pending</option>
                                 <option value="completed">Completed</option>
                                 <option value="reviewed">Reviewed</option>
                               </select>
                            </div>
                          </div>
                        ))}
                        {investigations.filter(i => i.type === (activeTab === 'labs' ? 'laboratory' : 'radiology')).length === 0 && (
                          <div className="p-12 text-center text-gray-300 font-bold">No investigations requested.</div>
                        )}
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

       <Modals 
        showVitalsModal={showVitalsModal} setShowVitalsModal={setShowVitalsModal}
        vitalsForm={vitalsForm} setVitalsForm={setVitalsForm} handleAddVitals={handleAddVitals}
        showAdmitModal={showAdmitModal} setShowAdmitModal={setShowAdmitModal}
        showDischargeModal={showDischargeModal} setShowDischargeModal={setShowDischargeModal}
        dischargeReason={dischargeReason} setDischargeReason={setDischargeReason}
        wards={wards} inventory={inventory} selectedWard={selectedWard} setSelectedWard={setSelectedWard}
        selectedBed={selectedBed} setSelectedBed={setSelectedBed} handleAdmit={handleAdmit}
        handleDischarge={handleDischarge}
        showInvModal={showInvModal} setShowInvModal={setShowInvModal}
        invType={invType} invTestName={invTestName} setInvTestName={setInvTestName}
        handleAddInvestigation={handleAddInvestigation}
        showRxModal={showRxModal} setShowRxModal={setShowRxModal}
        rxForm={rxForm} setRxForm={setRxForm} handleAddPrescription={handleAddPrescription}
        interactionWarning={interactionWarning} setInteractionWarning={setInteractionWarning}
        handleRxFormChange={handleRxFormChange}
      />

      {/* Appointment Modal */}
      <AnimatePresence>
        {showAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAppointmentModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <ClipboardCheck size={32} />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">Next Consultation Appointment</h3>
               <p className="text-sm font-medium text-gray-500 mb-8">Set when the patient should come back for consultation.</p>

               <div className="space-y-6">
                 <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Return Date for Consultation</label>
                   <input 
                     type="date"
                     className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-100"
                     value={nextAppointment}
                     onChange={(e) => setNextAppointment(e.target.value)}
                   />
                 </div>

                 <div className="flex gap-4">
                   <button onClick={() => setShowAppointmentModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                   <button 
                    disabled={isUpdatingAppointment || !nextAppointment}
                    onClick={handleUpdateAppointment} 
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg"
                   >
                     {isUpdatingAppointment ? 'Saving...' : 'Set Appointment'}
                   </button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

{/* Modals Section */}
function Modals({ 
  showVitalsModal, setShowVitalsModal, vitalsForm, setVitalsForm, handleAddVitals,
  showAdmitModal, setShowAdmitModal, showDischargeModal, setShowDischargeModal, 
  dischargeReason, setDischargeReason,
  wards, inventory, selectedWard, setSelectedWard, selectedBed, setSelectedBed, handleAdmit, handleDischarge,
  showInvModal, setShowInvModal, invType, invTestName, setInvTestName, handleAddInvestigation,
  showRxModal, setShowRxModal, rxForm, setRxForm, handleAddPrescription,
  interactionWarning, setInteractionWarning, handleRxFormChange
}: any) {
  return (
    <>
      {/* Discharge Confirmation Modal */}
      <AnimatePresence>
        {showDischargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowDischargeModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden text-center"
             >
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <LogOut size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Discharge</h3>
                <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
                   Are you sure you want to discharge this patient? This will free up their assigned bed and mark the admission as completed.
                </p>

                <div className="mb-8 text-left">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Reason for Discharge</label>
                   <textarea 
                     value={dischargeReason}
                     onChange={(e) => setDischargeReason(e.target.value)}
                     placeholder="e.g. Treatment completed, Referral, Discharged against medical advice..."
                     className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none h-24 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all resize-none"
                   />
                </div>

                <div className="flex gap-4">
                   <button 
                     onClick={() => setShowDischargeModal(false)} 
                     className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-900 transition-colors"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={handleDischarge}
                     className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                      Confirm Discharge
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vitals Modal */}
      <AnimatePresence>
        {showVitalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowVitalsModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                      <Activity size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Record Vitals</h3>
                     <p className="text-xs font-bold text-gray-400">Current clinical observations</p>
                   </div>
                </div>

                <form onSubmit={handleAddVitals} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BP (Systolic/Diastolic)</label>
                        <input 
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="e.g. 120/80"
                          value={vitalsForm.bp}
                          onChange={(e) => setVitalsForm({...vitalsForm, bp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pulse (bpm)</label>
                        <input 
                          type="number"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="72"
                          value={vitalsForm.pulse}
                          onChange={(e) => setVitalsForm({...vitalsForm, pulse: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temp (°C)</label>
                        <input 
                          type="number" step="0.1"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="36.5"
                          value={vitalsForm.temp}
                          onChange={(e) => setVitalsForm({...vitalsForm, temp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SpO2 (%)</label>
                        <input 
                          type="number"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="98"
                          value={vitalsForm.spo2}
                          onChange={(e) => setVitalsForm({...vitalsForm, spo2: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resp (cpm)</label>
                        <input 
                          type="number"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="18"
                          value={vitalsForm.resp}
                          onChange={(e) => setVitalsForm({...vitalsForm, resp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight (kg)</label>
                        <input 
                          type="number" step="0.1"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="70.0"
                          value={vitalsForm.weight}
                          onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowVitalsModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-100">Save Observations</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admission Modal */}
      <AnimatePresence>
        {showAdmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAdmitModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                      <BedDouble size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Patient Admission</h3>
                     <p className="text-xs font-bold text-gray-400">Assign ward and bed number</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Ward</label>
                      <select 
                        value={selectedWard}
                        onChange={(e) => {
                          setSelectedWard(e.target.value);
                          setSelectedBed('');
                        }}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none ring-2 ring-gray-100 focus:ring-blue-100"
                      >
                         <option value="">Choose a ward...</option>
                         {wards.map((w: Ward) => (
                           <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                         ))}
                      </select>
                   </div>

                   {selectedWard && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Beds</label>
                        <div className="grid grid-cols-4 gap-3">
                           {wards.find((w: Ward) => w.id === selectedWard)?.beds.filter((b: Bed) => b.status === 'vacant').map((b: Bed) => (
                             <button
                               key={b.id}
                               onClick={() => setSelectedBed(b.id)}
                               className={cn(
                                 "py-3 rounded-xl text-xs font-black transition-all",
                                 selectedBed === b.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-100 text-gray-400 border border-transparent hover:border-gray-200"
                               )}
                             >
                               {b.id}
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAdmitModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button 
                        onClick={handleAdmit}
                        disabled={!selectedBed}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-100 disabled:opacity-50"
                      >
                        Confirm Admission
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Investigation Modal */}
      <AnimatePresence>
        {showInvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowInvModal(false)}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden"
             >
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      {invType === 'laboratory' ? <Activity size={24} /> : <FileSearch size={24} />}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-gray-900">Request {invType === 'laboratory' ? 'Laboratory Test' : 'Radiology Scan'}</h3>
                     <p className="text-xs font-medium text-gray-500">Official request for diagnostic services.</p>
                   </div>
                </div>

                <form onSubmit={handleAddInvestigation} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test/Scan Name</label>
                     <input 
                       autoFocus
                       className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                       placeholder={invType === 'laboratory' ? "e.g., FBC, Blood Sugar, Urinalysis" : "e.g., Chest X-Ray, Pelvic CT Scan"}
                       value={invTestName}
                       onChange={(e) => setInvTestName(e.target.value)}
                     />
                   </div>
                   <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowInvModal(false)}
                        className="flex-1 py-3 text-sm font-black text-gray-400 hover:text-gray-600"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100"
                      >
                         Send Request
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Prescription Modal */}
      <AnimatePresence>
        {showRxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowRxModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl">
                      <Pill size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">New Prescription</h3>
                     <p className="text-xs font-bold text-gray-400">Add pharmacotherapy details</p>
                   </div>
                </div>

                <form onSubmit={handleAddPrescription} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medication Name (from Pharmacy Inventory)</label>
                      <div className="relative">
                        <input 
                          required
                          list="medications-list"
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-orange-100 outline-none" 
                          placeholder="Search or type medication..."
                          value={rxForm.medication}
                          onChange={(e) => handleRxFormChange('medication', e.target.value)}
                        />
                        <datalist id="medications-list">
                          {inventory.map(item => {
                            const isLowStock = item.stockLevel <= 10 && item.stockLevel > 0;
                            const isOutOfStock = item.stockLevel === 0;
                            const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                            const isExpired = expiryDate && expiryDate.getTime() < new Date().getTime();
                            const statusLabel = isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK';
                            const expiryLabel = isExpired ? 'EXPIRED' : item.expiryDate ? `Exp: ${formatDate(item.expiryDate)}` : '';
                            
                            return (
                              <option key={item.id} value={item.name}>
                                {item.category} • {statusLabel} ({item.stockLevel} {item.unit}) • {expiryLabel}
                              </option>
                            );
                          })}
                        </datalist>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                          <Search size={16} />
                        </div>
                      </div>
                      {interactionWarning && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl"
                        >
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <p className="text-[10px] font-black uppercase leading-tight">{interactionWarning}</p>
                        </motion.div>
                      )}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dosage</label>
                        <input 
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="500mg"
                          value={rxForm.dosage}
                          onChange={(e) => setRxForm({...rxForm, dosage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</label>
                        <input 
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="TDS (3x daily)"
                          value={rxForm.frequency}
                          onChange={(e) => setRxForm({...rxForm, frequency: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</label>
                      <input 
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        placeholder="5 days"
                        value={rxForm.duration}
                        onChange={(e) => setRxForm({...rxForm, duration: e.target.value})}
                      />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowRxModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl text-sm font-black shadow-lg">Prescribe</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
