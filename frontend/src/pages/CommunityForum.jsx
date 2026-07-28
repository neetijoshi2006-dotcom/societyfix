import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Hash, Plus, X, ThumbsUp, MessageSquare, Eye, Pin, Trash2, Send, Clock, Info } from 'lucide-react';

const MOCK_THREADS = [
  { 
    id: 1, 
    title: 'Recommendation for a good maid in Block B?', 
    content: 'Looking for a reliable maid for a 2BHK in Block B. Preferred timings are morning. Any recommendations?',
    category: 'General', 
    author: 'Neha Gupta', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Neha%20Gupta',
    timeAgo: '2 hours ago', 
    upvotes: 5, 
    replies: [
      { id: 101, author: 'Suresh Iyer', content: 'Yes, ask for Laxmi from the agency we usually use. She is good.', timeAgo: '1 hour ago' }
    ], 
    views: 42, 
    isPinned: true, 
    hasUpvoted: true 
  },
  { 
    id: 2, 
    title: 'Found a set of keys near the garden gate', 
    content: 'It has a red keychain with a smiley face. I have left it with the main gate security. Please collect if yours.',
    category: 'Lost & Found', 
    author: 'Anonymous', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Anon',
    timeAgo: '5 hours ago', 
    upvotes: 12, 
    replies: [], 
    views: 89, 
    isPinned: false, 
    hasUpvoted: false 
  },
  { 
    id: 3, 
    title: 'Carpool available to Hitec City (Mon-Fri)', 
    content: 'I drive to Hitec City daily at 8:30 AM and return by 6:30 PM. Let me know if anyone wants to carpool. 3 seats available.',
    category: 'Car Pool', 
    author: 'Rahul Sharma', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Rahul%20Sharma',
    timeAgo: '1 day ago', 
    upvotes: 8, 
    replies: [
      { id: 102, author: 'Priya Desai', content: 'I am interested! Will DM you my number.', timeAgo: '20 hours ago' },
      { id: 103, author: 'Rahul Sharma', content: 'Sure Priya, noted.', timeAgo: '15 hours ago' }
    ], 
    views: 120, 
    isPinned: false, 
    hasUpvoted: false 
  }
];

