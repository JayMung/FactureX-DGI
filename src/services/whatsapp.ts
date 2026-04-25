// WhatsApp Business API Service — FactureSmart COD-46
// Provider: WhatsApp Cloud API (Meta) — https://developers.facebook.com/docs/whatsapp
//
// [COD-46] Fake API: VITE_USE_MOCK_WHATSAPP=true utilise mock-whatsapp (dev/test)
//
// Setup (real):
// 1. Create a Meta Business app at https://developers.facebook.com
// 2. Add WhatsApp product, get your Phone Number ID & Business Account ID
// 3. Set VITE_WHATSAPP_PHONE_NUMBER_ID and VITE_WHATSAPP_BUSINESS_ACCOUNT_ID in .env
// 4. Set WHATSAPP_ACCESS_TOKEN in secrets/.env.credentials
//
// API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppPhoneNumber {
  formatted: string;  // "+243****6213"
  raw: string;        // "243970746213"
}

export interface WhatsAppMessageResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

/**
 * Format a phone number for WhatsApp API
 * Accepts: +243****6213, 243970746213, 0970746213
 * Returns: 243970746213 (without leading + for API)
 */
export function formatWhatsAppPhone(phone: string): WhatsAppPhoneNumber {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle DRC numbers: 0[9x]XXXXXXXX -> 243[9x]XXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    return { formatted: `+243${digits.slice(1)}`, raw: `243${digits.slice(1)}` };
  }
  // Already has country code
  if (digits.startsWith('243') && digits.length === 12) {
    return { formatted: `+${digits}`, raw: digits };
  }
  // International format already
  if (phone.startsWith('+')) {
    return { formatted: phone, raw: digits };
  }
  // Fallback: assume DRC
  return { formatted: `+${digits}`, raw: digits };
}

class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private useMock: boolean;
  private mockEndpoint: string;

  constructor() {
    // [COD-46] Fake API mode — utilise mock-whatsapp au lieu de l'API Meta
    this.useMock = import.meta.env.VITE_USE_MOCK_WHATSAPP === 'true';
    this.mockEndpoint = `${SUPABASE_URL}/functions/v1/mock-whatsapp`;

    // Real WhatsApp API credentials (from env — not in constants since secrets)
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  }

  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /** Check if WhatsApp is configured (real or mock) */
  isConfigured(): boolean {
    if (this.useMock) return true; // Mock always available
    return !!(this.accessToken && this.phoneNumberId);
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
    }
  }

  /**
   * Send a text message via WhatsApp Business API (or mock)
   */
  async sendMessage(to: string, body: string): Promise<WhatsAppMessageResult> {
    const phone = formatWhatsAppPhone(to);

    // [COD-46] Mock mode
    if (this.useMock) {
      try {
        const accessToken = await this.getAccessToken();
        const response = await fetch(this.mockEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.raw,
            type: 'text',
            text: { body },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error?.message || 'Mock WhatsApp failed' };
        }
        return { success: true, message_id: data.messages?.[0]?.id };
      } catch (err) {
        return { success: false, error: `Network error: ${err}` };
      }
    }

    if (!this.isConfigured()) {
      console.warn('[WhatsAppService] Not configured — set WHATSAPP_ACCESS_TOKEN and VITE_WHATSAPP_PHONE_NUMBER_ID');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const response = await fetch(`${WHATSAPP_API_BASE}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.raw,
          type: 'text',
          text: { body },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[WhatsAppService] Send failed:', data);
        return { success: false, error: data.error?.message || 'Failed to send WhatsApp message' };
      }

      return { success: true, message_id: data.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsAppService] Network error:', err);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Send a document (PDF) via WhatsApp Business API (or mock)
   * The PDF must be hosted on a public URL — use Supabase Storage
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption: string,
    fileName: string,
    mimeType: string = 'application/pdf'
  ): Promise<WhatsAppMessageResult> {
    const phone = formatWhatsAppPhone(to);

    // [COD-46] Mock mode
    if (this.useMock) {
      try {
        const accessToken = await this.getAccessToken();
        const response = await fetch(this.mockEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.raw,
            type: 'document',
            document: {
              link: documentUrl,
              caption,
              filename: fileName,
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error?.message || 'Mock WhatsApp failed' };
        }
        return { success: true, message_id: data.messages?.[0]?.id };
      } catch (err) {
        return { success: false, error: `Network error: ${err}` };
      }
    }

    if (!this.isConfigured()) {
      console.warn('[WhatsAppService] Not configured');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const response = await fetch(`${WHATSAPP_API_BASE}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.raw,
          type: 'document',
          document: {
            link: documentUrl,
            caption,
            filename: fileName,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[WhatsAppService] Document send failed:', data);
        return { success: false, error: data.error?.message || 'Failed to send document via WhatsApp' };
      }

      return { success: true, message_id: data.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsAppService] Network error:', err);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Send an invoice notification via WhatsApp with download link
   * Includes: invoice number, amount, due date, download link
   */
  async sendInvoiceNotification(
    to: string,
    invoiceNumber: string,
    amount: string,
    status: string,
    downloadUrl: string
  ): Promise<WhatsAppMessageResult> {
    const message = `🧾 *FactureSmart*

Votre facture *${invoiceNumber}* est disponible.

💰 Montant: *${amount}*
📌 Statut: ${status}

📥 Téléchargez votre facture:
${downloadUrl}

--
Envoyé via FactureSmart`;

    return this.sendMessage(to, message);
  }

  /**
   * Send invoice with PDF attachment (hosted document)
   */
  async sendInvoiceWithPDF(
    to: string,
    invoiceNumber: string,
    amount: string,
    status: string,
    pdfUrl: string,
    fileName: string
  ): Promise<WhatsAppMessageResult> {
    const caption = `🧾 FactureSmart — ${invoiceNumber}\n💰 ${amount}\n📌 Statut: ${status}`;
    return this.sendDocument(to, pdfUrl, caption, fileName);
  }

  /**
   * Verify webhook token (for webhook setup validation)
   */
  static verifyWebhook(token: string, expected: string): boolean {
    return token === expected;
  }
}

export const whatsAppService = new WhatsAppService();
