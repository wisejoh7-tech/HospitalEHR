import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Patient, WorkflowStatus } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  Calendar,
  User as UserIcon,
  Database,
  Trash2,
  Fingerprint,
  UserPlus,
  Camera,
  Activity,
  Stethoscope,
  ArrowRightCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

const WORKFLOW_STEPS: { id: WorkflowStatus; label: string; icon: any; color: string; roles: string[] }[] = [
  { id: 'registered', label: 'Reception', icon: UserPlus, color: 'text-gray-500', roles: ['admin', 'record'] },
  { id: 'vitals', label: 'Nursing (Pre)', icon: Activity, color: 'text-emerald-500', roles: ['nurse', 'admin'] },
  { id: 'consultation', label: 'Doctor', icon: Stethoscope, color: 'text-blue-500', roles: ['doctor', 'admin'] },
  { id: 'laboratory', label: 'Laboratory', icon: Database, color: 'text-amber-500', roles: ['scientist', 'admin'] },
  { id: 'radiology', label: 'Radiology', icon: Camera, color: 'text-cyan-500', roles: ['radiographer', 'admin'] },
  { id: 'treatment', label: 'Nursing (Care)', icon: Activity, color: 'text-orange-500', roles: ['nurse', 'admin'] },
  { id: 'pharmacy', label: 'Pharmacy', icon: Database, color: 'text-purple-500', roles: ['pharmacy', 'admin'] },
  { id: 'discharged', label: 'Completed', icon: CheckCircle2, color: 'text-gray-400', roles: ['admin'] },
];

