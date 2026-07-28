import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Vote, Plus, X, BarChart2, CheckCircle, Clock, Trash2, PartyPopper } from 'lucide-react';

export default function Polls() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({}); // pollId -> optionId
  const [showConfetti, setShowConfetti] = useState(false);

  // New Poll Form State
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: [{ id: 'opt1', text: '' }, { id: 'opt2', text: '' }],
    days: 3
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/polls');
      setPolls(res.data.polls || []);
    } catch (err) {
      console.error('Failed to load polls', err);
    } finally {
      setLoading(false);
    }
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const handleVote = async (pollId) => {
    const selected = selectedOptions[pollId];
    if (!selected) return;

    try {
      await api.post(`/polls/${pollId}/vote`, { optionId: selected });
      
      setPolls(polls.map(p => {
        if (p.id === pollId) {
          const newOptions = p.options.map(opt => 
            opt.id === selected ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return { ...p, options: newOptions, hasVoted: selected, totalVotes: p.totalVotes + 1 };
        }
        return p;
      }));

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setToast({ title: 'Vote Cast!', message: 'Thank you for participating.' });
    } catch (err) {
      console.error('Failed to vote', err);
      setToast({ title: 'Error', message: 'Failed to cast vote.' });
    }
  };

  const handleOptionSelect = (pollId, optId) => {
    setSelectedOptions({ ...selectedOptions, [pollId]: optId });
  };

  const handleAddOption = () => {
    if (newPoll.options.length >= 4) return;
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { id: `opt${newPoll.options.length + 1}`, text: '' }]
    });
  };

  const handleRemoveOption = (idx) => {
    if (newPoll.options.length <= 2) return;
    const newOpts = [...newPoll.options];
    newOpts.splice(idx, 1);
    setNewPoll({ ...newPoll, options: newOpts });
  };

  const handleOptionChange = (idx, text) => {
    const newOpts = [...newPoll.options];
    newOpts[idx].text = text;
    setNewPoll({ ...newPoll, options: newOpts });
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!newPoll.question || newPoll.options.some(o => !o.text)) return;

    try {
      const res = await api.post('/polls', newPoll);
      setPolls([res.data.poll, ...polls]);
      setIsModalOpen(false);
      setNewPoll({ question: '', options: [{ id: 'opt1', text: '' }, { id: 'opt2', text: '' }], days: 3 });
      fetchPolls();
    } catch (err) {
      console.error('Failed to create poll', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/polls/${id}`);
      setPolls(polls.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete poll', err);
    }
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute top-1/4 animate-bounce text-6xl">🎉</div>
            <div className="absolute top-1/3 left-1/4 animate-ping text-5xl">🎊</div>
            <div className="absolute top-1/2 right-1/4 animate-bounce text-5xl delay-100">✨</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl shadow-lg shadow-rose-500/20 text-white">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Community Polls
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Have your say in society decisions</p>
          </div>
        </div>

        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Poll
          </button>
        )}
      </div>

      {/* Polls List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(n => <div key={n} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />)
        ) : (
          <AnimatePresence>
            {polls.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-500">No active polls right now</p>
              </div>
            )}
            {polls.map((poll, idx) => {
            const isClosed = poll.status === 'Closed' || new Date(poll.expiry) < new Date();
            const daysLeft = Math.ceil((new Date(poll.expiry) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-3xl p-6 flex flex-col relative group border border-slate-200 dark:border-slate-800"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isClosed ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {isClosed ? 'Closed' : 'Active'}
                  </span>
                  
                  {isManager && (
                    <button onClick={() => handleDelete(poll.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2">
                  {poll.question}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-6">
                  <span>By {poll.createdBy}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 
                    {isClosed ? 'Ended' : `${daysLeft} days left`}
                  </span>
                </div>

                {/* Options */}
                <div className="space-y-3 flex-1">
                  {poll.options.map((opt) => {
                    const percent = calculatePercentage(opt.votes, poll.totalVotes);
                    const isSelected = selectedOptions[poll.id] === opt.id;
                    const isVotedOption = poll.hasVoted === opt.id;
                    const showResults = poll.hasVoted || isClosed;

                    return (
                      <div 
                        key={opt.id}
                        onClick={() => !poll.hasVoted && !isClosed && handleOptionSelect(poll.id, opt.id)}
                        className={`relative rounded-xl border p-3 overflow-hidden transition-all ${
                          !poll.hasVoted && !isClosed ? 'cursor-pointer hover:border-brand-400' : ''
                        } ${
                          isSelected && !poll.hasVoted ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-700'
                        } ${isVotedOption ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                      >
                        {/* Progress Bar Background */}
                        {showResults && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, type: 'spring' }}
                            className={`absolute inset-0 opacity-10 dark:opacity-20 ${isVotedOption ? 'bg-emerald-500' : 'bg-brand-500'}`}
                          />
                        )}

                        <div className="relative flex items-center justify-between z-10">
                          <div className="flex items-center gap-3">
                            {!showResults && (
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                {isSelected && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
                              </div>
                            )}
                            <span className={`text-sm font-semibold ${isVotedOption ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                              {opt.text}
                            </span>
                          </div>
                          
                          {showResults && (
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                              {percent}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer / Submit Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <BarChart2 className="w-4 h-4" />
                    {poll.totalVotes} Votes
                  </div>
                  
                  {!poll.hasVoted && !isClosed && (
                    <button 
                      onClick={() => handleVote(poll.id)}
                      disabled={!selectedOptions[poll.id]}
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      Vote Now
                    </button>
                  )}
                  {poll.hasVoted && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Voted
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        )}
      </div>

      {/* Create Poll Modal */}
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
                <h3 className="font-bold text-slate-900 dark:text-white">Create Community Poll</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePoll} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Question</label>
                  <input 
                    type="text" required
                    value={newPoll.question}
                    onChange={e => setNewPoll({...newPoll, question: e.target.value})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    placeholder="What would you like to ask the society?"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Options</label>
                  {newPoll.options.map((opt, idx) => (
                    <div key={opt.id} className="flex gap-2">
                      <input 
                        type="text" required
                        value={opt.text}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm font-medium"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {newPoll.options.length > 2 && (
                        <button type="button" onClick={() => handleRemoveOption(idx)} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {newPoll.options.length < 4 && (
                    <button 
                      type="button" 
                      onClick={handleAddOption}
                      className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Duration (Days)</label>
                  <select 
                    value={newPoll.days}
                    onChange={e => setNewPoll({...newPoll, days: Number(e.target.value)})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium appearance-none"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>1 Week</option>
                  </select>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                >
                  Publish Poll
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




