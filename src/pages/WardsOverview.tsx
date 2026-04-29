import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Ward, Bed, Patient } from '../types';
import { 
  Bed as BedIcon, 
  Map as MapIcon, 
  Building2, 
  ChevronRight,
  PlusCircle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function WardsOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';
  const isNurse = profile?.role === 'nurse';
  const canManage = isAdmin || isNurse;
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'maintenance'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newWard, setNewWard] = useState({ name: '', type: '', capacity: '' });
  const [bedCount, setBedCount] = useState('1');

  const fetchWards = async () => {
    try {
      const wardsList = await apiService.getWards();
      setWards(wardsList);
      if (wardsList.length > 0 && !selectedWardId) {
        setSelectedWardId(wardsList[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (!selectedWardId) {
      setBeds([]);
      return;
    }
    const ward = wards.find(w => w.id === selectedWardId);
    if (ward) {
      setBeds(ward.beds || []);
    }
  }, [selectedWardId, wards]);

  const handleAddWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createWard({
        name: newWard.name,
        type: newWard.type,
        capacity: parseInt(newWard.capacity)
      });
      setShowAddWardModal(false);
      setNewWard({ name: '', type: '', capacity: '' });
      fetchWards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWardId) return;
    try {
      await apiService.addBeds(selectedWardId, parseInt(bedCount));
      setShowAddBedModal(false);
      setBedCount('1');
      fetchWards();
    } catch (err) {
      console.error(err);
    }
  };

  const seedData = async () => {
    await apiService.seedData();
    window.location.reload();
  };

  const selectedWard = wards.find(w => w.id === selectedWardId);

  const filteredBeds = (selectedWard?.beds || []).filter(bed => 
    statusFilter === 'all' ? true : bed.status === statusFilter
  );

  const occupancyStats = {
    totalBeds: wards.reduce((sum, w) => sum + (w.beds?.length || 0), 0),
    occupiedBeds: wards.reduce((sum, w) => sum + (w.beds?.filter(b => b.status === 'occupied').length || 0), 0),
    maintenance: wards.reduce((sum, w) => sum + (w.beds?.filter(b => b.status === 'maintenance').length || 0), 0),
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Ward Management Terminal</h1>
          <p className="text-gray-500 font-medium tracking-tight">Real-time floor layout and patient bed assignments.</p>
        </div>
        <div className="flex gap-3">
          {canManage && (
            <>
              <button 
                onClick={() => setShowAddBedModal(true)}
                disabled={!selectedWardId}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-100 disabled:opacity-50 transition-all"
              >
                <PlusCircle size={16} /> Add Bed
              </button>
              <button 
                onClick={() => setShowAddWardModal(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-gray-100 hover:scale-105 active:scale-95 transition-all"
              >
                <PlusCircle size={16} /> Create Ward
              </button>
            </>
          )}
        </div>
      </header>

      {/* Occupancy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Facility Capacity</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-900">{occupancyStats.totalBeds}</h3>
            <span className="text-xs font-bold text-blue-500 mb-1">Total Beds</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Occupancy</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-900">{occupancyStats.occupiedBeds}</h3>
            <span className="text-xs font-bold text-gray-400 mb-1">Patients</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Utilization Rate</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-900">
              {occupancyStats.totalBeds > 0 ? Math.round((occupancyStats.occupiedBeds / occupancyStats.totalBeds) * 100) : 0}%
            </h3>
            <span className="text-xs font-bold text-green-500 mb-1">Live</span>
          </div>
        </div>
      </div>

      {/* Ward Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          {wards.map((ward) => (
            <button
              key={ward.id}
              onClick={() => setSelectedWardId(ward.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                selectedWardId === ward.id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
            >
              {ward.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           {(['all', 'vacant', 'occupied', 'maintenance'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {status}
              </button>
           ))}
        </div>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredBeds.map((bed) => (
            <motion.div
              key={bed.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px]",
                bed.status === 'vacant' && "bg-white border-gray-100 hover:border-blue-200",
                bed.status === 'occupied' && "bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-200",
                bed.status === 'maintenance' && "bg-red-50 border-red-100 text-red-600"
              )}
            >
              <div className="flex justify-between items-start">
                <div className={cn(
                  "p-2 rounded-lg",
                  bed.status === 'vacant' ? "bg-gray-50 text-gray-400" : "bg-white/20 text-white"
                )}>
                  <BedIcon size={20} />
                </div>
              </div>
              
              <div className="mt-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    bed.status === 'vacant' && "bg-green-500",
                    bed.status === 'occupied' && "bg-red-500",
                    bed.status === 'maintenance' && "bg-yellow-500"
                  )} />
                  <p className={cn("text-[9px] font-black uppercase tracking-wider opacity-60")}>
                    Bed #{bed.id.slice(-4)}
                  </p>
                </div>
                {bed.status === 'occupied' && bed.patient ? (
                   <div className="space-y-0.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${bed.patient?.id}`);
                        }}
                        className="font-black text-xs truncate hover:underline text-left w-full"
                      >
                        {bed.patient.name} <span className="opacity-60 text-[9px] ml-1 font-bold">#{bed.patient.id}</span>
                      </button>
                   </div>
                ) : (
                  <p className="font-black text-sm truncate">
                    {bed.status === 'vacant' ? "Available" : "Maintenance"}
                  </p>
                )}
              </div>

              {canManage && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextStatus = bed.status === 'maintenance' ? 'vacant' : 'maintenance';
                      if (bed.status !== 'occupied') {
                        apiService.toggleBedStatus(bed.id, nextStatus as any).then(() => fetchWards());
                      }
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-white transition-all",
                      bed.status === 'maintenance' ? "bg-green-500" : "bg-red-500",
                      bed.status === 'occupied' && "hidden"
                    )}
                    title={bed.status === 'maintenance' ? "Set as Vacant" : "Set as Maintenance"}
                  >
                    <div className="w-3 h-3 border-2 border-white rounded-full" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {wards.length === 0 && !loading && (
        <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
            <Building2 size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Wards Configured</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Configure hospital departments and beds to start managing admissions.</p>
            {canManage && <button onClick={() => setShowAddWardModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm">Add First Ward</button>}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddWardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddWardModal(false)}
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
                     <h3 className="text-xl font-black text-gray-900">New Ward</h3>
                     <p className="text-xs font-bold text-gray-400">Initialize a new department</p>
                   </div>
                </div>

                <form onSubmit={handleAddWard} className="space-y-6">
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department Type</label>
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
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Bed Count</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        placeholder="10"
                        value={newWard.capacity}
                        onChange={(e) => setNewWard({...newWard, capacity: e.target.value})}
                      />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddWardModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg">Create</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showAddBedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddBedModal(false)}
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
                     <h3 className="text-xl font-black text-gray-900">Add Beds</h3>
                     <p className="text-xs font-bold text-gray-400">Expanding {selectedWard?.name}</p>
                   </div>
                </div>

                <form onSubmit={handleAddBeds} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Number of New Beds</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                        placeholder="5"
                        value={bedCount}
                        onChange={(e) => setBedCount(e.target.value)}
                      />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddBedModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
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
