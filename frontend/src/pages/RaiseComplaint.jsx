import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Send, Sparkles, AlertCircle, Info, Image, 
  QrCode, X, Download, HelpCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

export default function RaiseComplaint() {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [building, setBuilding] = useState(() => searchParams.get('building') || user?.details?.building || 'Orchid');
  const [wing, setWing] = useState(() => searchParams.get('wing') || user?.details?.wing || 'A');
  const [floor, setFloor] = useState(() => searchParams.get('floor') || user?.details?.floor || '1');
  const [flatNumber, setFlatNumber] = useState(() => searchParams.get('flat') || user?.details?.flatNumber || '101');
  const [exactLocation, setExactLocation] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const typingTimer = useRef(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const qrCanvasRef = useRef(null);

  // Trigger AI analysis when description changes (debounced)
  useEffect(() => {
    if (description.trim().length < 10) {
      setAiSuggestions(null);
      return;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    setAiLoading(true);

    typingTimer.current = setTimeout(async () => {
      try {
        const res = await api.post('/complaints/suggest-ai', { description });
        setAiSuggestions(res.data);
      } catch (err) {
        console.error('Error fetching AI suggestions', err);
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(typingTimer.current);
  }, [description]);

  // Handle files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate limits
    if (files.length + images.length > 5) {
      showToast('Limit Exceeded', 'You can upload a maximum of 5 images.', 'warning');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeSelectedImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyCategory = () => {
    if (aiSuggestions?.suggestedCategory) {
      setCategory(aiSuggestions.suggestedCategory);
      showToast('Category Applied', `Category set to ${aiSuggestions.suggestedCategory} via AI.`, 'success');
    }
  };

  const handleGenerateQR = () => {
    const url = `${window.location.origin}/resident/raise?building=${encodeURIComponent(building)}&wing=${encodeURIComponent(wing)}&floor=${floor}&flat=${encodeURIComponent(flatNumber)}`;
    setQrUrl(url);
    setQrModalOpen(true);

    // Render QR Code onto canvas in next micro-tick
    setTimeout(() => {
      if (qrCanvasRef.current) {
        QRCode.toCanvas(
          qrCanvasRef.current,
          url,
          {
            width: 200,
            margin: 2,
            color: {
              dark: '#1e1b4b', // brand-950 dark indigo
              light: '#ffffff'
            }
          },
          (error) => {
            if (error) console.error('Error rendering QR code canvas', error);
          }
        );
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      showToast('Form Incomplete', 'Please fill in the title, description and category.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('building', building);
    formData.append('wing', wing);
    formData.append('floor', floor);
    formData.append('flatNumber', flatNumber);
    formData.append('exactLocation', exactLocation);
    
    images.forEach(imgFile => {
      formData.append('images', imgFile);
    });

    try {
      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast(
        res.data.autoMerged ? 'Issue Linked' : 'Complaint Filed', 
        res.data.message, 
        res.data.autoMerged ? 'warning' : 'success'
      );
      
      navigate('/resident');
    } catch (err) {
      console.error('Error submitting complaint', err);
      showToast('Filing Error', err.response?.data?.message || 'Failed to file complaint.', 'error');
    }
  };

  const categoriesList = [
    'Water', 'Electricity', 'Lift', 'Parking', 'Garden', 'Cleaning', 
    'Security', 'Plumbing', 'Internet', 'Clubhouse', 'Swimming Pool', 
    'Gym', 'Fire Safety', 'Pest Control', 'Others'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <button
          onClick={handleGenerateQR}
          className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          <QrCode className="w-4 h-4 text-brand-500" />
          Generate Unit QR Code
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-900 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white my-0">
            File a Maintenance Complaint
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provide details about the issue. Our maintenance team will be alerted instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Issue Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Bedroom Ceiling Water Leakage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-brand-400 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain the problem in detail. Include when it started, symptoms, or specific parts affected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-brand-400 dark:text-white"
            />
            
            {/* AI Assistant Overlay */}
            <AnimatePresence>
              {(aiLoading || aiSuggestions) && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2.5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex gap-3.5 items-start"
                >
                  <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5 animate-pulse-slow" />
                  <div className="flex-1 space-y-2">
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                        <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        AI is analyzing your description...
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            Suggested Category: <strong className="font-bold text-slate-800 dark:text-white">{aiSuggestions.suggestedCategory}</strong>
                          </span>
                          {aiSuggestions.suggestedCategory !== category && (
                            <button
                              type="button"
                              onClick={handleApplyCategory}
                              className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                            >
                              Apply Suggestion
                            </button>
                          )}
                        </div>
                        {aiSuggestions.tips?.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-extrabold text-indigo-500 tracking-wider block">
                              💡 Emergency/Troubleshooting Tips:
                            </span>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {aiSuggestions.tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-white"
              >
                <option value="">Select a category</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'low', label: 'Low', color: 'border-slate-200 dark:border-slate-800 active:bg-slate-100 hover:border-slate-300 select-none' },
                  { value: 'medium', label: 'Medium', color: 'border-slate-200 dark:border-slate-800 active:bg-slate-100 hover:border-slate-300 select-none' },
                  { value: 'high', label: 'High', color: 'border-slate-200 dark:border-slate-800 active:bg-slate-100 hover:border-slate-300 select-none' },
                  { value: 'emergency', label: 'SOS', color: 'border-rose-200/50 text-rose-500 hover:border-rose-400/80 bg-rose-50/20' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPriority(item.value)}
                    className={`py-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      priority === item.value 
                        ? 'bg-brand-600 border-brand-600 text-white shadow-md' 
                        : `text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/20 ${item.color}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location fields */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Location Details</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Wing</label>
                <input
                  type="text"
                  required
                  value={wing}
                  onChange={(e) => setWing(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Floor</label>
                <input
                  type="number"
                  required
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Flat No.</label>
                <input
                  type="text"
                  required
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Exact Spot / Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Master bathroom dry balcony, under the sink"
                value={exactLocation}
                onChange={(e) => setExactLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-brand-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Image Uploader */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-5 space-y-3">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Complaint Photos (Max 5)
            </label>
            
            <div className="flex flex-wrap gap-3">
              {/* File selector card */}
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-500 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-brand-500 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
                <Image className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1 uppercase tracking-wider">Add</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>

              {/* Previews */}
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm bg-slate-100">
                  <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSelectedImage(i)}
                    className="absolute top-1 right-1 p-1 bg-slate-950/70 hover:bg-slate-950 text-white rounded-full transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            File Official Complaint
          </button>
        </form>
      </div>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative z-10"
            >
              <button
                onClick={() => setQrModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unit Complaint QR Code</h3>
                <p className="text-xs text-slate-500">
                  Stick this QR code inside Flat {wing}-{flatNumber}. Anyone can scan it to file a complaint pre-bound to this location instantly.
                </p>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl inline-block border border-slate-100 dark:border-slate-900">
                  <canvas ref={qrCanvasRef} className="mx-auto" />
                </div>

                <div className="text-[10px] text-slate-400 select-all font-mono p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg break-all">
                  {qrUrl}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `flat-${wing}-${flatNumber}-qr.png`;
                      link.href = qrCanvasRef.current.toDataURL();
                      link.click();
                    }}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                  >
                    Download Image
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


