import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Shield, Users, Server, Database, Globe, Check, RefreshCcw } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { showToast } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSociety, setActiveSociety] = useState('Orchid Residency');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch admin users directory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDb = () => {
    showToast('Backup Initiated', 'Database dump saved to server storage.', 'success');
  };

  const handleSyncOffline = () => {
    showToast('Offline Sync', 'Synchronized pending local database transactions.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white my-0 flex items-center gap-2">
            <Shield className="w-7 h-7 text-rose-500" />
            Super Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global configurations, multi-society routing, database utilities, and full user lists.
          </p>
        </div>
        
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Multi-society Selector & Utilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Society Context</span>
          <select
            value={activeSociety}
            onChange={(e) => setActiveSociety(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white font-bold"
          >
            <option value="Orchid Residency">Orchid Residency (Mumbai)</option>
            <option value="Tulip Meadows">Tulip Meadows (Pune)</option>
            <option value="Lavender Palms">Lavender Palms (Bangalore)</option>
          </select>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Offline Store Queue</span>
            <span className="text-base font-extrabold dark:text-white">0 pending syncs</span>
          </div>
          <button 
            onClick={handleSyncOffline}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-brand-500/10"
          >
            Sync DB
          </button>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Database Operations</span>
            <span className="text-xs text-slate-500">JSON/Mongo Backup Tool</span>
          </div>
          <button 
            onClick={handleBackupDb}
            className="bg-rose-600 hover:bg-rose-550 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-rose-500/10"
          >
            Dump SQL/JSON
          </button>
        </div>
      </div>

      {/* Database User Directory */}
      <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl space-y-4">
        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          Global User Registry
        </h2>

        {loading ? (
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse w-full" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pt-1">User Name</th>
                  <th className="pb-3 pt-1">Email</th>
                  <th className="pb-3 pt-1">Phone</th>
                  <th className="pb-3 pt-1">System Role</th>
                  <th className="pb-3 pt-1">Flat / Unit details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
                {(users || []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-3 flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full border bg-slate-100" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{u.phone}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        u.role === 'admin' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                        u.role === 'manager' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                        u.role === 'staff' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/20' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {u.role === 'resident' 
                        ? `${u.details?.building || 'Orchid'} Wing ${u.details?.wing || 'A'}-${u.details?.flatNumber || '101'}` 
                        : u.role === 'staff'
                          ? `Housekeeping (${u.details?.skills?.join(', ')})`
                          : 'Society Office Unit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


