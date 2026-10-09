import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Ward, Patient } from '../types';
import { 
  Users, 
  Bed as BedIcon, 
  Activity, 
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  FileSearch,
  Pill,
  Tablets,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    occupancyRate: 0,
    activeCritical: 0,
    bedsAvailable: 0,
    pendingLabs: 0,
    pendingRadiology: 0,
    totalRevenue: 0,
    totalBilled: 0,
    totalPending: 0,
    totalDrugs: 0,
    expiredCount: 0,
    stockOutCount: 0,
    stockInCount: 0
  });

  const [recentAdmissions, setRecentAdmissions] = useState<Patient[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [staffByRole, setStaffByRole] = useState<Record<string, number>>({});
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);

  const navigate = useNavigate();

  const handleDeletePatient = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}? This will permanently remove all their medical records.`)) {
      try {
        await apiService.deletePatient(id);
        setRecentAdmissions(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Failed to delete patient.');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patients, wards, investigations, logs, allStaff, inventory, bills] = await Promise.all([
          apiService.getPatients(),
          apiService.getWards(),
          apiService.getInvestigations({ status: 'pending' }),
          apiService.getLogs(),
          apiService.getStaff(),
          apiService.getInventory(),
          apiService.getBills()
        ]);
        
        const active = patients.filter(p => p.status === 'inpatient');
        setRecentAdmissions(patients.slice(0, 5));
        setActivityLogs(logs.slice(0, 6));

        // Financials
        const revenue = bills
          .filter(b => b.status === 'paid')
          .reduce((sum, b) => sum + b.totalAmount, 0);
        
        const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalPending = bills
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + b.totalAmount, 0);

        // Inventory Metrics
        const now = new Date();
        const totalStock = inventory.reduce((sum, item) => sum + item.stockLevel, 0);
        const expired = inventory.filter(item => item.expiryDate && new Date(item.expiryDate) < now).length;
        const stockOut = inventory.filter(item => item.stockLevel === 0).length;
        const stockIn = inventory.filter(item => item.stockLevel > 0).length;

        // Inventory Alerts
        const alerts = inventory.filter((item: any) => {
          const isLowStock = item.stockLevel <= 10;
          const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
          const isExpiringSoon = expiryDate && expiryDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
          const isExpired = expiryDate && expiryDate.getTime() < new Date().getTime();
          return isLowStock || isExpiringSoon || isExpired;
        });
        setInventoryAlerts(alerts);

        // Staff distribution
        const distribution = allStaff.reduce((acc: any, staff: any) => {
          if (staff && staff.role) {
            acc[staff.role] = (acc[staff.role] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        setStaffByRole(distribution);

        const totalBeds = wards.reduce((sum, w) => sum + (w as any).beds.length, 0);
        const occupiedBeds = wards.reduce((sum, w) => {
          return sum + (w as any).beds.filter((b: any) => b.status === 'occupied').length;
        }, 0);

        setStats({
          totalPatients: active.length,
          activeCritical: patients.filter(p => p.bloodGroup === 'AB-').length,
          bedsAvailable: totalBeds - occupiedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          pendingLabs: investigations.filter(i => i.type === 'laboratory').length,
          pendingRadiology: investigations.filter(i => i.type === 'radiology').length,
          totalRevenue: revenue,
          totalBilled: totalBilled,
          totalPending: totalPending,
          totalDrugs: totalStock,
          expiredCount: expired,
          stockOutCount: stockOut,
          stockInCount: stockIn
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Total Inpatients', value: stats.totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Labs', value: stats.pendingLabs, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Radiology Wait', value: stats.pendingRadiology, icon: FileSearch, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Beds Available', value: stats.bedsAvailable, icon: BedIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const adminStats = [
    { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Billed', value: `₦${stats.totalBilled.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Outstanding', value: `₦${stats.totalPending.toLocaleString()}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Expired Drugs', value: stats.expiredCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            {profile?.role === 'admin' ? 'Administrative Overview' : 
             profile?.role === 'doctor' ? 'Clinical Dashboard' :
             profile?.role === 'pharmacy' ? 'Pharmacy Control' :
             profile?.role === 'lab' || profile?.role === 'radiology' ? 'Diagnostic Center' :
             profile?.role === 'record' ? 'Patient Records' : 'Facility Overview'}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-500 font-medium tracking-tight">Real-time health monitoring and facility occupancy.</p>
            {profile?.role === 'admin' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Finance + Inventory Active</span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(profile?.role === 'admin' ? adminStats : statCards).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
            </div>
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {profile?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Tablets size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Drug Units</p>
                <p className="text-xl font-black text-gray-900">{stats.totalDrugs.toLocaleString()}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Pill size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Items In Stock</p>
                <p className="text-xl font-black text-gray-900">{stats.stockInCount}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Out of Stock</p>
                <p className="text-xl font-black text-gray-900">{stats.stockOutCount}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Inpatients</p>
                <p className="text-xl font-black text-gray-900">{stats.totalPatients}</p>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Alerts (Doctor Only) */}
        {profile?.role === 'doctor' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-gray-900">Pharmacy Alerts</h2>
              <Link to="/pharmacy" className={cn(
                "p-2 rounded-xl transition-all",
                inventoryAlerts.length > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              )}>
                <AlertCircle size={18} />
              </Link>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
              {inventoryAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">All Meds<br/>In Stock & Fresh</p>
                </div>
              ) : (
                inventoryAlerts.map((item) => {
                  const isOutOfStock = item.stockLevel === 0;
                  const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                  const isExpired = expiryDate && expiryDate.getTime() < new Date().getTime();
                  const isSoon = expiryDate && !isExpired && (expiryDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000);

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isOutOfStock || isExpired ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      )}>
                        <Pill size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate uppercase">{item.name}</p>
                        <div className="flex items-center gap-2">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-black text-red-600 uppercase">Out of Stock</span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-black text-red-600 uppercase">Expired</span>
                          ) : isSoon ? (
                            <span className="text-[10px] font-black text-orange-600 uppercase">Expiring Soon</span>
                          ) : (
                            <span className="text-[10px] font-black text-orange-600 uppercase">Low Stock ({item.stockLevel})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Link to="/pharmacy" className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase text-center tracking-widest shadow-lg shadow-gray-200">
              Manage Inventory
            </Link>
          </section>
        )}

        {/* Admin Specific Detail: Staff Distribution */}
        {profile?.role === 'admin' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <h2 className="font-bold text-lg text-gray-900 mb-6">Staff Distribution</h2>
            <div className="space-y-4">
              {Object.entries(staffByRole).map(([role, count]) => {
                const totalStaff = Object.values(staffByRole).reduce((a, b) => (a as number) + (b as number), 0) as number;
                return (
                <div key={role}>
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{role}</p>
                      <p className="text-xs font-black text-gray-900">{count}</p>
                   </div>
                   <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((count as number) / totalStaff) * 100}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          role === 'admin' ? "bg-gray-900" : 
                          role === 'doctor' ? "bg-blue-600" :
                          role === 'nurse' ? "bg-emerald-500" : "bg-blue-400"
                        )}
                      />
                   </div>
                </div>
              );})}
            </div>
          </section>
        )}

        {/* Recent Admissions */}
        <section className={cn(
          "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col",
          profile?.role === 'admin' ? "lg:col-span-1" : "lg:col-span-3"
        )}>
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900">Recent Admissions</h2>
            <Link to="/patients" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex-1">
            {recentAdmissions.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                No recent admissions found.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Admission Date</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider uppercase">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentAdmissions.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group" 
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-none mb-1">{patient.name}</p>
                            {patient.status === 'outpatient' && patient.nextVisit && (
                              <p className="text-[10px] font-bold text-blue-500 uppercase">Next: {new Date(patient.nextVisit).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-sm font-medium text-gray-600">{patient.gender}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">{new Date(patient.admissionDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                       <span className={cn(
                         "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                         patient.status === 'inpatient' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                       )}>
                         {patient.status}
                       </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {profile?.role === 'admin' && (
                          <button 
                            onClick={(e) => handleDeletePatient(e, patient.id, patient.name)}
                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete Patient"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
 
        {/* System Activity */}
        {profile?.role === 'admin' && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-50">
              <h2 className="font-bold text-lg text-gray-900">System Activity</h2>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {activityLogs.length === 0 ? (
                 <div className="text-center text-gray-300 py-10 font-bold">No activity recorded.</div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Activity size={18} className="text-blue-400 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{log.action}</p>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black uppercase text-gray-400">{log.performerName}</p>
                         <span className="w-1 h-1 bg-gray-200 rounded-full" />
                         <p className="text-[10px] font-bold text-gray-300 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
