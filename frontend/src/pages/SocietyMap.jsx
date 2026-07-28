import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Dumbbell, Waves, Coffee, Trees, ShieldAlert, Car, Info, X, Home, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const BLOCKS = [
  {
    id: 'A', name: 'Wing A', color: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/20',
    borderColor: 'border-blue-500/30', textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    floors: 8, flatsPerFloor: 4, totalResidents: 128,
    activeComplaints: 3, resolvedThisMonth: 12,
    description: 'Premium east-facing wing with garden view',
    facilities: ['Elevator x2', 'CCTV', 'Generator Backup'],
    position: { gridCol: '1 / 2', gridRow: '1 / 2' }
  },
  {
    id: 'B', name: 'Wing B', color: 'from-purple-500 to-indigo-500', shadowColor: 'shadow-purple-500/20',
    borderColor: 'border-purple-500/30', textColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    floors: 10, flatsPerFloor: 4, totalResidents: 160,
    activeComplaints: 5, resolvedThisMonth: 18,
    description: 'Tallest block with pool-facing view',
    facilities: ['Elevator x3', 'CCTV', 'Generator Backup', 'Intercom'],
    position: { gridCol: '3 / 4', gridRow: '1 / 2' }
  },
  {
    id: 'C', name: 'Wing C', color: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/20',
    borderColor: 'border-emerald-500/30', textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    floors: 8, flatsPerFloor: 4, totalResidents: 118,
    activeComplaints: 1, resolvedThisMonth: 9,
    description: 'Quiet west-facing block with park view',
    facilities: ['Elevator x2', 'CCTV', 'Solar Panels'],
    position: { gridCol: '1 / 2', gridRow: '3 / 4' }
  },
  {
    id: 'D', name: 'Wing D', color: 'from-rose-500 to-pink-500', shadowColor: 'shadow-rose-500/20',
    borderColor: 'border-rose-500/30', textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    floors: 6, flatsPerFloor: 4, totalResidents: 86,
    activeComplaints: 2, resolvedThisMonth: 7,
    description: 'Cozy compact wing near main entrance',
    facilities: ['Elevator x1', 'CCTV', 'Generator Backup'],
    position: { gridCol: '3 / 4', gridRow: '3 / 4' }
  },
];

const AMENITIES = [
  { id: 'pool', name: 'Swimming Pool', icon: Waves, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', status: 'Available', position: { gridCol: '2 / 3', gridRow: '1 / 2' } },
  { id: 'gym', name: 'Gymnasium', icon: Dumbbell, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', status: 'Open', position: { gridCol: '2 / 3', gridRow: '3 / 4' } },
  { id: 'club', name: 'Clubhouse', icon: Coffee, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', status: 'Open', position: { gridCol: '1 / 2', gridRow: '2 / 3' } },
  { id: 'park', name: 'Central Park', icon: Trees, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', status: 'Open', position: { gridCol: '2 / 3', gridRow: '2 / 3' } },
  { id: 'parking', name: 'Parking', icon: Car, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', status: 'Limited', position: { gridCol: '3 / 4', gridRow: '2 / 3' } },
  { id: 'security', name: 'Security', icon: ShieldAlert, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', status: 'Active 24x7', position: { gridCol: '2 / 3', gridRow: '4 / 5' } },
];

export default function SocietyMap() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // all | blocks | amenities

  const handleSelect = (item) => {
    setSelected(item);
  };

  const handleClose = () => setSelected(null);

  const isBlock = selected && 'floors' in selected;
  const isAmenity = selected && 'status' in selected && !('floors' in selected);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-500/20 text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Society Map
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Interactive layout of Orchid Residency</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="hidden sm:flex items-center gap-2 glass-card rounded-xl p-1 border border-slate-200 dark:border-slate-800">
          {['all', 'blocks', 'amenities'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Wings', value: '4', icon: Home, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Total Residents', value: '492', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Active Issues', value: '11', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Resolved / Mo.', value: '46', icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Grid */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 overflow-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Orchid Residency — Ground Plan
        </p>

        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto auto auto',
            minWidth: '400px'
          }}
        >
          {/* BLOCKS */}
          {(filter === 'all' || filter === 'blocks') && BLOCKS.map((block, i) => (
            <motion.button
              key={block.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(block)}
              style={{ gridColumn: block.position.gridCol, gridRow: block.position.gridRow }}
              className={`relative rounded-2xl border ${block.borderColor} ${block.bgColor} p-4 text-left shadow-lg ${block.shadowColor} transition-all group`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${block.color} text-white font-extrabold text-lg shadow-md mb-3`}>
                {block.id}
              </div>
              <p className={`font-bold text-sm ${block.textColor}`}>{block.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{block.floors} floors · {block.totalResidents} residents</p>
              {block.activeComplaints > 0 && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {block.activeComplaints} issues
                </span>
              )}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </motion.button>
          ))}

          {/* AMENITIES */}
          {(filter === 'all' || filter === 'amenities') && AMENITIES.map((am, i) => {
            const Icon = am.icon;
            return (
              <motion.button
                key={am.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (BLOCKS.length + i) * 0.07 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(am)}
                style={{ gridColumn: am.position.gridCol, gridRow: am.position.gridRow }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 p-3 text-center shadow-sm hover:shadow-md transition-all group flex flex-col items-center justify-center gap-2"
              >
                <div className={`p-2.5 rounded-xl ${am.color} shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{am.name}</p>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{am.status}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Click to explore hint */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        Click on any wing or amenity to view detailed information
      </p>

      {/* Detail Panel Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
            >
              {/* Modal header with gradient */}
              {isBlock && (
                <div className={`bg-gradient-to-r ${selected.color} p-6 text-white`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-extrabold text-2xl mb-3">
                        {selected.id}
                      </div>
                      <h2 className="text-xl font-extrabold">{selected.name}</h2>
                      <p className="text-sm text-white/80 mt-0.5">{selected.description}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {isAmenity && (
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${selected.color}`}>
                      <selected.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-900 dark:text-white">{selected.name}</h2>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selected.status}</span>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="p-5 space-y-4">
                {isBlock && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Floors', value: selected.floors, icon: Home },
                        { label: 'Total Residents', value: selected.totalResidents, icon: Users },
                        { label: 'Active Complaints', value: selected.activeComplaints, icon: AlertCircle },
                        { label: 'Resolved / Month', value: selected.resolvedThisMonth, icon: CheckCircle },
                      ].map(stat => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{stat.value}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Facilities</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.facilities.map(f => (
                          <span key={f} className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-xs font-semibold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Complaint health bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolution Rate</p>
                        <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {Math.round(selected.resolvedThisMonth / (selected.resolvedThisMonth + selected.activeComplaints) * 100)}%
                        </p>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(selected.resolvedThisMonth / (selected.resolvedThisMonth + selected.activeComplaints) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    </div>
                  </>
                )}

                {isAmenity && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{selected.status}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current Status</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                      This amenity is available for all residents to book via the <span className="font-bold text-brand-600 dark:text-brand-400">Book Amenity</span> page.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
