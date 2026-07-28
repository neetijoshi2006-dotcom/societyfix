import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Users, Megaphone, Activity, AlertTriangle, ShieldCheck, 
  Trash2, Mail, Phone, Wrench, Award, CheckCircle, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';

export default function ManagerDashboard() {
  const { showToast } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab views
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets', 'staff', 'broadcast'
  
  // Assigning states
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [assigningCategory, setAssigningCategory] = useState('');

  // Staff creation form states
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSkill, setStaffSkill] = useState('Electrician');

  // Announcement form states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState('maintenance');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analRes, compRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/complaints')
      ]);
      setAnalytics(analRes.data);
      setComplaints(compRes.data.complaints);
    } catch (err) {
      console.error('Failed to load manager dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch helper
  const handleRefresh = () => fetchDashboardData();

  // Assign staff
  const handleAssignStaffSubmit = async (ticketId, staffId) => {
    try {
      await api.put(`/complaints/${ticketId}/assign`, { staffId });
      showToast('Staff Assigned', 'Technician has been alerted.', 'success');
      setAssigningTicketId(null);
      
      // Update local state
      fetchDashboardData();
    } catch (err) {
      showToast('Error', 'Failed to assign staff.', 'error');
    }
  };

  // Close completed complaint
  const handleApproveClosure = async (ticketId) => {
    try {
      await api.put(`/complaints/${ticketId}/close`);
      showToast('Complaint Closed', 'Ticket has been approved and closed.', 'success');
      
      fetchDashboardData();
    } catch (err) {
      showToast('Error', 'Failed to close complaint.', 'error');
    }
  };

  // Suspend staff member
  const handleToggleSuspendStaff = async (staffId) => {
    try {
      const res = await api.put(`/analytics/staff/${staffId}/suspend`);
      showToast('Staff Status Updated', res.data.message, 'success');
      
      fetchDashboardData();
    } catch (err) {
      showToast('Error', 'Failed to change staff status.', 'error');
    }
  };

  // Create staff account
  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword || !staffPhone) {
      showToast('Validation Error', 'Please fill in all staff details.', 'warning');
      return;
    }

    try {
      await api.post('/analytics/staff', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        skills: [staffSkill]
      });

      showToast('Success', 'New staff member registered.', 'success');
      
      // Reset form
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      
      fetchDashboardData();
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to create staff account.', 'error');
    }
  };

  // Broadcast announcement
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      showToast('Validation Error', 'Title and content are required.', 'warning');
      return;
    }

    try {
      await api.post('/announcements', {
        title: annTitle,
        content: annContent,
        category: annCategory
      });
      showToast('Broadcast Sent', 'Notice published successfully.', 'success');
      setAnnTitle('');
      setAnnContent('');
    } catch (err) {
      showToast('Error', 'Failed to broadcast announcement.', 'error');
    }
  };

  // Helper matching colors for category pie cells
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const pendingTickets = complaints.filter(c => c.status === 'pending');
  const activeTickets = complaints.filter(c => ['assigned', 'accepted', 'in-progress', 'waiting-materials'].includes(c.status));
  const completedTickets = complaints.filter(c => c.status === 'completed');

  // Match technician skill to ticket category
  const getSkillMatch = (ticketCategory, staffSkills) => {
    const map = {
      'plumbing': ['plumber', 'plumbing'],
      'electricity': ['electrician', 'electricity'],
      'lift': ['lift technician', 'elevator'],
      'cleaning': ['cleaner', 'housekeeping'],
      'garden': ['gardener', 'garden'],
      'painting': ['painter']
    };
    const cat = ticketCategory.toLowerCase();
    const matches = map[cat] || [cat];
    return staffSkills.some(skill => matches.includes(skill.toLowerCase()));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Aggregated Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white my-0">
            Manager Control Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor workloads, view analytics, assign tickets, and broadcast alerts.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading || !analytics ? (
        <div className="h-60 rounded-3xl bg-slate-200 dark:bg-slate-900 animate-pulse w-full" />
      ) : (
        <>
          {/* 2. Overview Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Issues', count: analytics.stats.active, icon: Activity, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30' },
              { label: 'Pending Assignment', count: analytics.stats.pending, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
              { label: 'SOS Emergencies', count: analytics.stats.emergency, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
              { label: 'Avg Resolution Speed', count: `${analytics.stats.avgResolutionTimeHours} hrs`, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-card p-5 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{card.label}</span>
                    <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5 block">{card.count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Recharts Graphics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly Trend Area Chart */}
            <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-900 lg:col-span-2 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                Complaints Volume Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyTrends}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                Complaint Categories
              </h3>
              <div className="h-64 flex items-center justify-center">
                {analytics.byCategory?.length === 0 ? (
                  <span className="text-xs text-slate-400">No data available</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} issues`, name]} contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* 4. Tab Switcher for Action lists */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {[
              { id: 'tickets', label: 'Ticket Directory' },
              { id: 'staff', label: 'Housekeeping Staff' },
              { id: 'broadcast', label: 'Send Announcements' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeSubTab === tab.id
                    ? 'border-brand-600 text-brand-600 dark:border-brand-450 dark:text-brand-450'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              
              {/* SUB TAB 1: Ticket Assignments & Closures */}
              {activeSubTab === 'tickets' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-6"
                >
                  {/* Pending assignments */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                      Unassigned Issues ({pendingTickets.length})
                    </h3>
                    
                    {pendingTickets.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 border border-dashed rounded-xl">No pending assignments! All tickets have been processed.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {pendingTickets.map(ticket => (
                          <div key={ticket.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400">ID: {ticket.id.substring(0, 8)} • Floor {ticket.location?.floor}</span>
                              <h4 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{ticket.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">Filed by {ticket.residentName} in flat {ticket.location?.wing}-{ticket.location?.flatNumber}</p>
                            </div>

                            {/* Dropdown assigner */}
                            <div className="relative">
                              {assigningTicketId === ticket.id ? (
                                <div className="flex gap-2">
                                  <select
                                    onChange={(e) => handleAssignStaffSubmit(ticket.id, e.target.value)}
                                    defaultValue=""
                                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                                  >
                                    <option value="" disabled>Choose staff member</option>
                                    {analytics.staffWorkload
                                      .sort((a, b) => {
                                        // Sort staff: matching skills first
                                        const aMatch = getSkillMatch(ticket.category, a.skills);
                                        const bMatch = getSkillMatch(ticket.category, b.skills);
                                        if (aMatch && !bMatch) return -1;
                                        if (!aMatch && bMatch) return 1;
                                        return a.activeJobs - b.activeJobs; // Least loaded next
                                      })
                                      .map(staff => {
                                        const matches = getSkillMatch(ticket.category, staff.skills);
                                        return (
                                          <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.skills.join(', ')}) {matches ? '⭐ Skill Match' : ''} • Load: {staff.activeJobs}
                                          </option>
                                        );
                                      })}
                                  </select>
                                  <button
                                    onClick={() => setAssigningTicketId(null)}
                                    className="text-xs border border-slate-200 px-3.5 py-2 rounded-xl"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setAssigningTicketId(ticket.id); setAssigningCategory(ticket.category); }}
                                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                                >
                                  Assign Staff
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Closure reviews */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-455">
                      Pending Manager Sign-off ({completedTickets.length})
                    </h3>
                    
                    {completedTickets.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 border border-dashed rounded-xl">No completed tickets awaiting approval.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {completedTickets.map(ticket => (
                          <div key={ticket.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400">RESOLVED BY: {ticket.assignedStaffName}</span>
                              <h4 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{ticket.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">Resolution Details: {ticket.timeline?.[ticket.timeline.length - 1]?.notes}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveClosure(ticket.id)}
                                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                              >
                                Approve Closure
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SUB TAB 2: Staff directory manager */}
              {activeSubTab === 'staff' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Staff List */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Technicians</h3>
                    <div className="grid grid-cols-1 gap-3.5">
                      {analytics.staffWorkload.map(staff => (
                        <div key={staff.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-900 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={staff.avatar} alt={staff.name} className="w-11 h-11 rounded-full border bg-slate-100" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white">{staff.name}</h4>
                              <div className="flex gap-1.5 mt-0.5">
                                {staff.skills.map((s, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Active Jobs</span>
                              <span className="text-sm font-extrabold text-slate-800 dark:text-white">{staff.activeJobs}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Rating</span>
                              <span className="text-sm font-extrabold text-amber-500">{staff.rating.toFixed(1)} ★</span>
                            </div>
                            
                            <button
                              onClick={() => handleToggleSuspendStaff(staff.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                staff.details?.isSuspended 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {staff.details?.isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create staff form */}
                  <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl self-start space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Add Maintenance Staff</h3>
                    
                    <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Singh"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="ramesh@societyfix.com"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                        <input
                          type="text"
                          required
                          placeholder="+91 98765 43230"
                          value={staffPhone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assigned Skill</label>
                        <select
                          value={staffSkill}
                          onChange={(e) => setStaffSkill(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        >
                          <option value="Electrician">Electrician</option>
                          <option value="Plumber">Plumber</option>
                          <option value="Cleaner">Cleaner</option>
                          <option value="Gardener">Gardener</option>
                          <option value="Lift Technician">Lift Technician</option>
                          <option value="Painter">Painter</option>
                          <option value="Security">Security</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                      >
                        Create Staff Account
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* SUB TAB 3: Broadcast centre */}
              {activeSubTab === 'broadcast' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="glass-card max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-bold dark:text-white">Broadcast Society Notice</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Post an announcement. All residents will receive in-app alert notifications instantly.
                    </p>
                  </div>

                  <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notice Category</label>
                      <select
                        value={annCategory}
                        onChange={(e) => setAnnCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                      >
                        <option value="water-shutdown">Water Shutdown</option>
                        <option value="maintenance">Maintenance Notice</option>
                        <option value="events">Events & Activities</option>
                        <option value="electricity">Electricity Shutdown</option>
                        <option value="security-alerts">Security Alerts</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notice Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Scheduled Water Outage: July 3rd"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Message Details</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Write details about timing, buildings affected, instructions..."
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-brand-500/15 transition flex items-center justify-center gap-1.5"
                    >
                      <Megaphone className="w-4 h-4" /> Broadcast Announcement
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}


