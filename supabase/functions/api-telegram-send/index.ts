/**
 * API Endpoint: POST /api-telegram-send
 * 
 * Proxy server-side pour l'API Telegram Bot.
 * Le token du bot Telegram est stocké côté serveur (environment variable)
 * et n'est JAMAIS exposé au frontend.
 * 
 * Le frontend appelle cette Edge Function avec le message et l'ID de chat,
 * la fonction envoie le message via l'API Telegram avec le token secret.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const DEFAULT_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-organization-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TelegramMessage {
  message: string;
  chatId?: string;
  parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeMarkdownV2(text: string): string {
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escaped = text;
  for (const char of specialChars) {
    escaped = escaped.split(char).join('\\' + char);
  }
  return escaped;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check TELEGRAM_BOT_TOKEN is configured
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(
      JSON.stringify({
        error: 'Telegram bot not configured on server',
        hint: 'Set TELEGRAM_BOT_TOKEN environment variable in Supabase Edge Functions settings.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: TelegramMessage = await req.json();
    const {
      message,
      chatId = DEFAULT_CHAT_ID,
      parseMode = 'HTML',
      disableWebPagePreview = true,
      disableNotification = false,
      replyToMessageId,
    } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'message is required and cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chatId && !DEFAULT_CHAT_ID) {
      return new Response(
        JSON.stringify({ error: 'chatId is required (or TELEGRAM_CHAT_ID must be configured server-side)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize message based on parseMode
    let safeMessage = message;
    if (parseMode === 'HTML') {
      // Only allow safe HTML tags
      safeMessage = escapeHtml(message);
    } else if (parseMode === 'MarkdownV2') {
      safeMessage = escapeMarkdownV2(message);
    }

    // Build sendMessage payload
    const payload: Record<string, unknown> = {
      chat_id: chatId || DEFAULT_CHAT_ID,
      text: safeMessage,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview,
      disable_notification: disableNotification,
    };

    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    // Send via Telegram Bot API
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[api-telegram-send] Telegram API error:', errorData);
      return new Response(
        JSON.stringify({
          error: errorData.description || 'Failed to send Telegram message',
          errorCode: errorData.error_code,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.result.message_id,
        chatId: result.result.chat.id,
        date: result.result.date,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[api-telegram-send] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
