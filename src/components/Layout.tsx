import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bed, 
  ClipboardList, 
  Settings, 
  LogOut,
  Hospital,
  Search,
  Bell,
  MessageSquare,
  Plus,
  UserPlus,
  Microscope,
  CalendarDays,
  Pill,
  Banknote,
  Activity,
  GraduationCap,
  FlaskConical,
  BookOpenText,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin'] },
    { icon: Bed, label: 'Wards', path: '/wards', roles: ['admin', 'doctor', 'nurse'] },
    { icon: Activity, label: 'Vitals Record', path: '/vitals-record', roles: ['admin', 'nurse'] },
    { icon: Users, label: 'Patients', path: '/patients', roles: ['admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology', 'scientist', 'radiographer'] },
    { icon: CalendarDays, label: 'Appointments', path: '/appointments', roles: ['admin', 'record', 'doctor'] },
    { icon: Microscope, label: 'Investigations', path: '/investigations', roles: ['admin', 'doctor', 'nurse', 'lab', 'radiology', 'scientist', 'radiographer'] },
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy', roles: ['doctor', 'pharmacy', 'pharmacy_admin'] },
    { icon: BookOpenText, label: 'Academic Rounds', path: '/academic-rounds', roles: ['admin', 'doctor'] },
    { icon: GraduationCap, label: 'Medical Education', path: '/medical-education', roles: ['admin', 'doctor'] },
    { icon: FlaskConical, label: 'Clinical Research', path: '/clinical-research', roles: ['admin', 'doctor'] },
    { icon: Banknote, label: 'Billing', path: '/billing', roles: ['admin', 'doctor'] },
    { icon: Settings, label: 'Revenue Config', path: '/revenue', roles: ['admin'] },
    { icon: ClipboardList, label: 'Records', path: '/records', roles: ['admin', 'record'] },
    { icon: Users, label: 'Staff Management', path: '/staff', roles: ['admin'] },
    { icon: Activity, label: 'System Logs', path: '/logs', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-52 sm:w-56 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-md text-white border border-blue-700">
              <Hospital size={18} />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight">VIVO</h1>
              <p className="text-[10px] text-gray-500 font-medium">Teaching Hospital v2.5</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-md border border-gray-200 hover:border-gray-300 bg-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors border group",
                isActive 
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-200"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={cn(
                    "transition-colors shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                  )} />
                  <span className="font-medium text-xs truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2.5 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate leading-tight">{profile?.name}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-red-600 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-md transition-colors font-semibold text-xs shadow-2xs"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 sm:h-14 bg-white border-b border-[#E5E7EB] px-3.5 sm:px-5 flex items-center justify-between z-10 gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 bg-white rounded-md relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 bg-white rounded-md hidden sm:block">
              <MessageSquare size={16} />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-3.5 sm:p-5 lg:p-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
