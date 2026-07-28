import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CreditCard, Download, FileText, CheckCircle, AlertCircle, Clock, Search, Filter } from 'lucide-react';

const MOCK_ALL_FLATS = [
  { id: 101, wing: 'A', flat: '101', name: 'Rahul Sharma', amount: 2500, status: 'Paid' },
  { id: 102, wing: 'A', flat: '102', name: 'Anita Patel', amount: 2500, status: 'Paid' },
  { id: 103, wing: 'B', flat: '201', name: 'Vikram Singh', amount: 2500, status: 'Overdue' },
  { id: 104, wing: 'C', flat: '305', name: 'Priya Desai', amount: 2500, status: 'Pending' },
];

export default function MaintenanceFee() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('upi');
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFee, setCurrentFee] = useState(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees');
      setFees(res.data.fees || []);
      const current = res.data.fees?.find(f => f.status !== 'Paid');
      setCurrentFee(current || res.data.fees?.[0]);
    } catch (err) {
      console.error('Failed to fetch fees', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!currentFee) return;

    try {
      await api.post(`/fees/${currentFee.id}/pay`);
      setIsPayModalOpen(false);
      setToast({ title: 'Payment Successful', message: 'Maintenance fee paid successfully.' });
      fetchFees();
    } catch (err) {
      console.error('Failed to pay fee', err);
      setToast({ title: 'Error', message: 'Could not process payment.' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Due Soon': 
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'Overdue': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Maintenance Fees
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage society dues and payments</p>
          </div>
        </div>
        
        {isManager && (
          <button onClick={() => setToast({title:'Exported', message:'CSV report downloaded'})} className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold shadow-lg text-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        )}
      </div>

      {!isManager ? (
        // Resident View
        <div className="space-y-6">
          {/* Current Due Card */}
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
              <CreditCard className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Current Dues</h3>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentFee?.month || 'Current Month'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(currentFee?.status || 'Paid')}`}>
                  {currentFee?.status || 'Paid'}
                </span>
              </div>
              
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{currentFee?.amount || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-slate-500 dark:text-slate-400 mb-0.5">Due Date</p>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" /> {currentFee?.dueOn || '--'}
                  </p>
                </div>
                
                {currentFee?.status !== 'Paid' && (
                  <button 
                    onClick={() => setIsPayModalOpen(true)}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* History Table */}
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white">Payment History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading history...</td></tr>
                  ) : fees.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
                  ) : fees.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.month}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono font-bold">₹{row.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{row.paidOn || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        {row.status === 'Paid' ? (
                          <button onClick={() => setToast({title:'Receipt Downloaded', message:''})} className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/20 rounded-lg transition inline-block">
                            <Download className="w-4 h-4" />
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Manager View
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Collected</span>
              <h3 className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">₹4,50,000</h3>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase">Pending Dues</span>
              <h3 className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">₹32,500</h3>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase">Overdue Count</span>
              <h3 className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">13 Flats</h3>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase">Collection Rate</span>
              <h3 className="text-2xl font-black mt-2 text-brand-600 dark:text-brand-400">92%</h3>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search flat or name..." className="w-full pl-9 pr-4 py-2 text-sm glass-input rounded-xl" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button 
                onClick={() => setToast({title:'Reminders Sent', message:'Notified 13 overdue flats.'})}
                className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md"
              >
                Remind Overdue
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Flat No</th>
                  <th className="px-6 py-4">Resident Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MOCK_ALL_FLATS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.wing}-{row.flat}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono font-bold">₹{row.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.status !== 'Paid' && (
                        <button onClick={() => setToast({title:'Marked Paid', message:`${row.wing}-${row.flat} marked as paid manually.`})} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {isPayModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPayModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Complete Payment</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹2,500</p>
              </div>
              
              <form onSubmit={handlePay} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPayMethod('upi')} className={`py-3 rounded-xl text-sm font-bold border transition ${payMethod === 'upi' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}>
                      UPI (GPay/PhonePe)
                    </button>
                    <button type="button" onClick={() => setPayMethod('card')} className={`py-3 rounded-xl text-sm font-bold border transition ${payMethod === 'card' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}>
                      Credit/Debit Card
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                  Pay ₹2,500 Securely
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




