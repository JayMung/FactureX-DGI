/**
 * Notification Service — Phase 7
 * Handles CRUD for user_notifications and notification preferences.
 * Uses Supabase Realtime for live updates.
 */
import { supabase } from '@/integrations/supabase/client';
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationInput,
} from '@/types/notifications';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type NotificationInsertPayload = RealtimePostgresChangesPayload<{
  type: 'INSERT';
  table: string;
  schema: string;
  new: Notification;
  old: Record<string, never>;
}>;

type NotifyCallback = (notification: Notification) => void;

class NotificationService {
  private unsubscribeRealtime: (() => void) | null = null;
  private listeners: Set<NotifyCallback> = new Set();

  // ============================
  // HELPERS (uses SECURITY DEFINER RPCs)
  // ============================

  /** Get paginated notifications for current user */
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let query = supabase
      .from('user_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false).eq('is_dismissed', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[NotificationService] getNotifications error:', error);
      return [];
    }
    return data ?? [];
  }

  /** Get unread count via RPC */
  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_notification_count');
    if (error) {
      console.error('[NotificationService] getUnreadCount error:', error);
      return 0;
    }
    return data ?? 0;
  }

  /** Mark single notification as read */
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notif_id: notificationId,
    });
    if (error) {
      console.error('[NotificationService] markAsRead error:', error);
      return false;
    }
    return true;
  }

  /** Mark all notifications as read */
  async markAllAsRead(): Promise<boolean> {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) {
      console.error('[NotificationService] markAllAsRead error:', error);
      return false;
    }
    return true;
  }

  /** Dismiss a notification (soft delete) */
  async dismiss(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_dismissed: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[NotificationService] dismiss error:', error);
      return false;
    }
    return true;
  }

  // ============================
  // NOTIFICATION PREFERENCES
  // ============================

  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[NotificationService] getPreferences error:', error);
      return null;
    }
    return data;
  }

  async updatePreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_notification_preferences')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      console.error('[NotificationService] updatePreferences error:', error);
      return false;
    }
    return true;
  }

  // ============================
  // REALTIME SUBSCRIPTION
  // ============================

  /**
   * Subscribe to new notifications for the current user via Supabase Realtime.
   * Returns an unsubscribe function.
   */
  subscribeToNotifications(callback: NotifyCallback): () => void {
    this.listeners.add(callback);

    // Start subscription if not yet active
    if (!this.unsubscribeRealtime) {
      this.startRealtimeSubscription();
    }

    // Return unsubscribe for this specific listener
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopRealtimeSubscription();
      }
    };
  }

  private async startRealtimeSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on<NotificationInsertPayload>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          // Only notify if not dismissed
          if (!notification.is_dismissed) {
            this.listeners.forEach((cb) => cb(notification));
          }
        }
      )
      .subscribe();

    this.unsubscribeRealtime = () => {
      supabase.removeChannel(channel);
    };
  }

  private stopRealtimeSubscription(): void {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
  }

  // ============================
  // PUSH NOTIFICATIONS (Browser)
  // ============================

  /** Request push notification permission and register service worker */
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /** Register the service worker for push events */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[NotificationService] SW registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[NotificationService] SW registration failed:', error);
      return null;
    }
  }

  /** Subscribe to push via VAPID (calls backend endpoint) */
  async subscribeToPush(): Promise<boolean> {
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return false;

      // VAPID public key from environment
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('[NotificationService] No VAPID key configured');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey),
      });

      // Save subscription to backend
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.toJSON().keys),
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' }
      );

      if (error) {
        console.error('[NotificationService] Save push subscription error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] subscribeToPush error:', error);
      return false;
    }
  }

  /** Unsubscribe from push */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from backend
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] unsubscribeFromPush error:', error);
      return false;
    }
  }

  // ============================
  // UTILITY
  // ============================

  /** Convert base64 VAPID key to Uint8Array */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
