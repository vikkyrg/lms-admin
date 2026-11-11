import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAdminAuth } from './AdminAuthContext';

const AdminNotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 20000; // lightweight polling every 20s (no Socket.IO infra available)

const EMPTY_COUNTS = { enrollments: 0, enquiries: 0, reviews: 0 };

export const AdminNotificationsProvider = ({ children }) => {
  const { isAuthenticated, logout } = useAdminAuth();
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState(null);
  // Tracks which badge just increased so we can pulse it only on new arrivals.
  const [bumped, setBumped] = useState({ enrollments: false, enquiries: false, reviews: false });
  const prevCounts = useRef(EMPTY_COUNTS);
  const bumpTimers = useRef({});

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/admin/notifications/counts');
      setOnline(true);
      setError(null);
      const next = {
        enrollments: res.data?.counts?.enrollments ?? 0,
        enquiries: res.data?.counts?.enquiries ?? 0,
        reviews: res.data?.counts?.reviews ?? 0
      };
      const prev = prevCounts.current;

      // Pulse only when a count grows (a genuinely new notification arrived).
      ['enrollments', 'enquiries', 'reviews'].forEach((key) => {
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
      setOnline(false);
      setError(err.response?.data?.message || err.message || 'Failed to load notification counts.');
      if (err.response?.status === 401) {
        logout();
      } else {
        console.error('Failed to refresh notification counts', err);
      }
    }
  }, [isAuthenticated, logout]);

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

  const markReviewsRead = useCallback(async () => {
    try {
      await api.post('/reviews/admin/mark-read');
      await refresh();
    } catch (err) {
      console.error('Failed to mark review notifications read', err);
    }
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCounts(EMPTY_COUNTS);
      setOnline(false);
      setError(null);
      prevCounts.current = EMPTY_COUNTS;
      return undefined;
    }

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
  }, [isAuthenticated, refresh]);

  const value = { counts, bumped, online, error, refresh, markEnrollmentsRead, markEnquiriesRead, markReviewsRead };

  return <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>;
};

export const useAdminNotifications = () => {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationsProvider');
  }
  return ctx;
};
