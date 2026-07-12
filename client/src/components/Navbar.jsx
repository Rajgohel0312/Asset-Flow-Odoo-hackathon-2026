import React, { useState, useEffect } from 'react';
import { Bell, LogOut, User as UserIcon, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/notifications?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setNotifications(body.data || []);
        setUnreadCount(body.meta?.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 top-0 z-40">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition relative focus:outline-none"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition flex flex-col space-y-1 ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                        {!notif.isRead && (
                          <button 
                            onClick={() => {
                              markAsRead(notif.id);
                            }} 
                            className="text-[10px] text-slate-400 hover:text-brand-600 flex items-center space-x-0.5"
                          >
                            <CheckSquare size={10} />
                            <span>Read</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card Info */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-semibold text-slate-800">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {user?.role?.name?.replace('_', ' ')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon size={18} />
          </div>
          <button 
            onClick={logout} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
