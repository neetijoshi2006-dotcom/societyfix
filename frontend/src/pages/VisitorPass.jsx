import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { QrCode, Plus, X, User, Calendar, Clock, Car, ShieldCheck, Download, Share2, AlertCircle } from 'lucide-react';

export default function VisitorPass() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePass, setActivePass] = useState(null);

  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    purpose: 'Guest',
    count: 1
  });

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/visitors');
      setVisitors(res.data.passes || []);
    } catch (err) {
      console.error('Failed to load passes', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreApprove = async (e) => {
    e.preventDefault();
    if (!newVisitor.name || !newVisitor.phone) return;

    try {
      const res = await api.post('/visitors', newVisitor);
      const pass = res.data.pass;
      
      setVisitors([pass, ...visitors]);
      setActivePass(pass);
      setIsModalOpen(false);
      setNewVisitor({ name: '', phone: '', date: new Date().toISOString().split('T')[0], time: '12:00', purpose: 'Guest', count: 1 });
      setToast({ title: 'Gate Pass Generated', message: 'Share the code with your visitor.' });
    } catch (err) {
      console.error('Failed to generate pass', err);
      setToast({ title: 'Error', message: 'Could not generate pass.' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Awaiting': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'Checked-In': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Checked-Out': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'Expired': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Visitor Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pre-approve guests for hassle-free entry</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Pre-Approve Visitor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Active Pass Section */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Latest Gate Pass</h2>
          
          <AnimatePresence mode="wait">
            {activePass ? (
              <motion.div
                key={activePass.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-6 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${getStatusColor(activePass.status)}`}>
                  {activePass.status}
                </span>

                <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto mb-4 border border-slate-100">
                  {/* Fake QR Code Pattern */}
                  <div className="w-32 h-32 bg-slate-900 grid grid-cols-5 grid-rows-5 gap-0.5 p-1">
                    {Array.from({length: 25}).map((_, i) => (
                      <div key={i} className={Math.random() > 0.4 ? 'bg-white' : 'bg-transparent'} />
                    ))}
                    {/* Fixed corners */}
                    <div className="absolute top-5 left-5 w-6 h-6 border-4 border-slate-900 bg-white" />
                    <div className="absolute top-5 right-5 w-6 h-6 border-4 border-slate-900 bg-white" />
                    <div className="absolute bottom-5 left-5 w-6 h-6 border-4 border-slate-900 bg-white" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">{activePass.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{activePass.purpose}</p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Pass Code</p>
                  <p className="text-3xl font-black text-brand-600 dark:text-brand-400 tracking-widest">{activePass.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left mb-6">
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Date</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">{activePass.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Time</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">{activePass.time}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setToast({title:'Downloaded', message:'Pass saved to device'})} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-2.5 rounded-xl font-bold transition text-sm">
                    <Download className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => setToast({title:'Copied', message:'Link copied to clipboard'})} className="flex-1 flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/20 dark:hover:bg-brand-500/30 text-brand-700 dark:text-brand-400 py-2.5 rounded-xl font-bold transition text-sm">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500"
              >
                <QrCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">No active pass selected</p>
                <p className="text-xs mt-1">Pre-approve a visitor or select one from history.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Visitor History</h2>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden custom-scrollbar max-w-full overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4 font-bold">Visitor</th>
                  <th className="px-6 py-4 font-bold">Purpose</th>
                  <th className="px-6 py-4 font-bold">Date & Time</th>
                  <th className="px-6 py-4 font-bold">Pass Code</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading history...</td>
                  </tr>
                ) : visitors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No visitor passes found.</td>
                  </tr>
                ) : visitors.map((v) => (
                    <tr 
                      key={v.id} 
                      onClick={() => setActivePass(v)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{v.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          {v.purpose === 'Guest' ? <User className="w-4 h-4"/> : v.purpose === 'Delivery' ? <Car className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4"/>}
                          {v.purpose}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {v.date} <br/>
                        <span className="text-xs text-slate-400">{v.time}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-300">
                        {v.code}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pre-Approve Modal */}
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
                <h3 className="font-bold text-slate-900 dark:text-white">Pre-Approve Visitor</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePreApprove} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Visitor Name</label>
                    <input 
                      type="text" required
                      value={newVisitor.name}
                      onChange={e => setNewVisitor({...newVisitor, name: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      type="tel" required
                      value={newVisitor.phone}
                      onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Purpose</label>
                    <select 
                      value={newVisitor.purpose}
                      onChange={e => setNewVisitor({...newVisitor, purpose: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium appearance-none"
                    >
                      <option value="Guest">Guest</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Cab">Cab</option>
                      <option value="Service">Service / Repair</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">No. of People</label>
                    <input 
                      type="number" min="1" max="10"
                      value={newVisitor.count}
                      onChange={e => setNewVisitor({...newVisitor, count: parseInt(e.target.value)})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Visit Date</label>
                    <input 
                      type="date" required
                      value={newVisitor.date}
                      onChange={e => setNewVisitor({...newVisitor, date: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Expected Time</label>
                    <input 
                      type="time" required
                      value={newVisitor.time}
                      onChange={e => setNewVisitor({...newVisitor, time: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" /> Generate Gate Pass
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




