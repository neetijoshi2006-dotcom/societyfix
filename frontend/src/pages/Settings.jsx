import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Settings as SettingsIcon, User, Bell, Globe, Lock, Check } from 'lucide-react';

export default function Settings() {
  const { user, updateProfileState } = useAuth();
  const { showToast } = useSocket();

  // Settings tab selection
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'notifications', 'language', 'security'

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Notifications preferences
  const [emailNotif, setEmailNotif] = useState(user?.notificationPreferences?.email ?? true);
  const [smsNotif, setSmsNotif] = useState(user?.notificationPreferences?.sms ?? true);
  const [inAppNotif, setInAppNotif] = useState(user?.notificationPreferences?.inApp ?? true);

  // Language state
  const [language, setLanguage] = useState(user?.language || 'English');

  // Security password change states
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', { name, phone });
      updateProfileState(res.data.user);
      showToast('Profile Updated', 'Your profile details have been saved.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to update profile.', 'error');
    }
  };

  const handleNotificationsSubmit = async () => {
    try {
      const res = await api.put('/auth/profile', {
        notificationPreferences: { email: emailNotif, sms: smsNotif, inApp: inAppNotif }
      });
      updateProfileState(res.data.user);
      showToast('Settings Saved', 'Notification channels saved.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to update preferences.', 'error');
    }
  };

  const handleLanguageSubmit = async (langValue) => {
    try {
      const res = await api.put('/auth/profile', { language: langValue });
      setLanguage(langValue);
      updateProfileState(res.data.user);
      showToast('Language Updated', `System language set to: ${langValue}`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to change language settings.', 'error');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      showToast('Error', 'Please fill in both fields.', 'warning');
      return;
    }
    showToast('Success', 'Your password has been changed successfully.', 'success');
    setCurrPassword('');
    setNewPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white my-0 flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-brand-500" />
          Settings Profile Panel
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize notification methods, select translation languages, or update profile contact info.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Tabs */}
        <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none z-10 shrink-0">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'language', label: 'Language', icon: Globe },
            { id: 'security', label: 'Security & Lock', icon: Lock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap md:w-full text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 glass-card p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl self-start">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h3 className="text-base font-bold dark:text-white mb-4">Edit Profile Info</h3>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition"
              >
                Save Profile
              </button>
            </form>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold dark:text-white">Notification Deliveries</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Push in-app Alerts', desc: 'Receive real-time floating alerts and notification menu logs.', state: inAppNotif, setter: setInAppNotif },
                  { label: 'SMS text Broadcasts', desc: 'Get SMS notifications for emergency announcements and water shutoffs.', state: smsNotif, setter: setSmsNotif },
                  { label: 'E-mail notifications', desc: 'Receive detailed weekly reports and ticket closure summaries.', state: emailNotif, setter: setEmailNotif }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-900">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    
                    <button
                      onClick={() => item.setter(!item.state)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.state ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.state ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNotificationsSubmit}
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* LANGUAGE TAB */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold dark:text-white">Choose Language / भाषा</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['English', 'Hindi (हिंदी)', 'Marathi (मराठी)'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSubmit(lang.split(' ')[0])}
                    className={`p-4 rounded-2xl border text-center font-bold text-xs transition flex flex-col items-center justify-center gap-2 ${
                      language.toLowerCase() === lang.split(' ')[0].toLowerCase()
                        ? 'bg-brand-50 border-brand-300 text-brand-600 dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400'
                        : 'border-slate-200 bg-white/40 dark:border-slate-900 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {language.toLowerCase() === lang.split(' ')[0].toLowerCase() && (
                      <Check className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    )}
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h3 className="text-base font-bold dark:text-white mb-4">Change Password</h3>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition"
              >
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


