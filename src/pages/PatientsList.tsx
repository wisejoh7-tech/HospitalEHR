import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Patient } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  MoreVertical,
  Calendar,
  User as UserIcon,
  Hospital, 
  Database,
  Trash2,
  Fingerprint,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function PatientsList() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inpatient' | 'outpatient' | 'discharged'>('all');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const list = await apiService.getPatients();
        setPatients(list);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
  }, []);

  const seedPatient = async () => {
    await apiService.seedData();
    window.location.reload();
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}? This will permanently remove all their medical records, billing history, and results.`)) {
      try {
        await apiService.deletePatient(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleFingerprintScan = async () => {
    const inputFingerprint = prompt("Scan Fingerprint (Simulated: Enter Fingerprint ID)");
    if (!inputFingerprint) return;

    setScanning(true);
    setScanResult(null);
    
    setTimeout(async () => {
      try {
        const patient = await apiService.findPatientByFingerprint(inputFingerprint);
        
        if (patient) {
          setScanResult(`Patient Found: ${patient.name}`);
          setTimeout(() => {
            navigate(`/patients/${patient.id}`);
          }, 1500);
        } else {
          setScanResult("No matching records found. Please register patient biometric data.");
        }
      } catch (err: any) {
        setScanResult(err.message || "No matching records found.");
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Electronic Health Records</h1>
          <p className="text-gray-500 font-medium">Manage patient histories, active care plans and demographic data.</p>
        </div>
          <div className="flex items-center gap-3">
            {(profile?.role === 'admin' || profile?.role === 'record' || profile?.role === 'nurse') && (
              <button 
                onClick={() => navigate('/admission')}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <UserPlus size={18} />
                New Admission
              </button>
            )}
            {(profile?.role === 'admin' || profile?.role === 'record') && (
              <>
                <button 
                  onClick={() => navigate('/patients/register')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <Plus size={18} />
                  New Registration
                </button>
                <button 
                  onClick={() => setShowBiometricModal(true)}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all"
                >
                  <Fingerprint size={18} />
                  Biometric Search
                </button>
              </>
            )}
          <button 
            onClick={seedPatient}
            className="p-2.5 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:text-indigo-800 shadow-sm transition-all"
            title="Seed Sample Patient"
          >
            <Database size={18} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm transition-all"
            />
          </div>
        </div>
      </header>

      {/* Biometric Identification Modal */}
      <AnimatePresence>
        {showBiometricModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !scanning && setShowBiometricModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden text-center"
            >
               <div className="relative w-32 h-32 mx-auto mb-8">
                  <motion.div 
                    animate={scanning ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={cn(
                      "w-full h-full rounded-3xl flex items-center justify-center transition-colors",
                      scanning ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400"
                    )}
                  >
                    <Fingerprint size={64} />
                  </motion.div>
                  {scanning && (
                    <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] z-10"
                    />
                  )}
               </div>

               <h3 className="text-xl font-black text-gray-900 mb-2">
                 {scanning ? 'Scanning Biometrics...' : 'Biometric Identification'}
               </h3>
               <p className="text-sm font-medium text-gray-500 mb-8 px-4">
                 {scanning ? 'Please hold your finger on the scanner.' : 'Place a registered finger on the scanner device to identify patient.'}
               </p>

               {scanResult && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={cn(
                     "p-4 rounded-xl text-xs font-black uppercase mb-8",
                     scanResult.includes('Found') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                   )}
                 >
                   {scanResult}
                 </motion.div>
               )}

               <div className="flex gap-4">
                  {!scanning && (
                    <>
                      <button 
                        onClick={() => setShowBiometricModal(false)}
                        className="flex-1 py-4 text-sm font-black text-gray-400"
                      >
                        Close
                      </button>
                      <button 
                        onClick={handleFingerprintScan}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg"
                      >
                        Start Scan
                      </button>
                    </>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          <div className="relative flex items-center bg-white border border-gray-100 rounded-xl px-3 shadow-sm">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-2 pr-2 py-2.5 text-xs font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="inpatient">Inpatient</option>
              <option value="outpatient">Outpatient</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Demographics</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Next of Kin</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Current Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Admission Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((patient, i) => (
              <motion.tr 
                key={patient.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-lg overflow-hidden">
                      {patient.photoUrl ? (
                        <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                      ) : (
                        patient.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 leading-none mb-1">{patient.name}</p>
                      <p className="text-xs font-bold text-gray-400 tracking-tighter uppercase">{patient.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 capitalize">
                       <UserIcon size={14} className="text-gray-300" />
                       {patient.gender} • {new Date().getFullYear() - new Date(patient.dob).getFullYear()} Yrs
                    </div>
                    <p className="text-xs font-bold text-gray-400">Blood Group: {patient.bloodGroup || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-900">{patient.nextOfKinName || 'N/A'}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                       {patient.nextOfKinRelationship && <span>{patient.nextOfKinRelationship}</span>}
                       {patient.nextOfKinPhone && (
                         <>
                           <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                           <span>{patient.nextOfKinPhone}</span>
                         </>
                       )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    patient.status === 'inpatient' ? "bg-blue-100 text-blue-700" : 
                    patient.status === 'discharged' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", patient.status === 'inpatient' ? "bg-blue-500" : "bg-green-500")} />
                    {patient.status}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                    <Calendar size={14} />
                    {formatDate(patient.admissionDate)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={(e) => handleDelete(e, patient.id, patient.name)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Patient"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Users size={32} />
            </div>
            <h3 className="font-bold text-gray-900">No Patients Found</h3>
            <p className="text-gray-500 max-w-xs text-sm">No records match your search criteria. Try a different name or patient ID.</p>
          </div>
        )}
      </div>
    </div>
  );
}
