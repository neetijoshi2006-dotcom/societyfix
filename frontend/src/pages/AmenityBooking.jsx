import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Dumbbell, Calendar, Clock, Users, Plus, X, Waves, Coffee, PartyPopper, CheckCircle } from 'lucide-react';

const AMENITIES = [
  { id: 'gym', name: 'Gymnasium', icon: Dumbbell, capacity: 15, timings: '06:00 AM - 10:00 PM', price: 'Free', status: 'Available' },
  { id: 'pool', name: 'Swimming Pool', icon: Waves, capacity: 20, timings: '07:00 AM - 08:00 PM', price: 'Free', status: 'Limited' },
  { id: 'club', name: 'Clubhouse', icon: Coffee, capacity: 40, timings: '10:00 AM - 11:00 PM', price: '₹500 / hr', status: 'Available' },
  { id: 'party', name: 'Party Hall', icon: PartyPopper, capacity: 100, timings: '09:00 AM - 11:30 PM', price: '₹2000 / hr', status: 'Full' },
];

export default function AmenityBooking() {
  const { user } = useAuth();
  const { setToast } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState(null);

  const [newBooking, setNewBooking] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 11:00 AM',
    guests: 1,
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/amenities');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (amenity) => {
    if (amenity.status === 'Full') {
      setToast({ title: 'Fully Booked', message: 'No slots available for today.' });
      return;
    }
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    
    try {
      const res = await api.post('/amenities', {
        amenityName: selectedAmenity.name,
        date: newBooking.date,
        time: newBooking.time,
        membersCount: newBooking.guests
      });

      const booking = res.data.booking;
      setBookings([booking, ...bookings]);
      setIsModalOpen(false);
      setSelectedAmenity(null);
      setNewBooking({ date: new Date().toISOString().split('T')[0], time: '10:00 AM - 11:00 AM', guests: 1, notes: '' });
      
      setToast({ 
        title: booking.status === 'Confirmed' ? 'Booking Confirmed' : 'Booking Request Sent', 
        message: `${selectedAmenity.name} for ${booking.date}` 
      });
    } catch (err) {
      console.error('Failed to book amenity', err);
      setToast({ title: 'Error', message: 'Could not complete booking.' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-emerald-500';
      case 'Limited': return 'bg-amber-500';
      case 'Full': return 'bg-rose-500';
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Amenity Booking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Reserve society facilities</p>
        </div>
      </div>

      {/* Facilities Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Available Facilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AMENITIES.map((am) => {
            const Icon = am.icon;
            return (
              <motion.div 
                whileHover={{ y: -4 }}
                key={am.id}
                className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-full relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-500/20 dark:group-hover:text-brand-400 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(am.status)}`} />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{am.status}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{am.name}</h3>
                
                <div className="space-y-1.5 mb-6 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Max Capacity: {am.capacity}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {am.timings}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{am.price}</span>
                  <button 
                    onClick={() => handleOpenModal(am)}
                    disabled={am.status === 'Full'}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      am.status === 'Full' 
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 shadow-slate-900/10 dark:shadow-brand-500/20'
                    }`}
                  >
                    Book
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">My Bookings</h2>
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Facility</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">Loading bookings...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No bookings found.</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{b.amenity}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {b.date} <br/>
                      <span className="text-xs text-slate-400">{b.time}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAmenity && (
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
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Book {selectedAmenity.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedAmenity.price}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleBook} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Date</label>
                    <input 
                      type="date" required
                      value={newBooking.date}
                      onChange={e => setNewBooking({...newBooking, date: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Time Slot</label>
                    <select 
                      value={newBooking.time}
                      onChange={e => setNewBooking({...newBooking, time: e.target.value})}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium appearance-none"
                    >
                      <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                      <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</option>
                      <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                      <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                      <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                      <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Number of Guests</label>
                  <input 
                    type="number" min="1" max={selectedAmenity.capacity} required
                    value={newBooking.guests}
                    onChange={e => setNewBooking({...newBooking, guests: parseInt(e.target.value)})}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Maximum allowed: {selectedAmenity.capacity}</p>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-slate-900/20 dark:shadow-brand-500/20 transition-all active:scale-95"
                >
                  Confirm Booking
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




