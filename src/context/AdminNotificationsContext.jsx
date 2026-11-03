import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AdminNotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 20000; // lightweight polling every 20s (no Socket.IO infra available)

const EMPTY_COUNTS = { enrollments: 0, enquiries: 0 };

export const AdminNotificationsProvider = ({ children }) => {
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  // Real API connectivity signal: true after a successful poll, false on failure.
  const [online, setOnline] = useState(true);
  // Tracks which badge just increased so we can pulse it only on new arrivals.
  const [bumped, setBumped] = useState({ enrollments: false, enquiries: false });
  const prevCounts = useRef(EMPTY_COUNTS);
  const bumpTimers = useRef({});

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications/counts');
      setOnline(true);
      const next = {
        enrollments: res.data?.counts?.enrollments ?? 0,
        enquiries: res.data?.counts?.enquiries ?? 0
      };
      const prev = prevCounts.current;

      // Pulse only when a count grows (a genuinely new notification arrived).
      ['enrollments', 'enquiries'].forEach((key) => {
        if (next[key] > prev[key]) {
          setBumped((b) => ({ ...b, [key]: true }));
          clearTimeout(bumpTimers.current[key]);
          bumpTimers.current[key] = setTimeout(() => {
            setBumped((b) => ({ ...b, [key]: false }));
          }, 1600);
        }
      });

      prevCounts.current = next;
      setCounts(next);
    } catch (err) {
      // Silently ignore polling errors (e.g. transient network / 401 redirect).
      setOnline(false);
      console.error('Failed to refresh notification counts', err);
    }
  }, []);

  const markEnrollmentsRead = useCallback(async () => {
    try {
      await api.post('/admin/notifications/enrollments/read');
      await refresh();
    } catch (err) {
      console.error('Failed to mark enrollment notifications read', err);
    }
  }, [refresh]);

  const markEnquiriesRead = useCallback(async () => {
    try {
      await api.post('/admin/notifications/enquiries/read');
      await refresh();
    } catch (err) {
      console.error('Failed to mark enquiry notifications read', err);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);

    // Refresh as soon as the admin returns to the browser tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      Object.values(bumpTimers.current).forEach(clearTimeout);
    };
  }, [refresh]);

  const value = { counts, bumped, online, refresh, markEnrollmentsRead, markEnquiriesRead };

  return <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>;
};

export const useAdminNotifications = () => {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationsProvider');
  }
  return ctx;
};
