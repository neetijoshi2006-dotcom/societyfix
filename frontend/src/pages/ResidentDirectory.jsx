import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ShieldCheck, Lock, Mail, Phone, MessageSquare, Power, Info } from 'lucide-react';

const MOCK_RESIDENTS = [
  { id: 1, name: 'Rahul Sharma', wing: 'A', flat: '101', type: 'Owner', since: 'Jan 2023', phone: '+91 9876543210', email: 'rahul@example.com', privacy: false, active: true },
  { id: 2, name: 'Anita Patel', wing: 'A', flat: '102', type: 'Tenant', since: 'Mar 2024', phone: '+91 9876543211', email: 'anita@example.com', privacy: true, active: true },
  { id: 3, name: 'Vikram Singh', wing: 'B', flat: '201', type: 'Owner', since: 'Jun 2022', phone: '+91 9876543212', email: 'vikram@example.com', privacy: false, active: true },
  { id: 4, name: 'Priya Desai', wing: 'C', flat: '305', type: 'Owner', since: 'Dec 2023', phone: '+91 9876543213', email: 'priya@example.com', privacy: false, active: true },
  { id: 5, name: 'Karan Mehra', wing: 'B', flat: '402', type: 'Tenant', since: 'Feb 2025', phone: '+91 9876543214', email: 'karan@example.com', privacy: true, active: true },
  { id: 6, name: 'Sneha Reddy', wing: 'D', flat: '105', type: 'Owner', since: 'Oct 2021', phone: '+91 9876543215', email: 'sneha@example.com', privacy: false, active: false }
];

export default function ResidentDirectory() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const navigate = useNavigate();
  const [residents, setResidents] = useState(MOCK_RESIDENTS);
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState('All');

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const filtered = residents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.flat.includes(search);
    const matchWing = wingFilter === 'All' || r.wing === wingFilter;
    return matchSearch && matchWing;
  });

  const toggleStatus = (id, currentStatus) => {
    setResidents(residents.map(r => r.id === id ? { ...r, active: !currentStatus } : r));
    setToast({ title: 'Status Updated', message: `Resident access ${currentStatus ? 'revoked' : 'restored'}.` });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Resident Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect with your neighbours</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{residents.length}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase">Total Flats</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{residents.filter(r=>r.type==='Owner').length}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase">Owners</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{residents.filter(r=>r.type==='Tenant').length}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase">Tenants</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">4</h3>
          <p className="text-xs font-bold text-slate-500 uppercase">Wings</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or flat..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {['All', 'A', 'B', 'C', 'D'].map(w => (
            <button
              key={w}
              onClick={() => setWingFilter(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                wingFilter === w 
                  ? 'bg-slate-900 text-white dark:bg-brand-600 shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Wing {w === 'All' ? 'All' : w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Visible only to verified society residents. Privacy settings respected.
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filtered.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-card rounded-3xl p-6 border flex flex-col relative group ${!r.active ? 'opacity-60 border-slate-200 dark:border-slate-800 grayscale' : 'border-slate-200 dark:border-slate-800'}`}
            >
              {!r.active && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">Deactivated</div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${r.name}&backgroundColor=0284c7,3b82f6`} 
                  alt={r.name} 
                  className="w-14 h-14 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{r.name}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{r.wing}-{r.flat}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.type === 'Owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400'}`}>
                  {r.type}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Since {r.since}
                </span>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {r.privacy && !isManager ? (
                  <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                    <Lock className="w-3.5 h-3.5" /> Contact Hidden by Resident
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400" /> {r.phone}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400" /> {r.email}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => navigate(`/messages?userId=r${r.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition text-sm font-bold"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>

                {isManager && (
                  <button 
                    onClick={() => toggleStatus(r.id, r.active)}
                    className={`p-2.5 rounded-xl transition flex items-center justify-center ${r.active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'}`}
                    title={r.active ? 'Deactivate Account' : 'Activate Account'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>

            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Info className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No residents found</p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
