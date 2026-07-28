import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  ArrowLeft, Calendar, User, Shield, Clock, Send, MessageSquare, 
  Trash2, Star, CheckCircle, AlertTriangle, AlertCircle, FileSpreadsheet, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, showToast } = useSocket();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  
  // Feedback States
  const [feedbackStars, setFeedbackStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuggestions, setFeedbackSuggestions] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchComplaintDetails();
    fetchChatHistory();

    if (socket) {
      socket.emit('join_complaint', id);
      
      socket.on('message_received', (newMsg) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      });

      socket.on('typing_status', ({ userId, userName, isTyping }) => {
        if (userId !== user.id) {
          setTypingUser(isTyping ? userName : null);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message_received');
        socket.off('typing_status');
      }
    };
  }, [id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const fetchComplaintDetails = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data.complaint);
    } catch (err) {
      console.error('Error fetching complaint details', err);
      showToast('Error', 'Failed to retrieve complaint details.', 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Error loading chat history', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setTypedMessage(e.target.value);
    
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        complaintId: id,
        userId: user.id,
        userName: user.name,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        complaintId: id,
        userId: user.id,
        userName: user.name,
        isTyping: false
      });
    }, 1500);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const messageText = typedMessage.trim();
    setTypedMessage('');

    // Clear typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    if (socket) {
      socket.emit('typing', { complaintId: id, userId: user.id, userName: user.name, isTyping: false });
    }

    try {
      // 1. Post to REST server to persist in db
      const res = await api.post('/chat', {
        complaintId: id,
        message: messageText
      });
      
      const savedMsg = res.data.message;

      // 2. Broadcast via sockets
      if (socket) {
        socket.emit('send_message', {
          ...savedMsg,
          senderName: user.name,
          senderAvatar: user.avatar
        });
      } else {
        // Local state append in case socket is down
        setMessages(prev => [...prev, savedMsg]);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message', err);
      showToast('Send Error', 'Failed to send message.', 'error');
    }
  };

  // Delete complaint (pending only)
  const handleDeleteComplaint = async () => {
    if (window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
      try {
        await api.delete(`/complaints/${id}`);
        showToast('Success', 'Complaint deleted successfully.', 'success');
        navigate(-1);
      } catch (err) {
        showToast('Error', err.response?.data?.message || 'Failed to delete complaint.', 'error');
      }
    }
  };

  // Submit Feedback & Rating
  const handleSubmitFeedback = async () => {
    try {
      const res = await api.post(`/complaints/${id}/rate`, {
        stars: feedbackStars,
        comment: feedbackComment,
        suggestions: feedbackSuggestions
      });
      setComplaint(res.data.complaint);
      setFeedbackSubmitted(true);
      showToast('Thank You', 'Feedback submitted successfully.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to submit rating.', 'error');
    }
  };

  // Export receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return <div className="h-60 rounded-3xl bg-slate-200 dark:bg-slate-900 animate-pulse w-full" />;
  }

  if (!complaint) return null;

  // Timeline events helper
  const getTimelineIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'assigned': return User;
      case 'accepted': return CheckCircle;
      case 'in-progress': return AlertTriangle;
      case 'completed': return CheckCircle;
      case 'closed': return Shield;
      default: return Clock;
    }
  };

  // Seen status logic
  const isChatAvailable = complaint.assignedStaffId;

  return (
    <div className="space-y-6 max-w-5xl mx-auto printing-container">
      {/* 1. Header controls */}
      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrintReceipt}
            className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <Printer className="w-4 h-4 text-brand-500" />
            Print Receipt
          </button>

          {user.role === 'resident' && complaint.status === 'pending' && (
            <button
              onClick={handleDeleteComplaint}
              className="inline-flex items-center gap-2 border border-rose-200 text-rose-600 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Complaint
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="glass-card rounded-3xl p-6 border border-slate-100 dark:border-slate-900 shadow-xl print:shadow-none print:border-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-400 font-mono">
                COMPLAINT ID: {complaint.id}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg border uppercase ${
                complaint.priority === 'emergency' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30' : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}>
                {complaint.priority} PRIORITY
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight dark:text-white my-0 leading-tight">
              {complaint.title}
            </h1>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block">Category</span>
                <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">{complaint.category}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block">Status</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 uppercase mt-0.5 block">{complaint.status}</span>
              </div>
              <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-900 pt-2.5 mt-1">
                <span className="text-slate-400 dark:text-slate-500 font-medium block">Location</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                  Building {complaint.location?.building}, Wing {complaint.location?.wing}, Flat {complaint.location?.flatNumber}
                  {complaint.location?.exactLocation && ` • (${complaint.location.exactLocation})`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Description</span>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            {/* Photos if any */}
            {complaint.images?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Complaint Attachments</span>
                <div className="flex flex-wrap gap-2.5">
                  {complaint.images.map((img, idx) => (
                    <a key={idx} href={`http://localhost:5000${img}`} target="_blank" rel="noreferrer" className="no-print">
                      <img 
                        src={`http://localhost:5000${img}`} 
                        alt="attachment" 
                        className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-900 shadow-sm hover:opacity-90 transition"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          <div className="glass-card rounded-3xl p-6 border border-slate-100 dark:border-slate-900 shadow-xl">
            <h2 className="text-lg font-bold dark:text-white mb-6">Resolution Timeline</h2>
            
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8">
              {complaint.timeline?.map((event, idx) => {
                const Icon = getTimelineIcon(event.status);
                return (
                  <div key={idx} className="relative">
                    {/* Circle Node Icon */}
                    <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 border-2 border-brand-500 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                          {event.status.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {event.notes}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Chat Panel / Resident Review */}
        <div className="space-y-6 no-print">
          {/* Assigned Staff profile card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-100 dark:border-slate-900 shadow-lg text-center space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Assigned Technician</h3>
            
            {complaint.assignedStaffId ? (
              <div className="space-y-3">
                <img
                  src={complaint.assignedStaffAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${complaint.assignedStaffName}`}
                  alt={complaint.assignedStaffName}
                  className="w-16 h-16 rounded-full mx-auto border-2 border-brand-500/20 bg-slate-50"
                />
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white">{complaint.assignedStaffName}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{complaint.assignedStaffPhone || 'Maintenance Team'}</p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-slate-500 font-medium">Awaiting Manager Assignment</p>
              </div>
            )}
          </div>

          {/* Real-time Chat Portal */}
          {isChatAvailable ? (
            <div className="glass-card rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Live Discussion</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Chat messages box */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 p-6">
                    <MessageSquare className="w-8 h-8 opacity-25 mb-1.5" />
                    <p className="text-[11px] leading-relaxed">No messages yet. Send a message to coordinate resolution details.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!isSelf && (
                            <span className="text-[9px] font-bold text-slate-400">{m.senderName}</span>
                          )}
                          <span className="text-[8px] text-slate-300">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isSelf 
                            ? 'bg-brand-600 text-white rounded-tr-none' 
                            : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none'
                        }`}>
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing status indicator */}
                {typingUser && (
                  <div className="text-[10px] text-slate-400 italic font-semibold flex items-center gap-1">
                    <div className="flex gap-0.5 items-center justify-center shrink-0">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {typingUser} is typing...
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or send updates..."
                  value={typedMessage}
                  onChange={handleTyping}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md active:scale-95 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : null}

          {/* Feedback Form for Resident if completed */}
          {user.role === 'resident' && ['completed', 'closed'].includes(complaint.status) && (
            <div className="glass-card rounded-3xl p-5 border border-emerald-500/20 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Resident Feedback</h3>
              </div>

              {complaint.rating || feedbackSubmitted ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${s <= (complaint.rating?.stars || feedbackStars) ? 'fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    "{complaint.rating?.comment || feedbackComment || 'No comments provided'}"
                  </p>
                  {(complaint.rating?.suggestions || feedbackSuggestions) && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Suggestions: {complaint.rating?.suggestions || feedbackSuggestions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Resolution</span>
                    <div className="flex gap-1.5 text-slate-300">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackStars(star)}
                          className="hover:scale-110 transition"
                        >
                          <Star className={`w-6 h-6 ${star <= feedbackStars ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Comments</label>
                    <input
                      type="text"
                      placeholder="e.g. Friendly staff, fixed it quickly!"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Suggestions (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Staff should wear shoe covers..."
                      value={feedbackSuggestions}
                      onChange={(e) => setFeedbackSuggestions(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-950 dark:border-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={handleSubmitFeedback}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold transition shadow-md shadow-emerald-500/10"
                  >
                    Submit Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


