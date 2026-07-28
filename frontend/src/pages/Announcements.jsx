import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { Megaphone, Plus, X, Pin, AlertCircle, Clock, CheckCircle, Info, Calendar } from 'lucide-react';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', category: 'General', message: '', isUrgent: false });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const filtered = announcements.filter(a => filter === 'All' || a.category === filter);
  
  // Sort: pinned first, then by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    }
    return a.isPinned ? -1 : 1;
  });

  const categoryColors = {
    Maintenance: 'bg-blue-500',
    Event: 'bg-green-500',
    Alert: 'bg-red-500',
    Reminder: 'bg-yellow-500',
    General: 'bg-indigo-500'
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    
    try {
      // Assuming backend expects content instead of message based on db.json format
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.message,
        category: newAnnouncement.category.toLowerCase(),
        isUrgent: newAnnouncement.isUrgent,
        isPinned: false
      };
      const res = await api.post('/announcements', payload);
      setAnnouncements([res.data.announcement || res.data, ...announcements]);
      setIsModalOpen(false);
      setNewAnnouncement({ title: '', category: 'General', message: '', isUrgent: false });
      // Fetch fresh to ensure we get the right mapped fields
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to post announcement', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-2xl shadow-lg shadow-brand-500/20 text-white">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Notice Board
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Official updates and society announcements</p>
          </div>
        </div>

        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Maintenance', 'Event', 'Alert', 'Reminder', 'General'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f 
                ? 'bg-slate-800 text-white dark:bg-brand-600 dark:text-white shadow-md' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(n => <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl w-full" />)}
          </div>
        ) : (
          <AnimatePresence>
            {sorted.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
              >
                <Info className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No announcements found</p>
              </motion.div>
            ) : (
            sorted.map((ann, idx) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row relative group ${ann.isUrgent ? 'ring-2 ring-red-500/50 shadow-red-500/10' : ''}`}
              >
                {/* Left Color Bar */}
                <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto ${categoryColors[ann.category] || categoryColors.General}`} />
                
                <div className="p-5 sm:p-6 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {ann.isPinned && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        {ann.isUrgent && (
                          <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {ann.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {ann.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {ann.postedBy}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(ann.createdAt || ann.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    
                    {isManager && (
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {ann.message || ann.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        )}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Post Announcement</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePost} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
                  <input 
                    type="text" required
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    placeholder="e.g. Water Cut Tomorrow"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select 
                      value={newAnnouncement.category}
                      onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium appearance-none"
                    >
                      <option value="Maintenance">Maintenance</option>
                      <option value="Event">Event</option>
                      <option value="Alert">Alert</option>
                      <option value="Reminder">Reminder</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <input 
                        type="checkbox"
                        checked={newAnnouncement.isUrgent}
                        onChange={e => setNewAnnouncement({...newAnnouncement, isUrgent: e.target.checked})}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mark Urgent</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message</label>
                  <textarea 
                    required rows="4"
                    value={newAnnouncement.message}
                    onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium resize-none"
                    placeholder="Write your announcement details here..."
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                  Post Announcement
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




