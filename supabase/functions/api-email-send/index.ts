/**
 * API Endpoint: POST /api-email-send
 * 
 * Proxy server-side pour l'API Resend.
 * La clé RESEND_API_KEY est stockée côté serveur (environment variable)
 * et n'est JAMAIS exposée au frontend.
 * 
 * Le frontend appelle cette Edge Function avec le contenu de l'email,
 * la fonction fait appel à Resend avec la clé secrète.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const RESEND_ENDPOINT = 'https://api.resend.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'FactureSmart <noreply@facturesmart.com>';
const APP_URL = Deno.env.get('APP_URL') || 'https://facturesmart.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-organization-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  type?: 'verification' | 'password_reset' | 'invitation' | 'invoice' | 'generic';
  // For templated emails
  templateData?: {
    userName?: string;
    invoiceNumber?: string;
    amount?: string;
    status?: string;
    invitedBy?: string;
    role?: string;
    verificationToken?: string;
    resetToken?: string;
    invitationToken?: string;
  };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(html: string): string {
  // Basic sanitization - remove script tags
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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

  // Check RESEND_API_KEY is configured
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Email service not configured on server' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { to, subject, html, from, replyTo, type, templateData }: EmailPayload = body;

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!validateEmail(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build email content
    let emailHtml = html;
    if (type && templateData) {
      emailHtml = buildTemplatedEmail(type, templateData, emailHtml);
    }

    // Sanitize HTML
    emailHtml = sanitize(emailHtml);

    // Send via Resend
    const response = await fetch(`${RESEND_ENDPOINT}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || FROM_EMAIL,
        to,
        subject,
        html: emailHtml,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[api-email-send] Resend error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData.message || 'Failed to send email', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        from: from || FROM_EMAIL,
        to,
        subject,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[api-email-send] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildTemplatedEmail(
  type: string,
  data: EmailPayload['templateData'],
  customHtml?: string
): string {
  const base = customHtml || getDefaultTemplate();

  // Replace placeholders
  let html = base;
  if (data.userName) html = html.replace(/{{userName}}/g, data.userName);
  if (data.invoiceNumber) html = html.replace(/{{invoiceNumber}}/g, data.invoiceNumber);
  if (data.amount) html = html.replace(/{{amount}}/g, data.amount);
  if (data.status) html = html.replace(/{{status}}/g, data.status);
  if (data.invitedBy) html = html.replace(/{{invitedBy}}/g, data.invitedBy);
  if (data.role) html = html.replace(/{{role}}/g, data.role);
  if (data.verificationToken) {
    const verifyUrl = `${APP_URL}/verify-email?token=${data.verificationToken}`;
    html = html.replace(/{{verificationUrl}}/g, verifyUrl);
    html = html.replace(/{{verificationUrl}}/g, verifyUrl);
  }
  if (data.resetToken) {
    const resetUrl = `${APP_URL}/reset-password?token=${data.resetToken}`;
    html = html.replace(/{{resetUrl}}/g, resetUrl);
  }
  if (data.invitationToken) {
    const inviteUrl = `${APP_URL}/invitation/accept?token=${data.invitationToken}`;
    html = html.replace(/{{invitationUrl}}/g, inviteUrl);
  }

  return html;
}

function getDefaultTemplate(): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">FactureSmart</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Facturation intelligente, conformité DGI</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        {{content}}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          © 2026 FactureSmart — Cet email a été envoyé automatiquement.
        </p>
      </div>
    </div>
  `;
}
