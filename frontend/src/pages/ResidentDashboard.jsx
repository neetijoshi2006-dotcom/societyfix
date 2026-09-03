import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Filter, BookOpen, Clock, CheckCircle, AlertCircle, 
  ArrowRight, MessageSquare, Star, Bookmark, BookmarkCheck, HeartCrack
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Bookmarks saved in localstorage
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem(`bookmarks_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get('/complaints', { params });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Error fetching complaints', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter(bId => bId !== id);
    } else {
      updated = [...bookmarks, id];
    }
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(updated));
  };

  // Filter complaints list by search query locally
  const filteredComplaints = (complaints || []).filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.id?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute stat counts
  const pendingCount = (complaints || []).filter(c => c.status === 'pending').length;
  const inProgressCount = (complaints || []).filter(c => ['assigned', 'accepted', 'in-progress', 'waiting-materials'].includes(c.status)).length;
  const completedCount = (complaints || []).filter(c => ['completed', 'closed'].includes(c.status)).length;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'assigned':
      case 'accepted':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'in-progress':
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30';
      case 'waiting-materials':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white my-0">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and file complaints for Flat {user.details?.building} {user.details?.wing}-{user.details?.flatNumber}
          </p>
        </div>
        <Link
          to="/resident/raise"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-lg shadow-brand-500/10 active:scale-[0.98] self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          File New Complaint
        </Link>
      </div>

      {/* 2. Glassmorphic Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Pending Review', count: pendingCount, icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
          { label: 'In Progress', count: inProgressCount, icon: AlertCircle, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Resolved Tickets', count: completedCount, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-6 rounded-2xl flex items-center gap-5 border border-slate-100 dark:border-slate-900 shadow-md">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{stat.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filter controls & Search */}
      <div className="glass-card p-5 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-brand-400 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          >
            <option value="">All Categories</option>
            {['Plumbing', 'Electricity', 'Lift', 'Parking', 'Cleaning', 'Security', 'Pest Control', 'Others'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* 4. Complaints List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold dark:text-white mb-2">Complaint History</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse w-full" />
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-900 max-w-xl mx-auto shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-40 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No complaints found</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
              You haven't filed any complaints matching these filters yet. If you have an issue, click "File New Complaint".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((comp) => {
              const isBookmarked = bookmarks.includes(comp.id);
              return (
                <motion.div
                  layout
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-slate-900 shadow-sm hover:shadow-md transition duration-300 relative group flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => navigate(`/complaints/${comp.id}`)}
                >
                  {/* Left part: Title, Category, Priority badge */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                        #{comp.id.substring(0, 8)}
                      </span>
                      <span className={`text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full ${
                        comp.priority === 'emergency' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' 
                          : comp.priority === 'high'
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-450'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {comp.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-450 transition-colors">
                      {comp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>Category: <strong className="font-semibold text-slate-700 dark:text-slate-300">{comp.category}</strong></span>
                      <span>Filed: <strong className="font-semibold text-slate-700 dark:text-slate-300">{new Date(comp.createdAt).toLocaleDateString()}</strong></span>
                      {comp.assignedStaffName && (
                        <span>Assigned to: <strong className="font-semibold text-brand-600 dark:text-brand-400">{comp.assignedStaffName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Right part: Status tag, bookmark button, details link */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t pt-3 md:border-t-0 md:pt-0 border-slate-100 dark:border-slate-800">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getStatusStyle(comp.status)}`}>
                      {comp.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleBookmarkToggle(e, comp.id)}
                        className={`p-2.5 rounded-xl border transition ${
                          isBookmarked 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400' 
                            : 'border-slate-200 hover:bg-slate-100 text-slate-400 dark:border-slate-900 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-450 group-hover:border-brand-500/20 transition">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


