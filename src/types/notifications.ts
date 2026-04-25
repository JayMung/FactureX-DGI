// ============================
// Notification Types — Phase 7
// ============================

export type NotificationCategory =
  | 'transaction'
  | 'facture'
  | 'client'
  | 'caisse'
  | 'system'
  | 'team';

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  link_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  notify_transaction: boolean;
  notify_facture: boolean;
  notify_client: boolean;
  notify_caisse: boolean;
  notify_system: boolean;
  notify_team: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  link_url?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, any>;
  expires_at?: string | null;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Category labels for UI
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  transaction: 'Transactions',
  facture: 'Factures',
  client: 'Clients',
  caisse: 'Caisse',
  system: 'Système',
  team: 'Équipe',
};

export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> = {
  transaction: '💰',
  facture: '📄',
  client: '👤',
  caisse: '💳',
  system: '⚙️',
  team: '👥',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};
