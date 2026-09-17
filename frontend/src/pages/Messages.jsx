import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Search, ArrowLeft, CheckCheck, Plus, X, UserCheck, Users, Sparkles } from 'lucide-react';

const INITIAL_CONTACTS = [
  { id: 'u1', name: 'Priya Sharma',    flat: 'A-201', role: 'resident', unread: 0, lastMsg: 'Did you see the notice about the water supply?', time: '10:32 AM', online: true },
  { id: 'u2', name: 'Raj Mehta',       flat: 'B-104', role: 'resident', unread: 0, lastMsg: 'Thanks for the heads up!',                     time: 'Yesterday', online: false },
  { id: 'u3', name: 'Ananya Singh',    flat: 'A-305', role: 'resident', unread: 0, lastMsg: 'Can you share the plumber contact?',            time: 'Yesterday', online: true },
  { id: 'u4', name: 'Society Manager', flat: 'Office', role: 'manager', unread: 0, lastMsg: 'Maintenance scheduled for Sunday.',            time: 'Mon',       online: true },
  { id: 'u5', name: 'Vikram Patel',    flat: 'C-402', role: 'resident', unread: 0, lastMsg: 'See you at the meeting!',                      time: 'Sun',       online: false },
];

function Avatar({ name = '?', size = 10, online = false }) {
  const colors = [
    'from-brand-500 to-teal-500',
    'from-purple-500 to-indigo-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-blue-500',
  ];
  const colorIdx = (name.charCodeAt(0) || 0) % colors.length;
  return (
    <div className="relative shrink-0">
      <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
        {name.charAt(0).toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Messages() {
  const { user } = useAuth();
  const { socket, showToast } = useSocket();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [activeId, setActiveId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // New conversation modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch full directory of society members / friends from backend
  const fetchDirectory = useCallback(async () => {
    setLoadingDirectory(true);
    try {
      const res = await api.get('/chat/contacts');
      if (res.data?.contacts) {
        setDirectory(res.data.contacts);
      }
    } catch (err) {
      console.warn('Could not fetch contacts directory:', err);
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-select from query param (e.g. from ResidentDirectory)
  useEffect(() => {
    const uid = searchParams.get('userId');
    if (uid) {
      const contact = contacts.find(c => c.id === uid) || directory.find(c => c.id === uid) || contacts[0];
      if (contact) openConversation(contact);
    }
  }, [contacts, directory, searchParams]);

  // Setup socket listeners for real-time DMs
  useEffect(() => {
    if (!socket) return;

    const handleDirectMessage = (data) => {
      const { senderId, senderName, message, createdAt, id, conversationId } = data;
      
      if (activeId && (senderId === activeId || conversationId === activeId)) {
        setMessages(prev => [...prev, {
          id: id || Date.now(),
          text: message,
          sent: false,
          time: formatTime(createdAt || new Date()),
          senderId,
          senderName
        }]);
        setContacts(prev => {
          const exists = prev.some(c => c.id === senderId);
          if (!exists) {
            return [{ id: senderId, name: senderName || 'Neighbor', flat: 'Resident', lastMsg: message, time: 'Just now', unread: 0 }, ...prev];
          }
          return prev.map(c => c.id === senderId ? { ...c, lastMsg: message, time: 'Just now', unread: 0 } : c);
        });
      } else {
        setContacts(prev => {
          const exists = prev.some(c => c.id === senderId);
          if (!exists) {
            return [{ id: senderId, name: senderName || 'Neighbor', flat: 'Resident', lastMsg: message, time: 'Just now', unread: 1 }, ...prev];
          }
          return prev.map(c =>
            c.id === senderId ? { ...c, lastMsg: message, time: 'Just now', unread: (c.unread || 0) + 1 } : c
          );
        });
        showToast(`💬 ${senderName || 'Someone'} messaged you`, message.substring(0, 60), 'info');
      }
    };

    const handleTyping = ({ senderId, isTyping: typing }) => {
      if (senderId === activeId) setIsTyping(typing);
    };

    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    socket.on('direct_message_received', handleDirectMessage);
    socket.on('dm_typing', handleTyping);
    socket.on('online_users', handleOnlineUsers);

    return () => {
      socket.off('direct_message_received', handleDirectMessage);
      socket.off('dm_typing', handleTyping);
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket, activeId, showToast]);

  // Load conversation history from backend
  const loadConversation = useCallback(async (contactId) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/chat/dm/${contactId}`);
      const fetched = (res.data?.messages || []).map(m => ({
        id: m._id || m.id || Date.now(),
        text: m.message || m.text || '',
        sent: (m.senderId === user?.id || m.senderId === user?._id),
        time: formatTime(m.createdAt),
        senderId: m.senderId,
        senderName: m.senderName,
      }));
      setMessages(fetched);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [user]);

  const openConversation = (contact) => {
    // If contact is not yet in current conversations sidebar, prepend them
    setContacts(prev => {
      const exists = prev.some(c => c.id === contact.id);
      if (!exists) {
        return [{
          id: contact.id,
          name: contact.name,
          flat: contact.flat || 'Resident',
          role: contact.role || 'resident',
          unread: 0,
          lastMsg: 'Started conversation',
          time: 'Now',
          online: contact.online || false
        }, ...prev];
      }
      return prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c);
    });

    setActiveId(contact.id);
    setShowChat(true);
    setIsTyping(false);
    setShowNewChatModal(false);

    if (socket) {
      socket.emit('join_dm', { userId: user?.id, partnerId: contact.id });
    }
    loadConversation(contact.id);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId || !user) return;

    const now = new Date();
    const msgText = input.trim();
    const tempId = `temp_${Date.now()}`;

    const newMsg = {
      id: tempId,
      text: msgText,
      sent: true,
      time: formatTime(now),
      senderId: user.id,
      senderName: user.name,
    };
    setMessages(prev => [...prev, newMsg]);
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: msgText, time: 'Just now' } : c));
    setInput('');

    if (socket) {
      socket.emit('send_direct_message', {
        senderId: user.id,
        senderName: user.name,
        receiverId: activeId,
        message: msgText,
        createdAt: now.toISOString(),
        id: tempId,
      });

      socket.emit('dm_typing', { senderId: user.id, receiverId: activeId, isTyping: false });
    }

    api.post('/chat/dm', {
      receiverId: activeId,
      message: msgText,
    }).catch(() => {});
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket && activeId) {
      socket.emit('dm_typing', { senderId: user?.id, receiverId: activeId, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('dm_typing', { senderId: user?.id, receiverId: activeId, isTyping: false });
      }, 1500);
    }
  };

  const activeContact = contacts.find(c => c.id === activeId) || directory.find(c => c.id === activeId);
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.flat && c.flat.toLowerCase().includes(search.toLowerCase()))
  );

  // Directory filter for modal
  const filteredDirectory = directory.filter(c =>
    c.name.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    (c.flat && c.flat.toLowerCase().includes(newChatSearch.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(newChatSearch.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">

      {/* LEFT PANE — Conversations */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/70 dark:bg-slate-900/70 shrink-0 ${showChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header with New Chat Button */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Messages</h2>
            <button
              onClick={() => { setShowNewChatModal(true); fetchDirectory(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
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
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p className="text-xs">No conversations found.</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Start a new conversation
              </button>
            </div>
          ) : (
            filteredContacts.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openConversation(c)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all relative border-b border-slate-100 dark:border-slate-800/60 ${
                  activeId === c.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-l-brand-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Avatar name={c.name} size={10} online={onlineUsers.has(c.id) || c.online} />
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
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE — Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${showChat ? 'flex' : 'hidden md:flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shrink-0">
              <button
                onClick={() => { setShowChat(false); setActiveId(null); setMessages([]); }}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Avatar name={activeContact.name} size={9} online={onlineUsers.has(activeContact.id) || activeContact.online} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{activeContact.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {activeContact.flat} · {(onlineUsers.has(activeContact.id) || activeContact.online)
                    ? <span className="text-emerald-500 font-semibold">Online</span>
                    : 'Offline'}
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Other Neighbors
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-60">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Start your conversation with {activeContact.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Type a message below to connect directly with your building friend.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${msg.sent ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!msg.sent && <Avatar name={activeContact.name} size={7} />}
                      <div className="max-w-[70%] group">
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
              )}

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
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-200"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="p-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition shadow-md shadow-brand-500/20"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-xl shadow-brand-500/20">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-white text-lg">Your Messages</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Select a conversation or start a new chat with any neighbour or building friend.
              </p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Start New Conversation
            </button>
          </div>
        )}
      </div>

      {/* NEW CONVERSATION MODAL */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewChatModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">New Conversation</h3>
                    <p className="text-xs text-slate-400">Choose a friend or neighbor from your society</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newChatSearch}
                    onChange={e => setNewChatSearch(e.target.value)}
                    placeholder="Search by name, flat (e.g. A-201), wing, or role..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-200"
                    autoFocus
                  />
                </div>
              </div>

              {/* Residents Directory List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {loadingDirectory ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Loading building directory...</span>
                  </div>
                ) : filteredDirectory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No residents found matching "{newChatSearch}"</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching by first name or wing letter.</p>
                  </div>
                ) : (
                  filteredDirectory.map(person => (
                    <button
                      key={person.id}
                      onClick={() => openConversation(person)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-left group"
                    >
                      <Avatar name={person.name} size={10} online={onlineUsers.has(person.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition truncate">
                            {person.name}
                          </p>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            person.role === 'admin'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              : person.role === 'manager'
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                : person.role === 'staff'
                                  ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {person.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{person.flat} {person.email ? `• ${person.email}` : ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
                <span className="text-[11px] text-slate-400">
                  Select any resident to start texting them directly in real-time.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
