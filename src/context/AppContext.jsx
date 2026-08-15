import React, { createContext, useState, useEffect } from 'react';
import { DEMO_MODE } from '../services/api';

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [demoMode, setDemoMode] = useState(DEMO_MODE);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      type: "capacity",
      title: "Capacity Alert: AI Hackathon",
      text: "AI Hackathon is predicted to reach capacity based on current registration acceleration.",
      timestamp: "10m ago",
      read: false
    },
    {
      id: "notif-2",
      type: "recommendation",
      title: "New Match Identified",
      text: "A new event 'React 19 & Next.js Showcase' matches 88% of your activity profile.",
      timestamp: "2h ago",
      read: false
    },
    {
      id: "notif-3",
      type: "feedback",
      title: "AI Feedback Sentiment Available",
      text: "Feedback sentiment report generated for 'React 19 Workshop': 94% Positive.",
      timestamp: "1d ago",
      read: true
    }
  ]);

  // Keyboard shortcut listener for Ctrl + K global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addNotification = (notif) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        timestamp: "Just now",
        read: false,
        ...notif
      },
      ...prev
    ]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider value={{
      demoMode,
      setDemoMode,
      showSearchModal,
      setShowSearchModal,
      globalSearchQuery,
      setGlobalSearchQuery,
      notifications,
      addNotification,
      markAllRead,
      removeNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};
