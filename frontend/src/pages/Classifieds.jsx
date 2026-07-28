import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Store, Plus, X, PhoneCall, Tag, MessageCircle } from 'lucide-react';

export default function Classifieds() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '', imageUrl: '', sellerPhone: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classifieds');
      setItems(res.data.classifieds || []);
    } catch (err) {
      console.error('Failed to load classifieds', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAd = async (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.price || !newItem.sellerPhone) return;
    
    // Auto-generate placeholder if no image provided
    let imgUrl = newItem.imageUrl;
    if (!imgUrl) {
      const keywords = newItem.title.split(' ')[0].toLowerCase();
      imgUrl = `https://source.unsplash.com/500x500/?${keywords},furniture`;
    }

    try {
      const res = await api.post('/classifieds', { ...newItem, imageUrl: imgUrl });
      setItems([res.data.classified, ...items]);
      setIsModalOpen(false);
      setNewItem({ title: '', description: '', price: '', imageUrl: '', sellerPhone: '' });
      setToast({ title: 'Ad Posted', message: 'Your item is now live in the marketplace.' });
    } catch (err) {
      console.error('Failed to post ad', err);
      setToast({ title: 'Error', message: 'Could not post ad.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-fuchsia-500 to-pink-500 rounded-2xl shadow-lg shadow-fuchsia-500/20 text-white">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Buy and sell items within the society</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Post Ad
        </button>
      </div>

      {/* Masonry-style Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {loading ? (
          [1,2,3,4].map(n => <div key={n} className="break-inside-avoid h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />)
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-500">No items listed yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="break-inside-avoid glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col group relative"
              >
                {/* Image */}
                <div className="w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Store className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-fuchsia-400" />
                    ₹{item.price.toLocaleString()}
                  </div>
                </div>
                
                {/* Details */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{item.description}</p>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seller</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.sellerName}</span>
                    </div>
                    
                    <a 
                      href={`tel:${item.sellerPhone}`} 
                      className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/30 transition-colors"
                      title="Call Seller"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Post Ad Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Post New Ad</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={handlePostAd} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                    <input type="text" required value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="e.g., Wooden Dining Table" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input type="number" required min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea required rows="3" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium resize-none" placeholder="Condition, age, reason for selling..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Phone Number</label>
                    <input type="text" required value={newItem.sellerPhone} onChange={e => setNewItem({...newItem, sellerPhone: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                    <input type="url" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium" placeholder="https://example.com/image.jpg" />
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">* Leave blank to auto-generate a placeholder image.</p>
                  </div>
                  <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95 mt-2">
                    Post Ad
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
