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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'doctor', 'pharmacy_admin'] },
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
    <div className="flex h-screen bg-[#F3F4F6] text-[#111827] font-sans overflow-hidden">
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
          "fixed lg:static inset-y-0 left-0 z-50 w-56 sm:w-60 lg:w-60 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg text-white">
              <Hospital size={20} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">VIVO</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Teaching Hospital v2.5</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={cn(
                    "transition-colors shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                  )} />
                  <span className="font-medium text-xs sm:text-sm truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate">{profile?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs sm:text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between z-10 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="relative max-w-xs sm:max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg hidden sm:block">
              <MessageSquare size={18} />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
