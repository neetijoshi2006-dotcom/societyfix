import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import Chatbot from '../components/Chatbot';
import { 
  LayoutDashboard, FileText, PlusCircle, ShieldAlert, Settings, LogOut, 
  Menu, X, Bell, User, Sun, Moon, Laptop, Calendar, Users, Megaphone, Shield,
  BarChart2, CreditCard, QrCode, Dumbbell, MessageSquare, Hash, BookOpen,
  Vote, ClipboardList, MessageCircle, HeartHandshake, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { notifications, removeNotification, toasts, removeToast } = useSocket();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Sidebar navigation links based on user roles
  const getNavLinks = () => {
    switch (user.role) {
      case 'resident':
        return [
          { name: 'Dashboard',          path: '/resident',        icon: LayoutDashboard },
          { name: 'File Complaint',     path: '/resident/raise',  icon: PlusCircle },
          { name: 'Notice Board',       path: '/announcements',   icon: Megaphone },
          { name: 'Community Polls',    path: '/polls',           icon: Vote },
          { name: 'Visitor Pass',       path: '/visitor-pass',    icon: QrCode },
          { name: 'Book Amenity',       path: '/amenity-booking', icon: Dumbbell },
          { name: 'Maintenance Fee',    path: '/maintenance-fee', icon: CreditCard },
          { name: 'Messages',           path: '/messages',        icon: MessageCircle },
          { name: 'Resident Directory', path: '/directory',       icon: Users },
          { name: 'Community Forum',    path: '/forum',           icon: Hash },
          { name: 'Marketplace',        path: '/classifieds',     icon: Store },
          { name: 'Domestic Help',      path: '/domestic-help',   icon: HeartHandshake },
          { name: 'Emergency',          path: '/emergency',       icon: ShieldAlert },
          { name: 'Settings',           path: '/settings',        icon: Settings },
        ];
      case 'staff':
        return [
          { name: 'Assigned Jobs',    path: '/staff',           icon: FileText },
          { name: 'My Schedule',      path: '/staff/schedule',  icon: Calendar },
          { name: 'Notice Board',     path: '/announcements',   icon: Megaphone },
          { name: 'Community Forum',  path: '/forum',           icon: Hash },
          { name: 'Emergency',        path: '/emergency',       icon: ShieldAlert },
          { name: 'Settings',         path: '/settings',        icon: Settings },
        ];
      case 'manager':
        return [
          { name: 'Overview',           path: '/manager',         icon: LayoutDashboard },
          { name: 'Analytics',          path: '/analytics',       icon: BarChart2 },
          { name: 'Notice Board',       path: '/announcements',   icon: Megaphone },
          { name: 'Community Polls',    path: '/polls',           icon: Vote },
          { name: 'Amenity Booking',    path: '/amenity-booking', icon: Dumbbell },
          { name: 'Maintenance Fee',    path: '/maintenance-fee', icon: CreditCard },
          { name: 'Messages',           path: '/messages',        icon: MessageCircle },
          { name: 'Resident Directory', path: '/directory',       icon: Users },
          { name: 'Community Forum',    path: '/forum',           icon: Hash },
          { name: 'Marketplace',        path: '/classifieds',     icon: Store },
          { name: 'Domestic Help',      path: '/domestic-help',   icon: HeartHandshake },
          { name: 'Staff Directory',    path: '/manager/staff',   icon: ClipboardList },
          { name: 'Emergency',          path: '/emergency',       icon: ShieldAlert },
          { name: 'Settings',           path: '/settings',        icon: Settings },
        ];
      case 'admin':
        return [
          { name: 'System Admin',       path: '/admin',           icon: Shield },
          { name: 'Analytics',          path: '/analytics',       icon: BarChart2 },
          { name: 'Notice Board',       path: '/announcements',   icon: Megaphone },
          { name: 'Community Polls',    path: '/polls',           icon: Vote },
          { name: 'Resident Directory', path: '/directory',       icon: Users },
          { name: 'Maintenance Fee',    path: '/maintenance-fee', icon: CreditCard },
          { name: 'Messages',           path: '/messages',        icon: MessageCircle },
          { name: 'Community Forum',    path: '/forum',           icon: Hash },
          { name: 'Marketplace',        path: '/classifieds',     icon: Store },
          { name: 'Domestic Help',      path: '/domestic-help',   icon: HeartHandshake },
          { name: 'Emergency',          path: '/emergency',       icon: ShieldAlert },
          { name: 'Settings',           path: '/settings',        icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ link, onClick }) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
    return (
      <Link
        to={link.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
        <span className="truncate">{link.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center h-16 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-extrabold text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              SocietyFix
            </span>
          </div>
          <span className="ml-auto text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <NavLink key={link.path} link={link} />
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 shrink-0">
          {/* User profile mini card */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              alt="Profile"
              className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-20 shrink-0">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:block">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Apartment Society
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {user.role === 'resident' 
                ? `Orchid Residency • Wing ${user.details?.wing || 'A'}-${user.details?.flatNumber || '101'}`
                : user.role === 'staff'
                  ? `Maintenance Executive • ${user.details?.skills?.join(', ') || 'Staff'}`
                  : 'Orchid Residency Management Office'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme switcher */}
            <div className="relative">
              <button 
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {themeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setThemeDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-40"
                    >
                      {['light', 'dark', 'system'].map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTheme(t); setThemeDropdownOpen(false); }}
                          className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium capitalize ${
                            theme === t 
                              ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400' 
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {t === 'light' ? <Sun className="w-3.5 h-3.5" /> : t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                          {t}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                )}
              </button>
              
              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-40"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold">
                          {notifications.length} New
                        </span>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">All caught up! No new alerts.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex gap-3 transition relative group">
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-white">{notif.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.content}</p>
                                {notif.complaintId && (
                                  <Link 
                                    to={`/complaints/${notif.complaintId}`} 
                                    onClick={() => setNotifDropdownOpen(false)}
                                    className="inline-block mt-2 text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                                  >
                                    View complaint →
                                  </Link>
                                )}
                              </div>
                              <button 
                                onClick={() => removeNotification(notif.id)}
                                className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 self-start"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100"
              />
              <span className="hidden lg:block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {user.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic page contents */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 md:hidden"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                    <span className="text-white font-extrabold text-sm">S</span>
                  </div>
                  <span className="text-lg font-bold tracking-tight dark:text-white">SocietyFix</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                {navLinks.map((link) => (
                  <NavLink key={link.path} link={link} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </nav>

              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  <LogOut className="w-5 h-5 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Global Toast Banners */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="max-w-sm rounded-2xl glass-card border border-brand-500/30 p-4 shadow-2xl flex gap-3.5 items-start bg-white dark:bg-slate-900 pointer-events-auto"
            >
              <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/10 shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    {t.title}
                  </span>
                  <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 -mr-1 -mt-1 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 5. Global Chatbot */}
      <Chatbot />
    </div>
  );
}
