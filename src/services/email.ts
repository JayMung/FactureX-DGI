// Email Service — FactureSmart Sprint 1
// [COD-56] Refactorisé: RESEND_API_KEY supprimée du frontend
// Appels via Edge Function /api-email-send (server-side)
// La vraie clé Resend est stockée dans les environment variables Supabase
// [COD-46] Fake API: VITE_USE_MOCK_EMAIL=true utilise mock-email (dev/test)

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

class EmailService {
  private edgeFunctionUrl: string;
  private fromEmail: string;
  private useMock: boolean;

  constructor() {
    // [COD-46] Fake API mode — utilise mock-email au lieu de api-email-send
    this.useMock = import.meta.env.VITE_USE_MOCK_EMAIL === 'true';
    const functionName = this.useMock ? 'mock-email' : 'api-email-send';
    this.edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
    this.fromEmail = 'FactureSmart <noreply@facturesmart.com>';
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
   * Send a transactional email via Edge Function proxy
   * [COD-56] — La clé RESEND_API_KEY n'est plus dans le frontend
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    if (!this.edgeFunctionUrl || !SUPABASE_URL) {
      console.warn('[EmailService] SUPABASE_URL not configured — email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html: options.html,
          from: options.from || this.fromEmail,
          replyTo: options.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to send email' }));
        console.error('[EmailService] Send failed:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (err) {
      console.error('[EmailService] Network error:', err);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Send verification email (for email confirmation)
   */
  async sendVerificationEmail(to: string, verificationToken: string): Promise<EmailResult> {
    const verifyUrl = `${import.meta.env.VITE_APP_URL}/verify-email?token=${verificationToken}`;
    return this.send({
      to,
      subject: 'Vérifiez votre adresse email — FactureSmart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Bienvenue sur FactureSmart</h1>
          <p>Merci pour votre inscription. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Vérifier mon email</a>
          <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
        </div>
      `,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `${import.meta.env.VITE_APP_URL}/reset-password?token=${resetToken}`;
    return this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe — FactureSmart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <a href="${resetUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Réinitialiser mon mot de passe</a>
          <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  }

  /**
   * Send user invitation email
   */
  async sendUserInvitation(to: string, invitedBy: string, role: string, invitationToken: string): Promise<EmailResult> {
    const inviteUrl = `${import.meta.env.VITE_APP_URL}/invitation/accept?token=${invitationToken}`;
    return this.send({
      to,
      subject: `Invitation à rejoindre FactureSmart en tant que ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Vous êtes invité sur FactureSmart</h1>
          <p><strong>${invitedBy}</strong> vous invite à rejoindre FactureSmart avec le rôle : <strong>${role}</strong></p>
          <a href="${inviteUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accepter l'invitation</a>
          <p style="color: #666; font-size: 14px;">Cette invitation expire dans 7 jours.</p>
        </div>
      `,
    });
  }

  /**
   * Send invoice notification email
   */
  async sendInvoiceNotification(to: string, invoiceNumber: string, amount: string, status: string): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Facture ${invoiceNumber} — ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Nouvelle facture</h1>
          <p>Votre facture <strong>${invoiceNumber}</strong> est disponible.</p>
          <p><strong>Montant :</strong> ${amount}</p>
          <p><strong>Statut :</strong> ${status}</p>
          <a href="${import.meta.env.VITE_APP_URL}/factures" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Voir la facture</a>
        </div>
      `,
    });
  }

  /**
   * Send invoice email with PDF attachment [COD-46]
   * Note: PDF attachment via email requires multipart form data.
   * For now, sends with download link. Full PDF attach = future improvement.
   */
  async sendInvoiceWithPDF(
    to: string,
    invoiceNumber: string,
    amount: string,
    status: string,
    _pdfBlob?: Blob,
    fileName?: string,
    downloadUrl?: string
  ): Promise<EmailResult> {
    // Since multipart email with binary attachment is complex via Edge Function,
    // we send a rich email with download link as fallback
    return this.send({
      to,
      subject: `Facture ${invoiceNumber} — ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">🧾 Votre facture</h1>
          <p>Bonjour,</p>
          <p>Votre facture <strong>${invoiceNumber}</strong> est disponible.</p>
          <p><strong>Montant :</strong> ${amount}</p>
          <p><strong>Statut :</strong> ${status}</p>
          ${downloadUrl ? `<p><a href="${downloadUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">📥 Télécharger la facture PDF</a></p>` : ''}
          ${fileName ? `<p style="color: #666; font-size: 12px;">Pièce jointe: ${fileName}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">© 2026 FactureSmart</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
