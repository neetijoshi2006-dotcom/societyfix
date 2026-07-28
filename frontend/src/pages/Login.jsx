import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, CheckCircle, Home, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('Orchid');
  const [wing, setWing] = useState('A');
  const [floor, setFloor] = useState('4');
  const [flatNumber, setFlatNumber] = useState('402');

  const demoAccounts = [
    { label: 'Resident', email: 'amit@societyfix.com', pass: 'resident123', desc: 'Amit Sharma (Wing A-402)', role: 'resident', color: 'from-blue-500 to-indigo-600' },
    { label: 'Technician', email: 'rahul@societyfix.com', pass: 'staff123', desc: 'Rahul Kumar (Electrician)', role: 'staff', color: 'from-violet-500 to-purple-600' },
    { label: 'Manager', email: 'manager@societyfix.com', pass: 'manager123', desc: 'Suresh Patil (Society Office)', role: 'manager', color: 'from-emerald-500 to-teal-600' },
    { label: 'Super Admin', email: 'admin@societyfix.com', pass: 'admin123', desc: 'Vikram Aditya (Global Sys)', role: 'admin', color: 'from-rose-500 to-orange-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signup({
          name, email, password, phone, building, wing, floor, flatNumber
        });
        if (res.success) {
          navigate('/resident');
        } else {
          setError(res.error);
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          // Redirect based on role
          const token = localStorage.getItem('token');
          // Fetch route scoped by role
          const tempUser = JSON.parse(atob(token.split('.')[1]));
          const role = tempUser.role;
          if (role === 'resident') navigate('/resident');
          else if (role === 'staff') navigate('/staff');
          else if (role === 'manager') navigate('/manager');
          else if (role === 'admin') navigate('/admin');
        } else {
          setError(res.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (acc) => {
    setError('');
    setLoading(true);
    const res = await login(acc.email, acc.pass);
    if (res.success) {
      if (acc.role === 'resident') navigate('/resident');
      else if (acc.role === 'staff') navigate('/staff');
      else if (acc.role === 'manager') navigate('/manager');
      else if (acc.role === 'admin') navigate('/admin');
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-white relative overflow-hidden">
      {/* Background visual gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-white font-extrabold text-xl">S</span>
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SocietyFix
            </span>
          </div>
          <p className="text-slate-400 text-sm">Real-time Apartment Complaint & Maintenance Platform</p>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {/* Sign In/Up Switcher Tabs */}
          <div className="grid grid-cols-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/50 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                !isSignUp 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                isSignUp 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-950/30 border border-rose-900/50 text-rose-400 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Building</label>
                    <input
                      type="text"
                      placeholder="Orchid"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Wing</label>
                    <input
                      type="text"
                      placeholder="A"
                      value={wing}
                      onChange={(e) => setWing(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Floor</label>
                    <input
                      type="number"
                      placeholder="4"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Flat Number</label>
                    <input
                      type="text"
                      placeholder="402"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@societyfix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-xs text-brand-400 hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Character Selectors */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block text-center mb-4">
              Demo character quick logins
            </span>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                  className="p-3 text-left bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-300">{acc.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${acc.color}`} />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


