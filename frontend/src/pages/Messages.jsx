import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Search, ArrowLeft, CheckCheck } from 'lucide-react';

const MOCK_CONTACTS = [
  { id: 'u1', name: 'Priya Sharma',    flat: 'A-201', unread: 2, lastMsg: 'Did you see the notice about the water supply?', time: '10:32 AM', online: true },
  { id: 'u2', name: 'Raj Mehta',       flat: 'B-104', unread: 0, lastMsg: 'Thanks for the heads up!',                     time: 'Yesterday', online: false },
  { id: 'u3', name: 'Ananya Singh',    flat: 'A-305', unread: 1, lastMsg: 'Can you share the plumber contact?',            time: 'Yesterday', online: true },
  { id: 'u4', name: 'Society Manager', flat: 'Office', unread: 0, lastMsg: 'Maintenance scheduled for Sunday.',            time: 'Mon',       online: true },
  { id: 'u5', name: 'Vikram Patel',    flat: 'C-402', unread: 0, lastMsg: 'See you at the meeting!',                      time: 'Sun',       online: false },
];

const INITIAL_THREADS = {
  u1: [
    { id: 1, text: 'Hey! Did you see the notice about the water supply?', sent: false, time: '10:28 AM' },
    { id: 2, text: 'Yes! It says there will be no water from 10 AM to 2 PM tomorrow.', sent: true, time: '10:30 AM' },
    { id: 3, text: 'Oh no 😟 I have to fill up extra tanks then.', sent: false, time: '10:31 AM' },
    { id: 4, text: 'Did you see the notice about the water supply?', sent: false, time: '10:32 AM' },
  ],
  u4: [
    { id: 1, text: 'Dear residents, maintenance of water pumps is scheduled for this Sunday 9 AM – 1 PM.', sent: false, time: 'Mon 10:00 AM' },
    { id: 2, text: 'Thank you for the heads up! Will make sure to store water in advance.', sent: true, time: 'Mon 10:15 AM' },
    { id: 3, text: 'Great! Cooperation is appreciated. Please reach out for any concerns.', sent: false, time: 'Mon 10:20 AM' },
  ],
};

const AUTO_REPLIES = [
  'Got it! Thanks for letting me know 👍',
  'Sure, I will get back to you shortly.',
  'Sounds good!',
  'Thanks for the update.',
  'I will check and confirm.',
  'Noted! Will do. 🙌',
];

function Avatar({ name, size = 10, online = false }) {
  const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-indigo-500', 'from-rose-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className="relative shrink-0">
      <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
        {name.charAt(0)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [activeId, setActiveId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-select from query param (e.g. from ResidentDirectory)
  useEffect(() => {
    const uid = searchParams.get('userId');
    if (uid) {
      const contact = contacts.find(c => c.id === uid) || contacts.find(() => true);
      if (contact) {
        setActiveId(contact.id);
        setShowChat(true);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, isTyping, activeId]);

  const activeContact = contacts.find(c => c.id === activeId);
  const activeMessages = activeId ? (threads[activeId] || []) : [];

  const handleSelect = (contact) => {
    setActiveId(contact.id);
    setShowChat(true);
    // Clear unread
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;

    const newMsg = { id: Date.now(), text: input, sent: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setThreads(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }));
    // Update last message in contact list
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: input, time: 'Just now' } : c));
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyMsg = { id: Date.now() + 1, text: reply, sent: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setThreads(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), replyMsg] }));
      setIsTyping(false);
    }, 2000);
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.flat.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">

      {/* LEFT PANE — Conversations */}
      <div className={`w-full md:w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/70 dark:bg-slate-900/70 shrink-0 ${showChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredContacts.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleSelect(c)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all relative border-b border-slate-100 dark:border-slate-800/60 ${
                activeId === c.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Avatar name={c.name} size={10} online={c.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.lastMsg}</p>
                  {c.unread > 0 && (
                    <span className="ml-1 bg-brand-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.flat}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* RIGHT PANE — Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${showChat ? 'flex' : 'hidden md:flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shrink-0">
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Avatar name={activeContact.name} size={9} online={activeContact.online} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{activeContact.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {activeContact.flat} · {activeContact.online ? <span className="text-emerald-500 font-semibold">Online</span> : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              <AnimatePresence initial={false}>
                {activeMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${msg.sent ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!msg.sent && <Avatar name={activeContact.name} size={7} />}
                    <div className={`max-w-[70%] group`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        msg.sent
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 px-1 ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                        {msg.sent && <CheckCheck className="w-3 h-3 text-brand-400" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-end gap-2"
                  >
                    <Avatar name={activeContact.name} size={7} />
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1 items-center">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay }}
                          className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-200"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="p-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition shadow-md shadow-brand-500/20"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-brand-500/20">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-white text-lg">Your Messages</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">Select a conversation from the left to start chatting with your neighbours.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
