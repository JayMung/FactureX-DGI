// Email Service — FactureSmart Sprint 1
// Provider: Resend (https://resend.com) — Free tier: 100 emails/jour

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

const RESEND_ENDPOINT = 'https://api.resend.com';

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
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = RESEND_API_KEY;
    this.fromEmail = 'FactureSmart <noreply@facturesmart.com>';
  }

  /**
   * Send a transactional email via Resend API
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      console.warn('[EmailService] RESEND_API_KEY not configured — email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(`${RESEND_ENDPOINT}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          reply_to: options.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
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
}

export const emailService = new EmailService();
