import { useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

interface AlertConfig {
  telegramChatId?: string; // [COD-56] telegramBotToken supprimé du frontend — stocké server-side
  maxDaysWithoutReconciliation: number;
  maxUnrecordedExpenses: number;
}

export function useComptabiliteAI(config: AlertConfig) {
  const hasCheckedToday = useRef(false);

  // Fetch pending expenses (En attente)
  const { data: pendingExpenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['comptabilite-ai', 'pending-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, montant, motif, date_paiement')
        .eq('type_transaction', 'depense')
        .eq('statut', 'En attente')
        .order('date_paiement', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch last account movement (proxy for reconciliation)
  const { data: lastMovement, isLoading: loadingReconciliation } = useQuery({
    queryKey: ['comptabilite-ai', 'last-reconciliation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mouvements_comptes')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  /**
   * [COD-56] Envoie une alerte Telegram via Edge Function server-side.
   * Le token du bot Telegram (TELEGRAM_BOT_TOKEN) n'est plus dans le frontend.
   * Appelle /functions/v1/api-telegram-send avec le jeton d'auth Supabase.
   */
  const sendTelegramAlert = useCallback(async (message: string) => {
    if (!config.telegramChatId) {
      console.warn('[ComptabiliteAI] telegramChatId not configured — alert not sent');
      return;
    }

    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/api-telegram-send`;
    if (!edgeFunctionUrl || !SUPABASE_URL) {
      console.warn('[ComptabiliteAI] SUPABASE_URL not configured — Telegram alert not sent');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message,
          chatId: config.telegramChatId,
          parseMode: 'HTML',
          disableWebPagePreview: true,
          disableNotification: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[ComptabiliteAI] Telegram alert failed:', error);
      }
    } catch (error) {
      console.error('[ComptabiliteAI] Failed to send Telegram alert:', error);
    }
  }, [config.telegramChatId]);

  // Daily check (around 18h)
  useEffect(() => {
    if (loadingExpenses || loadingReconciliation || hasCheckedToday.current) return;

    const now = new Date();
    const currentHour = now.getHours();

    // Only trigger between 18:00 and 18:05
    if (currentHour !== 18 || now.getMinutes() >= 5) return;

    // Prevent multiple checks in the same session
    const lastCheckKey = 'comptabilite_ai_last_check';
    const lastCheck = localStorage.getItem(lastCheckKey);
    const today = now.toISOString().split('T')[0];

    if (lastCheck === today) {
      hasCheckedToday.current = true;
      return;
    }

    hasCheckedToday.current = true;
    localStorage.setItem(lastCheckKey, today);

    // Alert: pending expenses
    if (pendingExpenses && pendingExpenses.length >= config.maxUnrecordedExpenses) {
      sendTelegramAlert(
        `⚠️ <b>FactureSmart - Dépenses en attente</b>\n\n` +
        `Tu as <b>${pendingExpenses.length}</b> dépenses à valider aujourd'hui.\n\n` +
        `Connecte-toi sur FactureSmart pour les enregistrer.\n\n` +
        `<i>Ne laisse pas traîner, c'est important pour ta trésorerie !</i>`
      );
    }

    // Alert: reconciliation overdue
    if (lastMovement) {
      const daysSinceReconciliation = differenceInDays(now, new Date(lastMovement.created_at));

      if (daysSinceReconciliation >= config.maxDaysWithoutReconciliation) {
        sendTelegramAlert(
          `🚨 <b>FactureSmart - Réconciliation urgente</b>\n\n` +
          `Ta dernière réconciliation date de <b>${daysSinceReconciliation} jours</b>.\n\n` +
          `Va dans Comptes → Mouvements pour faire ta réconciliation.\n\n` +
          `<i>Sans réconciliation régulière, tu perds le contrôle de ta trésorerie !</i>`
        );
      }
    }
  }, [pendingExpenses, lastMovement, loadingExpenses, loadingReconciliation, config, sendTelegramAlert]);

  const daysSinceLastReconciliation = lastMovement
    ? differenceInDays(new Date(), new Date(lastMovement.created_at))
    : null;

  return {
    unrecordedExpensesCount: pendingExpenses?.length || 0,
    daysSinceLastReconciliation,
    sendTelegramAlert,
    isLoading: loadingExpenses || loadingReconciliation,
  };
}
