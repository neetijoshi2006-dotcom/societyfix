import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Users, PhoneCall, Star, ShieldCheck, Filter, Search, Plus, X } from 'lucide-react';

export default function DomesticHelp() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHelper, setNewHelper] = useState({ name: '', role: 'Maid', phone: '' });

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/domesticHelp');
      setHelpers(res.data.helpers || []);
    } catch (err) {
      console.error('Failed to load helpers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHelper = async (e) => {
    e.preventDefault();
    if (!newHelper.name || !newHelper.phone) return;
    try {
      const res = await api.post('/domesticHelp', newHelper);
      setHelpers([res.data.helper, ...helpers]);
      setIsModalOpen(false);
      setNewHelper({ name: '', role: 'Maid', phone: '' });
      setToast({ title: 'Helper Added', message: `${newHelper.name} has been added to the directory.` });
    } catch (err) {
      console.error('Failed to add helper', err);
      setToast({ title: 'Error', message: 'Could not add helper.' });
    }
  };

  const roles = ['All', 'Maid', 'Cook', 'Driver', 'Plumber', 'Electrician'];

  const filteredHelpers = helpers.filter(h => {
    const matchesFilter = filter === 'All' || h.role === filter;
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Domestic Help Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verified maids, cooks, and maintenance staff</p>
          </div>
        </div>

        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === r 
                  ? 'bg-slate-900 text-white dark:bg-brand-600 shadow-lg shadow-slate-900/20 dark:shadow-brand-500/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4,5,6].map(n => <div key={n} className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />)
        ) : filteredHelpers.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-500">No staff found matching your criteria</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredHelpers.map((h, idx) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center relative group"
              >
                {h.isVerified && (
                  <div className="absolute top-4 right-4 text-emerald-500" title="Verified">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4 border-2 border-white dark:border-slate-800 shadow-md">
                  <Users className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{h.name}</h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  {h.role}
                </span>
                
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{h.rating}</span>
                  <span className="text-xs text-slate-400">({h.reviews})</span>
                </div>
                
                <div className="w-full mt-auto">
                  <a href={`tel:${h.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 text-white rounded-xl font-semibold transition shadow-md active:scale-95">
                    <PhoneCall className="w-4 h-4" />
                    Call Now
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Add New Staff</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddHelper} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                  <input type="text" required value={newHelper.name} onChange={e => setNewHelper({...newHelper, name: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="Staff Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                  <select value={newHelper.role} onChange={e => setNewHelper({...newHelper, role: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium">
                    <option value="Maid">Maid</option>
                    <option value="Cook">Cook</option>
                    <option value="Driver">Driver</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" required value={newHelper.phone} onChange={e => setNewHelper({...newHelper, phone: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="+91 XXXXX XXXXX" />
                </div>
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 mt-4">
                  Add to Directory
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
