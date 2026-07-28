import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  BarChart2, TrendingUp, TrendingDown, Clock, CheckCircle, 
  AlertTriangle, Download, Calendar 
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const CATEGORY_DATA = [
  { name: 'Plumbing', value: 45, color: '#3b82f6' }, // blue-500
  { name: 'Electrical', value: 30, color: '#eab308' }, // yellow-500
  { name: 'Lift', value: 15, color: '#ef4444' }, // red-500
  { name: 'Security', value: 25, color: '#6366f1' }, // indigo-500
  { name: 'Cleaning', value: 55, color: '#10b981' }, // emerald-500
  { name: 'Garden', value: 10, color: '#84cc16' }, // lime-500
];

const MONTHLY_TREND = [
  { month: 'Jan', opened: 120, resolved: 110 },
  { month: 'Feb', opened: 98, resolved: 105 },
  { month: 'Mar', opened: 140, resolved: 130 },
  { month: 'Apr', opened: 115, resolved: 110 },
  { month: 'May', opened: 150, resolved: 145 },
  { month: 'Jun', opened: 80, resolved: 90 },
];

const STAFF_PERF = [
  { name: 'Rajesh (Plumb)', jobs: 42 },
  { name: 'Sunil (Elec)', jobs: 28 },
  { name: 'Anita (Clean)', jobs: 55 },
  { name: 'Vikram (Lift)', jobs: 15 }
];

export default function Analytics() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [dateRange, setDateRange] = useState('30 Days');

  const stats = [
    { label: 'Total Complaints', value: '250', trend: '+12%', isUp: true, icon: BarChart2, color: 'text-indigo-500' },
    { label: 'Resolution Rate', value: '92%', trend: '+2%', isUp: true, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Avg Resolution Time', value: '4.5 hrs', trend: '-1.2 hrs', isUp: true, icon: Clock, color: 'text-blue-500' },
    { label: 'Open Tickets', value: '18', trend: '-5', isUp: true, icon: AlertTriangle, color: 'text-amber-500' }
  ];

  const handleDownload = () => {
    setToast({ title: 'Exporting Report', message: 'The analytics report is downloading as PDF.' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Society operations overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
            {['7 Days', '30 Days', '90 Days', 'This Year'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === range 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition shadow-lg"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex items-end gap-3 mt-4">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
                <span className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stat.isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Area Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Complaint Trends (Opened vs Resolved)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="opened" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOpened)" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Complaints by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Staff Performance (Jobs Completed)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={STAFF_PERF} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="jobs" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recurring Issues Alert Box */}
        <div className="glass-card p-6 rounded-3xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Recurring Issues Detected</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">The system has flagged these areas as having repeated complaints in the selected time period.</p>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Water Leakage in Block B Basement</p>
                <p className="text-xs text-slate-500">4 complaints in last 7 days</p>
              </div>
            </li>
            <li className="flex items-start gap-3 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Passenger Lift 1 (Block C) Door Sensor</p>
                <p className="text-xs text-slate-500">3 breakdowns this month</p>
              </div>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}