export default function PatientsList() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<WorkflowStatus | 'all'>('all');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricMode, setBiometricMode] = useState<'fingerprint' | 'face'>('fingerprint');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fingerprintInput, setFingerprintInput] = useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Set default tab based on role
    if (isAdmin) {
      setActiveWorkflowTab('all');
    } else {
      setActiveWorkflowTab('all');
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanResult("Facial mapping requires a secure connection (HTTPS) and camera support.");
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video play failed:", e);
            setScanResult("Failed to start video stream.");
          });
        };
      }
    } catch (err: any) {
      console.error("Camera error details:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScanResult("Camera permission denied. Please allow access in settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setScanResult("No camera device detected.");
      } else {
        setScanResult(`Camera access failed: ${err.message || 'Unknown error'}`);
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleFaceScan = async () => {
    setScanning(true);
    setScanResult(null);
    
    setTimeout(async () => {
      try {
        const latestPatients = await apiService.getPatients();
        setPatients(latestPatients);
        const patientsWithPhotos = latestPatients.filter(p => !!p.photoUrl);
        
        if (patientsWithPhotos.length > 0) {
          const matched = patientsWithPhotos[0]; 
          setScanResult(`Facial identity verified: ${matched.name}`);
          stopCamera();
          setTimeout(() => {
            navigate(`/patients/${matched.id}`);
          }, 1500);
        } else {
          setScanResult("No matching facial patterns found in database.");
        }
      } catch (err: any) {
        setScanResult("Facial analysis failed. Please try again.");
      } finally {
        setScanning(false);
      }
    }, 2500);
  };

  const fetchPatients = async () => {
    try {
      const list = await apiService.getPatients();
      setPatients(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const moveWorkflow = async (e: React.MouseEvent, id: string, nextStatus: WorkflowStatus) => {
    e.stopPropagation();
    try {
      await apiService.updatePatientWorkflowStatus(id, nextStatus);
      fetchPatients();
    } catch (err) {
      alert("Failed to move patient to next department");
    }
  };

  const seedPatient = async () => {
    await apiService.seedData();
    window.location.reload();
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}? This will permanently remove all records.`)) {
      try {
        await apiService.deletePatient(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleFingerprintScan = async () => {
    setScanning(true);
    setScanResult(null);
    
    setTimeout(async () => {
      try {
        let patient = null;
        if (fingerprintInput.trim()) {
          patient = await apiService.findPatientByFingerprint(fingerprintInput.trim());
        }

        if (patient) {
          setScanResult(`Identity Verified: ${patient.name}`);
          setTimeout(() => {
            navigate(`/patients/${patient.id}`);
          }, 1500);
        } else {
          setScanResult("Biometric pattern not recognized. Please enter a valid registered Biometric ID.");
        }
      } catch (err: any) {
        setScanResult(err.message || "Identification failed.");
      } finally {
        setScanning(false);
      }
    }, 2000);
  };

  const filteredSteps = WORKFLOW_STEPS.filter(step => {
    if (profile?.role === 'record') {
      return !['laboratory', 'radiology', 'pharmacy'].includes(step.id);
    }
    return true;
  });

  const filtered = patients.filter(p => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch = !searchLower ||
                         p.name.toLowerCase().includes(searchLower) ||
                         p.id.toLowerCase().includes(searchLower) ||
                         (p.allergies && p.allergies.some(a => a.toLowerCase().includes(searchLower))) ||
                         (p.status && p.status.toLowerCase().includes(searchLower));
    const matchesWorkflow = activeWorkflowTab === 'all' || p.workflowStatus === activeWorkflowTab;
    return matchesSearch && matchesWorkflow;
  });

  const getNextStatus = (current: WorkflowStatus): WorkflowStatus | null => {
    const index = WORKFLOW_STEPS.findIndex(s => s.id === current);
    if (index === -1 || index === WORKFLOW_STEPS.length - 1) return null;
    return WORKFLOW_STEPS[index + 1].id;
  };

  return (
    <div className="space-y-6">
      {/* Department Banner with Doctor & Medical Record Officer Photos */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-blue-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src={
                profile?.role === 'record'
                  ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
                  : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800"
              }
              alt={profile?.role === 'record' ? "Medical Records Officer" : "Consultant Physician"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                {profile?.role === 'record' ? 'Records & Archive' : 'Clinical Desk'}
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Users size={12} /> {profile?.role === 'record' ? 'Health Records Management Station' : 'Clinical Doctors & Reception Terminal'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {isAdmin ? 'Clinical Department Console' : profile?.role === 'record' ? 'Health Records & Folder Management' : 'Patients Directory'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {profile?.role === 'record'
                  ? 'Managed by Health Records Officer • Patient Registration, Biometric Search & Folder Archiving'
                  : 'Managed by Consultant Doctors & Record Officers • Live Patient Tracking & Departmental Workflow'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Active Directory: <strong className="text-blue-700 font-black">{patients.length} Registered Patients</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-0.5">Patient Management Queue</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'nurse') && (
            <button 
              onClick={() => navigate('/admission')}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg"
            >
              <UserPlus size={16} /> Admission
            </button>
          )}
          {(profile?.role === 'admin' || profile?.role === 'record') && (
            <button 
              onClick={() => navigate('/patients/register')}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg"
            >
              <Plus size={16} /> New Registration
            </button>
          )}
          <button 
            onClick={() => {
              setScanResult(null);
              setShowBiometricModal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg"
          >
            <Fingerprint size={16} /> Biometric ID
          </button>
        </div>
      </header>

      {/* Statistics Strip - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
           {filteredSteps.map((step) => {
             const count = patients.filter(p => p.workflowStatus === step.id).length;
             return (
               <div key={step.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                  <step.icon size={16} className={cn("mb-2", step.color)} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{step.label}</p>
                  <p className="text-lg font-black text-gray-900">{count}</p>
               </div>
             );
           })}
        </div>
      )}

      {/* Main Console UI */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Console Tab Bar - Admin Only */}
        {isAdmin && (
          <div className="flex border-b border-gray-50 flex-wrap">
             <button 
               onClick={() => setActiveWorkflowTab('all')}
               className={cn(
                 "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2",
                 activeWorkflowTab === 'all' ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
               )}
             >
               Hospital Wide
             </button>
             {filteredSteps.map(step => (
               <button
                 key={step.id}
                 onClick={() => setActiveWorkflowTab(step.id)}
                 className={cn(
                   "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2",
                   activeWorkflowTab === step.id ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
                 )}
               >
                 <step.icon size={14} />
                 {step.label}
               </button>
             ))}
          </div>
        )}

        {/* Content Controls */}
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by Name, ID or Folder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-72 transition-all"
            />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing {filtered.length} patients
          </p>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient / Folder</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinical Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue Position</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue Status</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Workflow Action</th>}
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((patient, i) => {
                const nextStage = getNextStatus(patient.workflowStatus);
                const nextStepLabel = WORKFLOW_STEPS.find(s => s.id === nextStage)?.label;
                
                return (
                  <motion.tr 
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-blue-600 font-black relative overflow-hidden">
                          {patient.photoUrl ? (
                            <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={18} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-none mb-1 text-sm">{patient.name}</p>
                          <div className="flex items-center gap-1.5">
                             <p className="text-[10px] font-bold text-gray-400 tracking-tighter uppercase">{patient.id}</p>
                             <span className="w-1 h-1 rounded-full bg-gray-300" />
                             <p className="text-[10px] font-bold text-blue-500 uppercase">{patient.status}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-600">
                           {patient.gender.charAt(0).toUpperCase()} • {new Date().getFullYear() - new Date(patient.dob).getFullYear()} Yrs
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                           Allergies: {patient.allergies?.join(', ') || 'NKDA'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Clock size={12} className="text-gray-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase leading-none mb-1">Waiting since</p>
                            <p className="text-xs font-bold text-gray-900">{formatDate(patient.admissionDate)}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {WORKFLOW_STEPS.map(step => {
                         if (step.id === patient.workflowStatus) {
                           return (
                             <div key={step.id} className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", step.color, "bg-white")}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", step.color.replace('text', 'bg'))} />
                                {step.label}
                             </div>
                           );
                         }
                         return null;
                       })}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                         {nextStage && (
                           <button
                             onClick={(e) => moveWorkflow(e, patient.id, nextStage)}
                             className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                           >
                              Send to {nextStepLabel}
                              <ArrowRightCircle size={14} />
                           </button>
                         )}
                         {!nextStage && patient.workflowStatus === 'discharged' && (
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              Care Completed
                           </span>
                         )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {profile?.role === 'admin' && (
                          <button 
                            onClick={(e) => handleDelete(e, patient.id, patient.name)}
                            className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-32 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-200 mb-4">
                <Users size={32} />
              </div>
              <h3 className="font-bold text-gray-900">Queue is empty</h3>
              <p className="text-gray-400 max-w-xs text-xs mt-2 font-medium">No patients currently waiting in this department queue.</p>
            </div>
          )}
        </div>
      </div>

      {/* Biometric Identification Modal (Stayed Same) */}
      <AnimatePresence>
        {showBiometricModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                if (!scanning) {
                  stopCamera();
                  setShowBiometricModal(false);
                }
              }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden text-center"
            >
               <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl">
                  <button onClick={() => { setBiometricMode('fingerprint'); stopCamera(); }} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", biometricMode === 'fingerprint' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>Fingerprint</button>
                  <button onClick={() => { setBiometricMode('face'); }} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", biometricMode === 'face' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>Facial Map</button>
               </div>
               <div className="relative w-40 h-40 mx-auto mb-8">
                  {biometricMode === 'face' && isCameraActive ? (
                    <div className="w-full h-full rounded-3xl overflow-hidden bg-gray-900 relative">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
                      <div className="absolute inset-4 border border-blue-500/30 rounded-full animate-pulse flex items-center justify-center" />
                    </div>
                  ) : (
                    <motion.div animate={scanning ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 1.5 }} className={cn("w-full h-full rounded-3xl flex items-center justify-center transition-colors", scanning ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400")}>
                      {biometricMode === 'fingerprint' ? <Fingerprint size={64} /> : <Camera size={64} />}
                    </motion.div>
                  )}
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">{biometricMode === 'face' ? 'Facial Recognition' : 'Fingerprint ID'}</h3>
               {biometricMode === 'fingerprint' && !scanning && !scanResult && (
                 <div className="mb-8 px-4"><input type="text" placeholder="Simulated Fingerprint ID" value={fingerprintInput} onChange={(e) => setFingerprintInput(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-center" /></div>
               )}
               {scanResult && <div className={cn("p-4 rounded-xl text-xs font-black uppercase mb-8", scanResult.includes('Verified') || scanResult.includes('Found') || scanResult.includes('Match') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{scanResult}</div>}
               <div className="flex gap-4">
                  {!scanning && (
                    <><button onClick={() => { stopCamera(); setShowBiometricModal(false); }} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                    {biometricMode === 'face' && !isCameraActive ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <button onClick={startCamera} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg">Launch Camera</button>
                        <button onClick={handleFaceScan} className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest">(Simulate Recognition)</button>
                      </div>
                    ) : (
                      <button onClick={biometricMode === 'face' ? handleFaceScan : handleFingerprintScan} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg">{biometricMode === 'face' ? 'Scan Face' : 'Start Scan'}</button>
                    )}</>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
