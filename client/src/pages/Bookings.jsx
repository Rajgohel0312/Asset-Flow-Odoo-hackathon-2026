import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  CalendarRange, 
  Search, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Trash2 
} from 'lucide-react';

export default function Bookings() {
  const { token, user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    assetId: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setBookings(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const res = await fetch('/api/v1/assets?isBookable=true&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setBookableAssets(body.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  useEffect(() => {
    if (showBookModal) {
      fetchDropdowns();
    }
  }, [showBookModal, token]);

  const handleBook = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    const payload = {
      ...newBooking,
      startTime: new Date(newBooking.startTime).toISOString(),
      endTime: new Date(newBooking.endTime).toISOString()
    };

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Booking failed');

      setActionSuccess('Resource booked successfully!');
      setNewBooking({ assetId: '', startTime: '', endTime: '', purpose: '' });
      setTimeout(() => {
        setShowBookModal(false);
        setActionSuccess('');
        fetchBookings();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/v1/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Resource Bookings" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Control */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Reserve shared office spaces, projectors, or test devices.</p>
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition"
          >
            <Plus size={16} />
            <span>Book Resource</span>
          </button>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Reserved By</th>
                  <th className="px-6 py-4">Timeframe</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">Loading bookings...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">No active bookings listed.</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-950 uppercase tracking-wide">
                        {booking.bookingNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{booking.asset?.assetName}</span>
                          <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{booking.asset?.assetTag}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        <div>{new Date(booking.startTime).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">to {new Date(booking.endTime).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          booking.status === 'UPCOMING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          booking.status === 'ONGOING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          booking.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(booking.status === 'UPCOMING' || booking.status === 'ONGOING') && (user?.id === booking.bookedBy || user?.role?.name === 'ADMIN') && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center space-x-1 ml-auto transition"
                          >
                            <Trash2 size={12} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Book Resource Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Book Office Resource</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle size={14} />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Select Bookable Resource</label>
                <select
                  required
                  value={newBooking.assetId}
                  onChange={(e) => setNewBooking({...newBooking, assetId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Resource</option>
                  {bookableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.assetName} [{asset.assetTag}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Start Time</label>
                <input
                  type="datetime-local" required
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking({...newBooking, startTime: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">End Time</label>
                <input
                  type="datetime-local" required
                  value={newBooking.endTime}
                  onChange={(e) => setNewBooking({...newBooking, endTime: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Purpose / Notes</label>
                <textarea
                  required
                  value={newBooking.purpose}
                  onChange={(e) => setNewBooking({...newBooking, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-20"
                  placeholder="Marketing Team Sync Session."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
