/**
 * useNotifications — React hook for notification system
 * Phase 7: Real-time notification management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types/notifications';

interface UseNotificationsOptions {
  /** Max notifications to fetch initially */
  limit?: number;
  /** Auto-subscribe to realtime updates */
  enableRealtime?: boolean;
}

interface UseNotificationsReturn {
  /** List of notifications (newest first) */
  notifications: Notification[];
  /** Unread count */
  unreadCount: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Mark single notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all as read */
  markAllAsRead: () => Promise<void>;
  /** Dismiss a notification */
  dismiss: (id: string) => Promise<void>;
  /** Refresh notifications from server */
  refresh: () => Promise<void>;
  /** Fetch more (older) notifications */
  loadMore: () => Promise<void>;
  /** Whether there are more notifications to load */
  hasMore: boolean;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { limit = 50, enableRealtime = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mountedRef = useRef(true);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const data = await notificationService.getNotifications({
        limit,
        offset: currentOffset,
      });

      if (!mountedRef.current) return;

      if (reset) {
        setNotifications(data);
        setOffset(data.length);
      } else {
        // Append, deduplicate by id
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifs = data.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newNotifs];
        });
        setOffset((prev) => prev + data.length);
      }

      setHasMore(data.length >= limit);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Erreur lors du chargement des notifications');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit, offset]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const count = await notificationService.getUnreadCount();
    if (mountedRef.current) {
      setUnreadCount(count);
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications(true);
    fetchUnreadCount();

    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      (newNotification) => {
        if (!mountedRef.current) return;
        // Prepend to list
        setNotifications((prev) => [newNotification, ...prev]);
        // Increment unread count
        setUnreadCount((prev) => prev + 1);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [enableRealtime]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    const success = await notificationService.markAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) =>
          !n.is_read ? { ...n, is_read: true, read_at: now } : n
        )
      );
      setUnreadCount(0);
    }
  }, []);

  // Dismiss
  const dismiss = useCallback(async (id: string) => {
    const success = await notificationService.dismiss(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_dismissed: true } : n
        )
      );
      if (notifications.find((n) => n.id === id)?.is_read === false) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  }, [notifications]);

  // Refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(true),
      fetchUnreadCount(),
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(false);
  }, [hasMore, loading, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
    loadMore,
    hasMore,
  };
}
