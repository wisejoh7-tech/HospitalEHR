import React from 'react';
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
  BookOpenText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'doctor', 'pharmacy_admin'] },
    { icon: Bed, label: 'Wards', path: '/wards', roles: ['admin', 'doctor', 'nurse'] },
    { icon: Activity, label: 'Vitals Record', path: '/vitals-record', roles: ['admin', 'nurse'] },
    { icon: Users, label: 'Patients', path: '/patients', roles: ['admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology', 'scientist', 'radiographer'] },
    { icon: CalendarDays, label: 'Appointments', path: '/appointments', roles: ['admin', 'doctor', 'record'] },
    { icon: Microscope, label: 'Investigations', path: '/investigations', roles: ['admin', 'doctor', 'nurse', 'lab', 'radiology', 'scientist', 'radiographer'] },
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy', roles: ['doctor', 'pharmacy', 'pharmacy_admin'] },
    { icon: BookOpenText, label: 'Academic Rounds', path: '/academic-rounds', roles: ['admin', 'doctor'] },
    { icon: GraduationCap, label: 'Medical Education', path: '/medical-education', roles: ['admin', 'doctor'] },
    { icon: FlaskConical, label: 'Clinical Research', path: '/clinical-research', roles: ['admin', 'doctor'] },
    { icon: ClipboardList, label: 'Billing', path: '/billing', roles: ['admin', 'doctor'] },
    { icon: Banknote, label: 'Revenue Config', path: '/revenue', roles: ['admin'] },
    { icon: ClipboardList, label: 'Records', path: '/records', roles: ['admin', 'record'] },
    { icon: Settings, label: 'Staff Management', path: '/staff', roles: ['admin', 'pharmacy_admin'] },
    { icon: Activity, label: 'System Logs', path: '/logs', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen bg-[#F3F4F6] text-[#111827] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-6 border-bottom border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Hospital size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">VIVO</h1>
              <p className="text-xs text-gray-500 font-medium">Teaching Hospital v2.5</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                  )} />
                  <span className="font-medium text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search patients, results, or files..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <MessageSquare size={20} />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-2"></div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
