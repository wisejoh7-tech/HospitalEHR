import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Appointment, Patient, UserProfile } from '../types';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  User as UserIcon,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  LayoutList,
  Calendar as CalendarGridIcon
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';

export default function Appointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('scheduled');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarScope, setCalendarScope] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Booking Form State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'consultation' | 'follow-up' | 'investigation'>('consultation');

  const fetchAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Load patients and doctors for the booking modal
    const loadData = async () => {
      const [plist, ulist] = await Promise.all([
        apiService.getPatients(),
        apiService.getUsers()
      ]);
      setPatients(plist);
      setDoctors(ulist.filter(u => u.role === 'doctor'));
    };
    loadData();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !appointmentDate || !appointmentTime) return;

    try {
      const doctor = doctors.find(d => d.uid === selectedDoctor);
      await apiService.createAppointment({
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        doctorName: doctor?.name || 'Any Available',
        dateTime: `${appointmentDate}T${appointmentTime}`,
        reason,
        type,
        status: 'scheduled'
      });
      setShowBookModal(false);
      fetchAppointments();
      // Reset form
      setSelectedPatient('');
      setSelectedDoctor('');
      setAppointmentDate('');
      setAppointmentTime('');
      setReason('');
    } catch (err) {
      alert("Failed to book appointment");
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      await apiService.updateAppointment(id, { status });
      fetchAppointments();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filtered = appointments.filter(a => {
    const matchesSearch = a.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const nextDate = () => {
    if (calendarScope === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (calendarScope === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevDate = () => {
    if (calendarScope === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (calendarScope === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    let days: Date[] = [];
    if (calendarScope === 'month') {
      days = eachDayOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd)
      });
    } else if (calendarScope === 'week') {
      days = eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate)
      });
    } else {
      days = [currentDate];
    }

    return (
      <div className="flex-1 flex flex-col">
        {calendarScope !== 'day' && (
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                {day}
              </div>
            ))}
          </div>
        )}
        <div className={cn(
          "flex-1 grid auto-rows-fr",
          calendarScope === 'day' ? "grid-cols-1" : "grid-cols-7"
        )}>
          {days.map((day, i) => {
            const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.dateTime), day));
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-gray-50 flex flex-col gap-1 transition-colors",
                  !isSelectedMonth ? "bg-gray-50/30" : "bg-white",
                  isTodayDate && "ring-1 ring-inset ring-blue-100 bg-blue-50/10"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg",
                    isTodayDate ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                    isSelectedMonth ? "text-gray-900" : "text-gray-300"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
                
                <div className={cn(
                  "space-y-1 overflow-y-auto scrollbar-hide",
                  calendarScope === 'month' ? "max-h-[100px]" : "max-h-[500px]"
                )}>
                  {(calendarScope === 'month' ? dayAppointments.slice(0, 3) : dayAppointments).map(app => (
                    <div 
                      key={app.id} 
                      className={cn(
                        "px-2 py-1 rounded-lg font-bold truncate border flex items-center justify-between gap-2",
                        calendarScope === 'month' ? "text-[9px]" : "text-[11px] py-3 px-4",
                        app.status === 'scheduled' ? "bg-white border-amber-100 text-amber-700 shadow-sm" :
                        app.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                        "bg-red-50 border-red-100 text-red-700"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">{format(parseISO(app.dateTime), 'HH:mm')}</span>
                        <span className="truncate">{app.patient?.name}</span>
                      </div>
                      {calendarScope !== 'month' && (
                        <span className="text-[9px] uppercase tracking-widest opacity-50">{app.type}</span>
                      )}
                    </div>
                  ))}
                  {calendarScope === 'month' && dayAppointments.length > 3 && (
                    <p className="text-[8px] font-black text-gray-400 text-center uppercase tracking-tighter">
                      + {dayAppointments.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Appointment Manager</h1>
          <p className="text-gray-500 font-medium text-sm">Schedule and manage medical consultations and follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutList size={20} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'calendar' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <CalendarGridIcon size={20} />
            </button>
          </div>
          <button 
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg"
          >
            <Plus size={18} />
            Book Appointment
          </button>
        </div>
      </header>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
           <CalendarDays size={24} className="text-blue-500 mb-2" />
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Today's Visits</p>
           <p className="text-2xl font-black text-gray-900">
             {appointments.filter(a => formatDate(a.dateTime).includes(new Date().toLocaleDateString())).length}
           </p>
        </div>
        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex flex-col items-center justify-center text-center">
           <Clock size={24} className="text-amber-500 mb-2" />
           <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest leading-none mb-1">Pending</p>
           <p className="text-2xl font-black text-amber-900">
             {appointments.filter(a => a.status === 'scheduled').length}
           </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center justify-center text-center">
           <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
           <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Completed</p>
           <p className="text-2xl font-black text-emerald-900">
             {appointments.filter(a => a.status === 'completed').length}
           </p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
           <Filter size={24} className="text-purple-500 mb-2" />
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Scheduled</p>
           <p className="text-2xl font-black text-gray-900">{appointments.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Navigation & Toolbar */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           {viewMode === 'calendar' ? (
             <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                <div className="flex items-center gap-2">
                   <button onClick={prevDate} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
                   <h2 className="text-sm font-black text-gray-900 w-40 text-center">
                     {calendarScope === 'day' ? format(currentDate, 'PPP') : format(currentDate, 'MMMM yyyy')}
                   </h2>
                   <button onClick={nextDate} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight size={20}/></button>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                   {(['month', 'week', 'day'] as const).map(s => (
                     <button
                       key={s}
                       onClick={() => setCalendarScope(s)}
                       className={cn(
                         "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                         calendarScope === s ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                       )}
                     >
                       {s}
                     </button>
                   ))}
                </div>

                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-xl border border-gray-100 hover:bg-white"
                >
                  Today
                </button>
             </div>
           ) : (
             <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl">
                {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      statusFilter === f ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {f}
                  </button>
                ))}
             </div>
           )}

           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search patient or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none w-64 transition-all"
              />
           </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-x-auto"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Appointment Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Assigned</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((app, i) => (
                    <motion.tr 
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <UserIcon size={18} />
                           </div>
                           <div>
                              <p className="font-black text-gray-900 text-sm leading-none mb-1">{app.patient?.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: {app.patient?.id}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                           app.type === 'consultation' ? "bg-blue-50 border-blue-100 text-blue-600" :
                           app.type === 'follow-up' ? "bg-purple-50 border-purple-100 text-purple-600" :
                           "bg-amber-50 border-amber-100 text-amber-600"
                         )}>
                            {app.type.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-gray-700">{app.doctorName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <p className="text-xs font-black text-gray-900">{formatDate(app.dateTime)}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className={cn(
                           "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                           app.status === 'scheduled' ? "bg-amber-50 border-amber-100 text-amber-600" :
                           app.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                           "bg-red-50 border-red-100 text-red-600"
                         )}>
                            {app.status}
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {app.status === 'scheduled' && (
                             <>
                               <button 
                                 onClick={() => updateStatus(app.id, 'completed')}
                                 className="p-2 text-gray-300 hover:text-emerald-500 transition-colors"
                                 title="Mark as Completed"
                               >
                                 <CheckCircle2 size={18} />
                               </button>
                               <button 
                                 onClick={() => updateStatus(app.id, 'cancelled')}
                                 className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                 title="Cancel Appointment"
                               >
                                 <XCircle size={18} />
                               </button>
                             </>
                           )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                      <CalendarIcon size={32} />
                   </div>
                   <h3 className="font-bold text-gray-900">No appointments found</h3>
                   <p className="text-xs text-gray-400 max-w-xs mt-1">There are no records matching your criteria. Try adjusting filters or search.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {renderCalendar()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal (unchanged) */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowBookModal(false)}
               className="absolute inset-0 bg-black/20 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
             >
                <h2 className="text-2xl font-black text-gray-900 mb-6">Book New Appointment</h2>
                
                <form onSubmit={handleBookAppointment} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Patient</label>
                         <select 
                           required
                           value={selectedPatient}
                           onChange={(e) => setSelectedPatient(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                         >
                            <option value="">Select Patient</option>
                            {patients.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                            ))}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Doctor (Optional)</label>
                         <select 
                           value={selectedDoctor}
                           onChange={(e) => setSelectedDoctor(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                         >
                            <option value="">Any Available</option>
                            {doctors.map(d => (
                              <option key={d.uid} value={d.uid}>{d.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Date</label>
                         <input 
                           type="date"
                           required
                           value={appointmentDate}
                           onChange={(e) => setAppointmentDate(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Time</label>
                         <input 
                           type="time"
                           required
                           value={appointmentTime}
                           onChange={(e) => setAppointmentTime(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Visit Type</label>
                      <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-50 rounded-2xl">
                         {(['consultation', 'follow-up', 'investigation'] as const).map(t => (
                           <button 
                             key={t}
                             type="button"
                             onClick={() => setType(t)}
                             className={cn(
                               "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                               type === t ? "bg-white shadow-sm text-blue-600" : "text-gray-400"
                             )}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Reason / Notes</label>
                      <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Chief complaint or reason for visit..."
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-24 text-sm font-medium"
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowBookModal(false)}
                        className="flex-1 py-4 text-sm font-black text-gray-400"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-3 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg"
                      >
                        Confirm Booking
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
