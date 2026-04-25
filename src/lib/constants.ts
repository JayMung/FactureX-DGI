// ============================================================
// FactureSmart - Constantes de l'application
// ============================================================
// Toutes les références au nom de l'application passent par ici
// pour faciliter un rename futur.

export const APP_NAME = 'FactureSmart';
export const APP_NAME_DISPLAY = 'FactureSmart';
export const APP_TAGLINE = 'Facturation intelligente, conformité DGI';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://facturex.io';
export const APP_SUPPORT_EMAIL = 'support@facturex.io';

// Versions
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.0.0';
export const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();

// Société (pour mentions légales)
export const COMPANY_NAME = 'FactureSmart';
export const COMPANY_RCCM = ''; // À configurer dans settings
export const COMPANY_IDNAT = ''; // À configurer dans settings
export const COMPANY_NIF = ''; // À configurer dans settings

// API
export const API_DGI_URL = import.meta.env.VITE_DGI_API_URL || 'https://api.dgi.gouv.cd';
export const API_DGI_SANDBOX_URL = import.meta.env.VITE_DGI_API_SANDBOX_URL || 'https://sandbox.dgi.gouv.cd';

// Mobile Money (merchants)
export const MPESA_MERCHANT_ID = import.meta.env.VITE_MPESA_MERCHANT_ID || '';
export const ORANGE_MERCHANT_ID = import.meta.env.VITE_ORANGE_MERCHANT_ID || '';
export const AIRTEL_MERCHANT_ID = import.meta.env.VITE_AIRTEL_MERCHANT_ID || '';

// Email (Resend) — [COD-56] Clé supprimée du frontend, appels via Edge Function api-email-send
// Supabase URL + anon key pour appel Edge Function (authentification Supabase)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
export const MICROSOFT_TENANT_ID = import.meta.env.VITE_MICROSOFT_TENANT_ID || '';
