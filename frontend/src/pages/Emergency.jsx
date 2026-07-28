import React from 'react';
import { Shield, Flame, Activity, Phone, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Emergency() {
  const contacts = [
    { label: 'Society Gate Security', number: '+91 98765 43001', icon: Shield, desc: 'Intercom: 9001 (Available 24/7)', color: 'from-blue-500 to-indigo-600' },
    { label: 'Society Manager Office', number: '+91 98765 43211', icon: Phone, desc: 'Working Hours: 10:00 AM - 6:00 PM', color: 'from-brand-500 to-brand-700' },
    { label: 'Local Police Station', number: '100', icon: ShieldAlert, desc: 'Direct SOS emergency police desk', color: 'from-slate-700 to-slate-900' },
    { label: 'Medical Ambulance Support', number: '102', icon: Activity, desc: 'Immediate medical ambulance responder', color: 'from-emerald-500 to-teal-600' },
    { label: 'Fire Brigade Dept', number: '101', icon: Flame, desc: 'Municipal fire rescue services Desk', color: 'from-rose-500 to-red-600' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-500 my-0 flex items-center gap-2">
          <ShieldAlert className="w-7 h-7" />
          Emergency Response Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Instant one-click phone calls for security, medical, and public fire rescue desks.
        </p>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {contacts.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              whileHover={{ y: -3 }}
              key={i}
              className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-900 shadow-lg flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${c.color} text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{c.label}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{c.desc}</p>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block mt-1">{c.number}</span>
                </div>
              </div>

              <a
                href={`tel:${c.number.replace(/\s+/g, '')}`}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-tr ${c.color} shadow-md shrink-0`}
              >
                Call Now
              </a>
            </motion.div>
          );
        })}
      </div>

      {/* SOS Alert Warning */}
      <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 flex gap-4 items-start">
        <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-450 uppercase tracking-wide">Emergency Warning Notice</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Please use these numbers only for genuine safety incidents (gas leakage, elevator entrapments, theft, water floods, fire emergencies, medical distresses). Abuse of intercom security lines might lead to penalty assessments.
          </p>
        </div>
      </div>
    </div>
  );
}


