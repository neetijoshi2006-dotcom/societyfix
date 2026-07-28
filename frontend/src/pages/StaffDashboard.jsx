import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  FileText, Calendar as CalendarIcon, Award, Clock, CheckCircle2, 
  AlertCircle, XCircle, ArrowRight, User, Check, Play, Upload, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StaffDashboard() {
  const { showToast } = useSocket();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned', 'schedule', 'performance'
  
  // Accept/Reject action states
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Completion file upload state
  const [completeId, setCompleteId] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [afterImages, setAfterImages] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setJobs(res.data.complaints);
    } catch (err) {
      console.error('Error fetching staff jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    try {
      const res = await api.put(`/complaints/${jobId}/status`, {
        status: 'accepted',
        notes: 'Job assignment accepted by technician.'
      });
      showToast('Job Accepted', 'You have accepted this task. Get to work!', 'success');
      setJobs(prev => prev.map(j => j.id === jobId ? res.data.complaint : j));
    } catch (err) {
      showToast('Error', 'Failed to accept job.', 'error');
    }
  };

  const handleRejectJobSubmit = async (jobId) => {
    if (!rejectReason.trim()) {
      showToast('Error', 'Please provide a reason for rejection.', 'warning');
      return;
    }

    try {
      await api.put(`/complaints/${jobId}/status`, {
        status: 'pending', // Reverts to pending, unassigns
        notes: rejectReason
      });
      showToast('Assignment Rejected', 'Assignment reverted to manager directory.', 'warning');
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      showToast('Error', 'Failed to reject job.', 'error');
    }
  };

  const handleStartWork = async (jobId) => {
    try {
      const res = await api.put(`/complaints/${jobId}/status`, {
        status: 'in-progress',
        notes: 'Technician has started repairing the issue.'
      });
      showToast('Work Started', 'Status set to In Progress.', 'success');
      setJobs(prev => prev.map(j => j.id === jobId ? res.data.complaint : j));
    } catch (err) {
      showToast('Error', 'Failed to start work.', 'error');
    }
  };

  const handleCompleteJobSubmit = async (jobId) => {
    const formData = new FormData();
    formData.append('status', 'completed');
    formData.append('notes', completeNotes || 'Work resolved successfully.');
    afterImages.forEach(img => {
      formData.append('afterImages', img);
    });

    try {
      const res = await api.put(`/complaints/${jobId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Job Completed', 'Congratulations on completing the job!', 'success');
      setJobs(prev => prev.map(j => j.id === jobId ? res.data.complaint : j));
      setCompleteId(null);
      setCompleteNotes('');
      setAfterImages([]);
    } catch (err) {
      showToast('Error', 'Failed to finalize job completion.', 'error');
    }
  };

  // Filter lists based on states
  const pendingAssignments = jobs.filter(j => j.status === 'assigned');
  const activeJobs = jobs.filter(j => ['accepted', 'in-progress', 'waiting-materials'].includes(j.status));
  const completedJobs = jobs.filter(j => ['completed', 'closed'].includes(j.status));

  // Compute metrics
  const avgRating = completedJobs.reduce((acc, curr) => acc + (curr.rating?.stars || 5), 0) / (completedJobs.filter(j => j.rating).length || 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white my-0">
          Technician Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, accept, and update progress on your assigned society tickets.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'assigned', label: 'My Active Jobs', icon: FileText },
          { id: 'schedule', label: 'Schedule Calendar', icon: CalendarIcon },
          { id: 'performance', label: 'My Performance', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 dark:border-brand-450 dark:text-brand-450'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse w-full" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: Assigned Jobs */}
          {activeTab === 'assigned' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="space-y-6"
            >
              {/* SECTION: New Assignments needing Accept/Reject */}
              {pendingAssignments.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                    New Job Assignments ({pendingAssignments.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {pendingAssignments.map(job => (
                      <div key={job.id} className="glass-card p-5 rounded-2xl border border-orange-200/50 dark:border-orange-950/20 bg-orange-50/10 dark:bg-orange-950/5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">ID: {job.id.substring(0, 8)}</span>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{job.title}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{job.description}</p>
                            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-2 font-semibold">
                              📍 Flat {job.location?.building} {job.location?.wing}-{job.location?.flatNumber} ({job.location?.exactLocation})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-rose-50 text-rose-600 uppercase">
                            {job.priority}
                          </span>
                        </div>

                        {/* Accept/Reject actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                          <button
                            onClick={() => handleAcceptJob(job.id)}
                            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Job
                          </button>
                          
                          {rejectId === job.id ? (
                            <div className="flex-1 min-w-[240px] flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                              />
                              <button
                                onClick={() => handleRejectJobSubmit(job.id)}
                                className="bg-rose-600 hover:bg-rose-550 text-white font-bold py-2 px-3 rounded-xl text-xs transition"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => setRejectId(null)}
                                className="text-slate-400 hover:text-slate-600 p-2"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectId(job.id)}
                              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Decline
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: Active accepted jobs */}
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
                  Accepted Work Orders ({activeJobs.length})
                </h2>
                
                {activeJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-900 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 opacity-25 mx-auto mb-2" />
                    <p className="text-xs">No active jobs in your queue. Take a rest or check new assignments!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {activeJobs.map(job => (
                      <div key={job.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400">{job.category.toUpperCase()}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                job.status === 'in-progress' ? 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{job.title}</h3>
                            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-1">
                              📍 Flat {job.location?.building} {job.location?.wing}-{job.location?.flatNumber} • {job.location?.exactLocation}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/complaints/${job.id}`)}
                            className="p-2 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-950 rounded-xl transition shrink-0"
                          >
                            <MessageSquare className="w-4 h-4 text-brand-500" />
                          </button>
                        </div>

                        {/* Progress controller */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-900">
                          {job.status === 'accepted' && (
                            <button
                              onClick={() => handleStartWork(job.id)}
                              className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-550 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" /> Start Job
                            </button>
                          )}

                          {completeId === job.id ? (
                            <div className="w-full space-y-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-900">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Complete Job Checklist</h4>
                              
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Work Comments</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Replaced broken pipe valve under sink."
                                  value={completeNotes}
                                  onChange={(e) => setCompleteNotes(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Upload Work Resolution Photo (Optional)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setAfterImages([e.target.files[0]])}
                                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-brand-600 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-white"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCompleteJobSubmit(job.id)}
                                  className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                                >
                                  Finalize Completion
                                </button>
                                <button
                                  onClick={() => setCompleteId(null)}
                                  className="border border-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCompleteId(job.id)}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: Schedule Calendar */}
          {activeTab === 'schedule' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl space-y-4"
            >
              <h2 className="text-base font-bold dark:text-white">Assigned Job Schedule</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Here is a summary list of your scheduled complaints ordered by report dates.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
                {jobs.map((job) => (
                  <div key={job.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">{new Date(job.createdAt).toLocaleDateString()}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{job.title}</h4>
                      <p className="text-[10px] text-slate-500">Flat {job.location?.building} {job.location?.wing}-{job.location?.flatNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg uppercase ${
                      job.status === 'completed' || job.status === 'closed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: Performance statistics */}
          {activeTab === 'performance' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
              <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-900 text-center space-y-2">
                <Award className="w-8 h-8 text-amber-500 mx-auto" />
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Average Rating</span>
                <span className="text-3xl font-extrabold dark:text-white mt-1 block">{avgRating.toFixed(1)} / 5.0</span>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-900 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completed Jobs</span>
                <span className="text-3xl font-extrabold dark:text-white mt-1 block">{completedJobs.length} resolved</span>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-slate-900 text-center space-y-2">
                <Clock className="w-8 h-8 text-violet-500 mx-auto" />
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Queue Backlog</span>
                <span className="text-3xl font-extrabold dark:text-white mt-1 block">{activeJobs.length} active</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}


