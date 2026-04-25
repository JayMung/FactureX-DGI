/**
 * notificationSender — Utility functions to create notifications from various app events.
 * Phase 7: These call Supabase RPC `send_notification` or direct insert.
 *
 * In production, notification creation should happen on the backend (via Supabase Edge Functions).
 * This client-side version provides immediate feedback within the current session.
 */
import { supabase } from '@/integrations/supabase/client';
import type { NotificationCategory, NotificationPriority } from '@/types/notifications';

interface SendNotificationInput {
  userId: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  linkUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Send a notification to a user.
 * Uses the `send_notification` Postgres function (SECURITY DEFINER).
 * Returns the notification ID if created, or null if user opted out.
 */
export async function sendNotification(
  input: SendNotificationInput
): Promise<string | null> {
  const { error, data } = await supabase.rpc('send_notification', {
    p_user_id: input.userId,
    p_category: input.category,
    p_priority: input.priority ?? 'normal',
    p_title: input.title,
    p_body: input.body,
    p_link_url: input.linkUrl ?? null,
    p_entity_type: input.entityType ?? null,
    p_entity_id: input.entityId ?? null,
    p_metadata: input.metadata ?? {},
    p_expires_at: null,
  });

  if (error) {
    console.error('[notificationSender] sendNotification error:', error);
    return null;
  }

  return data as string | null;
}

// ============================
// Convenience builders
// ============================

export const NotificationFactory = {
  /** Notify when a transaction (payment) is completed */
  async transaction(
    userId: string,
    companyName: string,
    amount: number,
    transactionId: string
  ) {
    return sendNotification({
      userId,
      category: 'transaction',
      title: 'Transaction enregistrée',
      body: `${amount.toLocaleString()} CDF — ${companyName}`,
      linkUrl: '/transactions',
      entityType: 'transaction',
      entityId: transactionId,
      metadata: { amount, companyName },
    });
  },

  /** Notify when a facture (invoice) is created or updated */
  async facture(
    userId: string,
    clientName: string,
    invoiceNumber: string,
    action: 'created' | 'paid' | 'overdue' | 'cancelled',
    invoiceId: string
  ) {
    const labels: Record<string, string> = {
      created: 'Nouvelle facture',
      paid: 'Facture payée',
      overdue: 'Facture en retard',
      cancelled: 'Facture annulée',
    };

    const descriptions: Record<string, string> = {
      created: `${clientName} — Facture ${invoiceNumber}`,
      paid: `${clientName} a payé la Facture ${invoiceNumber}`,
      overdue: `Facture ${invoiceNumber} — ${clientName} est en retard`,
      cancelled: `Facture ${invoiceNumber} — ${clientName} annulée`,
    };

    const priority: NotificationPriority =
      action === 'overdue' ? 'high' : action === 'paid' ? 'normal' : 'normal';

    return sendNotification({
      userId,
      category: 'facture',
      priority,
      title: labels[action],
      body: descriptions[action],
      linkUrl: `/invoices/${invoiceId}`,
      entityType: 'facture',
      entityId: invoiceId,
      metadata: { clientName, invoiceNumber, action },
    });
  },

  /** Notify when a client is created or updated */
  async client(
    userId: string,
    clientName: string,
    action: 'created' | 'updated',
    clientId: string
  ) {
    const labels: Record<string, string> = {
      created: 'Nouveau client',
      updated: 'Client modifié',
    };

    return sendNotification({
      userId,
      category: 'client',
      title: labels[action],
      body: `${clientName}`,
      linkUrl: `/clients/${clientId}`,
      entityType: 'client',
      entityId: clientId,
      metadata: { clientName, action },
    });
  },

  /** Notify about caisse (cash register) events */
  async caisse(
    userId: string,
    caisseName: string,
    action: 'opened' | 'closed' | 'discrepancy',
    caisseId: string,
    amount?: number
  ) {
    const labels: Record<string, string> = {
      opened: 'Caisse ouverte',
      closed: 'Caisse fermée',
      discrepancy: 'Écart de caisse détecté',
    };

    const descriptions: Record<string, string> = {
      opened: `${caisseName} — Ouverture effectuée`,
      closed: `${caisseName} — Clôture effectuée`,
      discrepancy: `${caisseName} — Écart de ${(amount ?? 0).toLocaleString()} CDF`,
    };

    const priority: NotificationPriority =
      action === 'discrepancy' ? 'urgent' : 'normal';

    return sendNotification({
      userId,
      category: 'caisse',
      priority,
      title: labels[action],
      body: descriptions[action],
      linkUrl: '/caisse',
      entityType: 'caisse',
      entityId: caisseId,
      metadata: { caisseName, action, amount },
    });
  },

  /** Notify about system events */
  async system(
    userId: string,
    title: string,
    body: string,
    linkUrl?: string,
    priority?: NotificationPriority
  ) {
    return sendNotification({
      userId,
      category: 'system',
      priority: priority ?? 'normal',
      title,
      body,
      linkUrl,
      entityType: 'system',
      metadata: {},
    });
  },

  /** Notify about team events */
  async team(
    userId: string,
    memberName: string,
    action: 'invited' | 'joined' | 'left' | 'role_changed',
    companyName: string
  ) {
    const labels: Record<string, string> = {
      invited: 'Invitation envoyée',
      joined: 'Nouveau membre',
      left: 'Membre a quitté',
      role_changed: 'Rôle modifié',
    };

    return sendNotification({
      userId,
      category: 'team',
      title: labels[action],
      body: `${memberName} — ${companyName}`,
      linkUrl: '/settings/team',
      metadata: { memberName, action, companyName },
    });
  },
};
