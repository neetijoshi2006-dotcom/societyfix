import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (title, message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  // Backwards compatible setToast for existing pages
  const setToast = (toastObj) => {
    if (!toastObj) return;
    showToast(toastObj.title, toastObj.message, toastObj.type);
  };

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('⚡ Connected to socket server:', newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('register', user.id);
      
      const handleNotification = (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 30));
        showToast(notif.title, notif.content, notif.type);
      };

      socket.on('notification_received', handleNotification);

      return () => {
        socket.off('notification_received', handleNotification);
      };
    }
  }, [socket, user]);

  const clearNotifications = () => setNotifications([]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      toasts,
      toast: toasts[0] || null, 
      setToast, 
      showToast,
      removeToast,
      clearNotifications, 
      removeNotification 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;


