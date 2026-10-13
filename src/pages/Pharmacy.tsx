import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Prescription, Patient } from '../types';
import { 
  Pill, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  PackageCheck,
  User,
  Calendar,
  Edit3,
  Trash2,
  FolderEdit,
  Tag
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Pharmacy() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isPharmacyAdmin = profile?.role === 'pharmacy_admin' || profile?.role === 'admin';
  const isPharmacyStaff = profile?.role === 'pharmacy';

  const [activeView, setActiveView] = useState<'rx' | 'inventory'>(isPharmacyStaff ? 'rx' : 'inventory');
  const [prescriptions, setPrescriptions] = useState<(Prescription & { patient: Patient })[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: '', stockLevel: '', unit: '', description: '', expiryDate: '', price: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeView === 'rx') {
        const data = await apiService.getPrescriptions({ status: filterStatus !== 'all' ? filterStatus : undefined });
        setPrescriptions(data);
      } else {
        const data = await apiService.getInventory();
        setInventory(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, activeView]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addInventoryItem({
        ...newItem,
        stockLevel: parseInt(newItem.stockLevel as string) || 0,
        price: parseFloat(newItem.price as string) || 0
      });
      setShowAddModal(false);
      setNewItem({ name: '', category: '', stockLevel: '', unit: '', description: '', expiryDate: '', price: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await apiService.deleteInventoryItem(deletingItem.id);
      setShowDeleteModal(false);
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit || !newCategoryName.trim()) return;
    try {
      await apiService.renameCategory(categoryToEdit, newCategoryName.trim());
      setShowCategoryModal(false);
      setCategoryToEdit('');
      setNewCategoryName('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await apiService.updateInventoryItem(editingItem.id, {
        name: editingItem.name,
        category: editingItem.category,
        stockLevel: parseInt(editingItem.stockLevel) || 0,
        unit: editingItem.unit,
        price: parseFloat(editingItem.price) || 0,
        expiryDate: editingItem.expiryDate ? editingItem.expiryDate.split('T')[0] : null
      });
      setShowEditModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (rxId: string, status: string) => {
    try {
      await apiService.updatePrescriptionStatus(rxId, status);
      setPrescriptions(prev => prev.map(rx => rx.id === rxId ? { ...rx, status: status as any } : rx));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = (!startDate || new Date(rx.createdAt) >= new Date(startDate)) &&
                       (!endDate || new Date(rx.createdAt) <= new Date(endDate + 'T23:59:59'));

    return matchesSearch && matchesDate;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const stats = {
    active: prescriptions.filter(rx => rx.status === 'active').length,
    dispensedToday: prescriptions.filter(rx => (rx.status === 'dispensed' || rx.status === 'completed') && rx.createdAt?.toString().startsWith(todayStr)).length || prescriptions.filter(rx => rx.status === 'dispensed').length,
    pending: prescriptions.filter(rx => rx.status === 'active').length
  };

  return (
    <div className="space-y-8 animate-in mt-6">
      {/* Pharmacist Department Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-purple-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=800"
              alt="Clinical Pharmacist"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="px-2.5 py-1 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Pharmacy Unit
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Pill size={12} /> Pharmacist Desk & Pharmaceutical Services
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Pharmacy Control Center</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Managed by Chief Pharmacist • Prescription Dispensing, Drug Interaction Verification & Inventory Management
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                <span>Active Prescriptions: <strong className="text-purple-700 font-black">{stats.active} Orders</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">{isPharmacyAdmin ? 'Medication Inventory & Safety Controls' : 'Active Clinical Prescriptions'}</h2>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          {['prescriptions', 'inventory'].map((view) => {
            if (view === 'inventory' && isPharmacyStaff) return null;
            return (
              <button
                key={view}
                onClick={() => setActiveView(view as any)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeView === view 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {view}
              </button>
            );
          })}
        </div>
      </header>

      {activeView === 'rx' && (
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-fit">
          {['all', 'active', 'dispensed', 'completed', 'discontinued'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filterStatus === status 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-100" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {activeView === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0 flex items-center gap-1 mr-1">
                <Tag size={12} /> Category:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border",
                  selectedCategory === 'all'
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                )}
              >
                All Categories
              </button>
              {Array.from(new Set(inventory.map(item => item.category).filter(Boolean))).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border",
                    selectedCategory === cat
                      ? "bg-purple-600 text-white border-purple-600 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isPharmacyAdmin && (
                <button
                  onClick={() => {
                    const availableCategories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
                    setCategoryToEdit(selectedCategory !== 'all' ? selectedCategory : (availableCategories[0] || ''));
                    setNewCategoryName(selectedCategory !== 'all' ? selectedCategory : (availableCategories[0] || ''));
                    setShowCategoryModal(true);
                  }}
                  className="px-5 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-purple-100 transition-all flex items-center gap-2"
                  title="Rename or Edit Category"
                >
                  <FolderEdit size={16} /> Edit Category
                </button>
              )}

              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <PackageCheck size={18} /> Add New Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Stats - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Orders</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-gray-900">{stats.active}</h3>
              <span className="text-xs font-bold text-orange-500 mb-1">Queue</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dispensed Today</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-gray-900">{stats.dispensedToday}</h3>
              <span className="text-xs font-bold text-green-500 mb-1">Fulfilled</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm bg-orange-600 text-white border-none">
            <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Inventory Health</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black">94%</h3>
              <span className="text-xs font-bold text-orange-200 mb-1">Stocked</span>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search medication or patient..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-100 transition-all font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date" 
              className="bg-transparent border-none text-xs font-black uppercase outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-300">to</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-xs font-black uppercase outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate || searchQuery) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); }}
              className="p-3 text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
              title="Clear Filters"
            >
              <Clock size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading Data...</div>
        ) : activeView === 'rx' ? (
          filteredPrescriptions.map((rx, i) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-orange-200 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-5 rounded-3xl shrink-0",
                  rx.status === 'active' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                )}>
                  <Pill size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{rx.medication}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] uppercase font-black">{rx.dosage}</span>
                    • {rx.frequency} • {rx.duration}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <User size={14} />
                        <span className="text-gray-600 truncate max-w-[150px]">{rx.patient.name}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(rx.createdAt)}</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1 mb-1">Status</span>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm",
                    rx.status === 'active' ? "bg-amber-50 border-amber-100 text-amber-600" : 
                    rx.status === 'dispensed' ? "bg-blue-50 border-blue-100 text-blue-600" : 
                    rx.status === 'discontinued' ? "bg-red-50 border-red-100 text-red-600" :
                    "bg-emerald-50 border-emerald-100 text-emerald-600"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      rx.status === 'active' ? "bg-amber-500" : 
                      rx.status === 'dispensed' ? "bg-blue-500" : 
                      rx.status === 'discontinued' ? "bg-red-500" :
                      "bg-emerald-500"
                    )} />
                    {rx.status}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rx.status === 'active' && (profile?.role === 'pharmacy' || profile?.role === 'admin') && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(rx.id, 'dispensed')}
                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                      >
                        <PackageCheck size={14} /> Dispense
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(rx.id, 'discontinued')}
                        className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                        title="Discontinue"
                      >
                        <AlertCircle size={18} />
                      </button>
                    </>
                  )}
                  {rx.status === 'dispensed' && (profile?.role === 'pharmacy' || profile?.role === 'admin') && (
                    <button
                      onClick={() => handleStatusUpdate(rx.id, 'completed')}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest"
                    >
                      <CheckCircle2 size={14} /> Complete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Medication</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₦)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Expiration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory
                  .filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((item) => {
                  const isLowStock = item.stockLevel <= 10 && item.stockLevel > 0;
                  const isOutOfStock = item.stockLevel === 0;
                  const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                  const isExpiringSoon = expiryDate && expiryDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // < 30 days
                  const isExpired = expiryDate && expiryDate.getTime() < new Date().getTime();

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                            isOutOfStock ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
                          )}>
                            <Pill size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 uppercase">{item.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{item.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            isOutOfStock ? "bg-red-500" : isLowStock ? "bg-orange-500" : "bg-green-500"
                          )} />
                          <span className="text-sm font-black text-gray-900">{item.stockLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPharmacyAdmin ? (
                          <input 
                            type="number"
                            className="bg-transparent border-none font-black text-sm text-gray-900 w-20 outline-none focus:ring-2 focus:ring-orange-100 rounded px-1"
                            value={item.price}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              setInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, price: newPrice } : inv));
                            }}
                            onBlur={async (e) => {
                              try {
                                await apiService.updateInventoryItem(item.id, { price: parseFloat(e.target.value) || 0 });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-sm font-black text-gray-900">₦{item.price}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-xs font-bold",
                            isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : "text-gray-900"
                          )}>
                            {item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}
                          </span>
                          {isExpiringSoon && !isExpired && <span className="text-[8px] font-black uppercase text-orange-500">Expiring Soon</span>}
                          {isExpired && <span className="text-[8px] font-black uppercase text-red-500">Expired</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter w-fit",
                          isOutOfStock ? "bg-red-50 text-red-600" : 
                          isLowStock ? "bg-orange-50 text-orange-600" : 
                          "bg-green-50 text-green-600"
                        )}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {isPharmacyAdmin && (
                           <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => {
                                 setEditingItem({
                                   ...item,
                                   expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
                                 });
                                 setShowEditModal(true);
                               }}
                               className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 flex items-center gap-1 text-xs font-bold"
                               title="Edit Drug Details"
                             >
                               <Edit3 size={15} /> Edit
                             </button>

                             <button
                               onClick={() => {
                                 setDeletingItem(item);
                                 setShowDeleteModal(true);
                               }}
                               className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 flex items-center gap-1 text-xs font-bold"
                               title="Delete Inventory Item"
                             >
                               <Trash2 size={15} /> Delete
                             </button>
                           </div>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeView === 'rx' && filteredPrescriptions.length === 0 && (
          <div className="p-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <Pill size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-black text-gray-400 uppercase tracking-widest">No prescriptions found</p>
          </div>
        )}
      </div>

      {/* Edit Inventory Item Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowEditModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                      <PackageCheck size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Edit Inventory Item</h3>
                     <p className="text-xs font-bold text-gray-400">Update medication details & stock</p>
                   </div>
                </div>

                <form onSubmit={handleEditItem} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medication Name</label>
                       <input
                         required
                         className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                         value={editingItem.name}
                         onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <input
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                          value={editingItem.category}
                          onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</label>
                        <input
                          type="number"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                          value={editingItem.stockLevel}
                          onChange={(e) => setEditingItem({...editingItem, stockLevel: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</label>
                        <input
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                          value={editingItem.unit}
                          onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₦)</label>
                        <input
                          type="number"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expiry Date</label>
                        <input
                          type="date"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                          value={editingItem.expiryDate}
                          onChange={(e) => setEditingItem({...editingItem, expiryDate: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg">Update Drug Details</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowCategoryModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-purple-50 text-purple-600 rounded-3xl">
                      <FolderEdit size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Edit Pharmacy Category</h3>
                     <p className="text-xs font-bold text-gray-400">Rename category across all associated medications</p>
                   </div>
                </div>

                <form onSubmit={handleRenameCategory} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Existing Category</label>
                       <select
                         required
                         className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm text-gray-900"
                         value={categoryToEdit}
                         onChange={(e) => {
                           setCategoryToEdit(e.target.value);
                           setNewCategoryName(e.target.value);
                         }}
                       >
                         {Array.from(new Set(inventory.map(item => item.category).filter(Boolean))).map((cat) => (
                           <option key={cat} value={cat}>{cat}</option>
                         ))}
                       </select>
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Category Name</label>
                       <input
                         required
                         className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                         placeholder="e.g. Analgesics & Antipyretics"
                         value={newCategoryName}
                         onChange={(e) => setNewCategoryName(e.target.value)}
                       />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-purple-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-purple-700">Save Category</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowDeleteModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-center"
             >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Delete Inventory Item</h3>
                <p className="text-sm font-medium text-gray-500 mb-6">
                  Are you sure you want to delete <strong className="text-gray-900 uppercase font-black">{deletingItem.name}</strong> from pharmacy inventory? This action cannot be undone.
                </p>

                <div className="flex gap-4">
                   <button
                     type="button"
                     onClick={() => setShowDeleteModal(false)}
                     className="flex-1 py-3 text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
                   >
                     Cancel
                   </button>
                   <button
                     type="button"
                     onClick={handleDeleteItem}
                     className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all"
                   >
                     Delete Item
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
             >
                <div className="flex items-center gap-5 mb-8">
                   <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl">
                      <PackageCheck size={32} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Add Inventory Item</h3>
                     <p className="text-xs font-bold text-gray-400">Stock the pharmacy with new medication</p>
                   </div>
                </div>

                <form onSubmit={handleAddItem} className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medication Name</label>
                       <input 
                         required
                         className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                         placeholder="e.g. Paracetamol"
                         value={newItem.name}
                         onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <input 
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="Analgesics"
                          value={newItem.category}
                          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</label>
                        <input 
                          type="number"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="500"
                          value={newItem.stockLevel}
                          onChange={(e) => setNewItem({...newItem, stockLevel: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</label>
                        <input 
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="Tablets, Vials, Bags..."
                          value={newItem.unit}
                          onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₦)</label>
                        <input 
                          type="number"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          placeholder="Price"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expiry Date</label>
                        <input 
                          type="date"
                          required
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
                          value={newItem.expiryDate}
                          onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg">Save Item</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
