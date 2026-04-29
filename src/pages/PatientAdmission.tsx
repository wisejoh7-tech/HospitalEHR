import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Patient, Ward, Bed } from '../types';
import { 
  Building2, 
  Bed as BedIcon, 
  MapPin, 
  UserPlus, 
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function PatientAdmission() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsList, wardsList] = await Promise.all([
          apiService.getPatients(),
          apiService.getWards()
        ]);
        // Only show outpatients for admission
        setPatients(patientsList.filter(p => p.status === 'outpatient'));
        setWards(wardsList);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdmit = async () => {
    if (!selectedPatient || !selectedWardId || !selectedBedId) return;
    
    setIsSubmitting(true);
    try {
      await apiService.admitPatient(selectedPatient.id, selectedWardId, selectedBedId);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${selectedPatient.id}`);
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const selectedWard = wards.find(w => w.id === selectedWardId);
  const availableBeds = selectedWard?.beds?.filter(b => b.status === 'vacant') || [];

  const [showQuickWard, setShowQuickWard] = useState(false);
  const [showQuickBed, setShowQuickBed] = useState(false);
  const [newWard, setNewWard] = useState({ name: '', type: '', capacity: '5' });
  const [bedCount, setBedCount] = useState('1');

  const handleQuickWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ward = await apiService.createWard({
        name: newWard.name,
        type: newWard.type,
        capacity: parseInt(newWard.capacity)
      });
      const updatedWards = await apiService.getWards();
      setWards(updatedWards);
      setSelectedWardId(ward.id);
      setShowQuickWard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWardId) return;
    try {
      await apiService.addBeds(selectedWardId, parseInt(bedCount));
      const updatedWards = await apiService.getWards();
      setWards(updatedWards);
      setShowQuickBed(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">Admission Successful</h2>
      <p className="text-gray-500 font-medium">Redirecting to patient profile...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Patient Admission Portal</h1>
        <p className="text-gray-500 font-medium tracking-tight">Assign outpatients to specialist wards and available beds.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Select Patient */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">1</div>
            <h2 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Select Patient</h2>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Find patient..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSuccess(false);
                  }}
                  className={cn(
                    "w-full p-4 text-left hover:bg-blue-50/50 transition-all flex items-center justify-between group",
                    selectedPatient?.id === patient.id && "bg-blue-50"
                  )}
                >
                  <div>
                    <p className="font-black text-sm text-gray-900">{patient.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{patient.id}</p>
                  </div>
                  <ChevronRight size={16} className={cn(
                    "text-gray-300 group-hover:text-blue-500 transition-colors",
                    selectedPatient?.id === patient.id && "text-blue-600"
                  )} />
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-xs font-bold">
                   No eligible patients found.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Select Ward & Bed */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">2</div>
            <h2 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Assign Ward & Bed</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
            {/* Ward List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Wards</p>
                  <button 
                    onClick={() => setShowQuickWard(true)}
                    className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                  >
                    + NEW WARD
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {wards.map(ward => (
                    <button
                      key={ward.id}
                      onClick={() => {
                        setSelectedWardId(ward.id);
                        setSelectedBedId(null);
                      }}
                      className={cn(
                        "w-full p-6 text-left hover:bg-blue-50/50 transition-all flex items-center gap-4 group",
                        selectedWardId === ward.id && "bg-blue-50"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        selectedWardId === ward.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-gray-900">{ward.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                          {ward.type} • {ward.beds?.filter(b => b.status === 'vacant').length} Slots
                        </p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Bed Grid */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Bed Slot</p>
                  <div className="flex items-center gap-3">
                    {selectedWardId && (
                      <button 
                        onClick={() => setShowQuickBed(true)}
                        className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                      >
                        + Add Bed
                      </button>
                    )}
                    {selectedWardId && (
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                         {availableBeds.length} Vacant
                      </span>
                    )}
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4">
                  {!selectedWardId ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                       <MapPin size={32} className="text-gray-100 mb-2" />
                       <p className="text-xs font-bold text-gray-400">Select a ward first to see available beds</p>
                    </div>
                  ) : availableBeds.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                       <AlertCircle size={32} className="text-amber-200 mb-2" />
                       <p className="text-xs font-bold text-amber-500">No vacant beds in this ward</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                       {availableBeds.map(bed => (
                         <button
                           key={bed.id}
                           onClick={() => setSelectedBedId(bed.id)}
                           className={cn(
                             "p-4 rounded-xl border text-center transition-all group",
                             selectedBedId === bed.id 
                               ? "bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-100" 
                               : "bg-white border-gray-100 hover:border-blue-200 text-gray-400 hover:text-blue-500"
                           )}
                         >
                           <BedIcon size={20} className="mx-auto mb-2" />
                           <p className="text-[9px] font-black uppercase tracking-tight">Bed</p>
                           <p className="text-[10px] font-black truncate">#{bed.id.slice(-4)}</p>
                         </button>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Action */}
      <footer className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center border-2",
                 selectedPatient ? "bg-blue-100 border-blue-200 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-300"
               )}>
                  <UserPlus size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</p>
                  <p className="text-sm font-black text-gray-900">{selectedPatient?.name || '---'}</p>
               </div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="flex items-center gap-3">
               <div className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center border-2",
                 selectedBedId ? "bg-blue-100 border-blue-200 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-300"
               )}>
                  <MapPin size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                  <p className="text-sm font-black text-gray-900">
                    {selectedWard?.name || '---'} {selectedBedId ? `(Bed #${selectedBedId.slice(-4)})` : ''}
                  </p>
               </div>
            </div>
         </div>

         <button 
           disabled={!selectedPatient || !selectedWardId || !selectedBedId || isSubmitting}
           onClick={handleAdmit}
           className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
         >
           {isSubmitting ? 'Processing Admission...' : 'Confirm Admission'} <ChevronRight size={18} />
         </button>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showQuickWard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowQuickWard(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                      <Building2 size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Add Ward</h3>
                   </div>
                </div>

                <form onSubmit={handleQuickWard} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                      <input 
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        placeholder="e.g. Intensive Care Unit"
                        value={newWard.name}
                        onChange={(e) => setNewWard({...newWard, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                      <select 
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        value={newWard.type}
                        onChange={(e) => setNewWard({...newWard, type: e.target.value})}
                      >
                         <option value="">Select Type</option>
                         <option value="General">General</option>
                         <option value="ICU">ICU</option>
                         <option value="Emergency">Emergency</option>
                         <option value="Maternity">Maternity</option>
                         <option value="Paediatrics">Paediatrics</option>
                      </select>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowQuickWard(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg">Create</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showQuickBed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowQuickBed(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                      <PlusCircle size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Add Bed Slot</h3>
                     <p className="text-xs font-bold text-gray-400">Add more beds to {selectedWard?.name}</p>
                   </div>
                </div>

                <form onSubmit={handleQuickBed} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Number of Beds</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        value={bedCount}
                        onChange={(e) => setBedCount(e.target.value)}
                      />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowQuickBed(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg">Confirm</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