export default function CommunityForum() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [replyInput, setReplyInput] = useState('');

  const [newThread, setNewThread] = useState({
    title: '', category: 'General', content: '', isAnonymous: false
  });

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const filtered = threads.filter(t => categoryFilter === 'All' || t.category === categoryFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  const handleUpvote = (e, id) => {
    e.stopPropagation();
    setThreads(threads.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          upvotes: t.hasUpvoted ? t.upvotes - 1 : t.upvotes + 1,
          hasUpvoted: !t.hasUpvoted 
        };
      }
      return t;
    }));
  };

  const handlePostThread = (e) => {
    e.preventDefault();
    if (!newThread.title || !newThread.content) return;

    const thread = {
      id: Date.now(),
      ...newThread,
      author: newThread.isAnonymous ? 'Anonymous' : user.name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newThread.isAnonymous ? 'Anon' : user.name}`,
      timeAgo: 'Just now',
      upvotes: 0,
      replies: [],
      views: 0,
      isPinned: false,
      hasUpvoted: false
    };

    setThreads([thread, ...threads]);
    setIsModalOpen(false);
    setNewThread({ title: '', category: 'General', content: '', isAnonymous: false });
    setToast({ title: 'Posted', message: 'Your thread is now live.' });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setThreads(threads.filter(t => t.id !== id));
    setToast({ title: 'Deleted', message: 'Thread has been removed.' });
  };

  const handleReply = (e, threadId) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    setThreads(threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          replies: [...t.replies, { id: Date.now(), author: user.name, content: replyInput, timeAgo: 'Just now' }]
        };
      }
      return t;
    }));
    setReplyInput('');
  };

  const categories = ['All', 'General', 'Lost & Found', 'Car Pool', 'Buy/Sell', 'Events'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-500 to-fuchsia-500 rounded-2xl shadow-lg shadow-purple-500/20 text-white">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Community Forum
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Discuss, share, and connect</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Discussion
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              categoryFilter === c 
                ? 'bg-slate-900 text-white dark:bg-purple-600 shadow-md' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Thread List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sorted.map((thread, idx) => {
            const isExpanded = expandedThreadId === thread.id;
            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-card rounded-2xl overflow-hidden border transition-all ${
                  isExpanded ? 'border-purple-500/50 shadow-xl shadow-purple-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Thread Preview Header (Clickable) */}
                <div 
                  className={`p-5 cursor-pointer flex flex-col sm:flex-row gap-4 sm:gap-6 ${isExpanded ? 'bg-slate-50 dark:bg-slate-900/50' : ''}`}
                  onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                >
                  
                  {/* Left stats column (desktop) */}
                  <div className="hidden sm:flex flex-col items-center gap-4 min-w-[60px]">
                    <button 
                      onClick={(e) => handleUpvote(e, thread.id)}
                      className={`flex flex-col items-center p-2 rounded-xl transition ${
                        thread.hasUpvoted ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 mb-1 ${thread.hasUpvoted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-black">{thread.upvotes}</span>
                    </button>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {thread.isPinned && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          {thread.category}
                        </span>
                      </div>
                      
                      {isManager && (
                        <button 
                          onClick={(e) => handleDelete(e, thread.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2">
                      {thread.title}
                    </h3>

                    {/* Author row */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                      <img src={thread.avatar} alt="Avatar" className="w-5 h-5 rounded-full bg-slate-200" />
                      <span className="text-slate-700 dark:text-slate-300">{thread.author}</span>
                      <span>•</span>
                      <span>{thread.timeAgo}</span>
                    </div>

                    {/* Preview Text (if collapsed) */}
                    {!isExpanded && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {thread.content}
                      </p>
                    )}

                    {/* Full text (if expanded) */}
                    {isExpanded && (
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mt-4 mb-4">
                        {thread.content}
                      </p>
                    )}

                    {/* Bottom Stats (Mobile inline + Desktop view) */}
                    <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <div className="sm:hidden flex items-center gap-1">
                        <button onClick={(e) => handleUpvote(e, thread.id)} className={`flex items-center gap-1 ${thread.hasUpvoted ? 'text-purple-600' : ''}`}>
                          <ThumbsUp className={`w-3.5 h-3.5 ${thread.hasUpvoted ? 'fill-current' : ''}`} /> {thread.upvotes}
                        </button>
                      </div>
                      <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {thread.replies.length} Replies</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {thread.views} Views</span>
                    </div>
                  </div>

                </div>

                {/* Expanded Replies Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30"
                    >
                      <div className="p-5 sm:pl-[108px] space-y-4">
                        {thread.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-slate-500">{reply.author.charAt(0)}</span>
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{reply.author}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>{reply.timeAgo}</span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Reply Input */}
                        <form onSubmit={(e) => handleReply(e, thread.id)} className="flex gap-3 mt-4">
                          <input 
                            type="text" 
                            placeholder="Write a reply..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            className="flex-1 glass-input rounded-xl px-4 py-2 text-sm"
                          />
                          <button type="submit" disabled={!replyInput.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2.5 rounded-xl transition">
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })}
          {sorted.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Info className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No discussions found in this category.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* New Post Modal */}
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
                <h3 className="font-bold text-slate-900 dark:text-white">Start a Discussion</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePostThread} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
                  <input 
                    type="text" required
                    value={newThread.title}
                    onChange={e => setNewThread({...newThread, title: e.target.value})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    placeholder="What do you want to discuss?"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select 
                      value={newThread.category}
                      onChange={e => setNewThread({...newThread, category: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium appearance-none"
                    >
                      {categories.filter(c=>c!=='All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <input 
                        type="checkbox"
                        checked={newThread.isAnonymous}
                        onChange={e => setNewThread({...newThread, isAnonymous: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Post Anonymously</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Details</label>
                  <textarea 
                    required rows="4"
                    value={newThread.content}
                    onChange={e => setNewThread({...newThread, content: e.target.value})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium resize-none"
                    placeholder="Add details, ask questions, or share information..."
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                  Post Topic
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




